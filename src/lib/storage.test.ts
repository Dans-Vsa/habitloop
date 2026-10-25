import { describe, expect, it } from 'vitest'
import { createHabit } from './habits'
import {
  LEGACY_STORAGE_KEY,
  loadHabits,
  migrate,
  parseStoredData,
  sanitizeHabit,
  saveHabits,
  SCHEMA_VERSION,
  serialize,
  STORAGE_KEY,
} from './storage'

describe('serialize / parseStoredData', () => {
  it('round-trips habits', () => {
    const habit = { ...createHabit('Read', '2026-10-01', '#5e6ad2', 'a'), completions: ['2026-10-02'] }
    expect(parseStoredData(serialize([habit]))).toEqual([habit])
  })

  it.each([null, '', 'not json', '[]', '{"version":3,"habits":[{"id":"a"}]}', '{"version":1}', '{"version":2}'])(
    'returns an empty list for %j',
    (text) => {
      expect(parseStoredData(text)).toEqual([])
    },
  )

  it('drops invalid habits and duplicate ids', () => {
    const text = JSON.stringify({
      version: 1,
      habits: [
        { id: 'a', name: 'Read', color: '#5e6ad2', createdOn: '2026-10-01', completions: [] },
        { id: 'a', name: 'Dup', color: '#5e6ad2', createdOn: '2026-10-01', completions: [] },
        { id: 'b', name: '', createdOn: '2026-10-01' },
        { id: 'c', name: 'Bad date', createdOn: 'tomorrow' },
        'garbage',
      ],
    })
    expect(parseStoredData(text).map((h) => h.id)).toEqual(['a'])
  })
})

describe('sanitizeHabit', () => {
  it('repairs colors and completions', () => {
    expect(
      sanitizeHabit({
        id: 'x',
        name: '  Walk  ',
        color: 'red',
        createdOn: '2026-10-01',
        completions: ['2026-10-03', 'bad', '2026-10-02', '2026-10-03'],
      }),
    ).toEqual({
      id: 'x',
      name: 'Walk',
      color: '#5e6ad2',
      createdOn: '2026-10-01',
      completions: ['2026-10-02', '2026-10-03'],
    })
  })
})

describe('loadHabits / saveHabits', () => {
  it('persists to the given storage', () => {
    const habit = createHabit('Stretch', '2026-10-22', '#27a644', 's')
    expect(saveHabits([habit], localStorage)).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Stretch')
    expect(loadHabits(localStorage)).toEqual([habit])
  })

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    expect(loadHabits(broken)).toEqual([])
    expect(saveHabits([], broken)).toBe(false)
  })
})

describe('archived flag', () => {
  it('keeps archived: true and ignores other values', () => {
    const base = { id: 'a', name: 'Read', color: '#5e6ad2', createdOn: '2026-10-01', completions: [] }
    expect(sanitizeHabit({ ...base, archived: true })?.archived).toBe(true)
    expect(sanitizeHabit({ ...base, archived: 'yes' })).not.toHaveProperty('archived')
    expect(sanitizeHabit(base)).not.toHaveProperty('archived')
  })
})

describe('schema v2', () => {
  const v1Habit = { id: 'a', name: 'Read', color: '#5e6ad2', createdOn: '2026-10-01', completions: ['2026-10-02'] }

  it('writes the current version', () => {
    expect(JSON.parse(serialize([])).version).toBe(SCHEMA_VERSION)
    expect(SCHEMA_VERSION).toBe(2)
  })

  it('migrates v1 data without losing habits', () => {
    expect(migrate({ version: 1, habits: [v1Habit] })).toEqual([v1Habit])
    expect(parseStoredData(JSON.stringify({ version: 1, habits: [v1Habit] }))).toEqual([v1Habit])
  })

  it('rejects unknown versions', () => {
    expect(migrate({ version: 99, habits: [] })).toBeNull()
    expect(migrate('nope')).toBeNull()
  })

  it('keeps valid weekly targets only', () => {
    expect(sanitizeHabit({ ...v1Habit, target: 3 })?.target).toBe(3)
    expect(sanitizeHabit({ ...v1Habit, target: 7 })).not.toHaveProperty('target')
    expect(sanitizeHabit({ ...v1Habit, target: '3' })).not.toHaveProperty('target')
  })

  it('loads from the legacy key and moves data on save', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, habits: [v1Habit] }))
    const habits = loadHabits(localStorage)
    expect(habits).toEqual([v1Habit])

    saveHabits(habits, localStorage)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(2)
  })

  it('prefers the current key over legacy data', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ version: 1, habits: [v1Habit] }))
    localStorage.setItem(STORAGE_KEY, serialize([]))
    expect(loadHabits(localStorage)).toEqual([])
  })
})
