/**
 * JSON backups: export every habit to a file and import it again later, on
 * this or another device. Imports go through the same validation as data
 * loaded from localStorage, so a hand-edited or foreign file can never put
 * the app into a broken state.
 */
import type { DateKey } from './dates'
import type { Habit } from './habits'
import { migrate, SCHEMA_VERSION, sanitizeHabits } from './storage'

export const BACKUP_FORMAT = 'habitloop-backup'
/** Refuse absurdly large files before trying to parse them. */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: typeof SCHEMA_VERSION
  exportedAt: string
  habits: Habit[]
}

export type ImportResult = { ok: true; habits: Habit[] } | { ok: false; error: string }

export function createBackup(habits: Habit[], now: Date = new Date()): string {
  const backup: Backup = { format: BACKUP_FORMAT, version: SCHEMA_VERSION, exportedAt: now.toISOString(), habits }
  return JSON.stringify(backup, null, 2)
}

export function backupFileName(today: DateKey): string {
  return `habitloop-backup-${today}.json`
}

/**
 * Read a backup file. Both exported backups and raw localStorage data
 * (`{ version, habits }`) are accepted.
 */
export function parseBackup(text: string): ImportResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'That file is too large to be a habitloop backup.' }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (typeof data !== 'object' || data === null || !('habits' in data)) {
    return { ok: false, error: 'That file is not a habitloop backup.' }
  }
  const version = (data as { version?: unknown }).version
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, error: 'This backup was made by a newer version of habitloop.' }
  }
  const list = migrate(data)
  if (!list) return { ok: false, error: 'That file is not a habitloop backup.' }
  const habits = sanitizeHabits(list)
  if (list.length > 0 && habits.length === 0) return { ok: false, error: 'No valid habits were found in that file.' }
  return { ok: true, habits }
}

/**
 * Merge imported habits into the current list. A habit matches an existing
 * one by id, or else by name (case-insensitive); matches keep the current
 * name, color and settings and gain any check-ins they were missing. Habits
 * with no match are added at the end.
 */
export function mergeHabits(current: Habit[], incoming: Habit[]): Habit[] {
  const result = current.map((h) => ({ ...h }))
  for (const habit of incoming) {
    const match =
      result.find((h) => h.id === habit.id) ??
      result.find((h) => h.name.toLowerCase() === habit.name.toLowerCase())
    if (match) {
      match.completions = [...new Set([...match.completions, ...habit.completions])].sort()
      if (habit.createdOn < match.createdOn) match.createdOn = habit.createdOn
    } else {
      result.push(habit)
    }
  }
  return result
}
