"""Install skills into ~/.claude/skills.

Usage:
  python scripts/install.py [skill ...] [--link] [--force]

  --link   symlink instead of copy (on Windows without symlink rights: a junction)
  --force  replace existing skill folders with the same name
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

from _common import skill_dirs

DEST = Path.home() / ".claude" / "skills"


def is_junction(path: Path) -> bool:
    check = getattr(path, "is_junction", None)  # Python 3.12+
    return bool(check and check())


def make_link(src: Path, dst: Path) -> str:
    """Symlink src at dst; on Windows without symlink rights, use a junction."""
    try:
        dst.symlink_to(src, target_is_directory=True)
        return "symlink"
    except OSError:
        if os.name != "nt":
            raise
    # Junctions need no admin or Developer Mode and edits still apply live.
    subprocess.run(
        ["cmd", "/c", "mklink", "/J", str(dst), str(src.resolve())],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return "junction"


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
        if dst.exists() or dst.is_symlink() or is_junction(dst):
            if not force:
                print(f"skip {name}: exists (use --force)")
                continue
            if is_junction(dst):
                os.rmdir(dst)  # removes the junction only, never the target
            elif dst.is_symlink() or dst.is_file():
                dst.unlink()
            else:
                shutil.rmtree(dst)
        if link:
            how = make_link(src, dst)
            print(f"linked ({how}) {name} -> {dst}")
        else:
            shutil.copytree(src, dst)
            print(f"copied {name} -> {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
