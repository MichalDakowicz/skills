# Goal: `docs/orchestrator/goal.md`

Agents tend to stop when the work is *about* done: the happy path runs, a few states are
missing, the spacing is off, a TODO is left "for later". The goal stops that. It fixes,
up front and with the user, what **done** means for this run. You keep working until
every bar is met with evidence, or the user says otherwise.

## When

- **Initial command run** (the first session of a run, or no active goal in
  `goal.md`): draft a new goal after the baseline and regression pass, before planning
  units.
- **Active goal exists:** show it in two lines (statement and progress, `x/y` bars met)
  and ask: keep it / edit it / replace it. Do not redraft silently.
- **The user's command already states a goal:** use it as the statement and still draft
  the bars, scope and evidence. Their words win where they conflict with your draft.

## Drafting

Inputs: the user's command, the unticked task-list sections, the design source,
`CLAUDE.md` (especially Testing), open questions, and the last handoff.

Make it **ambitious but finishable in this run**: one coherent outcome, not "everything
left". If the remaining work is large, take the next section(s) that form something a
user could actually use, and put the rest under "Not in this goal".

Every bar must be **checkable**. Name the flow, state, screen or command, and say how
it is proven (a check command, a tester screenshot compared to a design board, an audit
result, a deployed URL). "Polished", "works well" or "clean" on their own are not bars.

Cover all five areas. Leave one out only if it cannot apply (for example *Looks* for a
CLI without output formatting), and say why.

| Area | Bars to write (adapt to the project) |
|------|--------------------------------------|
| **Works** | every in-scope flow runs end to end on every in-scope platform; data saves, survives a reload or restart, and syncs; all checks green; no console or log errors |
| **Looks** | matches the design side by side (layout, spacing, type, colour tokens, icons, motion); every state the design draws (empty, loading, error, disabled, selected); both themes; narrow and wide sizes; no overflow, clipping, truncation, misalignment or layout shift; copy is final, no placeholders |
| **Feels** | keyboard and focus paths, hover and active states, shortcuts; fast enough that nothing visibly janks or hangs; basic accessibility (labels, focus rings, contrast) |
| **Holds up** | edge cases, errors with user feedback, offline or reconnect if claimed, the security rules in `CLAUDE.md`; the gap auditor's final pass has no blocker or major findings |
| **Shipped** | committed, then pushed and deployed per the autonomy level; PR open; tracker and task list ticked; no TODO, FIXME, stub, dead code or skipped test in scope; handoff updated |

## Presenting

Show the full goal in chat (it is short: about one screen). Then ask with
`AskUserQuestion`:

- **Approve**: save it and start.
- **Edit**: the user types changes; apply them, show the result, ask again.
- **Narrow scope** / **Raise the bar**: adjust and show again.

Write nothing until it is approved. Save it to `docs/orchestrator/goal.md` and commit
with `docs: set orchestrator goal`.

## Template

```markdown
# Goal

_Set {{YYYY-MM-DD}} · status: {{active | blocked | achieved}}_

**Goal.** {{one or two sentences: the end state from the user's point of view}}

**In scope.** {{units / task-list sections / platforms}}
**Not in this goal.** {{what stays for later, so nobody stretches or shrinks the scope}}

## Done when

### Works
- [ ] {{bar}} · proof: {{how}}

### Looks
- [ ] {{bar}} · proof: {{how}}

### Feels
- [ ] {{bar}} · proof: {{how}}

### Holds up
- [ ] {{bar}} · proof: {{how}}

### Shipped
- [ ] {{bar}} · proof: {{how}}

## Blocked on
- {{open question or missing access}} (blocks: {{bar}})

## Changes
- {{YYYY-MM-DD}}: {{what changed}} (approved by the user)
```

Tick a bar only with its evidence inline, for example
`- [x] notes grid matches board N-03 in both themes · proof: tester run 4, screenshots 12–15`.

## Working toward it

- Plan the units from the goal, not only from the task-list order. A bar that no unit
  covers becomes a unit.
- After each unit closes, tick the bars it met, with evidence. In every recap, show
  progress as `x/y bars`.
- A finding that breaks a bar is in scope, even if it looks minor. Out-of-scope findings
  go to the task list, not into the goal.
- The goal changes only with the user's OK, logged under **Changes**. Never drop or
  soften a bar to finish sooner.

## Finishing: the goal review

When every unit is closed and every bar looks met, run a goal review before you call it
done. Earlier passes only saw single units.

1. Run every check from the Testing section, on a clean tree.
2. A tester walks **all** in-scope flows (not only the last unit's) against every
   Works, Looks and Feels bar, comparing screenshots with the design boards.
3. The gap auditor reviews the whole scope against the Holds up bars and `CLAUDE.md`.
4. Search the scope for `TODO`, `FIXME`, stubs, placeholder copy and skipped tests.
5. Every miss becomes a unit and goes through the pipeline (the round limit still
   applies). Then repeat the review.

**Not done** while any of these is true: a bar is unticked or has no evidence; a parked
unit holds a blocker; an in-scope question is unanswered; anything in scope reads
"should work", "mostly", "minor polish left" or "follow-up".

## Ending

- **Achieved:** set the status to `achieved` and report every bar with its evidence.
  Move the file to `docs/orchestrator/goals/{{YYYY-MM-DD}}-{{slug}}.md`, commit, and
  offer to draft the next goal.
- **Cannot be reached this run** (waiting on the user, missing access, round limit left
  as is): set the status to `blocked`, list exactly which bars are open and why, and
  ask the user. Never report a blocked goal as done.
