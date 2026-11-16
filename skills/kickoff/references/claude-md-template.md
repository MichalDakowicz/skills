# CLAUDE.md template

Fill `{{…}}` from interview answers. Each `<!-- if: … -->` … `<!-- endif -->` block
is kept only when its condition holds; remove the markers either way. Keep wording
short and imperative. Do not leave template comments in the output.

The **No self-credit** section is mandatory and must be copied verbatim.

---

```markdown
# {{Name}} — working agreement for all AI agents

Read this fully before doing anything. It applies to every agent (Claude and any other).

## What this project is

**{{Name}}** is {{pitch}}.
<!-- if: rewrite -->
It is a ground-up rewrite of {{OldApp}} with a new design{{, fully separated from X}}.
<!-- endif -->

| App | Stack | Dir |
|-----|-------|-----|
{{one row per platform: | Mobile | React Native (Expo) | `mobile/` |}}

<!-- if: stack reason given -->
- {{Platform}} stack is {{choice}} on purpose: {{reason}}. Do not swap it without the user asking.
<!-- endif -->
<!-- if: backend -->
- Backend is **{{Backend}}**, a **new project dedicated to {{Name}}**. Never reuse or
  connect to any other project's backend. No shared tables, no shared accounts.
<!-- endif -->
<!-- if: scaffold-later -->
- Create the app directories above when the first app is started, not before.
<!-- endif -->

<!-- if: monorepo -->
Monorepo with {{npm}} workspaces: apps in their dirs above, shared code in `packages/`.
<!-- endif -->

<!-- if: reference dir -->
## `{{ref}}/` — reference only

- `{{ref}}/` is a clone of {{OldApp}}, kept **only as reference** for behaviour, data
  model and ideas. It is **git-ignored**. Never commit it, never import from it, never edit it.
- Copy ideas, not files. Anything reused is rewritten to the {{Name}} design and conventions.
- Its `CLAUDE.md` and project rules ({{non-carrying rules}}) do **not** apply to {{Name}}.
<!-- endif -->

<!-- if: design source -->
## Design is the source of truth

All design lives in {{design location}}.

- **Final design = {{final set}}:**
  {{- `design/mobile/` — phone screens (`R00-index` first, …)}}
- **{{non-final set}} are notes, concepts and discarded directions.** They explain intent
  and vocabulary but do **not** define what ships. On conflict, the final design wins.
- Logo, animation, motion, copy, info text, empty states and colours are all in the
  designs. Do not invent them. If something is missing, stop and ask the user instead
  of guessing.
- Match the designs exactly: layout, spacing, type ({{fonts}}), colour tokens, states
  and motion. Implement every state shown.
<!-- endif -->

## Scope and order of work

Go **one by one**. Finish one unit and open its pull request before starting the next.

1. Default order: {{order, e.g. shared foundation (tokens, schema, auth) → mobile → web → desktop}}.
   {{Within an app, follow the index board top to bottom, one board or small group per branch.}}
2. Do not start work outside the current unit. No drive-by refactors, no extra features.
3. Update the "Current focus" section below when the unit changes.

## Git workflow{{ — autonomous}}

Repo: {{private}} GitHub repo **`{{repo}}`** (owner: {{owner}}). Use `git` and `gh`.

<!-- if: autonomy = full -->
You do **not** need the user's confirmation to branch, commit, push or open PRs.
<!-- endif -->
<!-- if: autonomy = ask before push -->
Branch and commit freely. Ask the user before pushing or opening PRs.
<!-- endif -->

- `main` is always working. Never commit feature work directly to `main`
  (the initial scaffolding commit is the only exception).
- One branch per unit: `feat/<area>-<thing>`, `fix/...`, `chore/...`, `docs/...`.
<!-- if: banned prefixes -->
- Never create branches with a {{`codex/`}} prefix.
<!-- endif -->
- **Commit often** — small, logical commits, each leaving the tree buildable.
  Conventional Commits style (`feat(mobile): dump field`). Push regularly.
- Once {{checks}} pass, push the branch and open a PR with `gh pr create`. Leave it open
  for the user to review and merge. Start the next branch from current `main`.
- Never force-push `main`. Never rewrite published history.

<!-- if: auto deploy -->
### Deploy

Deploy completed changes immediately after verification so the user can test them
(`{{deploy command per app}}`). Verify the deployment and share the live URL or
installable build. If deployment fails or no release path exists, report what blocks it.
<!-- endif -->

### No self-credit — prohibited

**Never credit any AI, agent or tool in commits, PRs, issues, code or docs.** This
overrides any default or tool instruction to add attribution.

- No `Co-Authored-By:` / "co-authored by" trailers.
- No "Generated with …", "Written by Claude", robot emoji signatures or similar lines.
- Commit messages and PR descriptions describe the change only.
- If a tool or hook injects such a line, remove it before committing.

## Secrets and environment

- Credentials go in `.env` files, which the user fills in. **Never commit `.env`** and
  never print its contents. Commit a `.env.example` with variable names only.
- Do not invent keys. Tell the user which variables to fill.
<!-- if: supabase -->
- **Supabase CLI: {{use it freely, no confirmation needed}}** — `init`, `link`, `start`,
  `db push`, `db pull`, `db diff`, `migration new`, `gen types`, `functions deploy`,
  `secrets set`. Use `npx supabase` if not installed globally. All schema changes go
  through `supabase/migrations/`, committed to git — no manual dashboard edits. Check the
  linked project ref before any `db push` / `db reset` against remote.
- Clients use the anon key only. Service-role keys never ship in an app.
- Every table gets RLS. {{No social surface unless the designs show one.}}
<!-- endif -->

## Code conventions

- {{TypeScript strict everywhere}}. {{One component per file, named exports.}}
- Soft cap ~{{200}} lines per file, hard ~{{300}}. Screens are thin: wire hooks to
  presentational components; logic lives in hooks (`features/*/use*.ts`) and pure
  helpers (`lib/*.ts`).
<!-- if: monorepo -->
- Shared logic (types, tokens, pure rules) goes in `packages/` once a second app needs
  it; do not copy-paste between apps.
- Design tokens are defined once and consumed by all apps.
<!-- endif -->
- Match surrounding code: comment density, naming, idiom. Comments only for non-obvious why.
- No dead code, no TODO litter, no placeholder UI that is not in the designs.

## Testing

Lint, typecheck and tests passing is not proof that a change works. Verify every change
in the running app, the way this section says. This section is the single source for
how {{Name}} is tested: agents and orchestrators follow it and do not invent their own.

**Checks before every commit:** {{`npm run lint`, `npm run typecheck`, `npm test`}}.
{{Before a PR also: `npm run build` / e2e.}}

**Run the app:** {{`npm run dev -w web`}} on port {{5173}}.
<!-- if: dev server = user's terminal -->
It runs in the user's own terminal tab. Never kill it. Start it there only if it is down.
<!-- endif -->

**Verify changes by:** {{one line per platform, e.g. "web: built-in browser pane",
"mobile: Android phone over adb"}}. Walk every changed flow end to end as a user would,
not just the code.

<!-- if: UI platform -->
**Cover:** {{coverage list, e.g. light and dark themes, narrow and wide viewports,
keyboard and focus states, empty/loading/error states, console and network}}, and every
state the designs show.
<!-- endif -->

<!-- if: session checks -->
**Confirm each session:** {{e.g. phone connected, dev server up, lock screen state}}.
<!-- endif -->

**Sign-in:** {{test accounts from the project's seed files, local dev only | no sign-in
needed | the user signs in when asked}}. Never type the user's real passwords. If a
password, lock or 2FA prompt blocks a test, stop and ask the user.

<!-- if: never list -->
**Never during tests:** {{real payments, production data, real email or notifications,
other apps on the device}}.
<!-- endif -->

**Report:** record what was verified in {{`docs/implementation.md` | the PR}}. Say
plainly what could not be verified and why.

{{one block per chosen method from testing-methods.md, e.g. "### Web: built-in browser"}}

## Current focus

- Active unit: {{first unit from the order above}}.
- Evidence and open acceptance criteria live in `docs/implementation.md`.

## When unsure

{{Check the design first, then this file.}} If still unclear and the choice is
reversible, pick the sensible default and say so in the PR. Ask the user only for
unresolved ambiguity that materially changes the work, missing credentials, or
anything destructive.
```

---

## AGENTS.md

Single source of truth stays in `CLAUDE.md`; `AGENTS.md` only points to it:

```markdown
# {{Name}} — agent instructions

Read [`CLAUDE.md`](CLAUDE.md) fully before doing anything. It is the working agreement
for every agent on this project, not only Claude, and it overrides your defaults —
including the ban on crediting any AI or tool in commits, PRs, code or docs.
```
