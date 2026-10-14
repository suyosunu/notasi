import { describe, expect, it } from 'vitest'
import { median, Smoother } from './smoothing'

describe('median', () => {
  it('tek sayıda elemanın ortancasını verir', () => {
    expect(median([3, 1, 2])).toBe(2)
  })
  it('çift sayıda elemanın iki ortanın ortalamasını verir', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
  it('girdiyi değiştirmez', () => {
    const xs = [3, 1, 2]
    median(xs)
    expect(xs).toEqual([3, 1, 2])
  })
})

describe('Smoother', () => {
  it('oktav sıçramasını bastırır', () => {
    const s = new Smoother()
    let last: number | null = null
    for (const hz of [440, 880, 441, 439, 442]) last = s.push(hz)
    expect(last).toBe(441)
  })
  it('null gelince tamponu temizler ve null döner', () => {
    const s = new Smoother()
    s.push(440)
    s.push(441)
    expect(s.push(null)).toBeNull()
    expect(s.push(500)).toBe(500)
  })
  it('yalnızca son N değeri tutar', () => {
    const s = new Smoother(3)
    let last: number | null = null
    for (const hz of [100, 100, 100, 200, 200]) last = s.push(hz)
    expect(last).toBe(200)
  })
  it('hiçbir zaman NaN döndürmez', () => {
    const s = new Smoother(1)
    expect(s.push(Number.NaN)).toBeNull()
    expect(s.push(440)).toBe(440)
  })
})
