import { describe, expect, it } from 'vitest'
import { createHabit } from './habits'
import { loadHabits, parseStoredData, sanitizeHabit, saveHabits, serialize, STORAGE_KEY } from './storage'

describe('serialize / parseStoredData', () => {
  it('round-trips habits', () => {
    const habit = { ...createHabit('Read', '2026-10-01', '#5e6ad2', 'a'), completions: ['2026-10-02'] }
    expect(parseStoredData(serialize([habit]))).toEqual([habit])
  })

  it.each([null, '', 'not json', '[]', '{"version":2,"habits":[]}', '{"version":1}'])(
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
