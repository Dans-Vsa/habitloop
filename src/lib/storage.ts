import { isDateKey } from './dates'
import { HABIT_COLORS, MAX_NAME_LENGTH, normalizeName, type Habit } from './habits'

export const STORAGE_KEY = 'habitloop:v1'
export const SCHEMA_VERSION = 1

export interface StoredData {
  version: typeof SCHEMA_VERSION
  habits: Habit[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validate one habit from untrusted JSON; returns `null` when unusable. */
export function sanitizeHabit(raw: unknown): Habit | null {
  if (!isRecord(raw)) return null
  const { id, name, color, createdOn, completions, archived } = raw
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
  }
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
  if (!isRecord(data) || data.version !== SCHEMA_VERSION || !Array.isArray(data.habits)) return []
  const seen = new Set<string>()
  const habits: Habit[] = []
  for (const raw of data.habits) {
    const habit = sanitizeHabit(raw)
    if (habit && !seen.has(habit.id)) {
      seen.add(habit.id)
      habits.push(habit)
    }
  }
  return habits
}

export function serialize(habits: Habit[]): string {
  const data: StoredData = { version: SCHEMA_VERSION, habits }
  return JSON.stringify(data)
}

export function loadHabits(storage: Storage | undefined = globalThis.localStorage): Habit[] {
  try {
    return parseStoredData(storage?.getItem(STORAGE_KEY) ?? null)
  } catch {
    return []
  }
}

/** Persist habits; returns false when storage is unavailable or full. */
export function saveHabits(habits: Habit[], storage: Storage | undefined = globalThis.localStorage): boolean {
  try {
    storage?.setItem(STORAGE_KEY, serialize(habits))
    return Boolean(storage)
  } catch {
    return false
  }
}
