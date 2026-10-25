import { describe, expect, it } from 'vitest'
import { backupFileName, BACKUP_FORMAT, createBackup, MAX_BACKUP_BYTES, mergeHabits, parseBackup } from './backup'
import { createHabit, type Habit } from './habits'

function habit(id: string, name: string, completions: string[] = [], extra: Partial<Habit> = {}): Habit {
  return { ...createHabit(name, '2026-10-01', '#5e6ad2', id), completions, ...extra }
}

describe('createBackup / parseBackup', () => {
  it('round-trips habits including targets and archived flags', () => {
    const habits = [habit('a', 'Read', ['2026-10-02']), habit('b', 'Gym', [], { target: 3, archived: true })]
    const text = createBackup(habits, new Date('2026-10-25T10:00:00Z'))
    const parsed = JSON.parse(text)
    expect(parsed.format).toBe(BACKUP_FORMAT)
    expect(parsed.version).toBe(2)
    expect(parsed.exportedAt).toBe('2026-10-25T10:00:00.000Z')
    expect(parseBackup(text)).toEqual({ ok: true, habits })
  })

  it('accepts raw v1 storage data', () => {
    const text = JSON.stringify({ version: 1, habits: [habit('a', 'Read')] })
    expect(parseBackup(text)).toEqual({ ok: true, habits: [habit('a', 'Read')] })
  })

  it.each([
    ['not json', 'not valid JSON'],
    ['[]', 'not a habitloop backup'],
    ['{"version":1}', 'not a habitloop backup'],
    ['{"version":"x","habits":[]}', 'not a habitloop backup'],
    ['{"version":3,"habits":[]}', 'newer version'],
    ['{"version":2,"habits":[{"id":1}]}', 'No valid habits'],
  ])('rejects %s', (text, message) => {
    const result = parseBackup(text)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })

  it('rejects files over the size limit', () => {
    const result = parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))
    expect(result).toEqual({ ok: false, error: expect.stringContaining('too large') })
  })

  it('names files by date', () => {
    expect(backupFileName('2026-10-25')).toBe('habitloop-backup-2026-10-25.json')
  })
})

describe('mergeHabits', () => {
  it('unions check-ins for habits with the same id', () => {
    const current = [habit('a', 'Read', ['2026-10-02', '2026-10-04'], { color: '#27a644' })]
    const incoming = [habit('a', 'Reading', ['2026-10-03', '2026-10-04'], { createdOn: '2026-09-01' })]
    expect(mergeHabits(current, incoming)).toEqual([
      habit('a', 'Read', ['2026-10-02', '2026-10-03', '2026-10-04'], { color: '#27a644', createdOn: '2026-09-01' }),
    ])
  })

  it('matches by name when ids differ', () => {
    const merged = mergeHabits([habit('a', 'Read', ['2026-10-02'])], [habit('z', 'read', ['2026-10-05'])])
    expect(merged).toHaveLength(1)
    expect(merged[0].completions).toEqual(['2026-10-02', '2026-10-05'])
  })

  it('appends new habits and does not mutate the inputs', () => {
    const current = [habit('a', 'Read', ['2026-10-02'])]
    const merged = mergeHabits(current, [habit('a', 'Read', ['2026-10-03']), habit('b', 'Walk')])
    expect(merged.map((h) => h.id)).toEqual(['a', 'b'])
    expect(current[0].completions).toEqual(['2026-10-02'])
  })
})
