#!/usr/bin/env python3
"""
Total backup of Iran Observatory PRODUCTION content.

Fetches everything via the admin HTTP API (we don't have direct DB access from
this container) and writes a self-contained, timestamped backup directory
with:
  - articles.json       (all articles, incl. drafts, all languages, all fields)
  - subscribers.json    (all subscribers + language + newsletter flag)
  - founder.json        (founder introduction settings)
  - rss_feeds.json      (configured RSS feeds)
  - sitemap.xml         (snapshot of the live sitemap)
  - news-sitemap.xml    (snapshot of the news sitemap)
  - manifest.json       (counts, timestamp, source URL)
  - files/              (every file referenced by an article — covers, PDFs,
                         founder photo, signature)

Usage:
  python3 backup_production.py
"""
import os
import sys
import json
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import requests

PROD_BASE = "https://iranobservatory.org"
ADMIN_EMAIL = os.environ.get("BACKUP_ADMIN_EMAIL", "admin@iranobservatory.org")
ADMIN_PASSWORD = os.environ.get("BACKUP_ADMIN_PASSWORD", "IranObs2024!")
BACKUP_ROOT = Path("/app/backups")
TIMEOUT = 30


def login() -> str:
    r = requests.post(
        f"{PROD_BASE}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    token = r.json().get("access_token")
    if not token:
        raise RuntimeError("Login succeeded but no access_token returned")
    return token


def get_json(path: str, token: str, params: dict | None = None):
    r = requests.get(
        f"{PROD_BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        params=params or {},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def get_text(path: str):
    r = requests.get(f"{PROD_BASE}{path}", timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def slug_safe_filename(filename: str) -> str:
    """Keep only the basename, no path traversal."""
    return urllib.parse.unquote(filename).split("/")[-1].split("?")[0]


def extract_file_paths(article: dict) -> list[str]:
    """Return every /api/files/<...> path referenced by an article."""
    paths = set()

    def maybe_add(url: str | None):
        if not url:
            return
        # Accept both absolute and relative
        if "/api/files/" in url:
            rel = "/api/files/" + url.split("/api/files/", 1)[1]
            paths.add(rel.split("?")[0].split("#")[0])

    maybe_add(article.get("image_url"))
    maybe_add(article.get("pdf_url"))

    # Scan all content fields for <img src="...">
    import re
    for field in ("content_en", "content_fr", "content_fa"):
        content = article.get(field) or ""
        for m in re.finditer(r'src=["\']([^"\']+)["\']', content):
            maybe_add(m.group(1))

    return sorted(paths)


def download_file(path: str, dest_dir: Path) -> dict:
    """Download a file from a /api/files/<name> path. Returns metadata."""
    url = f"{PROD_BASE}{path}"
    try:
        r = requests.get(url, timeout=TIMEOUT, stream=True)
        if r.status_code != 200:
            return {"path": path, "ok": False, "status_code": r.status_code, "bytes": 0}
        fname = slug_safe_filename(path)
        out = dest_dir / fname
        size = 0
        with open(out, "wb") as f:
            for chunk in r.iter_content(64 * 1024):
                if chunk:
                    f.write(chunk)
                    size += len(chunk)
        return {"path": path, "ok": True, "status_code": 200, "bytes": size, "saved_as": str(out.relative_to(dest_dir.parent))}
    except Exception as e:
        return {"path": path, "ok": False, "error": str(e), "bytes": 0}


def main():
    BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_dir = BACKUP_ROOT / f"iranobservatory_prod_{ts}"
    files_dir = backup_dir / "files"
    backup_dir.mkdir(parents=True)
    files_dir.mkdir()

    print(f"📦 Backup → {backup_dir}\n")
    t0 = time.time()

    print("→ Auth")
    token = login()

    # ---- Articles ----
    print("→ Articles (all, incl. drafts)")
    articles = get_json("/api/articles/admin", token)
    (backup_dir / "articles.json").write_text(
        json.dumps(articles, ensure_ascii=False, indent=2)
    )
    print(f"   {len(articles)} articles saved")

    # ---- Subscribers ----
    print("→ Subscribers")
    subscribers = get_json("/api/subscribers", token)
    (backup_dir / "subscribers.json").write_text(
        json.dumps(subscribers, ensure_ascii=False, indent=2)
    )
    print(f"   {len(subscribers)} subscribers saved")

    # ---- Founder settings ----
    print("→ Founder settings")
    try:
        founder = get_json("/api/settings/founder", token)
        (backup_dir / "founder.json").write_text(
            json.dumps(founder, ensure_ascii=False, indent=2)
        )
    except Exception as e:
        print(f"   skipped: {e}")
        founder = {}

    # ---- RSS feeds ----
    print("→ RSS feeds config")
    try:
        feeds = get_json("/api/rss/feeds", token)
        (backup_dir / "rss_feeds.json").write_text(
            json.dumps(feeds, ensure_ascii=False, indent=2)
        )
        print(f"   {len(feeds) if isinstance(feeds, list) else 'n/a'} feeds saved")
    except Exception as e:
        print(f"   skipped: {e}")
        feeds = []

    # ---- Sitemap snapshots ----
    print("→ Sitemap")
    try:
        (backup_dir / "sitemap.xml").write_text(get_text("/api/sitemap.xml"))
    except Exception as e:
        print(f"   sitemap.xml skipped: {e}")
    try:
        (backup_dir / "news-sitemap.xml").write_text(get_text("/api/news-sitemap.xml"))
    except Exception as e:
        # Endpoint may not exist on prod yet
        pass

    # ---- Files (GridFS) ----
    print("→ Files (GridFS — article covers, PDFs, founder media)")
    all_paths: set[str] = set()
    for a in articles:
        for p in extract_file_paths(a):
            all_paths.add(p)
    # Founder photos
    for key in ("photo_url", "signature_url"):
        if founder.get(key) and "/api/files/" in founder[key]:
            rel = "/api/files/" + founder[key].split("/api/files/", 1)[1]
            all_paths.add(rel.split("?")[0])

    file_results = []
    for i, path in enumerate(sorted(all_paths), 1):
        info = download_file(path, files_dir)
        file_results.append(info)
        marker = "✓" if info["ok"] else f"✗ ({info.get('status_code', info.get('error'))})"
        print(f"   [{i:>3}/{len(all_paths)}] {marker} {path}")

    # ---- Manifest ----
    manifest = {
        "source": PROD_BASE,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "articles": len(articles),
            "subscribers": len(subscribers),
            "rss_feeds": len(feeds) if isinstance(feeds, list) else 0,
            "files_attempted": len(all_paths),
            "files_downloaded": sum(1 for f in file_results if f["ok"]),
            "files_missing": sum(1 for f in file_results if not f["ok"]),
        },
        "files": file_results,
        "duration_seconds": round(time.time() - t0, 2),
    }
    (backup_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2)
    )

    print("\n✅ Backup complete")
    print(f"   path: {backup_dir}")
    print(f"   articles: {manifest['counts']['articles']}")
    print(f"   subscribers: {manifest['counts']['subscribers']}")
    print(f"   rss feeds: {manifest['counts']['rss_feeds']}")
    print(
        f"   files: {manifest['counts']['files_downloaded']} downloaded / "
        f"{manifest['counts']['files_missing']} missing"
    )
    print(f"   duration: {manifest['duration_seconds']}s")
    print(f"\nTotal size: ", end="")
    sys.stdout.flush()
    os.system(f"du -sh '{backup_dir}'")


if __name__ == "__main__":
    main()
