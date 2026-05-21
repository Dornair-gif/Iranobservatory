#!/usr/bin/env python3
"""Same as backup_production.py but targets the PREVIEW environment."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import backup_production as bp
bp.PROD_BASE = "https://iran-events-live.preview.emergentagent.com"
bp.BACKUP_ROOT = bp.Path("/app/backups")  # same root, prefix differs
# Tweak output prefix
import datetime
orig_main = bp.main
def main():
    # monkey-patch the timestamped dir to include "preview" prefix
    real_strftime = datetime.datetime.now
    orig_main()
if __name__ == "__main__":
    # Easier: just rename the folder after backup
    import datetime, shutil
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    bp.main()
    # find the just-created folder and rename it
    latest = max(bp.BACKUP_ROOT.glob("iranobservatory_prod_*"), key=lambda p: p.stat().st_mtime)
    target = bp.BACKUP_ROOT / latest.name.replace("iranobservatory_prod_", "iranobservatory_preview_")
    latest.rename(target)
    print(f"\n📦 renamed to {target}")
