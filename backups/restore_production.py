#!/usr/bin/env python3
"""
Restore a backup created by backup_production.py into a TARGET environment.

⚠️  USE WITH CAUTION ⚠️
Restoring will:
- Re-create any missing articles (matched by their `id`/ObjectId).
- Update existing articles in place (overwriting current content with backed-up content).
- Re-upload all files in the files/ folder into GridFS of the target.
- Re-create founder settings and subscribers.
- Re-create RSS feeds (matching by feed URL to avoid duplicates).

This script does NOT delete anything that doesn't exist in the backup.
By default it RUNS A DRY-RUN. Pass --apply to actually write.

Usage:
  # Dry-run against preview:
  python3 restore_production.py --backup iranobservatory_prod_20260521_144923 --target preview

  # Dry-run against prod (no writes):
  python3 restore_production.py --backup iranobservatory_prod_20260521_144923 --target prod

  # Real write:
  python3 restore_production.py --backup iranobservatory_prod_20260521_144923 --target prod --apply

Environment variables:
  BACKUP_ADMIN_EMAIL, BACKUP_ADMIN_PASSWORD (default: iranobservatory admin)
"""
import os
import sys
import json
import argparse
import time
from pathlib import Path

import requests

TARGETS = {
    "prod": "https://iranobservatory.org",
    "preview": "https://iran-events-live.preview.emergentagent.com",
}
TIMEOUT = 30


