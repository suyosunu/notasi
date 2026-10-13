import { describe, expect, it } from 'vitest'
import { todayLocal } from './date'

describe('todayLocal', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(todayLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(todayLocal(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31')
  })
  it('defaults to now', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
