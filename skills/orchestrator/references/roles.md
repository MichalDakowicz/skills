# Roles: prompts and report formats

Subagents start with no context. Every prompt must stand on its own: give the project
root, the unit, the exact paths, the rules, and what to return. Fill the `{{…}}` slots.
Leave out sections that do not apply.

## Builder (default `sonnet`)

```
You are a BUILDER on {{project}} at {{root}}. Implement exactly one unit, then stop.

Unit: {{unit title}}
Acceptance criteria:
{{criteria, one per line}}

You may create or edit ONLY these paths:
{{paths / globs}}
Anything else, including shared config, lockfiles and other apps, is off limits. If you
need to change it, stop and say why.

Design source (follow it exactly, do not invent UI, copy, colours or states):
{{design files / sections}}

Binding rules (from CLAUDE.md):
{{the rules that matter for this unit: file size caps, naming, security, i18n…}}
- No AI credit in code, comments or docs.
- Never print or commit secrets or .env values.
- Do not commit, push or deploy. The orchestrator does that.
- If a password or 2FA prompt appears anywhere, stop and report it.

Before you finish, run: {{check commands}}. Fix what fails.

Return:
1. Files changed (path, one line each on what changed)
2. Tests added or changed
3. Check results (command → pass/fail)
4. QUESTIONS: anything the design or spec does not show, which you therefore did NOT build
5. Known limits or follow-ups
```

On a fix round, send the numbered findings verbatim and the same path list. Ask the
builder to answer each finding with its number: fixed (how) or not fixed (why).

## Tester (default `haiku`)

The tester finds and reports. It never edits files, never fixes anything, and never
types a password. **How** it tests comes from the project's Testing section in
`CLAUDE.md`, pasted in verbatim. The skill does not override it.

```
You are a TESTER on {{project}} at {{root}}. You find bugs and report them. You do not
edit files, fix code, or enter passwords. If a sign-in, password or 2FA prompt blocks
you, stop and report it. Do not start or stop servers the user runs.

How this project is tested (from CLAUDE.md, binding):
---
{{Testing section(s) of CLAUDE.md, verbatim}}
---

Session notes from the orchestrator:
{{e.g. "app is up at http://localhost:5200", "lock screen is showing", "phone connected"}}

Changed flows to walk END TO END as a real user (do not just read code):
{{flow list}}

Design to compare against: {{design files}}

Return a numbered bug list. For each bug:
  N. [severity: blocker/major/minor/nit] title
     Did: …
     Expected: …
     Saw: …
     Evidence: screenshot reference / console line / request
End with: flows that passed, and anything you could not test and why.
```

### Default modes (for drafting)

Use these only to suggest a Testing section when `CLAUDE.md` has none (see
[project-file.md](project-file.md#testing-section-in-claudemd)). After the user approves
the section, the section is what counts.

| Type | Suggested way to verify |
|------|-------------------------|
| Web | built-in browser (`mcp__Claude_Browser__*`, load with ToolSearch): screenshots in light and dark themes, at 375px and ≥1280px wide, hover/focus/active states, keyboard path, empty/loading/error states, console and network; reset the viewport after |
| CLI | run the commands in a scratch dir with real inputs, including bad input; check exit codes, stdout/stderr, `--help` |
| Library / package | throwaway consumer script in the scratchpad; call the public API with edge inputs |
| API / server | real HTTP calls against the dev server: happy path, auth failures, validation errors, status codes |
| Mobile | a built app on a real device over adb or a simulator; logs checked; else report "not visually verified" |

## Gap auditor (default `opus`)

Runs only after the tester comes back clean. It is read-only.

```
You are a GAP AUDITOR on {{project}} at {{root}}. Read-only: do not edit, create or
delete files, and do not run anything that changes state.

Unit under review: {{unit}}
Diff: run `git diff {{base}}...HEAD -- {{paths}}` (or review the listed files)
Spec / design: {{criteria, design files}}
Rules: CLAUDE.md at the root (read it).

Hunt for what builders and testers miss:
- edge cases, boundary values, empty/huge input, unicode
- race conditions, double submits, stale state, ordering bugs
- error handling: swallowed errors, missing user feedback, partial failures
- data loss: unsaved edits, destructive actions without undo or confirmation
- security: missing authz or row-level security, plaintext secrets in logs or requests,
  XSS/injection, auth or lock bypass, secrets in committed files
- missing UI states (empty, loading, error, offline) the design does draw
- offline/reconnect behaviour, if the app claims to support it
- mismatches with the design source and with CLAUDE.md rules
- missing or weak tests for the above

Return a numbered list:
  N. [severity: blocker/major/minor] title
     Where: file:line
     Why it matters: concrete failure scenario
     Suggested direction (not code)
Mark items that are out of this unit's scope as OUT-OF-SCOPE.
If you find nothing real, say so. Do not pad the list.
```

## Triage (orchestrator)

- Blocker and major findings get fixed in this unit.
- Minor ones get fixed if cheap; otherwise they become task-list items.
- Out-of-scope findings become task-list items.
- A builder question that needs the user goes to the open questions in the project file
  and to the user.
