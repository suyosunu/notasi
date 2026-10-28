import { describe, expect, it } from 'vitest'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import {
  VURMA_GECME_ORANI,
  VURMA_OLCU,
  VURMA_TOLERANS_MS,
  beklenenVuruslar,
  degerlendir,
  vurusSirasi,
} from './usul-vurma'
import type { BeklenenVurus, Dokunus } from './usul-vurma'

const usul = (id: string): Usul => USULLER.find((u) => u.id === id)!
const NIM = beklenenVuruslar(usul('nim-sofyan'), 60)
/** Beklenen vuruşların aynısı (sapma kadar kaydırılmış) dokunuş olarak. */
const tam = (b: BeklenenVurus[], sapma = 0): Dokunus[] => b.map((x) => ({ t: x.t + sapma, tur: x.tur }))

describe('usul vurma sabitleri', () => {
  it('4 ölçü, ±150 ms, %80', () => {
    expect(VURMA_OLCU).toBe(4)
    expect(VURMA_TOLERANS_MS).toBe(150)
    expect(VURMA_GECME_ORANI).toBe(0.8)
  })
})

describe('beklenenVuruslar', () => {
  it('Nim Sofyan ♩=60, 4 ölçü → 8 beklenen vuruş, t = 0,1000,…,7000, türler düm,tek sırayla', () => {
    expect(NIM.map((b) => b.t)).toEqual([0, 1000, 2000, 3000, 4000, 5000, 6000, 7000])
    expect(NIM.map((b) => b.tur)).toEqual(['düm', 'tek', 'düm', 'tek', 'düm', 'tek', 'düm', 'tek'])
  })

  it('Sofyan: düm 0, te 2000, ke 3000 (tek türü)', () => {
    const b = beklenenVuruslar(usul('sofyan'), 60, 1)
    expect(b).toEqual([
      { t: 0, tur: 'düm' },
      { t: 2000, tur: 'tek' },
      { t: 3000, tur: 'tek' },
    ])
  })

  it('hız ölçüyü kısaltır: Semâî ♩=90, 2 ölçü', () => {
    const b = beklenenVuruslar(usul('semai'), 90, 2)
    expect(b).toHaveLength(6)
    expect(b[3]!.t).toBeCloseTo(2000, 6)
    expect(b[5]!.t).toBeCloseTo(3333.333333, 3)
  })

  it('vuruşsuz usul (Dolap) → boş', () => {
    expect(beklenenVuruslar(usul('dolap'), 60)).toEqual([])
  })
})

