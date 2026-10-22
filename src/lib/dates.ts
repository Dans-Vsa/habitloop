/**
 * Date helpers that work on local calendar days.
 *
 * Habits are tracked per calendar day in the user's own time zone, so every
 * day is stored as a `YYYY-MM-DD` "date key" instead of a timestamp. This keeps
 * streaks stable across daylight-saving changes and easy to serialise.
 */

export type DateKey = string

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format a Date as a local `YYYY-MM-DD` key. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** True when `value` is a well-formed key for a real calendar day. */
export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string') return false
  const match = DATE_KEY_RE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Parse a date key into a Date at local midnight. Throws on invalid input. */
export function parseDateKey(key: DateKey): Date {
  if (!isDateKey(key)) throw new Error(`Invalid date key: ${key}`)
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Shift a date key by a number of days (negative goes back in time). */
export function addDays(key: DateKey, days: number): DateKey {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: DateKey, to: DateKey): number {
  const a = parseDateKey(from)
  const b = parseDateKey(to)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86_400_000)
}

/** The `count` most recent days ending at `end`, oldest first. */
export function lastNDays(end: DateKey, count: number): DateKey[] {
  const days: DateKey[] = []
  for (let i = count - 1; i >= 0; i--) days.push(addDays(end, -i))
  return days
}

/** Today's date key, based on the local clock. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now)
}

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const LONG_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

/** Short weekday label, e.g. "Mon". */
export function weekdayLabel(key: DateKey): string {
  return WEEKDAY.format(parseDateKey(key))
}

/** Long label, e.g. "Thursday, October 22". */
export function longDateLabel(key: DateKey): string {
  return LONG_DATE.format(parseDateKey(key))
}
