# Tracking: task list plus Brief

The **markdown task list is always the source of truth** and is always kept up to
date. Brief is an extra layer, used when it is set up, so the same project can be
orchestrated on a machine without Brief.

## Markdown task list

The file is named in `docs/orchestrator.md` (usually `docs/TASKS.md` or
`docs/implementation.md`). Expected shape (adapt to whatever the project already uses;
do not reformat an existing file):

```markdown
## 3. Settings screen
- [ ] change-password row
- [x] theme toggle — verified: checks green, tested web light/dark, audit clean (a1b2c3d)
```

- Work the sections in order unless the user says otherwise.
- Tick `[x]` only after the full pipeline passed. Append a short evidence note and the
  commit sha.
- Split an item into sub-items when a unit is a slice of it.
- New findings that are out of scope go in as new unticked items under the right section.
- Commit task-list changes with the unit's commit, or as `docs: update tasks`.

## Brief adapter

Use it only when **both** hold:
1. `docs/orchestrator.md` names a Brief project id, and
2. the `brief_*` tools exist in the session (check with ToolSearch "brief").

If either is missing, say so once and continue with the markdown list only.

| When | Call |
|------|------|
| session start | `brief_orient` with the repo path |
| before work on a unit | `brief_claim_entry` |
| progress worth noting | `brief_append_line` (lowercase, one line, no full stop) |
| unit verified and committed | `brief_finish_entry` with done |

- Finish an entry only after verification, never on a builder's report.
- Agents that share one name often cannot finish each other's entries. If finish fails
  with "claim this brief first", claim it, then finish.
- Entries still claimed by an earlier session: verify the work they describe, then
  finish them or report what is missing. List them in the handoff until they are closed.
- Keep Brief and the task list in sync: when Brief says done, tick the box. When a box
  is ticked on a machine without Brief, finish the matching entry the next time Brief is
  available. The handoff lists any pending syncs.

Subagents do not touch the tracker. Only the orchestrator claims, appends and finishes.
