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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // Not `/orchestrator`: that name belongs to the orchestrator skill.
    // A refused name must not stop the band from showing.
    await $.command
      .register({
        name: COMMAND,
        description:
          'Show the orchestrator goal, done-bars and next step above the prompt (args: a project folder, auto, or hide)',
      })
      .catch(() => undefined)
    await refresh($)

    return next(e)
  })

  // `/orchestrator-pane` shows the band; `<folder>` reads that project instead
  // of searching from the session's folder; `auto` goes back to searching;
  // `hide` takes the band away until the orchestrator or the command is next run.
  on('command.run', { command: 'orchestrator-pane' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'hide') {
      await update($, band, view => ({ ...view, isHidden: true }))

      return { text: 'Orchestrator band hidden; /orchestrator-pane shows it again.' }
    }
    if (arg === 'auto') {
      await update($, pin, () => ({}))
    } else if (arg !== '') {
      const path = resolvePath(await $.session.cwd(), arg)
      if (!(await hasDocs($, path))) {
        return { text: `No ${DIR}/ in ${path}; the band is unchanged.` }
      }
      await update($, pin, () => ({ path }))
    }
    const found = await showBand($)

    return {
      text: found.isFound
        ? `Orchestrator band shows ${found.root}.`
        : `No ${DIR}/ in ${found.root} or above yet. Point the band at a project with /orchestrator-pane <folder>.`,
    }
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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const view = await read($, band)
    const found = await read($, board)
    if (view.isHidden || (!found.isFound && !view.isStarted)) return next(e)

    const { Box, Text, Button } = $.ui.resolve(e)

    if (!found.isFound) {
      return (
        <Box>
          <Text dimColor wrap="truncate-end">
            Orchestrator · waiting for {DIR}/ in {found.root ?? 'this folder'}
          </Text>
        </Box>
      )
    }

    const goal = found.goal
    const bars = goal ? countBars(goal) : { done: 0, total: 0 }
    const sections = found.tasks?.sections ?? []
    const tasks = sections.reduce(
      (sum, one) => ({ done: sum.done + one.done, total: sum.total + one.total }),
      { done: 0, total: 0 },
    )
    const summary = [
      goal
        ? `${meter(bars.done, bars.total, 10)} ${bars.done}/${bars.total} bars · ${goal.status}`
        : 'no active goal',
      tasks.total > 0 ? `tasks ${tasks.done}/${tasks.total}` : undefined,
    ]
      .filter(Boolean)
      .join(' · ')

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Box flexGrow={1}>
            <Text wrap="truncate-end">
              <Text bold>Orchestrator</Text> {summary}
            </Text>
          </Box>
          <Button
            key="more"
            label={view.isExpanded ? 'Less' : 'More'}
            onPress={() =>
              update($, band, one => ({ ...one, isExpanded: !one.isExpanded }))
            }
          />
        </Box>
        {found.next && (
          <Text dimColor wrap="truncate-end">
            Next: {found.next}
          </Text>
        )}
        {view.isExpanded && (
          <Box flexDirection="column">
            {goal?.statement && <Text>{goal.statement}</Text>}
            {goal?.areas.map(area => (
              <Text>
                <Text bold>{area.name}</Text>{' '}
                {area.bars
                  .map(bar => `${bar.isDone ? '✓' : '○'} ${bar.text}`)
                  .join('  ')}
              </Text>
            ))}
            {sections.map(section => (
              <Text
                dimColor={section.done === section.total}
                wrap="truncate-end"
              >
                {section.done === section.total ? '✓' : '○'} {section.name}{' '}
                {section.done}/{section.total}
              </Text>
            ))}
            <Text dimColor wrap="truncate-end">
              {found.root}
              {found.updatedOn ? ` · handoff ${found.updatedOn}` : ''}
            </Text>
          </Box>
        )}
      </Box>
    )
  })
}