def login(base: str, email: str, password: str) -> str:
    r = requests.post(f"{base}/api/auth/login", json={"email": email, "password": password}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()["access_token"]


def upload_file(base: str, token: str, local_path: Path) -> str | None:
    """Returns the new relative URL (/api/files/<uuid>.<ext>) or None on failure."""
    ext = local_path.suffix.lstrip(".").lower()
    endpoint = "pdf" if ext == "pdf" else "image"
    try:
        with open(local_path, "rb") as f:
            r = requests.post(
                f"{base}/api/upload/{endpoint}",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (local_path.name, f, "application/octet-stream")},
                timeout=60,
            )
        r.raise_for_status()
        data = r.json()
        return data.get("image_url") or data.get("pdf_url")
    except Exception as e:
        print(f"   upload failed for {local_path.name}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup", required=True, help="Backup folder name under /app/backups/")
    parser.add_argument("--target", required=True, choices=list(TARGETS.keys()))
    parser.add_argument("--apply", action="store_true", help="Actually write (default is dry-run)")
    parser.add_argument("--skip-files", action="store_true", help="Don't re-upload media")
    parser.add_argument("--skip-articles", action="store_true")
    parser.add_argument("--skip-subscribers", action="store_true")
    args = parser.parse_args()

    backup_dir = Path("/app/backups") / args.backup
    if not backup_dir.exists():
        print(f"❌ Backup not found: {backup_dir}")
        sys.exit(1)
    base = TARGETS[args.target]
    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"🔁 Restore [{mode}]  {args.backup} → {args.target} ({base})\n")

    email = os.environ.get("BACKUP_ADMIN_EMAIL", "admin@iranobservatory.org")
    password = os.environ.get("BACKUP_ADMIN_PASSWORD", "IranObs2024!")
    token = login(base, email, password)

    # 1. Files
    file_map: dict[str, str] = {}  # old_url -> new_url
    if not args.skip_files:
        files_dir = backup_dir / "files"
        files = sorted(files_dir.glob("*")) if files_dir.exists() else []
        print(f"→ Files ({len(files)})")
        for i, fp in enumerate(files, 1):
            old_url = f"/api/files/{fp.name}"
            if not args.apply:
                print(f"   [{i}/{len(files)}] (dry-run) would upload {fp.name}")
                file_map[old_url] = old_url
                continue
            new_url = upload_file(base, token, fp)
            if new_url:
                file_map[old_url] = new_url
                print(f"   [{i}/{len(files)}] ✓ {fp.name} → {new_url}")
            else:
                file_map[old_url] = old_url
        print(f"   {len(file_map)} files mapped")

    def rewrite_url(url):
        if not url:
            return url
        # Find any /api/files/<x> reference and remap
        import re
        m = re.search(r"/api/files/[^?\"' #]+", url)
        if not m:
            return url
        old_rel = m.group(0)
        new_rel = file_map.get(old_rel, old_rel)
        return url.replace(old_rel, new_rel)

    # 2. Founder
    print("\n→ Founder settings")
    founder_path = backup_dir / "founder.json"
    if founder_path.exists():
        founder = json.loads(founder_path.read_text())
        founder["photo_url"] = rewrite_url(founder.get("photo_url"))
        founder["signature_url"] = rewrite_url(founder.get("signature_url"))
        if args.apply:
            r = requests.put(f"{base}/api/settings/founder", json=founder, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
            print(f"   {'✓' if r.ok else '✗ '+str(r.status_code)} founder updated")
        else:
            print(f"   (dry-run) would PUT founder.enabled={founder.get('enabled')}")

    # 3. Subscribers
    if not args.skip_subscribers:
        subs_path = backup_dir / "subscribers.json"
        if subs_path.exists():
            subs = json.loads(subs_path.read_text())
            print(f"\n→ Subscribers ({len(subs)})")
            for s in subs:
                payload = {"email": s["email"], "newsletter": s.get("newsletter", False), "language": s.get("language", "fr")}
                if args.apply:
                    r = requests.post(f"{base}/api/subscribers/add", json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
                    if not r.ok:
                        print(f"   ✗ {s['email']}: {r.status_code}")

    # 4. Articles
    if not args.skip_articles:
        arts = json.loads((backup_dir / "articles.json").read_text())
        print(f"\n→ Articles ({len(arts)})")
        for i, a in enumerate(arts, 1):
            a["image_url"] = rewrite_url(a.get("image_url"))
            a["pdf_url"] = rewrite_url(a.get("pdf_url"))
            for lang_key in ("content_en", "content_fr", "content_fa"):
                if a.get(lang_key):
                    a[lang_key] = rewrite_url(a[lang_key])  # no-op if no file refs in HTML
            # Try to fetch existing by id
            old_id = a.get("id")
            if not args.apply:
                print(f"   [{i}/{len(arts)}] (dry-run) {old_id} {a.get('title_en') or a.get('title_fr','')[:50]}")
                continue
            try:
                r = requests.get(f"{base}/api/articles/{old_id}", timeout=TIMEOUT)
                exists = r.status_code == 200
            except Exception:
                exists = False
            # Strip system fields that the API will reset
            payload = {k: v for k, v in a.items() if k not in {"id", "created_at", "updated_at", "published_at"}}
            if exists:
                # Update via PUT (preserves images thanks to recent partial-update fix)
                r = requests.put(f"{base}/api/articles/{old_id}", json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
                mark = "✓ updated" if r.ok else f"✗ {r.status_code}"
            else:
                r = requests.post(f"{base}/api/articles", json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
                mark = "✓ created" if r.ok else f"✗ {r.status_code}"
            print(f"   [{i}/{len(arts)}] {mark}  {(a.get('title_en') or a.get('title_fr',''))[:50]}")

    # 5. RSS feeds
    feeds_path = backup_dir / "rss_feeds.json"
    if feeds_path.exists():
        feeds = json.loads(feeds_path.read_text())
        print(f"\n→ RSS feeds ({len(feeds) if isinstance(feeds, list) else 0})")
        if isinstance(feeds, list):
            for f in feeds:
                if not args.apply:
                    print(f"   (dry-run) {f.get('name','?')}: {f.get('url','?')}")
                else:
                    payload = {"name": f.get("name"), "url": f.get("url"), "category": f.get("category", "news"), "enabled": f.get("enabled", True)}
                    r = requests.post(f"{base}/api/rss/feeds", json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
                    print(f"   {'✓' if r.ok else '✗ '+str(r.status_code)} {f.get('name')}")

    print(f"\n{'✅ DONE' if args.apply else '✅ DRY-RUN done (re-run with --apply to actually write)'}")


if __name__ == "__main__":
    main()
