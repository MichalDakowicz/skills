"""Scaffold a new mod: python scripts/new-mod.py <name> "<description>".

Copies template/mod/ to mods/<name>/ and lists it in .claude-plugin/marketplace.json.
"""
from __future__ import annotations

import json
import sys

from _common import MARKETPLACE, MOD_TEMPLATE, MODS_DIR, NAME_RE


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    name, desc = sys.argv[1], sys.argv[2]
    if not NAME_RE.match(name):
        print(f"name must be kebab-case: {name}")
        return 1
    target = MODS_DIR / name
    if target.exists():
        print(f"already exists: {target}")
        return 1
    title = name.replace("-", " ").title()
    for src in sorted(MOD_TEMPLATE.rglob("*")):
        if not src.is_file():
            continue
        dest = target / src.relative_to(MOD_TEMPLATE)
        dest.parent.mkdir(parents=True, exist_ok=True)
        text = (
            src.read_text(encoding="utf-8")
            .replace("{{name}}", name)
            .replace("{{description}}", desc.replace('"', '\\"'))
            .replace("{{title}}", title)
        )
        dest.write_text(text, encoding="utf-8", newline="\n")

    market = json.loads(MARKETPLACE.read_text(encoding="utf-8"))
    market.setdefault("plugins", []).append(
        {"name": name, "source": f"./mods/{name}", "description": desc}
    )
    MARKETPLACE.write_text(json.dumps(market, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"created {target} and listed it in {MARKETPLACE.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
