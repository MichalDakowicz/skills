import { expect, test } from 'claude-code/testing'

import type { On } from 'claude-code'
import {
  countBars,
  parentOf,
  parseGoal,
  parseHandoff,
  parseTaskPath,
  parseTasks,
  parseWorktreeMain,
  resolvePath,
} from '../hooks/parse'

const GOAL = `# Goal

_Set 2026-11-16 · status: active_

**Goal.** Notes app syncs across web and phone.

**In scope.** sections 2-3

## Done when

### Works
- [x] notes save and reload · proof: tester run 2
- [ ] sync between web and phone · proof: adb run

### Looks
- [ ] matches board N-03 in both themes · proof: screenshots

## Blocked on
- [ ] not a bar
`

const PROJECT = `# Orchestration: project

## Project

- Task list: \`docs/TASKS.md\`
`

const TASKS = `# Tasks

## 1. Setup
- [x] repo
- [x] CI

## 2. Notes
- [x] list
- [ ] editor
`

const HANDOFF = `# Orchestration: handoff

_Updated 2026-11-15_

**Next.** Build the editor, then sync.
`

const FILES: Record<string, string> = {
  'docs/orchestrator/goal.md': GOAL,
  'docs/orchestrator/project.md': PROJECT,
  'docs/orchestrator/handoff.md': HANDOFF,
  'docs/TASKS.md': TASKS,
}

// A path as the fs hooks see it, with `/` and no drive: `/docs/x.md`.
const plain = (path: string): string =>
  path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')

// A file system of `files` (absolute paths): a file, or a folder above one.
const disk = (files: Record<string, string>) => ({
  read: (path: string): string | undefined => files[plain(path)],
  exists: (path: string): boolean =>
    plain(path) in files ||
    Object.keys(files).some(one => one.startsWith(`${plain(path)}/`)),
})

const under = (root: string): Record<string, string> =>
  Object.fromEntries(
    Object.entries(FILES).map(([name, text]) => [`${root}/${name}`, text]),
  )

const AT_ROOT = disk(under(''))

test('parses the goal template', async () => {
  const goal = parseGoal(GOAL)

  expect(goal.status).toBe('active')
  expect(goal.setOn).toBe('2026-11-16')
  expect(goal.statement).toBe('Notes app syncs across web and phone.')
  expect(goal.areas.map(area => area.name)).toEqual(['Works', 'Looks'])
  expect(goal.areas[0]?.bars[0]).toEqual({
    text: 'notes save and reload',
    isDone: true,
  })
  expect(countBars(goal)).toEqual({ done: 1, total: 3 })
})

test('parses project, tasks and handoff', async () => {
  expect(parseTaskPath(PROJECT)).toBe('docs/TASKS.md')
  expect(parseTasks(TASKS)).toEqual([
    { name: '1. Setup', done: 2, total: 2 },
    { name: '2. Notes', done: 1, total: 2 },
  ])
  expect(parseHandoff(HANDOFF)).toEqual({
    next: 'Build the editor, then sync.',
    updatedOn: '2026-11-15',
  })
  expect(
    parseHandoff('**Next.**\n- Merge the PR (user).\n- Then sync.').next,
  ).toBe('Merge the PR (user).')
})

test('resolves paths and worktree links', async () => {
  expect(resolvePath('C:\\skills', '../sedno')).toBe('C:/sedno')
  expect(resolvePath('/a/b', './c/../d')).toBe('/a/b/d')
  expect(resolvePath('/a', 'C:/x')).toBe('C:/x')
  expect(parentOf('C:/sedno')).toBe('C:/')
  expect(parentOf('C:/')).toBeUndefined()
  expect(parentOf('/repo')).toBe('/')
  expect(parentOf('/')).toBeUndefined()
  expect(parseWorktreeMain('gitdir: C:/sedno/.git/worktrees/agent-a12f\n')).toBe(
    'C:/sedno',
  )
  expect(
    parseWorktreeMain('gitdir: C:\\sedno\\.git\\worktrees\\excalidraw\r\n'),
  ).toBe('C:/sedno')
  expect(parseWorktreeMain('gitdir: /r/.git/modules/sub')).toBeUndefined()
})

// The band above the prompt, as the engine asks for this plugin's row.
const BAND = {
  plugin: 'orchestrator-pane',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
} as const

// The surfaces that draw the band (VS Code has none).
const SURFACES = ['terminal', 'desktop', 'mobile'] as const

