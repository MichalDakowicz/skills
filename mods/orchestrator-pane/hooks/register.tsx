import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Band, Board, Pin } from '../types'
import {
  countBars,
  joinPath,
  parentOf,
  parseGoal,
  parseHandoff,
  parseTaskPath,
  parseTasks,
  parseWorktreeMain,
  resolvePath,
} from './parse'
import { detailSvg, glanceSvg, isGoalMet } from './svg'

const COMMAND = 'orchestrator-pane'
const DIR = 'docs/orchestrator'
// Tools whose call may change the docs the band reads.
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
  { shape: 'board-2' },
)

const pin = atom(
  { plugin: 'orchestrator-pane', key: 'pin' } as const,
  {} as Pin,
  { shape: 'pin-1' },
)

const band = atom(
  { plugin: 'orchestrator-pane', key: 'band' } as const,
  { isHidden: false, isExpanded: false, isStarted: false } as Band,
  { shape: 'band-1' },
)

// Whether the opened band lists done bars beside the open ones.
const showDone = atom(
  { plugin: 'orchestrator-pane', key: 'showDone' } as const,
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

const TONE: Record<Tone, string> = {
  done: 'success',
  behind: 'warning',
  open: 'subtle',
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

const hasDocs = async ($: EngineInterface, dir: string): Promise<boolean> =>
  $.fs.exists(joinPath(dir, DIR)).catch(() => false)

// The folder whose docs/orchestrator/ the band reads: the session's folder or
// one above it, or, from a git worktree (an agent's, under .claude/worktrees/,
// often cut from a branch that lacks the docs), its main checkout.
const findRoot = async (
  $: EngineInterface,
  start: string,
): Promise<string | undefined> => {
  let dir: string | undefined = resolvePath(start, '.')
  for (let depth = 0; dir !== undefined && depth < 32; depth += 1) {
    if (await hasDocs($, dir)) return dir
    const gitFile = await readOr($, joinPath(dir, '.git'))
    const main = gitFile ? parseWorktreeMain(gitFile) : undefined
    if (main && (await hasDocs($, main))) return main
    dir = parentOf(dir)
  }

  return undefined
}

const load = async ($: EngineInterface): Promise<Board> => {
  const readAt = await $.clock.now()
  const cwd = await $.session.cwd()
  const pinned = (await read($, pin)).path
  const root = pinned ?? (await findRoot($, cwd))
  if (root === undefined) return { isFound: false, root: cwd, readAt }

  const docs = joinPath(root, DIR)
  const [goalText, projectText, handoffText] = await Promise.all([
    readOr($, `${docs}/goal.md`),
    readOr($, `${docs}/project.md`),
    readOr($, `${docs}/handoff.md`),
  ])
  if (!goalText && !projectText && !handoffText) {
    return { isFound: false, root, readAt }
  }

  const taskPath = projectText ? parseTaskPath(projectText) : undefined
  const taskText = taskPath
    ? await readOr($, resolvePath(root, taskPath))
    : undefined

  return {
    isFound: true,
    root,
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

// Show the band now, docs or not: the orchestrator started or was asked for.
const showBand = async ($: EngineInterface): Promise<Board> => {
  await update($, band, view => ({ ...view, isHidden: false, isStarted: true }))

  return refresh($)
}

const waitingText = (view: Board): string =>
  `waiting for ${DIR}/ in ${view.root ?? 'this folder'}`

// The progress as one line of text: what a reader without the drawing gets.
export const progressText = (view: Board): string => {
  if (!view.isFound) return `Orchestrator · ${waitingText(view)}`
  const goal = view.goal
  const tasks = view.tasks?.sections ?? []
  const taskPart = tasks.length
    ? `tasks ${tasks.reduce((n, one) => n + one.done, 0)}/${tasks.reduce((n, one) => n + one.total, 0)}`
    : undefined
  if (!goal) return ['Orchestrator · no active goal', taskPart].filter(Boolean).join(' · ')
  const bars = countBars(goal)

  return [
    `Orchestrator · ${bars.done}/${bars.total} bars · ${goal.status}`,
    ...goal.areas.map(area => `${area.name} ${area.bars.filter(one => one.isDone).length}/${area.bars.length}`),
    taskPart,
    view.next && `Next: ${view.next}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

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

// The terminal's detail: open bars by area, then each task section, then
// which project folder it reads.
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
      {goal?.statement && <Text bold>{goal.statement}</Text>}
      {goal && bars.total > 0 && (
        <Text dimColor>
          {bars.total > bars.done ? `Still open · ${bars.total - bars.done}` : 'All bars met'}
        </Text>
      )}
      {open.map(({ area, shown }) => {
        const done = area.bars.filter(one => one.isDone).length

        return (
          <Box key={`area-${area.name}`} flexDirection="column">
            <Text color={TONE[toneOf(done, area.bars.length)]}>
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
      <Text dimColor wrap="truncate-end">
        {view.root}
        {view.updatedOn ? ` · handoff ${view.updatedOn}` : ''}
      </Text>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Not `/orchestrator`: that name belongs to the orchestrator skill.
    // A refused name must not stop the band from showing.
    await $.command
      .register({
        name: COMMAND,
        description:
          'Open or close the orchestrator detail above the prompt (args: a project folder, auto, or hide)',
        argumentHint: '[folder | auto | hide]',
        // Runs at once mid-turn instead of waiting for the turn to end: it
        // only changes what the band reads and shows, never the work.
        immediate: true,
      })
      .catch(() => undefined)
    // A status line an earlier version pinned outlives a reload: clear it.
    $.ui.status(undefined)
    await refresh($)

    return next(e)
  })

  // Nothing is printed in the chat; what the command has to say is a toast.
  // Bare, it shows a hidden band and otherwise opens or closes the detail;
  // `<folder>` reads that project instead of searching from the session's
  // folder; `auto` goes back to searching; `hide` takes the band away until
  // the orchestrator or the command is next run.
  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'hide') {
      await update($, band, view => ({ ...view, isHidden: true }))
      $.ui.toast(`Orchestrator band hidden; /${COMMAND} shows it again.`)

      return {}
    }
    if (arg === '') {
      const view = await read($, band)
      const found = await read($, board)
      if (!view.isHidden && found.isFound) {
        await update($, band, one => ({ ...one, isExpanded: !one.isExpanded }))
        void refresh($).catch(() => undefined)

        return {}
      }
    } else if (arg === 'auto') {
      await update($, pin, () => ({}))
    } else {
      const path = resolvePath(await $.session.cwd(), arg)
      if (!(await hasDocs($, path))) {
        $.ui.toast(`No ${DIR}/ in ${path}; the band is unchanged.`)

        return {}
      }
      await update($, pin, () => ({ path }))
    }
    const found = await showBand($)
    $.ui.toast(
      found.isFound
        ? `Orchestrator band shows ${found.root}.`
        : `No ${DIR}/ in ${found.root} or above yet. Point the band at a project with /${COMMAND} <folder>.`,
    )

    return {}
  })

  // Show the band the moment the orchestrator skill starts, before its first
  // step writes anything; it says it is waiting until docs appear.
  // A plugin in a tier above this mod's (an org's security plugin, say) may
  // `next.to` past the user tier on `skill.prompt`, so this hook never runs;
  // the `Skill` tool call below catches the same start.
  on('skill.prompt', async ($, e, next) => {
    if (isOrchestrator(e.skill)) void showBand($).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e)) // observe only: never block the skill

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'Skill' && isOrchestrator(e.skill)) {
      void showBand($).catch(() => undefined)
    }
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
    const view = await read($, band)
    const found = await read($, board)
    if (view.isHidden || (!found.isFound && !view.isStarted)) return next(e)
    // Other mods share this row (ponytail's band): draw theirs under ours.
    // next(e) rejects only when nothing answers beneath.
    const below = await next(e).catch(() => undefined)
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const stack = (mine: NonNullable<typeof below>) =>
      below ? <Box flexDirection="column">{mine}{below}</Box> : mine
    const isOpen = found.isFound && view.isExpanded
    const isShowingDone = await read($, showDone)
    const doneCount = found.goal ? countBars(found.goal).done : 0
    // Laid out at the size it is drawn, so text keeps its true size.
    const width = Math.max(320, Math.min(1100, e.props.bodyColumns * 8)) - 90

    const controls = found.isFound && (
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
          key="more"
          // One glyph: a plain Button with a one-glyph label is a control by itself.
          label={isOpen ? '▴' : '▾'}
          plain
          dimColor
          onPress={() =>
            void update($, band, one => ({ ...one, isExpanded: !one.isExpanded }))
          }
        />
      </Box>
    )

    if (e.surface !== 'terminal' && 'Svg' in els) {
      const { Svg } = els
      const line = glanceSvg(found, width)
      const detail = isOpen ? detailSvg(found, isShowingDone, width) : undefined

      return stack(
        <Box flexDirection="column" rowGap={1}>
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" columnGap={1}>
            <Svg {...line} alt={progressText(found)} isInteractive />
            {controls}
          </Box>
          {detail && <Svg {...detail} alt="Open done-bars and task sections" isInteractive />}
        </Box>,
      )
    }

    if (!found.isFound) {
      return stack(
        <Text dimColor wrap="truncate-end">
          <Text color="claude">◆</Text> Orchestrator · {waitingText(found)}
        </Text>,
      )
    }

    const goal = found.goal
    const bars = goal ? countBars(goal) : { done: 0, total: 0 }
    const tasks = found.tasks?.sections ?? []
    const progress = (
      <Text wrap="truncate-end">
        <Text color="claude">◆</Text>{' '}
        {goal && bars.total > 0 ? (
          <Text>
            {track(els, bars.done, bars.total, 'success', 10)}{' '}
            <Text bold>
              {bars.done}/{bars.total} bars
            </Text>
          </Text>
        ) : (
          <Text dimColor>no active goal</Text>
        )}
        {goal?.areas.map(area => {
          const done = area.bars.filter(one => one.isDone).length

          return (
            <Text key={`area-${area.name}`} color={TONE[toneOf(done, area.bars.length)]}>
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
    const line =
      goal && isGoalMet(goal, bars.done, bars.total) ? (
        <Text wrap="truncate-end">
          {'  '}
          <Text color="success">✓ Goal met</Text> <Text dimColor>{goal.statement}</Text>
        </Text>
      ) : (
        <Text wrap="truncate-end">
          {'  '}
          <Text color="suggestion">Next</Text> {found.next ?? goal?.statement ?? 'No active goal'}
        </Text>
      )

    return stack(
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
          <Box flexDirection="column" flexShrink={1}>
            {progress}
            {line}
          </Box>
          {controls}
        </Box>
        {isOpen && detailTree(els, found, isShowingDone)}
      </Box>,
    )
  })
}
