# Project file: `docs/orchestrator.md`

Each project keeps its own orchestration facts here, so the skill itself stays generic.
`CLAUDE.md` holds the standing rules. This file holds how to run, check and ship the
project, plus the live handoff.

Commit it. Keep secrets, passwords, tokens and `.env` values out of it. Hosts and
deploy commands are fine in a private repo. In a public repo, point to an env var or a
gitignored local file instead (for example `docs/orchestrator.local.md`).

## First-run setup

Survey first: `CLAUDE.md`, `AGENTS.md`, `package.json` / other manifests and their
scripts, the task file (`docs/TASKS.md`, `docs/implementation.md`, `TODO.md`), the
design folder, existing deploy scripts, and `git remote -v`. Pre-fill answers from what
you find, then confirm them with `AskUserQuestion` (at most 4 questions per call). Skip
anything the survey already settled.

1. **Design source.** Which files or folders are the truth for UI? Which platform leads
   when platforms differ?
2. **Task list.** Which file, and does a Brief project exist for this repo (its id)?
3. **Autonomy.** `commit`, `push` or `deploy` after each verified unit (see SKILL.md).
   For `deploy`: the exact deploy command and the URL to smoke-test.
4. **Branch and PR.** Working branch, base branch, whether a PR is already open.
5. **Models.** Keep the defaults (sonnet / haiku / opus) or override?
6. **Regression pass** at session start: always, only when stale, or never?

How to check, run and test the project is not asked here. It lives in `CLAUDE.md`
(next section).

Show the filled file once and get an OK before writing it.

## Testing section in `CLAUDE.md`

Testing belongs to the project, not to the orchestrator. Every agent reads `CLAUDE.md`,
the user may already have their own ways to test (a phone over adb, a staging site, a
manual checklist), and the rules apply to humans and non-orchestrated sessions too. The
orchestrator reads this section, follows it, and passes it to testers verbatim.

Accept any existing heading that covers it (`## Testing`, `## Verification`,
`## Testing on the user's phone (adb)`…). Several testing sections are fine; use all of
them. Only if nothing covers **checks** and **how to verify a change**, draft the
missing parts with the user. Pre-fill from the manifests' scripts and from the tester
modes in [roles.md](roles.md#default-modes-for-drafting). Show the draft and append it
to `CLAUDE.md` only after their OK. Never rewrite a testing section the user already
wrote; suggest additions instead.

What the section should answer:

```markdown
## Testing

**Checks before every commit:** `{{typecheck}}`, `{{lint}}`, `{{test}}`, `{{build}}`.

**Run the app:** `{{dev command}}` on port {{n}}, in the user's own terminal tab. Never
kill it; start it only if it is down.

**Verify changes by:** {{how: built-in browser at http://localhost:n / adb on the
user's phone / CLI in a scratch dir / API calls / manual checklist}}. Walk every changed
flow end to end, not just the code.

**Cover:** {{what "tested" means here: themes, viewports, keyboard, empty/loading/error
states, console and logs, offline…}}

**Confirm each session:** {{e.g. "lock screen may be up; never enter the password",
"phone connected?", "VPN on?"}}

**Never:** {{limits: no real payments, no production data, stay inside the app…}}

**Report:** what was verified and what was not, in {{PR / docs/implementation.md}}.
```

## Template

```markdown
# Orchestration

How agents run, check and ship this project. Rules live in CLAUDE.md; this file is
facts and state. Updated by the orchestrator at the end of every session.

## Project

- Root: `{{relative or repo name, no personal absolute paths}}`
- Layout: {{apps / packages one-liner}}
- Design source: {{paths}}. {{which platform leads}}
- Task list: `{{docs/TASKS.md}}`
- Brief: {{project id and name | none}}

## Testing

Checks, running and verification: see the Testing section of `CLAUDE.md`.
Regression pass at session start: {{always | when stale | never}}

## Shipping

- Autonomy: {{commit | push | deploy}}
- Branch: `{{feat/…}}`, base `{{main}}`, PR: {{#n | not opened}}
- Deploy: `{{command or "see orchestrator.local.md"}}`
- Smoke-test URL: {{…}}
- Always ask first: migrations, infra, production data, {{project-specific}}

## Models

builder `{{sonnet}}` · tester `{{haiku}}` · gap auditor `{{opus}}`

## Open questions

<!-- Waiting on the user. Never resolve these yourself. -->
- {{question}} (blocks: {{unit}})

## Handoff

{{see format below}}
```

## Handoff

Rewrite this section (do not append) at the end of every session and commit it with
`docs: update orchestrator handoff`.

```markdown
## Handoff

_Updated {{YYYY-MM-DD}}_

**State.** Branch `{{…}}` at `{{short sha}}`, pushed: {{yes/no}}. Checks: {{all green |
which fail}}. Deployed: {{sha / no}}.

**Parked.** {{units left after the round limit: unit, stage, remaining findings}}

**Done this session.** {{units, one line each, with how they were verified}}

**Not verified.** {{what could not be checked and why}}

**In flight.** {{unit, stage of the pipeline, open findings}}

**Claimed but unfinished.** {{tracker entry ids still claimed; verify, then finish}}

**Next.** {{the next unit(s) in order}}

**Housekeeping.** {{PR not opened, migrations not registered, etc.}}
```

The handoff replaces the long hand-written "state of the project" prompt. A new session
only needs "be the orchestrator" plus this file.
