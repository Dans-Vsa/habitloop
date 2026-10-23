import { describe, expect, it } from 'vitest'
import { createHabit } from './habits'
import { buildHeatmap, countByDay, levelFor } from './heatmap'

describe('countByDay', () => {
  it('sums completions across habits', () => {
    const a = { ...createHabit('A', '2026-10-01', '#5e6ad2', 'a'), completions: ['2026-10-01', '2026-10-02'] }
    const b = { ...createHabit('B', '2026-10-01', '#5e6ad2', 'b'), completions: ['2026-10-02'] }
    const counts = countByDay([a, b])
    expect(counts.get('2026-10-01')).toBe(1)
    expect(counts.get('2026-10-02')).toBe(2)
    expect(counts.get('2026-10-03')).toBeUndefined()
  })
})

describe('levelFor', () => {
  it.each([
    [0, 4, 0],
    [1, 4, 1],
    [2, 4, 2],
    [3, 4, 3],
    [4, 4, 4],
    [1, 1, 4],
    [5, 0, 0],
  ])('count %i of max %i is level %i', (count, max, level) => {
    expect(levelFor(count, max)).toBe(level)
  })
})

describe('buildHeatmap', () => {
  // 2026-10-22 is a Thursday.
  const END = '2026-10-22'

  it('builds Sunday-first weeks ending with the current week', () => {
    const map = buildHeatmap(new Map(), END, 53)
    expect(map.weeks).toHaveLength(53)
    expect(map.weeks.every((w) => w.length === 7)).toBe(true)
    const last = map.weeks[52]
    expect(last[0].day).toBe('2026-10-18')
    expect(last[4]).toMatchObject({ day: END, inRange: true })
    expect(last[5]).toMatchObject({ day: '2026-10-23', inRange: false, count: 0 })
    expect(map.weeks[0][0].day).toBe('2025-10-19')
  })

  it('scales levels to the busiest day and totals the range', () => {
    const counts = new Map([
      ['2026-10-20', 4],
      ['2026-10-21', 1],
      ['2026-10-30', 9], // after the end date: ignored
      ['2020-01-01', 9], // before the range: ignored
    ])
    const map = buildHeatmap(counts, END, 2)
    expect(map.max).toBe(4)
    expect(map.total).toBe(5)
    const cells = map.weeks.flat()
    expect(cells.find((c) => c.day === '2026-10-20')?.level).toBe(4)
    expect(cells.find((c) => c.day === '2026-10-21')?.level).toBe(1)
  })

  it('labels each month once at the week it starts', () => {
    const map = buildHeatmap(new Map(), END, 53)
    const labels = map.months.map((m) => m.label)
    expect(labels).toContain('Jan')
    expect(labels.filter((l) => l === 'Jan')).toHaveLength(1)
    const weeks = map.months.map((m) => m.week)
    expect(weeks).toEqual([...weeks].sort((x, y) => x - y))
  })
})
