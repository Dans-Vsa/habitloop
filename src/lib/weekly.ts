/**
 * Weekly targets: a habit can ask for "N times per week" instead of every day.
 * Weeks run Monday to Sunday, and streaks for these habits are counted in
 * weeks that reached the target.
 */
import { addDays, parseDateKey, type DateKey } from './dates'
import type { Habit } from './habits'

export const MIN_WEEKLY_TARGET = 1
export const MAX_WEEKLY_TARGET = 6

export function isWeeklyTarget(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_WEEKLY_TARGET &&
    value <= MAX_WEEKLY_TARGET
  )
}

/** True when the habit asks for N times per week rather than every day. */
export function hasWeeklyTarget(habit: Habit): habit is Habit & { target: number } {
  return isWeeklyTarget(habit.target)
}

/** Monday of the week that contains `day`. */
export function weekStart(day: DateKey): DateKey {
  const offset = (parseDateKey(day).getDay() + 6) % 7
  return addDays(day, -offset)
}

/** Completions per week, keyed by the week's Monday. */
export function countByWeek(habit: Habit): Map<DateKey, number> {
  const counts = new Map<DateKey, number>()
  for (const day of habit.completions) {
    const week = weekStart(day)
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return counts
}

/** Check-ins so far in the week that contains `today`. */
export function doneThisWeek(habit: Habit, today: DateKey): number {
  return countByWeek(habit).get(weekStart(today)) ?? 0
}

/**
 * Consecutive weeks that reached the target, ending this week. Like daily
 * streaks, a week that is still in progress never breaks the streak.
 */
export function currentWeekStreak(habit: Habit, target: number, today: DateKey): number {
  const counts = countByWeek(habit)
  const thisWeek = weekStart(today)
  let week = (counts.get(thisWeek) ?? 0) >= target ? thisWeek : addDays(thisWeek, -7)
  let streak = 0
  while ((counts.get(week) ?? 0) >= target) {
    streak++
    week = addDays(week, -7)
  }
  return streak
}

/** The longest run of consecutive weeks that reached the target. */
export function longestWeekStreak(habit: Habit, target: number): number {
  const weeks = [...countByWeek(habit)]
    .filter(([, count]) => count >= target)
    .map(([week]) => week)
    .sort()
  let best = 0
  let run = 0
  for (let i = 0; i < weeks.length; i++) {
    run = i > 0 && addDays(weeks[i - 1], 7) === weeks[i] ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

export function targetLabel(target: number | undefined): string {
  return isWeeklyTarget(target) ? `${target}× per week` : 'Every day'
}
