import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import {
  countBars,
  parseGoal,
  parseHandoff,
  parseTaskPath,
  parseTasks,
} from '../hooks/parse'
import { progressText } from '../hooks/register'

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

const BAND = {
  plugin: 'orchestrator-pane',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

type On = Parameters<TestBody>[1]

// Answers the engine calls the module makes, reading `files` for fs.
const seed = (on: On, files: Record<string, string> | undefined) => {
  const at = (path: string) => {
    if (!files) return undefined
    const slashed = path.replace(/\\/g, '/')
    const name = Object.keys(files).find(one => slashed.endsWith(`/${one}`))

    return name === undefined ? undefined : files[name]
  }
  on('command.register', () => ({ value: { command: 'orchestrator-pane' } }))
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', (_, e) => ({ value: at(e.path) !== undefined }))
  on('fs.read', (_, e) => ({ value: at(e.path) ?? '' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
}


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
})

test('the command is registered to run mid-turn', async ($, on) => {
  const specs: unknown[] = []
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', () => ({ value: false }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => {
    specs.push(e)

    return { value: { command: 'orchestrator-pane' } }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(specs).toEqual([expect.objectContaining({ immediate: true })])
})


test('the command opens and closes the detail and prints nothing', async ($, on) => {
  seed(on, FILES)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const run = () =>
    $.command.run({
      command: 'orchestrator-pane',
      args: '',
    } as Parameters<typeof $.command.run>[0])

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Still open/ })).toBeUndefined()

  expect((await run()).text).toBeUndefined()
  expect(
    (await ui.find({ type: 'Text', text: /Still open/ }))?.text,
  ).toBe('Still open · 2')
  expect(await ui.find({ type: 'Text', text: /2\. Notes/ })).toBeDefined()

  await run()
  expect(await ui.find({ type: 'Text', text: /Still open/ })).toBeUndefined()
  await ui.unmount()
})

test('the progress reads as one line of text', async () => {
  const view = {
    isFound: true,
    readAt: 0,
    goal: parseGoal(GOAL),
    tasks: { path: 'docs/TASKS.md', sections: parseTasks(TASKS) },
    next: 'Build the editor, then sync.',
  }

  expect(progressText(view, false)).toBe('◆ 1/3 bars · Works 1/2 · Looks 0/1 · tasks 3/4')
  expect(progressText({ isFound: false, readAt: 0 }, true)).toBe('◆ orchestrator starting')
  expect(progressText({ isFound: false, readAt: 0 }, false)).toBeUndefined()
})

test('the band is progress and the next step until opened', async ($, on) => {
  seed(on, FILES)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /Build the editor/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^  Works 1\/2$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Still open/ })).toBeUndefined()

  await ui.press({ key: 'toggle-detail' })
  expect(await ui.find({ type: 'Text', text: /^Works 1\/2$/ })).toBeDefined()
  expect(
    await ui.find({ type: 'Text', text: /notes save and reload/ }),
  ).toBeUndefined()

  await ui.press({ key: 'toggle-done' })
  expect(
    await ui.find({ type: 'Text', text: /notes save and reload/ }),
  ).toBeDefined()
  await ui.unmount()
})

test('desktop and mobile draw the band as styled svg', async ($, on) => {
  seed(on, FILES)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const line = await ui.find({ type: 'Svg' })

    expect(String(line?.props.source)).toContain('Build the editor, then sync.')
    expect(String(line?.props.source)).toContain('prefers-color-scheme: dark')
    expect(Number(line?.props.height)).toBe(44)
    expect(String(line?.props.source)).toContain('Works 1/2')

    await ui.press({ key: 'toggle-detail' })
    const all = await ui.findAll({ type: 'Svg' })
    const detail = String(all[1]?.props.source)
    expect(detail).toContain('Still open · 2')
    expect(detail).toContain('Tasks')
    await ui.press({ key: 'toggle-detail' })
    await ui.unmount()
  }
})

test('a finished goal shows goal met in the band', async ($, on) => {
  const met = GOAL.replace(/- \[ \]/g, '- [x]')
  seed(on, { ...FILES, 'docs/orchestrator/goal.md': met })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Goal met/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Build the editor/ })).toBeUndefined()
  await ui.unmount()

  const styled = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(String((await styled.find({ type: 'Svg' }))?.props.source)).toContain('✓ Goal met')
  await styled.unmount()
})

test('the band waits for docs once the orchestrator skill starts', async ($, on) => {
  seed(on, undefined)
  on('skill.prompt', (_, e) => ({ text: e.text }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.skill.prompt({
    skill: 'orchestrator',
    text: 'You coordinate.',
    frontmatter: {},
    source: 'userSettings' as const,
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(
    (await ui.find({ type: 'Text', text: /starting/ }))?.text,
  ).toContain('docs/orchestrator')
  await ui.unmount()
})
