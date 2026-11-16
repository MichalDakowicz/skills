# Project docs: `docs/orchestrator/`

Each project keeps its orchestration files in one folder, so the skill itself stays
generic and a new session can resume from the files alone.

```
docs/orchestrator/
├── project.md    facts: how to ship, track and run agents here
├── goal.md       the agreed goal for the current run (see goal.md reference)
├── handoff.md    where the last session stopped
├── goals/        achieved goals, one file each
└── local.md      private facts for public repos (gitignored)
```

`CLAUDE.md` holds the standing rules, including how to test. The folder holds facts
and state. Commit everything except `local.md`. Keep secrets, passwords, tokens and
`.env` values out of all of it. Hosts and deploy commands are fine in a private repo.
In a public repo, put them in `local.md` and add `docs/orchestrator/local.md` to
`.gitignore`.

**Migrating:** if the project has an old single `docs/orchestrator.md`, split it into
`project.md` and `handoff.md`, delete the old file, and commit with
`docs: move orchestrator docs into folder`.

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
(next section). The goal is not asked here either: it is drafted right after setup.

Show the filled `project.md` once and get an OK before writing it.

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
wrote; suggest additions instead. (The `kickoff` skill writes this section for new
projects.)

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

## `project.md`

```markdown
# Orchestration: project

How agents ship and track this project. Rules and testing live in CLAUDE.md; the goal
lives in goal.md; the last session's state lives in handoff.md.

## Project

- Root: `{{relative or repo name, no personal absolute paths}}`
- Layout: {{apps / packages one-liner}}
- Design source: {{paths}}. {{which platform leads}}
- Task list: `{{docs/TASKS.md}}`
- Brief: {{project id and name | none}}
- Regression pass at session start: {{always | when stale | never}}

## Shipping

- Autonomy: {{commit | push | deploy}}
- Branch: `{{feat/…}}`, base `{{main}}`, PR: {{#n | not opened}}
- Deploy: `{{command | "see local.md"}}`
- Smoke-test URL: {{… | "see local.md"}}
- Always ask first: migrations, infra, production data, {{project-specific}}

## Models

builder `{{sonnet}}` · tester `{{haiku}}` · gap auditor `{{opus}}`

## Open questions

<!-- Waiting on the user. Never resolve these yourself. -->
- {{question}} (blocks: {{unit or goal bar}})
```

## `handoff.md`

Rewrite the whole file (do not append) at the end of every session and commit it with
`docs: update orchestrator handoff`.

```markdown
# Orchestration: handoff

_Updated {{YYYY-MM-DD}}_

**State.** Branch `{{…}}` at `{{short sha}}`, pushed: {{yes/no}}. Checks: {{all green |
which fail}}. Deployed: {{sha / no}}.

**Goal.** {{goal statement, one line}}: {{x/y}} bars met, status {{active | blocked |
achieved}}. Open bars: {{list}}.

**Done this session.** {{units, one line each, with how they were verified}}

**Not verified.** {{what could not be checked and why}}

**In flight.** {{unit, stage of the pipeline, open findings}}

**Parked.** {{units left after the round limit: unit, stage, remaining findings}}

**Claimed but unfinished.** {{tracker entry ids still claimed; verify, then finish}}

**Next.** {{the next unit(s) toward the goal}}

**Housekeeping.** {{PR not opened, migrations not registered, etc.}}
```

The folder replaces the long hand-written "state of the project" prompt. A new session
only needs "be the orchestrator".
