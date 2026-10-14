import { describe, expect, it } from 'vitest'
import { fingeringCheck, ILK_SES_CONFIG, initialLongTone, neyLevelConfig, stepLongTone } from './long-tone'
import type { LongToneState } from './long-tone'

const CFG = neyLevelConfig(0)

/** `[t, cents]` çiftlerini sırayla işler. */
function run(samples: [number, number | null][], cfg = CFG): LongToneState {
  let s = initialLongTone()
  for (const [t, cents] of samples) s = stepLongTone(s, { t, cents }, cfg)
  return s
}

/** `from`..`to` arası (ikisi dahil) `step` ms arayla aynı değer. */
function series(from: number, to: number, cents: number | null, step = 50): [number, number | null][] {
  const out: [number, number | null][] = []
  for (let t = from; t <= to; t += step) out.push([t, cents])
  return out
}

describe('neyLevelConfig', () => {
  it('başlangıç: ±25 sent, 4000 ms, 250 ms', () => {
    expect(neyLevelConfig(0)).toEqual({ toleranceCents: 25, requiredMs: 4000, graceMs: 250 })
  })

  it('her geçişte daralır ve uzar; sınırlarda durur', () => {
    expect(neyLevelConfig(3)).toEqual({ toleranceCents: 10, requiredMs: 7000, graceMs: 250 })
    expect(neyLevelConfig(10).requiredMs).toBe(10000)
    expect(neyLevelConfig(10).toleranceCents).toBe(10)
  })

  it('ilk ses yapılandırması', () => {
    expect(ILK_SES_CONFIG).toEqual({ toleranceCents: 50, requiredMs: 3000, graceMs: 250 })
  })
})

describe('stepLongTone', () => {
  it('başlangıç durumu boştur', () => {
    expect(initialLongTone()).toEqual({ holdStartAt: null, lastGoodAt: null, holdingMs: 0, bestMs: 0, passed: false })
  })

  it('0 sentte 4000 ms tutuş geçer', () => {
    const s = run(series(0, 4000, 0))
    expect(s.passed).toBe(true)
    expect(s.holdingMs).toBeGreaterThanOrEqual(4000)
    expect(s.bestMs).toBeGreaterThanOrEqual(4000)
  })

  it('süre dolmadan geçmez', () => {
    const s = run(series(0, 3950, 0))
    expect(s.passed).toBe(false)
    expect(s.holdingMs).toBe(3950)
  })

  it('Review Focus 5: 200 ms null boşluğu tutuşu bozmaz', () => {
    const s = run([...series(0, 2000, 0), ...series(2050, 2150, null), ...series(2200, 4000, 0)])
    expect(s.passed).toBe(true)
    expect(s.holdingMs).toBeGreaterThanOrEqual(4000)
  })

  it('Review Focus 5: 300 ms null boşluğu tutuşu sıfırlar', () => {
    const s = run([...series(0, 2000, 0), ...series(2050, 2250, null), ...series(2300, 4000, 0)])
    expect(s.passed).toBe(false)
    expect(s.holdingMs).toBe(1700)
    expect(s.bestMs).toBe(2000)
  })

  it('Review Focus 5: tolerans dışı örnekler de grace süresini aşınca sıfırlar', () => {
    const s = run([...series(0, 2000, 0), ...series(2050, 2300, 1200), ...series(2350, 4000, 0)])
    expect(s.passed).toBe(false)
  })

  it('+40 sent örnekleri tutuş başlatmaz', () => {
    const s = run(series(0, 6000, 40))
    expect(s.holdStartAt).toBeNull()
    expect(s.holdingMs).toBe(0)
    expect(s.passed).toBe(false)
  })

  it('Review Focus 5: sessizlik (yalnız null) geçmez', () => {
    const s = run(series(0, 10000, null))
    expect(s.passed).toBe(false)
    expect(s.bestMs).toBe(0)
  })

  it('Review Focus 5: oktav sıçramalı giriş geçmez', () => {
    // Her 150 ms'de bir oktav sıçraması 300 ms süren bir tolerans dışı aralık bırakır.
    const samples: [number, number | null][] = []
    for (let t = 0; t <= 8000; t += 50) samples.push([t, Math.floor(t / 150) % 3 === 0 ? 0 : 1200])
    expect(run(samples).passed).toBe(false)
  })

  it('grace içindeki tolerans dışı örnekler süreyi uzatmaz, tutuşu korur', () => {
    const s = run([...series(0, 1000, 0), [1100, 60], [1200, 0]])
    expect(s.holdStartAt).toBe(0)
    expect(s.holdingMs).toBe(1200)
  })

  it('geçtikten sonra durum donar', () => {
    const passed = run(series(0, 4000, 0))
    const after = stepLongTone(passed, { t: 9000, cents: null }, CFG)
    expect(after).toEqual(passed)
  })

  it('daha sıkı yapılandırmada 15 sent tolerans dışıdır', () => {
    const s = run(series(0, 8000, 15), neyLevelConfig(3))
    expect(s.holdStartAt).toBeNull()
  })
})

describe('fingeringCheck', () => {
  it('12 örnek +70 sent → şüpheli', () => {
    const r = fingeringCheck(Array(12).fill(70))
    expect(r).toEqual({ suspicious: true, medianCents: 70 })
  })

  it('5 örnek +70 sent → şüpheli değil (az veri)', () => {
    expect(fingeringCheck(Array(5).fill(70)).suspicious).toBe(false)
  })

  it('ortanca ±50 içindeyse şüpheli değil; tek tük sıçramalar ortancayı bozmaz', () => {
    expect(fingeringCheck([...Array(10).fill(10), 1200, 1200, 1200]).suspicious).toBe(false)
    expect(fingeringCheck(Array(10).fill(50)).suspicious).toBe(false)
    expect(fingeringCheck(Array(10).fill(-60))).toEqual({ suspicious: true, medianCents: -60 })
  })

  it('boş dizi şüpheli değildir', () => {
    expect(fingeringCheck([])).toEqual({ suspicious: false, medianCents: 0 })
  })
})
