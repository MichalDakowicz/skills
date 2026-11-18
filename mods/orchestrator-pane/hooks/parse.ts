import type { Area, Goal, Section } from '../types'

const CHECKBOX = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/

/** Parses docs/orchestrator/goal.md (the orchestrator skill's goal template). */
export const parseGoal = (text: string): Goal => {
  const meta = text.match(/_Set\s+([^·_]+?)\s*·\s*status:\s*([^_]+?)\s*_/)
  const statement = text.match(/\*\*Goal\.\*\*\s*(.+)/)?.[1]?.trim() ?? ''
  const areas: Area[] = []
  let inDone = false
  let area: Area | undefined

  for (const line of text.split(/\r?\n/)) {
    if (/^##\s/.test(line)) {
      inDone = /^##\s+Done when/i.test(line)
      area = undefined
      continue
    }
    if (!inDone) continue
    const heading = line.match(/^###\s+(.+)/)
    if (heading?.[1]) {
      area = { name: heading[1].trim(), bars: [] }
      areas.push(area)
      continue
    }
    const box = line.match(CHECKBOX)
    if (box && area) {
      const text = (box[2] ?? '').split(/\s+·\s+proof:/)[0]?.trim() ?? ''
      area.bars.push({ text, isDone: box[1] !== ' ' })
    }
  }

  return {
    statement,
    setOn: meta?.[1]?.trim() ?? '',
    status: meta?.[2]?.trim() ?? 'unknown',
    areas,
  }
}

/** Finds the task-list path named in docs/orchestrator/project.md. */
export const parseTaskPath = (text: string): string | undefined =>
  text.match(/^\s*-\s*Task list:\s*`([^`]+)`/m)?.[1]?.trim()

/** Counts checkboxes per `##` section of a markdown task list. */
export const parseTasks = (text: string): Section[] => {
  const sections: Section[] = []
  let section: Section | undefined

  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)/)
    if (heading?.[1]) {
      section = { name: heading[1].trim(), done: 0, total: 0 }
      sections.push(section)
      continue
    }
    const box = line.match(CHECKBOX)
    if (!box) continue
    if (!section) {
      section = { name: 'Tasks', done: 0, total: 0 }
      sections.push(section)
    }
    section.total += 1
    if (box[1] !== ' ') section.done += 1
  }

  return sections.filter(one => one.total > 0)
}

/** Reads the `**Next.**` line and update date from docs/orchestrator/handoff.md. */
export const parseHandoff = (
  text: string,
): { next?: string; updatedOn?: string } => ({
  // The line after `**Next.**`, or its first bullet when a list follows.
  next: text
    .match(/\*\*Next\.\*\*\s*(.+)/)?.[1]
    ?.replace(/^[-*]\s+/, '')
    .trim(),
  updatedOn: text.match(/_Updated\s+([^_]+?)\s*_/)?.[1]?.trim(),
})

export const countBars = (goal: Goal): { done: number; total: number } => {
  const bars = goal.areas.flatMap(area => area.bars)

  return { done: bars.filter(bar => bar.isDone).length, total: bars.length }
}

// Paths below are spelled with `/`; the engine's fs takes them on Windows too.
const slashed = (path: string): string => path.replace(/\\/g, '/')

const isAbsolute = (path: string): boolean => /^([A-Za-z]:)?\//.test(slashed(path))

/** Resolves `path` against `base` (absolute), folding `.` and `..`. */
export const resolvePath = (base: string, path: string): string => {
  const whole = isAbsolute(path) ? slashed(path) : `${slashed(base)}/${slashed(path)}`
  const drive = whole.match(/^[A-Za-z]:/)?.[0] ?? ''
  const parts: string[] = []
  for (const part of whole.slice(drive.length).split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }

  return `${drive}/${parts.join('/')}`
}

/** The folder above `dir`, or undefined at a root (`/`, `C:/`). */
export const parentOf = (dir: string): string | undefined => {
  const trimmed = slashed(dir).replace(/\/+$/, '')
  const cut = trimmed.lastIndexOf('/')
  if (cut < 0) return undefined
  const up = trimmed.slice(0, cut)

  return up === '' ? '/' : /^[A-Za-z]:$/.test(up) ? `${up}/` : up
}

/** Joins a folder and a relative path. */
export const joinPath = (dir: string, path: string): string =>
  `${slashed(dir).replace(/\/+$/, '')}/${slashed(path)}`

/**
 * The main checkout a git worktree's `.git` file points at
 * (`gitdir: C:/repo/.git/worktrees/name` gives `C:/repo`), or undefined.
 */
export const parseWorktreeMain = (gitFile: string): string | undefined => {
  const main = gitFile.match(/^gitdir:\s*(.+?)[\\/]\.git[\\/]worktrees[\\/]/m)?.[1]

  return main === undefined ? undefined : slashed(main.trim())
}
