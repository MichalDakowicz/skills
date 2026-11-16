"""Shared helpers for repo scripts."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = ROOT / "skills"
TEMPLATE = ROOT / "template" / "SKILL.md"
MODS_DIR = ROOT / "mods"
MOD_TEMPLATE = ROOT / "template" / "mod"
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def parse_frontmatter(text: str) -> dict[str, str] | None:
    """Return simple key: value frontmatter, or None if missing."""
    if not text.startswith("---"):
        return None
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None
    data: dict[str, str] = {}
    for line in parts[1].splitlines():
        if ":" in line and not line.startswith((" ", "\t")):
            key, _, value = line.partition(":")
            data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def skill_dirs() -> list[Path]:
    if not SKILLS_DIR.exists():
        return []
    return sorted(p for p in SKILLS_DIR.iterdir() if p.is_dir())


def mod_dirs() -> list[Path]:
    if not MODS_DIR.exists():
        return []
    return sorted(p for p in MODS_DIR.iterdir() if p.is_dir())
