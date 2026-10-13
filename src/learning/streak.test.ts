import { describe, expect, it } from 'vitest'
import { streakDays } from './streak'

const D3 = ['2026-10-11', '2026-10-12', '2026-10-13']

describe('streakDays', () => {
  it('bugün çalışıldı: 3', () => expect(streakDays(D3, '2026-10-13')).toBe(3))
  it('bugün henüz çalışılmadı: dünden sayılır', () => expect(streakDays(D3, '2026-10-14')).toBe(3))
  it('iki gün boşluk: 0', () => expect(streakDays(D3, '2026-10-15')).toBe(0))
  it('boş liste: 0', () => expect(streakDays([], '2026-10-13')).toBe(0))
  it('tekrarlar ve sırasızlık sorun değil', () => {
    expect(streakDays(['2026-10-13', '2026-10-11', '2026-10-12', '2026-10-12', '2026-10-13'], '2026-10-13')).toBe(3)
  })
  it('kesinti seriyi böler', () => {
    expect(streakDays(['2026-10-09', '2026-10-12', '2026-10-13'], '2026-10-13')).toBe(2)
  })
  it('ay ve yıl sınırı', () => {
    expect(streakDays(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01')).toBe(3)
    expect(streakDays(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')).toBe(3)
  })
  it('gelecekteki tarihler sayılmaz', () => {
    expect(streakDays(['2026-10-13', '2026-10-14'], '2026-10-13')).toBe(1)
  })
})
