# Testing methods

Each method the user picks in rounds 7–8 adds one block under `## Testing` in
`CLAUDE.md` (see the template). Copy the block, fill `{{…}}`, and drop lines that do not
apply. Keep only the chosen methods.

Rules shared by every method (already in the template's base section, not repeated
here): walk changed flows end to end, never type the user's real passwords, stop on a
password, lock or 2FA prompt, say plainly what could not be verified.

---

## Web: built-in browser pane

```markdown
### Web: built-in browser

Verify web changes in the built-in browser pane of the Claude desktop app
(`mcp__Claude_Browser__*` tools; read the `built-in-browser` skill first if available).
- Open {{dev URL}}. Prefer reading the page as text (`get_page_text`, `read_page`) and
  take screenshots for visual checks.
- Check {{coverage list}}. Use `resize_window` for narrow (375px) and wide (≥1280px),
  and reset it to desktop afterwards.
- Read the console and network requests. A flow that looks fine but logs an error or
  a failed request is not passing.
- The pane may hold the user's sign-ins. Never sign out or change account settings.
```

## Web: Claude in Chrome

```markdown
### Web: Claude in Chrome

Verify web changes in the user's real Chrome through Claude in Chrome
(`mcp__claude-in-chrome__*`; read the `chrome-browser` skill first if available).
- Work in a new tab, never in the user's open tabs. Close it when done.
- It runs with the user's real sign-ins: touch only {{Name}}'s own pages and data.
- Check {{coverage list}}, the console and network.
```

## Web / desktop / extension: Playwright

```markdown
### Playwright e2e

End-to-end tests live in `{{e2e dir}}` and run with `{{command}}`.
- Every user-visible change gets or updates an e2e test for its flow.
- Run the affected specs before each commit and the full suite before each PR.
- Failing e2e blocks the PR. Never mark a test as skipped to get green.
{{- Electron: launch with `_electron.launch` against the built app.}}
{{- Extension: load the unpacked build with a persistent context.}}
```

## Mobile: Android phone over adb

```markdown
### Mobile: the user's Android phone (adb)

The user's Android phone is available for real-device checks. Use `adb` to confirm that
fixes and features actually work, not just that lint, typecheck and tests pass.
- Run `adb devices` first. If no device is listed, say so and fall back to other checks.
- Always test a built `.apk`, never through Expo Go, a dev client or Metro. Rebuild and
  reinstall (`adb install -r`) after every code change; a stale APK is not evidence.
  Keep APKs and screenshots in the scratchpad or `.tmp/`, never commit them.
- Drive the UI with `adb shell input`; find elements with `adb shell uiautomator dump`
  instead of guessing coordinates. Screenshot with `adb exec-out screencap -p`.
- Check `adb logcat` (filter for the app{{ / `ReactNativeJS`}}). A flow that looks fine
  but logs an error is not passing.
- Test end to end (data saved, survives restart, syncs with backend) and cover every
  state the designs show.
- Stay inside the {{Name}} app. Do not open, read or change other apps, accounts or
  personal data. No destructive device actions without the user asking. Clearing
  {{Name}}'s own data to test fresh-install states is fine.
```

## Mobile: Android emulator

```markdown
### Mobile: Android emulator (adb)

Use the `{{AVD name}}` emulator (`emulator -avd {{AVD name}}`). Same rules as a device:
built `.apk` only, reinstall after every change, drive with `adb shell input` and
`uiautomator dump`, check `logcat`. Test a narrow and a large screen size if the design
covers both.
```

## Mobile: iOS simulator

```markdown
### Mobile: iOS simulator (macOS only)

Build for the simulator and install with `xcrun simctl install booted {{app path}}`.
Screenshot with `xcrun simctl io booted screenshot`. Check the logs with
`xcrun simctl spawn booted log stream --predicate 'process == "{{app}}"'`. On a machine
without Xcode, say "not verified on iOS" instead of skipping silently.
```

## Desktop: computer use

```markdown
### Desktop: computer use

Verify desktop changes on the built app through computer use (desktop control; read the
`computer-use` skill first if available).
- Launch the built app (`{{command}}`), not other installed apps. Never touch OS
  settings, other apps' windows or system dialogs.
- Screenshot each changed flow. Check window resize, keyboard shortcuts and
  {{coverage list}}.
- Read the app's logs (`{{log location / devtools}}`).
```

## Desktop: browser on the renderer

```markdown
### Desktop: renderer in the built-in browser

For UI-only checks, open the renderer dev URL ({{url}}) in the built-in browser pane.
Native features (menus, file system, tray, IPC) are not covered this way; verify those
on the built app or report them as not verified.
```

## Backend / API

```markdown
### Backend / API

- Exercise changed endpoints with real HTTP calls against {{local stack URL | staging URL}}:
  happy path, missing or invalid auth, validation errors, and the expected status codes.
- {{Integration tests run against a local backend (`{{start command}}`) with `{{test command}}`.}}
- Every policy or permission change gets a test that proves another user cannot read
  or write the data.
- Never point tests at production. Never print keys or tokens in output.
```

## CLI

```markdown
### CLI

Run the CLI in a scratch directory, never in the repo or the user's real folders.
- Try real input, bad input, missing arguments and `--help`. Check exit codes, stdout
  and stderr.
- {{Golden-output tests in `{{dir}}`; update snapshots only when the change is intended,
  and say so in the PR.}}
```

## Manual by the user

```markdown
### Manual checks by the user

{{Platform}} is verified by the user by hand. After each unit, list the exact flows to
check and what to look for, and do not mark the unit verified until the user confirms.
```
