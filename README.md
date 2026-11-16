# skills

Collection of useful [Claude Code](https://claude.com/claude-code) skills.

## Layout

```
skills/
├── .claude-plugin/
│   ├── marketplace.json   # lets Claude Code install this repo as a plugin marketplace
│   └── plugin.json        # plugin manifest (skills/ is auto-discovered)
├── skills/                # one folder per skill
│   └── <skill-name>/
│       ├── SKILL.md       # required: frontmatter + instructions
│       ├── references/    # optional: docs loaded on demand
│       ├── scripts/       # optional: helper scripts the skill runs
│       └── assets/        # optional: templates, files used in output
├── .github/workflows/     # CI: runs validate.py on push/PR
├── template/SKILL.md      # starting point for new skills
└── scripts/
    ├── new-skill.py       # scaffold a new skill from the template
    ├── validate.py        # check every SKILL.md has valid frontmatter
    └── install.py         # copy/link skills into ~/.claude/skills
```

## Skills

| Skill | Description |
|-------|-------------|
| [kickoff](skills/kickoff/SKILL.md) | Interview the user, then write a strict `CLAUDE.md` working agreement (no AI credit), `AGENTS.md`, and a monorepo structure for a new project. |
| [orchestrator](skills/orchestrator/SKILL.md) | Run a project as a non-coding orchestrator: Sonnet builders, Haiku visual QA, Opus gap auditor, own verification, agreed goal with checkable done-bars it must fully meet, round limit that asks the user, task list + optional Brief tracking, project facts, goal and handoff in `docs/orchestrator/`. |

## Install

**As plugin (recommended):**

```
/plugin marketplace add MichalDakowicz/skills
/plugin install skills@michu-skills
```

**Manual (copy into personal skills dir):**

```bash
python scripts/install.py            # all skills
python scripts/install.py my-skill   # one skill
python scripts/install.py --link     # symlink instead of copy (edits apply live)
```

## Add a skill

```bash
python scripts/new-skill.py my-skill "What it does and when to use it"
```

Then edit `skills/my-skill/SKILL.md`, add a row to the table above, and run:

```bash
python scripts/validate.py
```

### SKILL.md rules

- Folder name = `name` in frontmatter, kebab-case.
- `description` says **what** the skill does and **when** to trigger it — Claude picks skills from this line alone.
- Keep `SKILL.md` focused; push long material into `references/` and point to it.

## License

[MIT](LICENSE)
