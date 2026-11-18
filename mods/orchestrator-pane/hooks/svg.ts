import type { Board, Goal } from '../types'
import { countBars } from './parse'

// Styled drawings for the surfaces that draw `Svg` (desktop, editor, mobile):
// the same look as the design preview, in light and dark.

const FONT =
  "'Anthropic Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

const STYLE = `<style>
.t{fill:#1f1e1d}.m{fill:#73726c}.f{fill:#a3a29b}
.clay{fill:#d97757}.acc{fill:#2c6bed}.acc-bg{fill:#e6f1fb}.acc-ln{stroke:#85b7eb}
.ok{fill:#0f6e56}.ok-bg{fill:#e1f5ee}.ok-bar{fill:#1d9e75}
.warn{fill:#854f0b}.warn-bg{fill:#faeeda}
.neu{fill:#5f5e5a}.neu-bg{fill:#ecebe5}
.track{fill:#e6e4dd}.card{fill:#faf9f5;stroke:#e6e4dd}.rule{stroke:#e6e4dd}
@media (prefers-color-scheme: dark){
.t{fill:#f5f4ef}.m{fill:#a3a29b}.f{fill:#73726c}
.acc{fill:#85b7eb}.acc-bg{fill:#1b2a40}.acc-ln{stroke:#2f5486}
.ok{fill:#5dcaa5}.ok-bg{fill:#10372c}.ok-bar{fill:#2fb787}
.warn{fill:#ef9f27}.warn-bg{fill:#3d2a0c}
.neu{fill:#c9c7bf}.neu-bg{fill:#34332f}
.track{fill:#3a3935}.card{fill:#262624;stroke:#3a3935}.rule{stroke:#3a3935}}
text{font-family:${FONT}}
</style>`

const esc = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// A rough width for proportional text: enough to cut and place, not to kern.
const widthOf = (text: string, size: number): number => text.length * size * 0.56

const cut = (text: string, size: number, room: number): string => {
  if (widthOf(text, size) <= room) return text
  const keep = Math.max(1, Math.floor(room / (size * 0.56)) - 1)

  return `${text.slice(0, keep).trimEnd()}…`
}

type Tone = 'ok' | 'warn' | 'neu'

const toneOf = (done: number, total: number): Tone => {
  if (total > 0 && done === total) return 'ok'
  if (total > 0 && done / total < 0.5) return 'warn'

  return 'neu'
}

export const isGoalMet = (goal: Goal, done: number, total: number): boolean =>
  /\b(met|done|complete[d]?)\b/i.test(goal.status) ||
  (total > 0 && done === total)

const txt = (
  x: number,
  y: number,
  text: string,
  cls: string,
  size = 12,
  extra = '',
): string =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${size}"${extra}>${esc(text)}</text>`

const bar = (x: number, y: number, w: number, done: number, total: number, cls = 'ok-bar') => {
  const fill = total === 0 ? 0 : Math.max(done > 0 ? 4 : 0, (done / total) * w)

  return (
    `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" class="track"/>` +
    (fill > 0
      ? `<rect x="${x}" y="${y}" width="${fill.toFixed(1)}" height="6" rx="3" class="${cls}"/>`
      : '')
  )
}

/** A drawing and its size in CSS pixels, handed to `Svg` as is. */
export type Drawn = { source: string; width: number; height: number }

