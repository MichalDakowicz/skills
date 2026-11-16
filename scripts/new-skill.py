"""Scaffold a new skill: python scripts/new-skill.py <name> "<description>"."""
from __future__ import annotations

import sys

from _common import NAME_RE, SKILLS_DIR, TEMPLATE


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    name = sys.argv[1]
    desc = sys.argv[2] if len(sys.argv) > 2 else "TODO: what it does and when to use it."
    if not NAME_RE.match(name):
        print(f"name must be kebab-case: {name}")
        return 1
    target = SKILLS_DIR / name
    if target.exists():
        print(f"already exists: {target}")
        return 1
    title = name.replace("-", " ").title()
    body = (
        TEMPLATE.read_text(encoding="utf-8")
        .replace("{{name}}", name)
        .replace("{{description}}", desc)
        .replace("{{title}}", title)
    )
    target.mkdir(parents=True)
    (target / "SKILL.md").write_text(body, encoding="utf-8")
    print(f"created {target / 'SKILL.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
