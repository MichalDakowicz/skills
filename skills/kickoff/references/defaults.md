# Saved defaults

Kickoff remembers how the user likes projects set up, so a second project takes one
confirmation instead of a full interview.

## Where answers come from

Resolve every answer in this order and remember its source for the summary:

1. **Said** — the user's message or an earlier answer in this session.
2. **Found** — the folder survey (design folder, reference clone, existing remote,
   package manager from a lockfile, folder name as project name).
3. **Saved** — the defaults profile (below).
4. **Recommended** — the built-in defaults table at the end of this file.

Only a value no source settles, and that cannot safely default, is asked
(see SKILL.md step 2).

## File

One global file: `~/.claude/kickoff/defaults.json`, in the user's home, never in a
project and never committed. It holds the user's standing choices, not facts about
any one project (no name, pitch, platforms or design source).

```json
{
  "version": 1,
  "stack": { "mobile": "expo", "web": "react-vite", "desktop": "electron", "backend": "supabase", "cli": "node-ts" },
  "language": "typescript-strict",
  "packageManager": "npm",
  "layout": "monorepo",
  "backend": { "isolation": "dedicated", "cliAutonomy": "ask-remote" },
  "designStrictness": "exact-ask-missing",
  "git": { "repo": "private", "owner": "<github login>", "autonomy": "full", "unit": "feature-branch-pr", "bannedPrefixes": [] },
  "testing": {
    "web": ["browser-pane"], "mobile": ["adb-device"], "desktop": ["computer-use"],
    "backend": ["http-local"], "cli": ["scratch-dir"], "extension": ["chrome"]
  },
  "coverage": ["themes", "states", "console"],
  "devServer": "user-terminal",
  "signIn": "seed-accounts",
  "sessionChecks": [],
  "checks": "lint-typecheck-test",
  "neverDuringTests": ["real-payments", "production-data"],
  "deploy": "on-request",
  "evidence": "implementation-md",
  "conventions": { "fileCaps": "200/300", "structure": "thin-screens", "exports": "named" },
  "scaffoldNow": false
}
```

Values are short slugs; write what the user chose in their own words when no slug
fits. Leave a key out rather than guess. Never store secrets, passwords, tokens,
hosts, IPs or absolute paths.

## Loading

Read `~/.claude/kickoff/defaults.json`. If it is missing, this is the first kickoff:
use the recommended table, and the file is created when this run is confirmed.

A saved value applies only to what it covers: a profile with web testing says
nothing about mobile testing. A platform the profile has never seen gets the
recommended value, and its testing method is asked (it is the one default the
agreement leans on hardest).

## Saving

After the final OK, merge this run's answers into `~/.claude/kickoff/defaults.json`
(create the folder if needed). A value the user chose or changed this time replaces
the saved one; keys this run did not touch (say, mobile testing on a web-only
project) are kept. The summary already told the user this happens (one line); no
extra question. If the user says "don't save defaults", skip it.

## Recommended defaults

Used when nothing else settles a value. These match the "(Recommended)" options in
[interview.md](interview.md).

| Key | Recommended |
|-----|-------------|
| stack | mobile Expo · web React (Vite) · desktop Electron · backend Supabase · CLI Node + TS |
| language | TypeScript strict |
| packageManager | npm workspaces (or what a lockfile shows) |
| layout | monorepo with workspaces when 2+ platforms, else single app |
| backend | new dedicated project; ask before remote changes; auth providers left as `TODO(user)` |
| designStrictness | match exactly, ask when missing |
| git | private GitHub repo, owner from `gh api user -q .login`; branch, commit, push, PR without asking; one feature per branch + PR |
| testing | web: built-in browser pane · desktop: computer use · backend: real HTTP calls against local stack · CLI: scratch dir · extension: Claude in Chrome · mobile: **ask** (no safe default) |
| coverage | light + dark themes; empty, loading and error states; console and logs |
| devServer | runs in the user's terminal tab; agents start it only if down, never kill it |
| signIn | test accounts from seed files, local dev only |
| checks | lint + typecheck + tests before commit/PR |
| neverDuringTests | real payments, production data |
| deploy | only when asked |
| evidence | `docs/implementation.md` |
| conventions | soft 200 / hard 300 lines; thin screens, logic in hooks + pure helpers; one component per file, named exports |
| scaffoldNow | no: create app dirs when the first app is started |
