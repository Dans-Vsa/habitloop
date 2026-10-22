import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  isDateKey,
  lastNDays,
  longDateLabel,
  parseDateKey,
  toDateKey,
  todayKey,
  weekdayLabel,
} from './dates'

describe('toDateKey / parseDateKey', () => {
  it('formats local dates with zero padding', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 9, 22, 23, 59))).toBe('2026-10-22')
  })

  it('round-trips through parse', () => {
    expect(toDateKey(parseDateKey('2024-02-29'))).toBe('2024-02-29')
  })

  it('rejects invalid keys', () => {
    expect(() => parseDateKey('2026-02-30')).toThrow(/Invalid date key/)
    expect(() => parseDateKey('yesterday')).toThrow()
  })
})

describe('isDateKey', () => {
  it.each([
    ['2026-10-22', true],
    ['2024-02-29', true],
    ['2023-02-29', false],
    ['2026-13-01', false],
    ['2026-1-01', false],
    [20261022, false],
    [null, false],
  ])('%s -> %s', (value, expected) => {
    expect(isDateKey(value)).toBe(expected)
  })
})

describe('addDays / daysBetween', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts whole days, including across DST changes', () => {
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
    expect(daysBetween('2026-10-22', '2026-10-20')).toBe(-2)
    expect(daysBetween('2026-10-22', '2026-10-22')).toBe(0)
  })
})

describe('lastNDays', () => {
  it('returns days oldest first, ending at the given day', () => {
    expect(lastNDays('2026-10-02', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02'])
  })
})

describe('labels', () => {
  it('formats weekday and long labels in English', () => {
    expect(weekdayLabel('2026-10-22')).toBe('Thu')
    expect(longDateLabel('2026-10-22')).toBe('Thursday, October 22')
  })

  it('todayKey uses the provided clock', () => {
    expect(todayKey(new Date(2026, 9, 22, 8))).toBe('2026-10-22')
  })
})
