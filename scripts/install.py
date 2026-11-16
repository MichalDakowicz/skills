"""Install skills into ~/.claude/skills.

Usage:
  python scripts/install.py [skill ...] [--link] [--force]

  --link   symlink instead of copy (needs Developer Mode or admin on Windows)
  --force  replace existing skill folders with the same name
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from _common import skill_dirs

DEST = Path.home() / ".claude" / "skills"


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    link = "--link" in sys.argv
    force = "--force" in sys.argv

    available = {d.name: d for d in skill_dirs()}
    wanted = args or list(available)
    missing = [w for w in wanted if w not in available]
    if missing:
        print(f"unknown skill(s): {', '.join(missing)}")
        return 1

    DEST.mkdir(parents=True, exist_ok=True)
    for name in wanted:
        src, dst = available[name], DEST / name
        if dst.exists() or dst.is_symlink():
            if not force:
                print(f"skip {name}: exists (use --force)")
                continue
            if dst.is_symlink() or dst.is_file():
                dst.unlink()
            else:
                shutil.rmtree(dst)
        if link:
            dst.symlink_to(src, target_is_directory=True)
        else:
            shutil.copytree(src, dst)
        print(f"{'linked' if link else 'copied'} {name} -> {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
