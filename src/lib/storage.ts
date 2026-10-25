import { isDateKey } from './dates'
import { HABIT_COLORS, MAX_NAME_LENGTH, normalizeName, type Habit } from './habits'
import { isWeeklyTarget } from './weekly'

export const STORAGE_KEY = 'habitloop'
/** Where v0.1/v0.2 kept their data; read once and migrated on the next save. */
export const LEGACY_STORAGE_KEY = 'habitloop:v1'
export const SCHEMA_VERSION = 2

export interface StoredData {
  version: typeof SCHEMA_VERSION
  habits: Habit[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Bring stored data of any known version up to the current schema, or return
 * `null` for data this app cannot read (unknown or newer versions).
 *
 * v1 → v2: habits gained an optional weekly `target`. v1 habits have none, so
 * they stay daily habits and their data is carried over unchanged.
 */
export function migrate(data: unknown): unknown[] | null {
  if (!isRecord(data) || !Array.isArray(data.habits)) return null
  if (data.version === 1 || data.version === SCHEMA_VERSION) return data.habits
  return null
}

/** Validate one habit from untrusted JSON; returns `null` when unusable. */
export function sanitizeHabit(raw: unknown): Habit | null {
  if (!isRecord(raw)) return null
  const { id, name, color, createdOn, completions, archived, target } = raw
  if (typeof id !== 'string' || !id) return null
  if (typeof name !== 'string') return null
  const cleanName = normalizeName(name).slice(0, MAX_NAME_LENGTH)
  if (!cleanName || !isDateKey(createdOn)) return null
  const days = Array.isArray(completions) ? completions.filter(isDateKey) : []
  return {
    id,
    name: cleanName,
    color: typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : HABIT_COLORS[0],
    createdOn,
    completions: [...new Set(days)].sort(),
    ...(archived === true ? { archived: true } : {}),
    ...(isWeeklyTarget(target) ? { target } : {}),
  }
}

/** Sanitize a list of raw habits, dropping invalid ones and duplicate ids. */
export function sanitizeHabits(list: unknown[]): Habit[] {
  const seen = new Set<string>()
  const habits: Habit[] = []
  for (const raw of list) {
    const habit = sanitizeHabit(raw)
    if (habit && !seen.has(habit.id)) {
      seen.add(habit.id)
      habits.push(habit)
    }
  }
  return habits
}

/** Parse stored JSON. Corrupt or unknown data yields an empty habit list. */
export function parseStoredData(text: string | null): Habit[] {
  if (!text) return []
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  const list = migrate(data)
  return list ? sanitizeHabits(list) : []
}

export function serialize(habits: Habit[]): string {
  const data: StoredData = { version: SCHEMA_VERSION, habits }
  return JSON.stringify(data)
}

export function loadHabits(storage: Storage | undefined = globalThis.localStorage): Habit[] {
  try {
    const current = storage?.getItem(STORAGE_KEY) ?? null
    return parseStoredData(current ?? storage?.getItem(LEGACY_STORAGE_KEY) ?? null)
  } catch {
    return []
  }
}

/** Persist habits; returns false when storage is unavailable or full. */
export function saveHabits(habits: Habit[], storage: Storage | undefined = globalThis.localStorage): boolean {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_KEY, serialize(habits))
    storage.removeItem(LEGACY_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
