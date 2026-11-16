import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Board } from '../types'
import {
  countBars,
  parseGoal,
  parseHandoff,
  parseTaskPath,
  parseTasks,
} from './parse'

const PANE = 'orchestrator'
const COMMAND = 'orchestrator-pane'
const TITLE = 'Orchestrator'
const DIR = 'docs/orchestrator'
// Tools whose call may change the docs the pane reads.
const WRITERS = new Set([
  'Write',
  'Edit',
  'MultiEdit',
  'NotebookEdit',
  'Bash',
  'PowerShell',
])

// Change the tag when Board's fields change: a value an earlier version
// stored outlives a reload and is read as the initial value instead.
const board = atom(
  { plugin: 'orchestrator-pane', key: 'board' } as const,
  { isFound: false, readAt: 0 },
  { shape: 'board-1' },
)

// The skill is `orchestrator` installed by hand, `<plugin>:orchestrator` from a plugin.
const isOrchestrator = (skill: string): boolean =>
  skill === 'orchestrator' || skill.endsWith(':orchestrator')

// A text meter: Progress is not drawn by every Claude Code build yet.
const meter = (done: number, total: number, width = 16): string => {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const readOr = async (
  $: EngineInterface,
  path: string,
): Promise<string | undefined> => {
  try {
    return (await $.fs.exists(path)) ? await $.fs.read(path) : undefined
  } catch {
    return undefined
  }
}

const load = async ($: EngineInterface): Promise<Board> => {
  const readAt = await $.clock.now()
  const [goalText, projectText, handoffText] = await Promise.all([
    readOr($, `${DIR}/goal.md`),
    readOr($, `${DIR}/project.md`),
    readOr($, `${DIR}/handoff.md`),
  ])
  if (!goalText && !projectText && !handoffText) {
    return { isFound: false, readAt }
  }

  const taskPath = projectText ? parseTaskPath(projectText) : undefined
  const taskText = taskPath ? await readOr($, taskPath) : undefined

  return {
    isFound: true,
    goal: goalText ? parseGoal(goalText) : undefined,
    tasks:
      taskPath && taskText
        ? { path: taskPath, sections: parseTasks(taskText) }
        : undefined,
    ...(handoffText ? parseHandoff(handoffText) : {}),
    readAt,
  }
}

const refresh = async ($: EngineInterface): Promise<Board> => {
  const next = await load($)
  await update($, board, () => next)

  return next
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Not `/orchestrator`: that name belongs to the orchestrator skill.
    // A refused name must not stop the pane from opening.
    await $.command
      .register({
        name: COMMAND,
        description: 'Show the orchestrator goal, done-bars and tasks in a pane',
      })
      .catch(() => undefined)
    const found = await refresh($)
    if (found.isFound) void $.ui.open({ id: PANE, title: TITLE })

    return next(e)
  })

  on('command.run', { command: 'orchestrator-pane' }, async $ => {
    const found = await refresh($)
    await $.ui.open({ id: PANE, title: TITLE })

    return {
      text: found.isFound
        ? 'Orchestrator pane opened.'
        : `Orchestrator pane opened; no ${DIR}/ here yet.`,
    }
  })

  // Open the pane the moment the orchestrator skill starts, before its first
  // step writes anything; the pane shows its empty state until docs appear.
  on('skill.prompt', async ($, e, next) => {
    if (isOrchestrator(e.skill)) {
      void refresh($).catch(() => undefined)
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return next(e)
  }).catch(($, e, next) => next(e)) // observe only: never block the skill

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (WRITERS.has(String(e.tool))) void refresh($).catch(() => undefined)

    return ran
  }).catch(($, e, next) => next(e)) // observe only: never refuse a call

  on('turn.complete', async ($, e, next) => {
    void refresh($).catch(() => undefined)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const view = await read($, board)
    const isGlance = e.props.placement === 'widget'

    if (!view.isFound) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No {DIR}/ yet.</Text>
          <Text dimColor>
            Fills in as the orchestrator writes its project, goal and tasks.
          </Text>
          <Button key="refresh" label="Refresh" onPress={() => void refresh($)} />
        </Box>
      )
    }

    const goal = view.goal
    const bars = goal ? countBars(goal) : { done: 0, total: 0 }

    if (isGlance) {
      return (
        <Box flexDirection="column">
          <Text bold>
            {goal ? `${bars.done}/${bars.total} bars · ${goal.status}` : 'No goal'}
          </Text>
          {view.next && <Text dimColor>Next: {view.next}</Text>}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {goal ? (
          <Box flexDirection="column">
            <Text bold>
              Goal · {goal.status}
              {goal.setOn ? ` · set ${goal.setOn}` : ''}
            </Text>
            {goal.statement && <Text>{goal.statement}</Text>}
            <Text>
              {meter(bars.done, bars.total)}{' '}
              <Text dimColor>
                {bars.done}/{bars.total} done-bars
              </Text>
            </Text>
            {goal.areas.map(area => (
              <Box key={`area-${area.name}`} flexDirection="column">
                <Text bold>
                  {area.name}{' '}
                  <Text dimColor>
                    {area.bars.filter(bar => bar.isDone).length}/
                    {area.bars.length}
                  </Text>
                </Text>
                {area.bars.map(bar => (
                  <Text dimColor={bar.isDone}>
                    {bar.isDone ? '✓' : '○'} {bar.text}
                  </Text>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Text dimColor>No active goal in {DIR}/goal.md.</Text>
        )}

        {view.tasks && view.tasks.sections.length > 0 && (
          <Box flexDirection="column">
            <Text bold>
              Tasks <Text dimColor>{view.tasks.path}</Text>
            </Text>
            {view.tasks.sections.map(section => (
              <Text dimColor={section.done === section.total}>
                {section.done === section.total ? '✓' : '○'} {section.name}{' '}
                {section.done}/{section.total}
              </Text>
            ))}
          </Box>
        )}

        {view.next && (
          <Box flexDirection="column">
            <Text bold>
              Next
              {view.updatedOn ? (
                <Text dimColor> · handoff {view.updatedOn}</Text>
              ) : (
                ''
              )}
            </Text>
            <Text>{view.next}</Text>
          </Box>
        )}

        <Button key="refresh" label="Refresh" onPress={() => void refresh($)} />
      </Box>
    )
  })
}
