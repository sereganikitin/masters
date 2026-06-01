"""BFS scraper for cg-projects.ru МАСТЕРС flats.

Each /flats/{id} page contains ~5 property records in its Nuxt payload —
the target flat plus 4 «recommended» neighbours. We start from a known id
and follow the references until no new МАСТЕРС flat IDs appear.

Per flat we capture:
  - id, area, price, section_number, floor_number, rooms, property_code-ish
  - plan_hover   (apartment polygon on the floor plan)
  - floor_plan   {url, w, h}
  - section_plan_hover (section polygon on the genplan)
  - building_plan {url, w, h}

Cached as JSONL at data/cg-cache/flats.jsonl so re-runs only fetch new IDs.
"""

import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

CACHE_DIR = Path("data/cg-cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = CACHE_DIR / "flats.jsonl"
RATE_LIMIT_SECONDS = 0.4  # ~150 pages in ~60s, polite enough


def fetch_html(flat_id: int) -> str | None:
    """Return raw HTML for /flats/{id} or None on 404."""
    req = urllib.request.Request(
        f"https://cg-projects.ru/flats/{flat_id}",
        headers={"User-Agent": "Mozilla/5.0 (compatible; cg-overlay-import)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def parse_payload(html: str) -> list:
    m = re.search(
        r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    )
    if not m:
        raise ValueError("__NUXT_DATA__ tag missing")
    return json.loads(m.group(1))


def resolve(payload: list, val, _seen=None):
    if _seen is None:
        _seen = set()
    if isinstance(val, int):
        if val in _seen:
            return None
        if 0 <= val < len(payload):
            return resolve(payload, payload[val], _seen | {val})
        return val
    if isinstance(val, list):
        return [resolve(payload, x, _seen) for x in val]
    if isinstance(val, dict):
        return {k: resolve(payload, v, _seen) for k, v in val.items()}
    return val


def is_masters(payload: list) -> bool:
    return any(isinstance(v, str) and v == "masters" for v in payload)


def extract_flats(payload: list) -> list[dict]:
    """Locate every dict in the payload that looks like a flat record
    (has id + plan_hover + section + floor + area + price). Resolve and
    return a normalised record."""
    out: list[dict] = []
    seen_ids: set[int] = set()

    for idx, raw in enumerate(payload):
        if not isinstance(raw, dict):
            continue
        required = {"id", "section", "floor", "area", "price", "plan_hover"}
        if not required.issubset(raw.keys()):
            continue
        resolved = resolve(payload, idx)
        flat_id = resolved.get("id")
        if not isinstance(flat_id, int) or flat_id in seen_ids:
            continue
        seen_ids.add(flat_id)

        # Some sub-fields can be a list rather than a dict when there's no
        # data — coerce to {} so .get() doesn't blow up.
        def safe_dict(v):
            return v if isinstance(v, dict) else {}

        sec = safe_dict(resolved.get("section"))
        flr = safe_dict(resolved.get("floor"))
        bld = safe_dict(resolved.get("building"))
        rooms = safe_dict(resolved.get("rooms"))

        out.append(
            {
                "id": flat_id,
                "area": resolved.get("area"),
                "price": resolved.get("price"),
                "rooms": rooms.get("number"),
                "section_number": sec.get("number"),
                "section_plan_hover": sec.get("plan_hover"),
                "floor_number": flr.get("number"),
                "floor_plan_url": flr.get("plan"),
                "floor_plan_width": flr.get("plan_width"),
                "floor_plan_height": flr.get("plan_height"),
                "plan_hover": resolved.get("plan_hover"),
                "building_number": bld.get("number"),
                "building_plan_url": bld.get("plan"),
                "building_plan_width": bld.get("plan_width"),
                "building_plan_height": bld.get("plan_height"),
            }
        )
    return out


def main(seed_ids: list[int]) -> None:
    # Resume from cache if present.
    seen: set[int] = set()
    records: dict[int, dict] = {}
    if OUTPUT.exists():
        for line in OUTPUT.read_text(encoding="utf-8").splitlines():
            r = json.loads(line)
            records[r["id"]] = r
            seen.add(r["id"])
        print(f"resumed with {len(seen)} cached flats")

    queue: list[int] = [fid for fid in seed_ids if fid not in seen]
    not_found: set[int] = set()
    out_fh = OUTPUT.open("a", encoding="utf-8")

    while queue:
        fid = queue.pop(0)
        if fid in seen or fid in not_found:
            continue
        seen.add(fid)
        time.sleep(RATE_LIMIT_SECONDS)
        try:
            html = fetch_html(fid)
        except Exception as e:
            print(f"  ! /flats/{fid}: {e}")
            continue
        if html is None:
            not_found.add(fid)
            print(f"  - /flats/{fid}: 404")
            continue
        try:
            payload = parse_payload(html)
        except Exception as e:
            print(f"  ! /flats/{fid} parse: {e}")
            continue
        if not is_masters(payload):
            print(f"  - /flats/{fid}: NOT masters, skipping")
            continue

        flats = extract_flats(payload)
        new_records = 0
        for f in flats:
            if f["id"] not in records:
                records[f["id"]] = f
                out_fh.write(json.dumps(f, ensure_ascii=False) + "\n")
                out_fh.flush()
                new_records += 1
            # discover new IDs to crawl
            if f["id"] not in seen:
                queue.append(f["id"])
        print(
            f"  ok /flats/{fid}: page yielded {len(flats)} records"
            f"({new_records} new), queue={len(queue)}, total={len(records)}"
        )

    out_fh.close()
    print(f"\nDONE. Cached {len(records)} flats to {OUTPUT}")
    # Stats
    by_section: dict[str, int] = {}
    for r in records.values():
        by_section[r.get("section_number") or "?"] = by_section.get(r.get("section_number") or "?", 0) + 1
    print(f"by section: {dict(sorted(by_section.items()))}")


def scan_range(lo: int, hi: int) -> None:
    """Walk a numeric ID range, fetch every page, and extract every МАСТЕРС
    flat record found inside its Nuxt payload (each page yields ~5)."""
    records: dict[int, dict] = {}
    not_found: set[int] = set()
    if OUTPUT.exists():
        for line in OUTPUT.read_text(encoding="utf-8").splitlines():
            r = json.loads(line)
            records[r["id"]] = r
        print(f"resumed with {len(records)} cached flats")

    out_fh = OUTPUT.open("a", encoding="utf-8")
    for fid in range(lo, hi + 1):
        if fid in records:
            continue
        time.sleep(RATE_LIMIT_SECONDS)
        try:
            html = fetch_html(fid)
        except Exception as e:
            print(f"  ! /flats/{fid}: {e}")
            continue
        if html is None:
            not_found.add(fid)
            continue
        try:
            payload = parse_payload(html)
        except Exception:
            continue
        if not is_masters(payload):
            continue
        flats = extract_flats(payload)
        new = 0
        for f in flats:
            if f["id"] not in records:
                records[f["id"]] = f
                out_fh.write(json.dumps(f, ensure_ascii=False) + "\n")
                out_fh.flush()
                new += 1
        if new:
            print(
                f"  ok /flats/{fid}: {len(flats)} records ({new} new), "
                f"total={len(records)}, 404s={len(not_found)}"
            )
    out_fh.close()
    print(f"\nDONE. {len(records)} flats cached.")
    by_section: dict[str, int] = {}
    for r in records.values():
        by_section[r.get("section_number") or "?"] = (
            by_section.get(r.get("section_number") or "?", 0) + 1
        )
    print(f"by section: {dict(sorted(by_section.items()))}")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "scan":
        scan_range(int(sys.argv[2]), int(sys.argv[3]))
    else:
        seeds = [int(x) for x in sys.argv[1:]] or [780]
        main(seeds)