// The engine answers beneath the plugin: a session in `cwd` over `files`.
const seat = (
  on: On,
  cwd: string,
  files: ReturnType<typeof disk>,
) => {
  on('command.register', () => ({ value: { command: 'orchestrator-pane' } }))
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', (_, e) => ({ value: files.exists(e.path) }))
  on('fs.read', (_, e) => ({ value: files.read(e.path) ?? '' }))
  on('session.cwd', () => ({ value: cwd }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('skill.prompt', (_, e) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  // The engine's own band row for this plugin: none.
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })
}

const SKILL = {
  text: 'You coordinate.',
  frontmatter: {},
  source: 'userSettings' as const,
}

test('the band shows goal, tasks and next step on every surface', async ($, on) => {
  seat(on, '/', AT_ROOT)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })

    const summary = await ui.find({ type: 'Text', text: /Orchestrator/ })
    expect(summary?.text).toContain('1/3 bars · active')
    expect(summary?.text).toContain('tasks 3/4')
    expect((await ui.find({ type: 'Text', text: /^Next:/ }))?.text).toBe(
      'Next: Build the editor, then sync.',
    )
    expect(await ui.find({ type: 'Text', text: /2\. Notes/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('More shows each done-bar and task section', async ($, on) => {
  seat(on, '/', AT_ROOT)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  await ui.press({ key: 'more' })
  expect((await ui.find({ type: 'Text', text: /Works/ }))?.text).toContain(
    '✓ notes save and reload',
  )
  expect((await ui.find({ type: 'Text', text: /2\. Notes/ }))?.text).toContain(
    '1/2',
  )
  expect((await ui.find({ type: 'Button', key: 'more' }))?.props.label).toBe('Less')

  await ui.press({ key: 'more' })
  expect(await ui.find({ type: 'Text', text: /2\. Notes/ })).toBeUndefined()
  await ui.unmount()
})

test('no band without docs until asked, then it waits for them', async ($, on) => {
  seat(on, '/home/me/app', disk({}))
  await $.session.start({ cwd: '/home/me/app', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /Orchestrator/ })).toBeUndefined()

  const said = await $.command.run({
    command: 'orchestrator-pane',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
  expect(JSON.stringify(said)).toContain('in /home/me/app or above')
  expect((await ui.find({ type: 'Text', text: /waiting/ }))?.text).toBe(
    'Orchestrator · waiting for docs/orchestrator/ in /home/me/app',
  )
  await ui.unmount()
})

test('the band appears when the orchestrator skill starts', async ($, on) => {
  seat(on, '/', disk({}))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const waiting = () => ui.find({ type: 'Text', text: /waiting/ })

  await $.skill.prompt({ ...SKILL, skill: 'kickoff' })
  expect(await waiting()).toBeUndefined()

  await $.skill.prompt({ ...SKILL, skill: 'skills:orchestrator' })
  expect(await waiting()).toBeDefined()
  await ui.unmount()
})

// An org plugin in the prepend tier that sends `skill.prompt` past the user
// tier, as cc-plugin-sec-default does: the band still shows from the Skill call.
test(
  'the band appears from the Skill call when skill.prompt is bypassed',
  {
    plugins: [
      {
        name: 'sec-above',
        tier: 'prepend',
        register(on) {
          on('skill.prompt', (_, e, next) => next.to(e, 'append'))
        },
      },
    ],
  },
  async ($, on) => {
    seat(on, '/', disk({}))
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    const waiting = () => ui.find({ type: 'Text', text: /waiting/ })

    await $.skill.prompt({ ...SKILL, skill: 'orchestrator' })
    expect(await waiting()).toBeUndefined()

    await $.tool.call({ tool: 'Skill', skill: 'kickoff' })
    expect(await waiting()).toBeUndefined()

    await $.tool.call({ tool: 'Skill', skill: 'orchestrator' })
    expect(await waiting()).toBeDefined()
    await ui.unmount()
  },
)

// A session in an agent's worktree, cut from a branch without the docs: the
// band reads the main checkout's docs/orchestrator/ instead.
test('the band finds the main checkout from a worktree', async ($, on) => {
  const WORKTREE = '/repo/.claude/worktrees/agent-1'
  seat(
    on,
    WORKTREE,
    disk({
      [`${WORKTREE}/.git`]: 'gitdir: /repo/.git/worktrees/agent-1\n',
      [`${WORKTREE}/README.md`]: '',
      ...under('/repo'),
    }),
  )
  await $.session.start({ cwd: WORKTREE, surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(
    (await ui.find({ type: 'Text', text: /Orchestrator/ }))?.text,
  ).toContain('1/3 bars')
  await ui.press({ key: 'more' })
  expect((await ui.find({ type: 'Text', text: /^\/repo/ }))?.text).toBe(
    '/repo · handoff 2026-11-15',
  )
  await ui.unmount()
})

// `/orchestrator-pane ../sedno` reads a sibling project, `auto` searches
// again, `hide` takes the band away.
test('the command pins a project folder and hides the band', async ($, on) => {
  seat(on, '/code/skills', disk(under('/code/sedno')))
  await $.session.start({
    cwd: '/code/skills',
    surface: 'desktop',
    isInteractive: true,
  })
  const run = (args: string) =>
    $.command.run({
      command: 'orchestrator-pane',
      args,
      origin: { kind: 'composer' },
      presentation: { isFullscreen: false, columns: 100 },
    })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const summary = () => ui.find({ type: 'Text', text: /bars/ })

  expect(JSON.stringify(await run('../nowhere'))).toContain(
    'No docs/orchestrator/ in /code/nowhere',
  )
  expect(JSON.stringify(await run('../sedno'))).toContain('shows /code/sedno')
  expect((await summary())?.text).toContain('1/3 bars')

  await run('hide')
  expect(await summary()).toBeUndefined()
  await run('')
  expect((await summary())?.text).toContain('1/3 bars')

  expect(JSON.stringify(await run('auto'))).toContain('in /code/skills or above')
  expect((await ui.find({ type: 'Text', text: /waiting/ }))?.text).toContain(
    '/code/skills',
  )
  await ui.unmount()
})