describe('degerlendir', () => {
  it('tam isabet → gecti', () => {
    const s = degerlendir(NIM, tam(NIM))
    expect(s).toEqual({ toplam: 8, isabet: 8, yanlisTur: 0, kacan: 0, fazla: 0, ortalamaSapma: 0, gecti: true })
  })

  it('hiç dokunuş → kacan = toplam, ortalamaSapma null, gecti false', () => {
    const s = degerlendir(NIM, [])
    expect(s).toEqual({ toplam: 8, isabet: 0, yanlisTur: 0, kacan: 8, fazla: 0, ortalamaSapma: null, gecti: false })
  })

  it('beklenen vuruş yoksa çökmez, geçmez', () => {
    const s = degerlendir([], [{ t: 0, tur: 'düm' }])
    expect(s).toEqual({ toplam: 0, isabet: 0, yanlisTur: 0, kacan: 0, fazla: 1, ortalamaSapma: null, gecti: false })
  })

  it('±150 sınırı: 150 ms isabet, 151 ms fazla+kaçan', () => {
    const b: BeklenenVurus[] = [{ t: 1000, tur: 'düm' }]
    expect(degerlendir(b, [{ t: 1150, tur: 'düm' }]).isabet).toBe(1)
    expect(degerlendir(b, [{ t: 850, tur: 'düm' }]).isabet).toBe(1)
    const s = degerlendir(b, [{ t: 1151, tur: 'düm' }])
    expect(s.isabet).toBe(0)
    expect(s.fazla).toBe(1)
    expect(s.kacan).toBe(1)
  })

  it('aynı beklenen vuruşa iki dokunuş → biri isabet, biri fazla', () => {
    const b: BeklenenVurus[] = [{ t: 0, tur: 'düm' }]
    const s = degerlendir(b, [
      { t: 20, tur: 'düm' },
      { t: 60, tur: 'düm' },
    ])
    expect(s).toMatchObject({ isabet: 1, fazla: 1, kacan: 0, ortalamaSapma: 20 })
  })

  it('dokunuşlar zaman sırasıyla gezilir (sırasız verilse de): ilk dokunuş vuruşu alır', () => {
    const b: BeklenenVurus[] = [{ t: 100, tur: 'düm' }]
    const s = degerlendir(b, [
      { t: 180, tur: 'düm' },
      { t: 0, tur: 'düm' },
    ])
    expect(s).toMatchObject({ isabet: 1, fazla: 1, kacan: 0, ortalamaSapma: -100 })
  })

  it('her dokunuş tolerans içindeki en yakın eşlenmemiş vuruşla eşlenir', () => {
    const b: BeklenenVurus[] = [
      { t: 0, tur: 'düm' },
      { t: 200, tur: 'tek' },
    ]
    // 110: 0'a 110, 200'e 90 uzak → 200; 40 önce gezilir → 0.
    const s = degerlendir(b, [
      { t: 110, tur: 'tek' },
      { t: 40, tur: 'düm' },
    ])
    expect(s).toMatchObject({ isabet: 2, fazla: 0, kacan: 0 })
    expect(s.ortalamaSapma).toBeCloseTo((40 - 90) / 2, 6)
  })

  it('yanlış düğme → yanlisTur', () => {
    const d = tam(NIM)
    d[1] = { t: 1000, tur: 'düm' }
    const s = degerlendir(NIM, d)
    expect(s).toMatchObject({ isabet: 7, yanlisTur: 1, kacan: 0, fazla: 0 })
  })

  it('ortalama sapma işaretli (+ geç)', () => {
    expect(degerlendir(NIM, tam(NIM, 80)).ortalamaSapma).toBeCloseTo(80, 6)
    expect(degerlendir(NIM, tam(NIM, -70)).ortalamaSapma).toBeCloseTo(-70, 6)
    // Yanlış tür ortalamaya girmez.
    const d = tam(NIM, 50)
    d[0] = { t: -140, tur: 'tek' }
    expect(degerlendir(NIM, d).ortalamaSapma).toBeCloseTo(50, 6)
  })

  it('%80 sınırı: 8 vuruşta 7 isabet geçer, 6 geçmez', () => {
    expect(degerlendir(NIM, tam(NIM).slice(0, 7)).gecti).toBe(true)
    const alti = degerlendir(NIM, tam(NIM).slice(0, 6))
    expect(alti.gecti).toBe(false)
    expect(alti.kacan).toBe(2)
    // 5 vuruşta 4 = tam %80 geçer.
    const bes = NIM.slice(0, 5)
    expect(degerlendir(bes, tam(bes).slice(0, 4)).gecti).toBe(true)
  })

  it('çok hızlı rastgele dokunuşlar çökmez; her dokunuş en çok bir kez sayılır', () => {
    const d: Dokunus[] = Array.from({ length: 400 }, (_, i) => ({ t: i * 20 - 500, tur: i % 3 ? 'tek' : 'düm' }))
    const s = degerlendir(NIM, d)
    expect(s.isabet + s.yanlisTur + s.kacan).toBe(8)
    expect(s.isabet + s.yanlisTur + s.fazla).toBe(400)
  })
})

describe('vurusSirasi', () => {
  it('Sofyan ♩=60: o anki vuruşun sırası; ölçüler boyunca döner, dışında null', () => {
    const u = usul('sofyan')
    expect(vurusSirasi(u, 60, -1)).toBeNull()
    expect(vurusSirasi(u, 60, 0)).toBe(0)
    expect(vurusSirasi(u, 60, 1999)).toBe(0)
    expect(vurusSirasi(u, 60, 2000)).toBe(1)
    expect(vurusSirasi(u, 60, 3500)).toBe(2)
    expect(vurusSirasi(u, 60, 4100)).toBe(0)
    expect(vurusSirasi(u, 60, 15_999)).toBe(2)
    expect(vurusSirasi(u, 60, 16_000)).toBeNull()
    expect(vurusSirasi(usul('dolap'), 60, 0)).toBeNull()
  })
})
