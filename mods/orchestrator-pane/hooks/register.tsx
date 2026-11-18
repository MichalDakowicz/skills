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
import { detailSvg, glanceSvg, isGoalMet } from './svg'

const COMMAND = 'orchestrator-pane'
const DIR = 'docs/orchestrator'
// Tools whose call may change the docs the views read.
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

// Whether the done bars are listed under their areas or folded into a count.
const showDone = atom(
  { plugin: 'orchestrator-pane', key: 'showDone' } as const,
  false,
)

// Whether the band shows the detail (open bars, tasks) under its line.
const isExpanded = atom(
  { plugin: 'orchestrator-pane', key: 'isExpanded' } as const,
  false,
)

// Whether the orchestrator skill started this session: the band then shows
// before any docs exist.
const isStarted = atom(
  { plugin: 'orchestrator-pane', key: 'isStarted' } as const,
  false,
)

// The skill is `orchestrator` installed by hand, `<plugin>:orchestrator` from a plugin.
const isOrchestrator = (skill: string): boolean =>
  skill === 'orchestrator' || skill.endsWith(':orchestrator')

type Tone = 'done' | 'behind' | 'open'

// Green once every bar is met, amber while under half are, plain otherwise.
const toneOf = (done: number, total: number): Tone => {
  if (total > 0 && done === total) return 'done'
  if (total > 0 && done / total < 0.5) return 'behind'

  return 'open'
}

const CHIP: Record<Tone, { bg: string; fg: string }> = {
  done: { bg: 'success', fg: 'inverseText' },
  behind: { bg: 'warning', fg: 'inverseText' },
  open: { bg: 'subtle', fg: 'text' },
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

// The progress as one line of text: what a reader without the drawing gets.
export const progressText = (view: Board, isWaiting: boolean): string | undefined => {
  if (!view.isFound) return isWaiting ? '◆ orchestrator starting' : undefined
  const goal = view.goal
  const tasks = view.tasks?.sections ?? []
  const taskPart = tasks.length
    ? `tasks ${tasks.reduce((n, one) => n + one.done, 0)}/${tasks.reduce((n, one) => n + one.total, 0)}`
    : undefined
  if (!goal) return ['◆ no active goal', taskPart].filter(Boolean).join(' · ')
  const bars = countBars(goal)
  if (isGoalMet(goal, bars.done, bars.total)) {
    return ['◆ goal met', `${bars.done}/${bars.total} bars`, taskPart].filter(Boolean).join(' · ')
  }

  return [
    `◆ ${bars.done}/${bars.total} bars`,
    ...goal.areas.map(area => `${area.name} ${area.bars.filter(one => one.isDone).length}/${area.bars.length}`),
    taskPart,
  ]
    .filter(Boolean)
    .join(' · ')
}

// What a reader without the drawing gets: the status and the next step.
const summary = (view: Board): string =>
  [progressText(view, false) ?? `No ${DIR}/ here yet.`, view.next && `Next: ${view.next}`]
    .filter(Boolean)
    .join(' · ')

type Els = ReturnType<EngineInterface['ui']['resolve']>

// A solid bar of two coloured runs: block glyphs draw as hatching on the
// desktop, coloured cells read the same everywhere.
const NBSP = ' '
const track = (
  { Text }: Els,
  done: number,
  total: number,
  color = 'suggestion',
  width = 14,
) => {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)

  return (
    <Text>
      <Text backgroundColor={color}>{NBSP.repeat(filled)}</Text>
      <Text backgroundColor="subtle">{NBSP.repeat(width - filled)}</Text>
    </Text>
  )
}

