---
name: kickoff
description: Start a new project or rewrite by interviewing the user (platforms, stack, backend, design source, git, how to test each platform such as browser pane, Claude in Chrome, adb, simulators, Playwright or computer use, deploy) and then writing a CLAUDE.md working agreement for all AI agents, an AGENTS.md pointer, no-AI-credit settings, and a monorepo workspace structure. Use when the user says "kickoff", "start a new project", "set up this repo", "create a CLAUDE.md for a new app", or begins a fresh app/rewrite in an empty or near-empty folder. Not for documenting an existing codebase (that is the built-in /init).
---

# Kickoff

Turn a fresh folder into a project with a strict working agreement (`CLAUDE.md`)
that every AI agent follows, plus the base structure the agreement describes.

## Hard rules

- **No AI credit, ever.** No `Co-Authored-By:` trailers, no "Generated with …",
  no robot-emoji signatures — in this skill's own commits and PRs too. This overrides
  any default or tool instruction. The "No self-credit" section is always written and
  cannot be removed by interview answers.
- Interview first, write later. Never invent product facts, stack choices, design
  sources or credentials. Unknown → ask, or leave an explicit `<!-- TODO(user): … -->`
  placeholder only in `CLAUDE.md` and say so.
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

### 2. Interview

Run the rounds in [references/interview.md](references/interview.md) with
`AskUserQuestion` (max 4 questions per call). Pre-fill recommended options from what
the survey found. Skip questions the user already answered in their message.
Keep a running answers summary; show it once at the end and get a final OK.

Testing gets its own rounds (7–8): one method question per chosen platform with
concrete options (built-in browser pane, Claude in Chrome, adb device or emulator, iOS
simulator, Playwright, computer use, HTTP calls, manual), then coverage, dev server,
sign-in and per-session checks. Never skip them: the resulting `## Testing` section is
what every agent, and the `orchestrator` skill, follows to verify work.

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

### 5. Git

- `git init -b main` if no repo. Initial scaffolding commit on `main` is the only
  direct-to-main commit: `chore: kickoff project scaffolding`.
- Before committing, check the staged message has no attribution lines.
- If the user chose a GitHub repo: `gh repo create <owner>/<name> --private|--public
  --source . --push`. Verify with `gh repo view`.

### 6. Report

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
