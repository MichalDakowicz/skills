"""Validate every skill in skills/ and mod in mods/. Exit 1 on any error."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from _common import MARKETPLACE, NAME_RE, mod_dirs, parse_frontmatter, skill_dirs


def load_json(path: Path, errors: list[str], label: str) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"{label}: missing {path.name}")
    except json.JSONDecodeError as exc:
        errors.append(f"{label}: {path.name} is not valid JSON ({exc})")
    return None


def check_mods(errors: list[str]) -> int:
    """Mods are hooks-module plugins: manifest, hooks.json, module, marketplace entry."""
    dirs = mod_dirs()
    market = load_json(MARKETPLACE, errors, "marketplace") or {}
    sources = {
        p.get("name"): p.get("source") for p in market.get("plugins", []) if isinstance(p, dict)
    }
    for d in dirs:
        label = f"mods/{d.name}"
        manifest = load_json(d / ".claude-plugin" / "plugin.json", errors, label)
        if manifest is not None:
            name = manifest.get("name", "")
            if name != d.name:
                errors.append(f"{label}: plugin.json name '{name}' != folder name")
            if not NAME_RE.match(name or ""):
                errors.append(f"{label}: name must be kebab-case")
            desc = manifest.get("description", "")
            if not desc or "{{" in desc or "TODO" in desc:
                errors.append(f"{label}: missing or unfilled 'description'")
            types = manifest.get("types")
            if types and not (d / types).is_file():
                errors.append(f"{label}: types file {types} not found")
        hooks = load_json(d / "hooks" / "hooks.json", errors, label)
        if hooks is not None:
            modules = hooks.get("modules")
            if not isinstance(modules, list) or len(modules) != 1:
                errors.append(f"{label}: hooks.json must name exactly one module")
            elif not (d / "hooks" / modules[0]).is_file():
                errors.append(f"{label}: hooks module {modules[0]} not found")
        if sources.get(d.name) != f"./mods/{d.name}":
            errors.append(
                f"{label}: add {{\"name\": \"{d.name}\", \"source\": \"./mods/{d.name}\"}}"
                " to .claude-plugin/marketplace.json"
            )
    return len(dirs)


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

    mods = check_mods(errors)

    for e in errors:
        print(f"ERROR {e}")
    print(f"{len(dirs)} skill(s), {mods} mod(s) checked, {len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
