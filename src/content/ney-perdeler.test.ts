import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from './nota-topics'
import { ILK_SES_REHBER, NEY_PERDELER, visibleFingering } from './ney-perdeler'

describe('NEY_PERDELER', () => {
  it('MEB sırasıyla gelir: Nevâ, Çârgâh, Bûselik, Dügâh, Rast', () => {
    expect(NEY_PERDELER.map((p) => p.id)).toEqual(['neva', 'cargah', 'buselik', 'dugah', 'rast'])
    expect(NEY_PERDELER.map((p) => p.name)).toEqual(['Nevâ', 'Çârgâh', 'Bûselik', 'Dügâh', 'Rast'])
  })

  it('yazılış ve bağlı nota konusu tabloya uyar', () => {
    const rows = NEY_PERDELER.map((p) => [p.id, p.written.step, p.written.octave, p.written.acc, p.notaTopicId])
    expect(rows).toEqual([
      ['neva', 'D', 5, 0, 'nota-1'],
      ['cargah', 'C', 5, 0, 'nota-1'],
      ['buselik', 'B', 4, 0, 'nota-1'],
      ['dugah', 'A', 4, 0, 'nota-2'],
      ['rast', 'G', 4, 0, 'nota-2'],
    ])
    const topicIds = NOTA_TOPICS.map((t) => t.id)
    for (const p of NEY_PERDELER) expect(topicIds).toContain(p.notaTopicId)
  })

  it('her doğrulanmış perdenin kaynağı ve şeması doludur', () => {
    for (const p of NEY_PERDELER.filter((x) => x.verified)) {
      expect(p.source, p.id).toBeTruthy()
      expect(p.source, p.id).toMatch(/^https:\/\/\S+$/)
      expect(p.fingering, p.id).not.toBeNull()
      expect(p.fingering!.front, p.id).toHaveLength(6)
    }
  })

  it('her perdenin Türkçe kısa tarifi vardır', () => {
    for (const p of NEY_PERDELER) expect(p.tip.trim().length, p.id).toBeGreaterThan(0)
  })

  it('Rast tüm delikler kapalı, Dügâh yalnız en alt delik açık', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId.rast.fingering).toEqual({ thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] })
    expect(byId.dugah.fingering).toEqual({ thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'acik'] })
  })
})

describe('visibleFingering', () => {
  it('doğrulanmamış perdede null döner', () => {
    for (const p of NEY_PERDELER) expect(visibleFingering({ ...p, verified: false })).toBeNull()
  })

  it('doğrulanmış perdede şemayı döner', () => {
    for (const p of NEY_PERDELER) {
      expect(visibleFingering({ ...p, verified: true, source: 'x' })).toBe(p.fingering)
    }
  })
})

describe('ILK_SES_REHBER', () => {
  it('3–5 kısa Türkçe madde içerir', () => {
    expect(ILK_SES_REHBER.length).toBeGreaterThanOrEqual(3)
    expect(ILK_SES_REHBER.length).toBeLessThanOrEqual(5)
    for (const m of ILK_SES_REHBER) {
      expect(m.trim().length).toBeGreaterThan(0)
      expect(m.length).toBeLessThanOrEqual(120)
    }
  })
})