// The terminal's detail: open bars by area, then each task section.
const detailTree = (els: Els, view: Board, isShowingDone: boolean) => {
  const { Box, Text } = els
  const goal = view.goal
  const bars = goal ? countBars(goal) : { done: 0, total: 0 }
  const open = goal
    ? goal.areas
        .map(area => ({
          area,
          shown: area.bars.filter(one => isShowingDone || !one.isDone),
        }))
        .filter(one => one.shown.length > 0)
    : []

  return (
    <Box flexDirection="column" marginTop={1}>
      {goal && bars.total > 0 && (
        <Text dimColor>
          {bars.total > bars.done ? `Still open · ${bars.total - bars.done}` : 'All bars met'}
        </Text>
      )}
      {open.map(({ area, shown }) => {
        const done = area.bars.filter(one => one.isDone).length
        const tone = CHIP[toneOf(done, area.bars.length)]

        return (
          <Box key={`area-${area.name}`} flexDirection="column">
            <Text color={tone.bg}>
              {area.name} {done}/{area.bars.length}
            </Text>
            {shown.map((one, at) => (
              <Text key={`bar-${area.name}-${at}`} dimColor={one.isDone}>
                {'  '}
                {one.isDone ? '✓' : '○'} {one.text}
              </Text>
            ))}
          </Box>
        )
      })}
      {view.tasks && view.tasks.sections.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Tasks · {view.tasks.path}</Text>
          {view.tasks.sections.map(section =>
            section.done === section.total ? (
              <Text key={`task-${section.name}`} dimColor>
                ✓ {section.name} {section.done}/{section.total}
              </Text>
            ) : (
              <Box key={`task-${section.name}`} flexDirection="row" justifyContent="space-between" gap={1}>
                <Text>{section.name}</Text>
                <Box flexDirection="row" columnGap={1}>
                  {track(els, section.done, section.total)}
                  <Text dimColor>
                    {section.done}/{section.total}
                  </Text>
                </Box>
              </Box>
            ),
          )}
        </Box>
      )}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Not `/orchestrator`: that name belongs to the orchestrator skill.
    await $.command
      .register({
        name: COMMAND,
        description: 'Open or close the orchestrator detail in the band above the prompt',
        // Runs at once mid-turn instead of waiting for the turn to end: it
        // only flips what the band shows, so it never disturbs the work.
        immediate: true,
      })
      .catch(() => undefined)
    // A status line an earlier version pinned outlives a reload: clear it.
    $.ui.status(undefined)
    await refresh($)

    return next(e)
  })

  // Opens or closes the detail in the band; prints nothing in the chat.
  on('command.run', { command: COMMAND }, async $ => {
    await update($, isExpanded, was => !was)
    await refresh($)

    return {}
  })

  // The band shows from the moment the orchestrator skill
  // starts, before its first step writes anything.
  on('skill.prompt', async ($, e, next) => {
    if (isOrchestrator(e.skill)) {
      await update($, isStarted, () => true).catch(() => undefined)
      void refresh($).catch(() => undefined)
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

  // The band: the progress line over the next step; the detail under them
  // when opened.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const view = await read($, board)
    if (!view.isFound && !(await read($, isStarted))) return next(e)
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const isOpen = view.isFound && (await read($, isExpanded))
    const isShowingDone = await read($, showDone)
    const doneCount = view.goal ? countBars(view.goal).done : 0
    // Laid out at the size it is drawn, so text keeps its true size.
    const width = Math.max(320, Math.min(1100, e.props.bodyColumns * 8)) - 90

    const controls = view.isFound && (
      <Box flexDirection="row" columnGap={1} flexShrink={0}>
        {isOpen && doneCount > 0 && (
          <Button
            key="toggle-done"
            label={isShowingDone ? 'hide done' : `+${doneCount} done`}
            plain
            dimColor
            onPress={() => void update($, showDone, was => !was)}
          />
        )}
        <Button
          key="toggle-detail"
          // One glyph: a plain Button with a one-glyph label is a control by itself.
          label={isOpen ? '▴' : '▾'}
          plain
          dimColor
          onPress={() => void update($, isExpanded, was => !was)}
        />
      </Box>
    )

    if (e.surface !== 'terminal' && 'Svg' in els) {
      const { Svg } = els
      const line = glanceSvg(view, width)
      const detail = isOpen ? detailSvg(view, isShowingDone, width) : undefined

      return (
        <Box flexDirection="column" rowGap={1}>
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" columnGap={1}>
            <Svg {...line} alt={summary(view)} isInteractive />
            {controls}
          </Box>
          {detail && <Svg {...detail} alt="Open done-bars and task sections" isInteractive />}
        </Box>
      )
    }

    const goal = view.goal
    const bars = goal ? countBars(goal) : { done: 0, total: 0 }
    const line = !view.isFound ? (
      <Text dimColor wrap="truncate-end">
        <Text color="claude">◆</Text> orchestrator starting · fills in as {DIR}/ is written
      </Text>
    ) : goal && isGoalMet(goal, bars.done, bars.total) ? (
      <Text wrap="truncate-end">
        {'  '}<Text color="success">✓ Goal met</Text>{' '}
        <Text dimColor>{goal.statement}</Text>
      </Text>
    ) : (
      <Text wrap="truncate-end">
        {'  '}<Text color="suggestion">Next</Text>{' '}
        {view.next ?? goal?.statement ?? 'No active goal'}
      </Text>
    )

    const tasks = view.tasks?.sections ?? []
    const progress = view.isFound && (
      <Text wrap="truncate-end">
        <Text color="claude">◆</Text>{' '}
        {goal && bars.total > 0 && (
          <Text>
            {track(els, bars.done, bars.total, 'success', 10)}{' '}
            <Text bold>
              {bars.done}/{bars.total}
            </Text>
          </Text>
        )}
        {goal?.areas.map(area => {
          const done = area.bars.filter(one => one.isDone).length

          return (
            <Text key={`area-${area.name}`} color={CHIP[toneOf(done, area.bars.length)].bg}>
              {'  '}
              {area.name} {done}/{area.bars.length}
            </Text>
          )
        })}
        {tasks.length > 0 && (
          <Text dimColor>
            {'  '}tasks {tasks.reduce((n, one) => n + one.done, 0)}/
            {tasks.reduce((n, one) => n + one.total, 0)}
          </Text>
        )}
      </Text>
    )

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
          <Box flexDirection="column" flexShrink={1}>
            {progress}
            {line}
          </Box>
          {controls}
        </Box>
        {isOpen && detailTree(els, view, isShowingDone)}
      </Box>
    )
  })
}
