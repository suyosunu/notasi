import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from './nota-topics'
import { ILK_SES_REHBER, NEY_PERDELER, visibleFingering } from './ney-perdeler'

describe('NEY_PERDELER', () => {
  it('MEB sırasıyla gelir: Nevâ, Çârgâh, Bûselik, Dügâh, Rast; ardından yeni perdeler', () => {
    expect(NEY_PERDELER.map((p) => p.id)).toEqual([
      'neva', 'cargah', 'buselik', 'dugah', 'rast',
      'huseyni', 'acem', 'gerdaniye', 'muhayyer', 'segah', 'kurdi', 'dik-kurdi', 'nim-hicaz', 'evic',
    ])
    expect(NEY_PERDELER.map((p) => p.name)).toEqual([
      'Nevâ', 'Çârgâh', 'Bûselik', 'Dügâh', 'Rast',
      'Hüseynî', 'Acem', 'Gerdâniye (açık)', 'Muhayyer (açık)', 'Segâh', 'Kürdî', 'Dik Kürdî', 'Nim Hicaz', 'Eviç',
    ])
  })

  it('Irak ve Hicaz (58) listede yoktur', () => {
    const ids = NEY_PERDELER.map((p) => p.id as string)
    expect(ids).not.toContain('irak')
    expect(ids).not.toContain('hicaz')
    expect(NEY_PERDELER.some((p) => /Irak|^Hicaz/.test(p.name))).toBe(false)
  })

  it('yazılış ve bağlı nota konusu tabloya uyar', () => {
    const rows = NEY_PERDELER.map((p) => [p.id, p.written.step, p.written.octave, p.written.acc, p.notaTopicId])
    expect(rows).toEqual([
      ['neva', 'D', 5, 0, 'nota-1'],
      ['cargah', 'C', 5, 0, 'nota-1'],
      ['buselik', 'B', 4, 0, 'nota-1'],
      ['dugah', 'A', 4, 0, 'nota-2'],
      ['rast', 'G', 4, 0, 'nota-2'],
      ['huseyni', 'E', 5, 0, 'perde-2'],
      ['acem', 'F', 5, 0, 'perde-2'],
      ['gerdaniye', 'G', 5, 0, 'perde-2'],
      ['muhayyer', 'A', 5, 0, 'perde-2'],
      ['segah', 'B', 4, -1, 'perde-3'],
      ['kurdi', 'B', 4, -5, 'perde-3'],
      ['dik-kurdi', 'B', 4, -4, 'perde-3'],
      ['nim-hicaz', 'C', 5, 4, 'perde-4'],
      ['evic', 'F', 5, 4, 'perde-4'],
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

  it('yeni perdelerin şemaları araştırma §4 ile birebir aynıdır', () => {
    const K = 'kapali'
    const A = 'acik'
    const want: Record<string, string[]> = {
      segah: [K, K, K, A, K, A],
      huseyni: [K, K, K, K, K, A],
      acem: [K, K, K, K, A, A],
      evic: [K, K, K, A, K, A],
      kurdi: [K, K, K, K, A, A],
      'dik-kurdi': [K, K, K, K, A, A],
      'nim-hicaz': [K, A, A, A, K, A],
      gerdaniye: [K, K, A, A, K, A],
      muhayyer: [A, K, A, A, K, A],
    }
    for (const [id, front] of Object.entries(want)) {
      const p = NEY_PERDELER.find((x) => x.id === id)!
      expect(p.fingering, id).toEqual({ thumb: 'kapali', front })
      expect(p.verified, id).toBe(true)
    }
  })

  it('yeni perdelerin her biri tek https neyzenim kaynağına dayanır', () => {
    const src = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p.source]))
    expect(src.segah).toBe('https://www.neyzenim.com/neydersleri_2.html')
    expect(src.kurdi).toBe('https://www.neyzenim.com/neydersleri_5.html')
    expect(src['nim-hicaz']).toBe('https://www.neyzenim.com/neydersleri_5.html')
    expect(src['dik-kurdi']).toBe('https://www.neyzenim.com/neydersleri_10.html')
    for (const id of ['huseyni', 'acem', 'evic', 'gerdaniye', 'muhayyer']) {
      expect(src[id], id).toBe('https://www.neyzenim.com/neydersleri_6.html')
    }
  })

  it('kademe: ilk beşi ve ikinci kademe perdeleri 2, Hüseynî/Acem/Eviç/Gerdâniye/Muhayyer 3', () => {
    const kademe = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p.kademe]))
    for (const id of ['neva', 'cargah', 'buselik', 'dugah', 'rast', 'segah', 'kurdi', 'dik-kurdi', 'nim-hicaz']) {
      expect(kademe[id], id).toBe(2)
    }
    for (const id of ['huseyni', 'acem', 'evic', 'gerdaniye', 'muhayyer']) expect(kademe[id], id).toBe(3)
  })

  it('3. kademe tarifi "Daha sert üfle: " ile ve parmak ailesiyle başlar', () => {
    const family: Record<string, string> = {
      huseyni: 'Dügâh', acem: 'Kürdî', evic: 'Segâh', gerdaniye: 'Çârgâh', muhayyer: 'Nevâ',
    }
    for (const [id, name] of Object.entries(family)) {
      const p = NEY_PERDELER.find((x) => x.id === id)!
      expect(p.tip.startsWith('Daha sert üfle: '), id).toBe(true)
      expect(p.tip, id).toContain(`${name} parmağı`)
    }
    for (const p of NEY_PERDELER.filter((x) => x.kademe === 2)) expect(p.tip.startsWith('Daha sert üfle'), p.id).toBe(false)
  })

  it('ortak şemalı Kürdî ve Dik Kürdî tarifinde birbirine gönderme notu bulunur', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId.kurdi.tip).toContain(
      'Parmak konumu Dik Kürdî ile aynı; aradaki koma farkını dudak ve baş açısıyla verirsin.',
    )
    expect(byId['dik-kurdi'].tip).toContain(
      'Parmak konumu Kürdî ile aynı; aradaki koma farkını dudak ve baş açısıyla verirsin.',
    )
    expect(byId.kurdi.fingering).toEqual(byId['dik-kurdi'].fingering)
  })

  it('Nim Hicaz tarifi kapalı başparmağı anar', () => {
    expect(NEY_PERDELER.find((p) => p.id === 'nim-hicaz')!.tip.toLowerCase()).toContain('başparmak arkada kapalı')
  })

  it('listedeki her perdenin şeması gösterilebilir (doğrulanmış)', () => {
    for (const p of NEY_PERDELER) expect(visibleFingering(p), p.id).not.toBeNull()
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
