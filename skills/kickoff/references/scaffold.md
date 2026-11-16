# Kickoff scaffold

Create only what the answers call for. Match the agreement: if it says "create app
dirs when the first app is started", do not create them now.

## Always

| File | Content |
|------|---------|
| `CLAUDE.md` | from the template |
| `AGENTS.md` | pointer to `CLAUDE.md` |
| `.claude/settings.json` | copy of `assets/settings.json` (turns off Claude commit/PR credit; `attribution` for current Claude Code, `includeCoAuthoredBy` for older) |
| `.gitignore` | see below |
| `.gitattributes` | `* text=auto eol=lf` |
| `.env.example` | variable names only, one per line, grouped by app, no values |
| `docs/implementation.md` | heading per unit: status, evidence, open acceptance criteria |
| `README.md` | name, pitch, apps table, how to run (only commands that exist) |

If `.claude/settings.json` already exists, merge the two keys in; keep other settings.

### `.gitignore`

```
node_modules/
dist/
build/
.expo/
out/
coverage/
*.log
.env
.env.*
!.env.example
.tmp/
*.apk
*.aab
.DS_Store
Thumbs.db
.claude/settings.local.json
# reference clones (one line each)
{{ref}}/
# supabase local
supabase/.temp/
supabase/.branches/
```

Drop lines that do not apply (no `.expo/` without Expo, no `*.apk` without mobile).

## Monorepo (2+ apps)

```
{{root}}/
├── package.json          # private, "workspaces": ["mobile", "web", "desktop", "packages/*"]
├── tsconfig.base.json    # strict: true, shared compiler options
├── packages/
│   └── shared/           # tokens, types, pure rules — created when a 2nd app needs it
├── mobile/  web/  desktop/   # created per "scaffold now?" answer
├── supabase/             # if Supabase: `npx supabase init`
├── design/               # existing; never moved
└── docs/implementation.md
```

Root `package.json`:

```json
{
  "name": "{{name}}",
  "private": true,
  "workspaces": ["{{app dirs}}", "packages/*"],
  "scripts": {
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  }
}
```

For pnpm use `pnpm-workspace.yaml` instead of `"workspaces"`; for bun, `"workspaces"` works as-is.

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Scaffold apps now (only if the user said yes)

Use official generators, non-interactive, then make each app's `tsconfig.json`
extend `../tsconfig.base.json` and add `lint` / `typecheck` / `test` scripts.

| App | Command |
|-----|---------|
| Expo | `npx create-expo-app@latest mobile --template blank-typescript` |
| Vite React | `npm create vite@latest web -- --template react-ts` |
| Next.js | `npx create-next-app@latest web --ts --eslint --app --no-src-dir --use-npm` |
| Electron | `npm create electron-vite@latest desktop -- --template react-ts` (own app; shares UI/logic via `packages/`, not by importing from `web/`) |
| Tauri | `npm create tauri-app@latest desktop -- --template react-ts` |
| Supabase | `npx supabase init` |

Remove generator demo content (logos, counters, sample pages) — the agreement bans
placeholder UI not in the designs. After generating, run `npm install` at the root once
and confirm `npm run typecheck` passes before the initial commit.

Generators drift. If a command fails or prompts, check its `--help` and adjust; never
fall back to interactive prompts the user can't see.

## Initial commit

```bash
git init -b main
git add -A
git status --short          # confirm no .env, reference clone, node_modules
git commit -m "chore: kickoff project scaffolding"
```

No trailers. If the repo was chosen: `gh repo create {{owner}}/{{repo}} --{{private}}
--source . --push`, then `gh repo view {{owner}}/{{repo}}` to verify.
