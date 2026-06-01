"""Push overlays from a local admin.db to a remote admin server.

Reads every row we've inserted from cg-projects (the cg-scrape.py /
cg-import.py pipeline), then for each row hits the remote admin API:
  - DELETE any existing overlay with the same (scope, entityType, entityId)
  - POST the new geometry

Usage:
    python scripts/cg-push.py https://masters.infoseledka.ru <ADMIN_TOKEN>
"""

import json
import sqlite3
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "admin.db"


def list_remote(base: str, token: str) -> list[dict]:
    req = urllib.request.Request(
        f"{base}/api/overlays",
        headers={"User-Agent": "cg-overlay-push"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def delete_remote(base: str, token: str, overlay_id: int) -> None:
    req = urllib.request.Request(
        f"{base}/api/overlays/{overlay_id}",
        method="DELETE",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "cg-overlay-push",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=30).read()
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise


def post_remote(base: str, token: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/overlays",
        method="POST",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "cg-overlay-push",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: python scripts/cg-push.py <base_url> <admin_token>")
        return
    base = sys.argv[1].rstrip("/")
    token = sys.argv[2]
    if not DB.exists():
        raise SystemExit(f"local admin.db missing: {DB}")
    local = sqlite3.connect(DB)
    rows = list(
        local.execute(
            "SELECT scope, scope_key, entity_type, entity_id, label, points, color FROM overlays"
        )
    )
    print(f"local overlays to push: {len(rows)}")

    # Build a lookup of remote overlays so we can DELETE the right ID before
    # inserting the cg geometry. Match key is (scope, entityType, entityId).
    remote = list_remote(base, token)
    print(f"remote overlays before push: {len(remote)}")
    remote_idx: dict[tuple, list[int]] = {}
    for o in remote:
        remote_idx.setdefault(
            (o["scope"], o["entityType"], o["entityId"]), []
        ).append(o["id"])

    pushed = 0
    for scope, scope_key, etype, eid, label, points, color in rows:
        # Replace existing first
        for rid in remote_idx.get((scope, etype, eid), []):
            delete_remote(base, token, rid)
        payload = {
            "scope": scope,
            "scopeKey": scope_key,
            "entityType": etype,
            "entityId": eid,
            "label": label,
            "color": color,
            "points": json.loads(points),
        }
        try:
            post_remote(base, token, payload)
            pushed += 1
            if pushed % 25 == 0:
                print(f"  pushed {pushed}/{len(rows)}")
        except urllib.error.HTTPError as e:
            print(f"  ! {scope}/{eid}: {e.code} {e.read()[:200]}")
    print(f"\nDONE: pushed {pushed} overlays")


if __name__ == "__main__":
    main()
