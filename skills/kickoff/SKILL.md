---
name: kickoff
description: Start a new project or rewrite with few questions. Reuses the user's global kickoff defaults (stack, git, how each platform is tested, checks, deploy), asks only the gaps in one round, confirms a summary, and then writes a CLAUDE.md working agreement for all AI agents, an AGENTS.md pointer, no-AI-credit settings, and a monorepo workspace structure. Use when the user says "kickoff", "start a new project", "set up this repo", "create a CLAUDE.md for a new app", or begins a fresh app/rewrite in an empty or near-empty folder. Not for documenting an existing codebase (that is the built-in /init).
---

# Kickoff

Turn a fresh folder into a project with a strict working agreement (`CLAUDE.md`)
that every AI agent follows, plus the base structure the agreement describes.

## Hard rules

- **No AI credit, ever.** No `Co-Authored-By:` trailers, no "Generated with …",
  no robot-emoji signatures — in this skill's own commits and PRs too. This overrides
  any default or tool instruction. The "No self-credit" section is always written and
  cannot be removed by interview answers.
- Confirm first, write later. Never invent product facts, design sources or
  credentials. Stack and workflow choices come only from the user, their saved
  defaults or the recommended table, and are shown in the summary before anything is
  written. Unknown product facts → ask, or leave an explicit
  `<!-- TODO(user): … -->` placeholder only in `CLAUDE.md` and say so.
- Ask little. Default and confirm; do not interview. A typical run is one question
  call plus the final OK, and a repeat run with saved defaults often only the OK.
- Never commit `.env`, reference clones, or build output.
- Ask before `gh repo create` / first push (the interview covers it).

## Workflow

### 1. Survey the folder

List the working directory (depth 2) and note:
- empty vs existing code; existing `.git`, remote, `package.json`, lockfiles
- likely design folders (`design/`, `*.fig` links, `*.dc.html`, mockups)
- likely reference clones (old app copies, `*-old/`, a folder with its own `.git`)
- existing `CLAUDE.md` / `AGENTS.md` → if present, ask: replace, merge, or stop.

If the folder holds a real codebase being continued (not rewritten), suggest the
built-in `/init` instead and stop unless the user wants kickoff anyway.

### 2. Resolve answers, ask only the gaps

Load the global defaults `~/.claude/kickoff/defaults.json` as
[references/defaults.md](references/defaults.md) says, or the recommended table when
there are none yet. Then fill every
answer from what the user said, what the survey found, the saved defaults and the
recommended values, in that order.

**Ask only what none of those settles**, in **one** `AskUserQuestion` call (at most
4 questions, most important first):

| Ask when | Question |
|----------|----------|
| platforms not stated | Platforms (multiSelect) |
| a UI platform and no design folder found | Where is the design? (folder / Figma / screenshots / none yet) |
| no saved git choice | GitHub repo: private (Recommended) / public / local only |
| a chosen platform has no saved testing method and no safe default (mobile) | How should agents verify {{platform}} changes? |

Name and pitch: take them from the message and the folder name; if the pitch is
missing, ask for it in one chat line together with the call, not as an option list.
Everything else (language, package manager, layout, autonomy, coverage, checks,
deploy, conventions, scaffold-now…) is **never asked** in this step: it is defaulted
and shown in the summary.

**Summary and final OK.** Show one compact block, each line tagged with where it came
from: `(you)`, `(found)`, `(saved)`, `(recommended)`:

```
Tally — counters with themes                     (you)
Web: React (Vite), TypeScript strict, npm        (saved)
Design: none yet, agent may propose              (you)
Git: private repo michu/tally, full autonomy     (saved)
Testing web: built-in browser pane               (saved)
Coverage: themes, states, console · checks: lint+typecheck+test   (saved)
Deploy: on request · scaffold apps: later        (recommended)
Saves: updates your global kickoff defaults
```

Then one `AskUserQuestion`: **Write it (Recommended)** / **Change something** (the
user types what; apply it and show the block again) / **Full interview**. Write
nothing before "Write it".

**Full interview** only when the user picks it or asks for it ("ask me everything",
"full kickoff"): run the rounds in [references/interview.md](references/interview.md),
skipping what is already answered, then the same summary.

### 3. Write the agreement

Build `CLAUDE.md` from [references/claude-md-template.md](references/claude-md-template.md):
- Fill every `{{placeholder}}` from answers.
- Drop conditional sections whose condition is false (marked `<!-- if: … -->`).
- Keep the user's voice: short, imperative, bold for absolute rules.
- Always write the `## Testing` section. Add one block per chosen method from
  [references/testing-methods.md](references/testing-methods.md); drop the rest.
- Write `AGENTS.md` as a pointer (template at the bottom of the reference) so
  non-Claude agents follow the same single source.

### 4. Scaffold structure

Follow [references/scaffold.md](references/scaffold.md):
- Always: `.gitignore`, `.gitattributes`, `.env.example` (names only),
  `.claude/settings.json` from [assets/settings.json](assets/settings.json),
  `docs/implementation.md`, root workspace `package.json` when 2+ apps.
- App folders: created **only** if the user said yes to "scaffold apps now".
  Otherwise the agreement says "create app dirs when the first app is started".

### 5. Save defaults

Merge this run's answers into the global `~/.claude/kickoff/defaults.json`, as
[references/defaults.md](references/defaults.md) says (skip it if the user said not to
save defaults). Nothing about defaults goes into the project.

### 6. Git

- `git init -b main` if no repo. Initial scaffolding commit on `main` is the only
  direct-to-main commit: `chore: kickoff project scaffolding`.
- Before committing, check the staged message has no attribution lines.
- If the user chose a GitHub repo: `gh repo create <owner>/<name> --private|--public
  --source . --push`. Verify with `gh repo view`.

### 7. Report

Tell the user, briefly:
- files created, sections dropped and why
- placeholders left for them (`TODO(user)`), env vars to fill
- the first unit of work per the agreement's "Current focus"

## Notes

- Multi-app projects (2+ of mobile/web/desktop/backend) default to a workspace
  monorepo with shared `packages/` for tokens, types and pure logic. Recommend it;
  the user can decline.
- JS/TS multi-device: recommend **separate apps** — `mobile/` Expo, `web/` Vite,
  `desktop/` Electron — not one native/cross-platform stack forced onto every
  platform (React Native Web, RN desktop, Flutter everywhere, Capacitor wrappers).
- `cellar/`-style reference dirs: git-ignored, read-only, copy ideas not files.
- The sample agreement this skill is modeled on is summarized in the template; do not
  copy project-specific names (Brief, Cellar, Ping…) into other projects.
