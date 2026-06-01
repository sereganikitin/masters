"""Import cg-projects.ru polygons into our admin.db.

Reads:
  data/cg-cache/flats.jsonl   — scraped flat records
  src/data/apartments.json    — our feed-built apartments

Matches by (section_number, floor_number, area, price) → our apartment UUID.

Writes to data/admin.db:
  * floor-scope overlays (one per matched apartment)
  * genplan-scope overlays (one per unique section)

Existing rows for the same (scope, scopeKey, entityType, entityId) are wiped
before insert so re-running is idempotent.
"""

import json
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FLATS_JSONL = ROOT / "data" / "cg-cache" / "flats.jsonl"
APTS_JSON = ROOT / "src" / "data" / "apartments.json"
DB_PATH = ROOT / "data" / "admin.db"

# Target viewBox of our OverlayLayer.
VB_W, VB_H = 1920.0, 1080.0


def parse_polygon_points(svg_str: str) -> list[tuple[float, float]]:
    """Extract the `points="x,y x,y …"` attribute out of an inline polygon
    string and return [(x, y), …]."""
    m = re.search(r'points="([^"]+)"', svg_str)
    if not m:
        return []
    pairs = m.group(1).split()
    out: list[tuple[float, float]] = []
    for p in pairs:
        if "," not in p:
            continue
        x, y = p.split(",", 1)
        try:
            out.append((float(x), float(y)))
        except ValueError:
            continue
    return out


def transform(points: list[tuple[float, float]], img_w: float, img_h: float) -> list[list[float]]:
    """Map pixel-space polygon to our 1920×1080 viewBox, accounting for the
    object-contain letterbox of the underlying PNG."""
    if img_w <= 0 or img_h <= 0:
        return [[round(x, 2), round(y, 2)] for x, y in points]
    a_img = img_w / img_h
    a_box = VB_W / VB_H
    if a_img >= a_box:
        # image fills width, letterboxed top/bottom
        scale = VB_W / img_w
        off_x = 0.0
        off_y = (VB_H - img_h * scale) / 2.0
    else:
        # image fills height, letterboxed left/right
        scale = VB_H / img_h
        off_x = (VB_W - img_w * scale) / 2.0
        off_y = 0.0
    return [
        [round(off_x + x * scale, 2), round(off_y + y * scale, 2)]
        for x, y in points
    ]


def load_flats() -> list[dict]:
    return [json.loads(l) for l in FLATS_JSONL.read_text(encoding="utf-8").splitlines() if l.strip()]


def load_apartments() -> list[dict]:
    data = json.loads(APTS_JSON.read_text(encoding="utf-8"))
    out: list[dict] = []
    for house in data.get("houses", []):
        for section in house.get("sections", []):
            for floor_str, apts in section.get("apartmentsByFloor", {}).items():
                for a in apts:
                    out.append(a)
    return out


def build_index(apts: list[dict]) -> dict:
    """Index our apartments by (section, floor, area-rounded, price-rounded)."""
    idx: dict[tuple, list[dict]] = {}
    for a in apts:
        key = (
            a["sectionNumber"],
            a["floor"],
            round(float(a["area"]), 1),
            round(float(a["price"])),
        )
        idx.setdefault(key, []).append(a)
    return idx


def main() -> None:
    flats = load_flats()
    apts = load_apartments()
    idx = build_index(apts)
    print(f"loaded {len(flats)} cg flats, {len(apts)} our apartments")

    matches: list[tuple[dict, dict]] = []  # (cg_flat, our_apt)
    unmatched: list[dict] = []
    for f in flats:
        try:
            key = (
                int(f["section_number"]),
                int(f["floor_number"]),
                round(float(f["area"]), 1),
                round(float(f["price"])),
            )
        except (TypeError, ValueError):
            unmatched.append(f)
            continue
        candidates = idx.get(key, [])
        if len(candidates) == 1:
            matches.append((f, candidates[0]))
        else:
            unmatched.append(f)
    print(f"matched: {len(matches)} / {len(flats)}")
    print(f"unmatched / ambiguous: {len(unmatched)}")
    if unmatched[:3]:
        print("first unmatched:", [(u.get("id"), u.get("section_number"), u.get("floor_number"), u.get("area"), u.get("price")) for u in unmatched[:3]])

    # Build floor overlays
    floor_rows: list[tuple] = []
    for f, a in matches:
        pts = parse_polygon_points(f.get("plan_hover") or "")
        if not pts:
            continue
        coords = transform(
            pts,
            float(f.get("floor_plan_width") or 0),
            float(f.get("floor_plan_height") or 0),
        )
        if len(coords) < 3:
            continue
        floor_rows.append(
            (
                "floor",
                f"{a['sectionNumber']}_{a['floor']}",
                "apartment",
                a["id"],
                f"№{a['number']} · {a['area']} м²",
                json.dumps(coords),
                "#0061A6",
            )
        )

    # Build genplan overlays (1 per unique section)
    section_rows: dict[int, tuple] = {}
    for f in flats:
        try:
            sec = int(f["section_number"])
        except (TypeError, ValueError):
            continue
        if sec in section_rows:
            continue
        pts = parse_polygon_points(f.get("section_plan_hover") or "")
        if not pts:
            continue
        coords = transform(
            pts,
            float(f.get("building_plan_width") or 0),
            float(f.get("building_plan_height") or 0),
        )
        if len(coords) < 3:
            continue
        # apt count for that section
        apt_count = sum(1 for a in apts if a["sectionNumber"] == sec)
        section_rows[sec] = (
            "genplan",
            "",
            "section",
            str(sec),
            f"{sec} секция · {apt_count} кв.",
            json.dumps(coords),
            "#0061A6",
        )
    print(f"prepared {len(floor_rows)} floor overlays, {len(section_rows)} genplan overlays")

    # Write to DB. Wipe existing imports first (same entity → fresh row).
    if not DB_PATH.exists():
        print(f"WARN: {DB_PATH} not found — bootstrap with `npm run server` first")
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    now = int(__import__("time").time() * 1000)
    inserted_floor = 0
    inserted_genplan = 0
    for row in floor_rows:
        cur.execute(
            "DELETE FROM overlays WHERE scope=? AND entity_type=? AND entity_id=?",
            (row[0], row[2], row[3]),
        )
        cur.execute(
            "INSERT INTO overlays (scope, scope_key, entity_type, entity_id, label, points, color, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (*row, now, now),
        )
        inserted_floor += 1
    for row in section_rows.values():
        cur.execute(
            "DELETE FROM overlays WHERE scope=? AND entity_type=? AND entity_id=?",
            (row[0], row[2], row[3]),
        )
        cur.execute(
            "INSERT INTO overlays (scope, scope_key, entity_type, entity_id, label, points, color, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (*row, now, now),
        )
        inserted_genplan += 1
    conn.commit()
    conn.close()
    print(f"\nInserted: {inserted_floor} floor overlays + {inserted_genplan} genplan overlays")


if __name__ == "__main__":
    main()
