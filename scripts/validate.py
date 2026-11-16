"""Validate every skill in skills/. Exit 1 on any error."""
from __future__ import annotations

import sys

from _common import NAME_RE, parse_frontmatter, skill_dirs


def main() -> int:
    errors: list[str] = []
    dirs = skill_dirs()
    for d in dirs:
        skill_md = d / "SKILL.md"
        if not skill_md.exists():
            errors.append(f"{d.name}: missing SKILL.md")
            continue
        fm = parse_frontmatter(skill_md.read_text(encoding="utf-8"))
        if fm is None:
            errors.append(f"{d.name}: SKILL.md has no frontmatter")
            continue
        name = fm.get("name", "")
        desc = fm.get("description", "")
        if not name:
            errors.append(f"{d.name}: missing 'name'")
        elif name != d.name:
            errors.append(f"{d.name}: name '{name}' != folder name")
        if name and not NAME_RE.match(name):
            errors.append(f"{d.name}: name must be kebab-case")
        if not desc:
            errors.append(f"{d.name}: missing 'description'")
        elif len(desc) > 1024:
            errors.append(f"{d.name}: description over 1024 chars")
        if "{{" in name or "{{" in desc or "TODO" in desc:
            errors.append(f"{d.name}: unfilled template placeholder in frontmatter")

    for e in errors:
        print(f"ERROR {e}")
    print(f"{len(dirs)} skill(s) checked, {len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
