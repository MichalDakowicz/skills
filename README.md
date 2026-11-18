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
├── mods/                  # one folder per mod (each its own plugin)
│   └── <mod-name>/
│       ├── .claude-plugin/plugin.json
│       ├── hooks/hooks.json   # names the one hooks module
│       ├── hooks/register.tsx # the mod: register(on) adds hooks
│       ├── types/index.d.ts   # optional: $.state contract
│       └── tests/*.test.tsx   # optional: run by `claude plugin test`
├── .github/workflows/     # CI: runs validate.py on push/PR
├── template/
│   ├── SKILL.md           # starting point for new skills
│   └── mod/               # starting point for new mods
└── scripts/
    ├── new-skill.py       # scaffold a new skill from the template
    ├── new-mod.py         # scaffold a new mod and list it in marketplace.json
    ├── validate.py        # check skills' frontmatter and mods' manifests
    └── install.py         # copy/link skills into ~/.claude/skills
```

## Skills

| Skill | Description |
|-------|-------------|
| [kickoff](skills/kickoff/SKILL.md) | Set up a new project with few questions: reuses your global defaults (`~/.claude/kickoff/defaults.json`, updated each run), asks only the gaps, then writes a strict `CLAUDE.md` working agreement (no AI credit), `AGENTS.md`, and a monorepo structure. |
| [orchestrator](skills/orchestrator/SKILL.md) | Run a project as a non-coding orchestrator: Sonnet builders, Haiku visual QA, Opus gap auditor, own verification, agreed goal with checkable done-bars it must fully meet, round limit that asks the user, task list + optional Brief tracking, project facts, goal and handoff in `docs/orchestrator/`. |

## Mods

Mods change Claude Code itself (panes, bands, themes, slash commands, tool-call hooks) through a hooks module. Each one is its own plugin in this marketplace.

| Mod | Description |
|-----|-------------|
| [orchestrator-pane](mods/orchestrator-pane/hooks/register.tsx) | A two-line band above the prompt with the [orchestrator](skills/orchestrator/SKILL.md) progress at a glance (a done-bar bar, each area coloured by how far along it is, the task total) over the handoff's next step, read live from `docs/orchestrator/`. It finds that folder in the session's folder, one above it, or a git worktree's main checkout, and shows whenever it is found or the orchestrator skill starts. `/orchestrator-pane` (or the band's `▾`) opens the open bars and task sections under it and closes them again; `/orchestrator-pane <folder>` reads another project, `auto` searches again, `hide` hides the band. The command prints nothing in the chat (it answers with a toast) and runs at once, even mid-turn. Desktop and mobile draw the band as styled SVG. |

## Install

**As plugin (recommended):**

```
/plugin marketplace add MichalDakowicz/skills
/plugin install skills@michu-skills
/plugin install orchestrator-pane@michu-skills   # mod
```

From a shell: `claude plugin install orchestrator-pane --marketplace MichalDakowicz/skills`.
In the desktop app: + next to the prompt box → Plugins → Add marketplace `MichalDakowicz/skills` → Add plugin.

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

## Add a mod

```bash
python scripts/new-mod.py my-mod "What it does"
```

Then edit `mods/my-mod/hooks/register.tsx`, add a row to the Mods table, and check it:

```bash
claude plugin validate mods/my-mod
```

```bash
claude plugin test mods/my-mod
```

```bash
python scripts/validate.py
```

While developing, run a session with `claude --plugin-dir mods/my-mod`; saving the module hot-reloads it.

## License

[MIT](LICENSE)
