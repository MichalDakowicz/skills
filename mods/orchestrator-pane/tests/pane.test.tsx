import { expect, test } from 'claude-code/testing'

import {
  countBars,
  parseGoal,
  parseHandoff,
  parseTaskPath,
  parseTasks,
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

// The engine hands fs calls an absolute path: match on the relative tail.
const fileAt = (path: string): string | undefined => {
  const slashed = path.replace(/\\/g, '/')
  const name = Object.keys(FILES).find(one => slashed.endsWith(`/${one}`))

  return name === undefined ? undefined : FILES[name]
}

const PANE = {
  plugin: 'orchestrator-pane',
  component: 'Pane',
  requestId: 'orchestrator',
  props: {
    title: 'Orchestrator',
    isFocused: false,
    bodyColumns: 50,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

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

test('the pane shows goal, tasks and next step on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'orchestrator-pane' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', (_, e) => ({ value: fileAt(e.path) !== undefined }))
  on('fs.read', (_, e) => ({ value: fileAt(e.path) ?? '' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(
      (await ui.find({ type: 'Text', text: /Notes app syncs/ }))?.text,
    ).toBe('Notes app syncs across web and phone.')
    expect(
      (await ui.find({ type: 'Text', text: /2\. Notes/ }))?.text,
    ).toContain('1/2')
    expect(
      (await ui.find({ type: 'Text', text: /Build the editor/ }))?.text,
    ).toBe('Build the editor, then sync.')
    await ui.unmount()
  }
})

test('the pane says when there is no docs/orchestrator', async ($, on) => {
  on('command.register', () => ({ value: { command: 'orchestrator-pane' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', () => ({ value: false }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect((await ui.find({ type: 'Text', text: /No docs/ }))?.text).toContain(
    'docs/orchestrator/',
  )
  await ui.unmount()
})

test('the pane opens when the orchestrator skill starts', async ($, on) => {
  const opened: string[] = []
  on('ui.open', (_, e) => {
    opened.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('clock.now', () => ({ value: 0 }))
  on('fs.exists', () => ({ value: false }))
  on('skill.prompt', (_, e) => ({ text: e.text }))

  const skill = (name: string) => ({
    skill: name,
    text: 'You coordinate.',
    frontmatter: {},
    source: 'userSettings' as const,
  })

  await $.skill.prompt(skill('kickoff'))
  expect(opened).toEqual([])

  await $.skill.prompt(skill('orchestrator'))
  await $.skill.prompt(skill('skills:orchestrator'))
  expect(opened).toEqual(['orchestrator', 'orchestrator'])
})