const svg = (w: number, h: number, body: string): Drawn => ({
  width: w,
  height: h,
  source: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${STYLE}${body}</svg>`,
})

// The next step, the goal met, or the wait for docs, on a line at `y`.
const nextLine = (view: Board, width: number, y: number): string => {
  const goal = view.goal
  const bars = goal ? countBars(goal) : { done: 0, total: 0 }
  const room = width - 18

  if (!view.isFound) {
    return txt(16, y, cut(`Orchestrator · waiting for docs/orchestrator/ in ${view.root ?? 'this folder'}`, 12.5, room), 'm', 12.5)
  }
  if (goal && isGoalMet(goal, bars.done, bars.total)) {
    return (
      txt(16, y, '✓ Goal met', 'ok', 12.5, ' font-weight="500"') +
      txt(16 + widthOf('✓ Goal met', 12.5) + 10, y, cut(goal.statement, 12.5, room - 90), 'm', 12.5)
    )
  }
  if (view.next) {
    return (
      txt(16, y, 'Next', 'acc', 11.5, ' font-weight="500"') +
      txt(16 + widthOf('Next', 11.5) + 8, y, cut(view.next, 12.5, room - 44), 't', 12.5)
    )
  }

  return txt(16, y, cut(goal?.statement || 'No active goal', 12.5, room), 'm', 12.5)
}

// The progress at a glance, on a line at `y`: a bar with the done-bars, each
// area coloured by how far along it is, the task total at the right end.
const progressLine = (view: Board, width: number, y: number): string => {
  const parts: string[] = []
  const goal = view.goal
  const tasks = view.tasks?.sections ?? []
  let right = width
  if (tasks.length) {
    const label = `tasks ${tasks.reduce((n, one) => n + one.done, 0)}/${tasks.reduce((n, one) => n + one.total, 0)}`
    right -= widthOf(label, 11.5)
    parts.push(txt(right, y, label, 'm', 11.5))
    right -= 14
  }
  if (!goal) return parts.join('') + txt(16, y, 'No active goal', 'm', 11.5)
  const bars = countBars(goal)
  parts.push(bar(16, y - 6, 110, bars.done, bars.total))
  const count = `${bars.done}/${bars.total}`
  parts.push(txt(134, y, count, 't', 11.5, ' font-weight="500"'))
  let x = 134 + widthOf(count, 11.5) + 14
  for (const area of goal.areas) {
    const done = area.bars.filter(one => one.isDone).length
    const label = `${area.name} ${done}/${area.bars.length}`
    const w = widthOf(label, 11.5)
    if (x + w > right) break
    parts.push(txt(x, y, label, toneOf(done, area.bars.length), 11.5))
    x += w + 12
  }

  return parts.join('')
}

/**
 * The band at a glance: the progress line over the next step, a diamond
 * marking it as the orchestrator's; the wait for docs alone on one line.
 */
export const glanceSvg = (view: Board, width: number): Drawn => {
  const mark = (y: number) =>
    `<path d="M5 ${y - 9} L10 ${y - 4} L5 ${y + 1} L0 ${y - 4} Z" class="clay"/>`
  if (!view.isFound) return svg(width, 22, mark(15) + nextLine(view, width, 15))

  return svg(width, 44, mark(15) + progressLine(view, width, 15) + nextLine(view, width, 37))
}

/**
 * What the band opens to: the open bars by area and each task section with a
 * bar, side by side when there is room, the numbers left to the status line.
 */
export const detailSvg = (
  view: Board,
  isShowingDone: boolean,
  width: number,
  maxBars = 8,
): Drawn => {
  const isSplit = width >= 560
  const gap = 28
  const colW = isSplit ? (width - gap) / 2 : width
  const left: string[] = []
  const right: string[] = []
  let ly = 0
  let ry = 0

  const goal = view.goal
  if (goal) {
    const bars = countBars(goal)
    const open = bars.total - bars.done
    ly += 13
    left.push(txt(0, ly, open > 0 ? `Still open · ${open}` : 'All bars met', 'm', 11, ' font-weight="500"'))
    let room = maxBars
    let hidden = 0
    for (const area of goal.areas) {
      const shown = area.bars.filter(one => isShowingDone || !one.isDone)
      if (shown.length === 0) continue
      if (room <= 0) {
        hidden += shown.length
        continue
      }
      const done = area.bars.filter(one => one.isDone).length
      const tone = toneOf(done, area.bars.length)
      ly += 20
      left.push(`<rect x="0" y="${ly - 9}" width="6" height="6" rx="3" class="${tone}"/>`)
      left.push(txt(12, ly, `${area.name} ${done}/${area.bars.length}`, tone, 11, ' font-weight="500"'))
      for (const one of shown) {
        if (room <= 0) {
          hidden += 1
          continue
        }
        room -= 1
        ly += 18
        left.push(
          txt(12, ly, `${one.isDone ? '✓' : '○'} ${cut(one.text, 12.5, colW - 24)}`, one.isDone ? 'f' : 't', 12.5),
        )
      }
    }
    if (hidden > 0) {
      ly += 18
      left.push(txt(12, ly, `+${hidden} more`, 'f', 11))
    }
  }

  if (view.tasks && view.tasks.sections.length > 0) {
    const col = isSplit ? right : left
    let y = isSplit ? ry : ly + (ly > 0 ? 14 : 0)
    y += 13
    col.push(txt(0, y, 'Tasks', 'm', 11, ' font-weight="500"'))
    const path = cut(view.tasks.path, 11, colW / 2)
    col.push(txt(colW - widthOf(path, 11), y, path, 'f', 11))
    for (const section of view.tasks.sections) {
      const isDone = section.done === section.total
      const count = `${section.done}/${section.total}`
      y += 20
      col.push(txt(0, y, `${isDone ? '✓ ' : ''}${cut(section.name, 12.5, colW - 50)}`, isDone ? 'f' : 't', 12.5))
      col.push(txt(colW - widthOf(count, 12), y, count, isDone ? 'f' : 'm', 12))
      if (!isDone) {
        col.push(bar(0, y + 6, colW, section.done, section.total, 'acc'))
        y += 10
      }
    }
    if (isSplit) ry = y
    else ly = y
  }

  const h = Math.max(ly, ry) + 8
  const body =
    left.join('') +
    (isSplit && right.length
      ? `<g transform="translate(${(colW + gap).toFixed(1)} 0)">${right.join('')}</g>`
      : '')

  return svg(width, h, body)
}
