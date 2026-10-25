import { addDays, daysBetween, isDateKey, type DateKey } from './dates'
import { currentWeekStreak, hasWeeklyTarget, isWeeklyTarget, longestWeekStreak } from './weekly'

export interface Habit {
  id: string
  name: string
  color: string
  /** Day the habit was created; streaks never look further back than this. */
  createdOn: DateKey
  /** Sorted, de-duplicated list of days the habit was completed. */
  completions: DateKey[]
  /** Archived habits keep their history but are hidden from the daily list. */
  archived?: boolean
  /** Times per week (1-6). Missing means the habit is meant for every day. */
  target?: number
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

export interface HabitChanges {
  name?: string
  color?: string
  /** A weekly target, or `null` to go back to every day. */
  target?: number | null
}

/** Returns a new habit with a normalised name, a new color and/or a new target. */
export function updateHabit(habit: Habit, changes: HabitChanges): Habit {
  const next: Habit = {
    ...habit,
    ...(changes.name !== undefined ? { name: normalizeName(changes.name) } : {}),
    ...(changes.color !== undefined ? { color: changes.color } : {}),
  }
  if (changes.target === undefined) return next
  const { target: _previous, ...rest } = next
  return isWeeklyTarget(changes.target) ? { ...rest, target: changes.target } : rest
}

export interface StreakInfo {
  current: number
  best: number
  /** Daily habits count days; habits with a weekly target count weeks. */
  unit: 'day' | 'week'
}

/** Current and best streak in the unit that fits the habit's target. */
export function streakInfo(habit: Habit, today: DateKey): StreakInfo {
  if (hasWeeklyTarget(habit)) {
    return {
      current: currentWeekStreak(habit, habit.target, today),
      best: longestWeekStreak(habit, habit.target),
      unit: 'week',
    }
  }
  return { current: currentStreak(habit, today), best: longestStreak(habit), unit: 'day' }
}

/** "3 days" / "1 week" */
export function formatStreak(count: number, unit: StreakInfo['unit']): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

/** Archive or restore a habit. Unarchived habits drop the flag entirely. */
export function setArchived(habit: Habit, archived: boolean): Habit {
  const { archived: _previous, ...rest } = habit
  return archived ? { ...rest, archived: true } : rest
}

export function isArchived(habit: Habit): boolean {
  return habit.archived === true
}

/**
 * Move a habit one step up (-1) or down (+1) among habits with the same
 * archived state, so reordering the visible list never jumps over hidden ones.
 * Returns the original array when the move is not possible.
 */
export function moveHabit(habits: Habit[], id: string, direction: -1 | 1): Habit[] {
  const from = habits.findIndex((h) => h.id === id)
  if (from === -1) return habits
  const group = isArchived(habits[from])
  let to = from + direction
  while (to >= 0 && to < habits.length && isArchived(habits[to]) !== group) to += direction
  if (to < 0 || to >= habits.length) return habits
  const next = [...habits]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

/** Total number of completed days. */
export function totalCompletions(habit: Habit): number {
  return habit.completions.length
}
