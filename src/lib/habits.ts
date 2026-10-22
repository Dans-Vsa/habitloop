import { addDays, daysBetween, isDateKey, type DateKey } from './dates'

export interface Habit {
  id: string
  name: string
  color: string
  /** Day the habit was created; streaks never look further back than this. */
  createdOn: DateKey
  /** Sorted, de-duplicated list of days the habit was completed. */
  completions: DateKey[]
}

export const HABIT_COLORS = ['#5e6ad2', '#27a644', '#d4a72c', '#e5484d', '#3e9fd8', '#a46ad2'] as const

export const MAX_NAME_LENGTH = 60

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/** Returns an error message, or `null` when the name is acceptable. */
export function validateHabitName(name: string, existing: Habit[] = [], ignoreId?: string): string | null {
  const clean = normalizeName(name)
  if (!clean) return 'Give the habit a name.'
  if (clean.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH} characters.`
  const lower = clean.toLowerCase()
  if (existing.some((h) => h.id !== ignoreId && h.name.toLowerCase() === lower)) {
    return 'You already track a habit with that name.'
  }
  return null
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createHabit(
  name: string,
  createdOn: DateKey,
  color: string = HABIT_COLORS[0],
  id: string = randomId(),
): Habit {
  return { id, name: normalizeName(name), color, createdOn, completions: [] }
}

export function isDone(habit: Habit, day: DateKey): boolean {
  return habit.completions.includes(day)
}

/** Returns a new habit with `day` toggled between done and not done. */
export function toggleCompletion(habit: Habit, day: DateKey): Habit {
  if (!isDateKey(day)) throw new Error(`Invalid date key: ${day}`)
  const completions = isDone(habit, day)
    ? habit.completions.filter((d) => d !== day)
    : [...habit.completions, day].sort()
  return { ...habit, completions }
}

/**
 * Consecutive completed days ending today. If today is not done yet the
 * streak still counts from yesterday, so an unfinished day never "breaks"
 * a streak before it is over.
 */
export function currentStreak(habit: Habit, today: DateKey): number {
  const done = new Set(habit.completions)
  let day = done.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (done.has(day)) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}

/** The longest run of consecutive completed days ever recorded. */
export function longestStreak(habit: Habit): number {
  const days = [...new Set(habit.completions)].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

/** Share of days completed between creation (or `windowDays` ago) and today, 0..1. */
export function completionRate(habit: Habit, today: DateKey, windowDays = 30): number {
  const sinceCreated = daysBetween(habit.createdOn, today) + 1
  const span = Math.max(1, Math.min(windowDays, sinceCreated))
  const start = addDays(today, -(span - 1))
  const done = habit.completions.filter((d) => d >= start && d <= today).length
  return done / span
}
