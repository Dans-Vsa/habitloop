import { addDays, parseDateKey, type DateKey } from './dates'
import type { Habit } from './habits'

/** One square in the heatmap grid. */
export interface HeatmapCell {
  day: DateKey
  /** Completions on this day (0 or 1 for a single habit). */
  count: number
  /** Intensity bucket 0..4 used for coloring. */
  level: 0 | 1 | 2 | 3 | 4
  /** False for padding cells after `end`, which are rendered empty. */
  inRange: boolean
}

export interface Heatmap {
  /** Columns of 7 cells, Sunday first, oldest week first. */
  weeks: HeatmapCell[][]
  /** Month labels and the week column they start in. */
  months: { label: string; week: number }[]
  /** Highest daily count, used to scale levels. */
  max: number
  /** Total completions inside the range. */
  total: number
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short' })

/** Count completions per day across one or more habits. */
export function countByDay(habits: Habit[]): Map<DateKey, number> {
  const counts = new Map<DateKey, number>()
  for (const habit of habits) {
    for (const day of habit.completions) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return counts
}

/** Map a count to a 0..4 level relative to `max` (GitHub-style buckets). */
export function levelFor(count: number, max: number): HeatmapCell['level'] {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/**
 * Build a calendar grid of `weeks` columns ending with the week that
 * contains `end`. Each column runs Sunday → Saturday; days after `end`
 * are padding cells.
 */
export function buildHeatmap(counts: Map<DateKey, number>, end: DateKey, weeks = 53): Heatmap {
  const endWeekday = parseDateKey(end).getDay()
  const start = addDays(end, -(endWeekday + (weeks - 1) * 7))

  let max = 0
  let total = 0
  for (const [day, count] of counts) {
    if (day >= start && day <= end) {
      max = Math.max(max, count)
      total += count
    }
  }

  const columns: HeatmapCell[][] = []
  const months: Heatmap['months'] = []
  let lastMonth = -1
  for (let w = 0; w < weeks; w++) {
    const column: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d)
      const inRange = day <= end
      const count = inRange ? (counts.get(day) ?? 0) : 0
      column.push({ day, count, level: levelFor(count, max), inRange })
    }
    const month = parseDateKey(column[0].day).getMonth()
    if (month !== lastMonth) {
      months.push({ label: MONTH.format(parseDateKey(column[0].day)), week: w })
      lastMonth = month
    }
    columns.push(column)
  }

  // Drop a leading label that would overlap the next one.
  if (months.length > 1 && months[1].week - months[0].week < 3) months.shift()

  return { weeks: columns, months, max, total }
}
