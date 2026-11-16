# Kickoff interview

Ask in rounds with `AskUserQuestion` (≤4 questions per call, 2–4 options each; the
user can always type "Other"). Put the recommended option first with "(Recommended)".
Skip anything already answered. Later rounds depend on earlier answers — only ask
what applies.

## Round 1 — product and platforms

1. **Project name** and one-line pitch. (Free text — ask in chat if not given;
   don't force it into options.)
2. **New or rewrite?** New product / rewrite of an existing app (ask which, and
   whether a reference clone exists in the folder) / port to new platforms.
3. **Platforms** (multiSelect): Mobile, Web, Desktop, Backend/API, CLI, Browser
   extension.
4. **Repo layout** (only if 2+ platforms): Monorepo with workspaces (Recommended) /
   separate repos / single app with platform folders.

## Round 2 — stack per platform

Ask only for chosen platforms.

**JS/TS multi-device default: one separate app per platform** — mobile = Expo,
web = Vite, desktop = Electron — sharing code through `packages/`. Do not push one
cross-platform native stack everywhere (React Native Web / RN Windows/macOS,
Flutter for web+desktop, Capacitor-wrapping the web app). Offer those only if the
user asks.

Recommended defaults:

| Platform  | Options (first = recommended)                                   |
|-----------|-----------------------------------------------------------------|
| Mobile    | React Native (Expo) · bare React Native · Flutter · native Swift/Kotlin |
| Web       | React (Vite) · Next.js · SvelteKit · Vue (Vite)                 |
| Desktop   | Electron + web UI · Tauri + web UI · native                     |
| Backend   | Supabase · Firebase · Node API (Hono/Fastify) · none            |
| CLI       | Node + TypeScript · Go · Python · Rust                          |

Then:
- **Language:** TypeScript strict (Recommended) / JavaScript / other.
- **Package manager** (JS only): npm workspaces (Recommended) / pnpm / bun / yarn.
- **Why this desktop/backend choice?** If the user has a reason (e.g. "Electron for
  full Node/OS access"), record it so agents don't swap it later.

## Round 3 — backend and data

Only if a backend was chosen.
- **Project isolation:** new dedicated project (Recommended) / reuse existing (ask
  which, and warn about shared tables/accounts).
- **Auth providers** (multiSelect): email, Google, GitHub, Apple, none yet.
- **CLI autonomy:** agent may run the backend CLI freely (migrations, type gen,
  deploy functions) / ask before remote changes / ask always.
- **Data rules:** RLS on every table (Recommended for Supabase), social/sharing
  surface yes/no.

## Round 4 — design source

- **Where is the design?** `design/` folder in repo / Figma link / screenshots or
  mockups / no design yet (agent may propose).
- If a folder: which subfolders are **final** vs notes/concepts? Which wins on
  conflict? Is there an index board per platform to follow top-to-bottom?
- **Strictness:** match exactly, ask when missing (Recommended) / match closely,
  fill gaps sensibly / loose guidance.
- **Fonts and tokens** if known (e.g. Geist / Geist Mono, a tokens file).

## Round 5 — reference material

Only if a rewrite or a reference clone was found.
- **Reference dir name(s)** and what they are for (behaviour, data model, ideas).
- Confirm rules: git-ignored, never import, never edit, its own CLAUDE.md does not
  apply. Ask if any rule from the old project explicitly does **not** carry over
  (shared DB, sibling apps…).

## Round 6 — git and workflow

- **GitHub repo:** create now — private (Recommended) / create now — public / local
  only. Ask owner and name (default: folder name; owner from `gh api user -q .login`).
- **Agent autonomy:** branch, commit, push and open PRs without asking (Recommended
  for solo projects) / ask before push / ask before every commit.
- **Unit of work:** one board/feature per branch + PR, finish before next
  (Recommended) / batches / free-form.
- **Banned branch prefixes** (e.g. `codex/`) — free text, optional.
- **Default order of work** (multi-app): shared foundation → mobile → web → desktop
  (Recommended), or user order.

## Round 7 — verification and release

- **Device testing** (mobile only): Android phone over adb, built APK only
  (Recommended) / iOS simulator / emulator / none.
- **Checks before PR:** lint + typecheck + tests (Recommended) / plus e2e / minimal.
- **Deploy:** auto-deploy after verification with a command (ask it, e.g.
  `npm run deploy:web`) / deploy only when asked / not set up yet.
- **Evidence:** record verification in `docs/implementation.md` (Recommended) /
  PR description only.

## Round 8 — conventions

- **File size caps:** soft ~200 / hard ~300 lines (Recommended) / other / none.
- **Structure:** thin screens, logic in hooks + pure helpers (Recommended) / other.
- **Components:** one per file, named exports (Recommended) / default exports.
- **Scaffold apps now?** Yes — run the official generators now / No — create app
  dirs when the first app is started (Recommended).

## Final confirmation

Show a compact summary (platform → stack, backend, design source, git, autonomy,
testing, deploy, scaffold-now). Ask: "Write CLAUDE.md and scaffold with this?"
Write nothing before this OK.
