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
  next: text.match(/\*\*Next\.\*\*\s*(.+)/)?.[1]?.trim(),
  updatedOn: text.match(/_Updated\s+([^_]+?)\s*_/)?.[1]?.trim(),
})

export const countBars = (goal: Goal): { done: number; total: number } => {
  const bars = goal.areas.flatMap(area => area.bars)

  return { done: bars.filter(bar => bar.isDone).length, total: bars.length }
}
