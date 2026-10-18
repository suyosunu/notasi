import { describe, expect, it } from 'vitest'
import { adjustCount } from './feedback'

describe('adjustCount', () => {
  it('kolay +3, tam 0, zor −3', () => {
    expect(adjustCount(12, 'kolay')).toBe(15)
    expect(adjustCount(12, 'tam')).toBe(12)
    expect(adjustCount(12, 'zor')).toBe(9)
  })

  it('[6, 20] aralığında sınırlanır', () => {
    expect(adjustCount(19, 'kolay')).toBe(20)
    expect(adjustCount(20, 'kolay')).toBe(20)
    expect(adjustCount(7, 'zor')).toBe(6)
    expect(adjustCount(6, 'zor')).toBe(6)
  })

  it('aralık dışı ya da geçersiz mevcut değer de aralığa çekilir', () => {
    expect(adjustCount(30, 'tam')).toBe(20)
    expect(adjustCount(2, 'tam')).toBe(6)
    expect(adjustCount(Number.NaN, 'tam')).toBe(12)
  })
})
