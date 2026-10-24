import { describe, expect, it } from 'vitest'
import {
  BASPARE_DENEME,
  BASPARE_KARARLI_MS,
  BASPARE_SESSIZLIK_MS,
  BASPARE_TOLERANS,
  BASPARE_ZAMAN_ASIMI_MS,
  baspareSonuc,
  baspareSonucMetni,
  initialBaspare,
  stepBaspare,
} from './baspare'
import type { BaspareState } from './baspare'

const ADIM = 50

/** `from`–`to` (dahil) arası 50 ms arayla aynı sent değerini besler (null = sessizlik). */
function feed(s: BaspareState, from: number, to: number, cents: number | null): BaspareState {
  let st = s
  for (let t = from; t <= to; t += ADIM) st = stepBaspare(st, { t, cents })
  return st
}

/** Sessizlik → t0'da tolerans dışı ses → `bulMs` sonra tolerans içinde kararlı ses: sonuç `bulMs`. */
function birDeneme(s: BaspareState, t0: number, bulMs: number): { s: BaspareState; bitis: number } {
  let st = feed(s, t0 - BASPARE_SESSIZLIK_MS - ADIM, t0 - ADIM, null)
  st = feed(st, t0, t0 + bulMs - ADIM, 120)
  const bitis = t0 + bulMs + BASPARE_KARARLI_MS
  st = feed(st, t0 + bulMs, bitis, 3)
  return { s: st, bitis }
}

describe('stepBaspare', () => {
  it('sessizlik → ses → 300 ms sonra tolerans içinde 400 ms → sonuç 300', () => {
    const { s } = birDeneme(initialBaspare(), 1000, 300)
    expect(s.denemeler).toEqual([300])
  })

  it('başlangıçta faz sessizlik-bekle, sessizlik sürünce hazir, ilk sesle ariyor olur', () => {
    let s = initialBaspare()
    expect(s.faz).toBe('sessizlik-bekle')
    s = feed(s, 0, BASPARE_SESSIZLIK_MS, null)
    expect(s.faz).toBe('hazir')
    s = stepBaspare(s, { t: 1000, cents: 120 })
    expect(s.faz).toBe('ariyor')
    expect(s.denemeler).toEqual([])
  })

  it('sessizlik olmadan başlayan sesten deneme sayılmaz', () => {
    // Kullanıcı Başla'ya basarken zaten üflüyor: 3 sn boyunca tolerans içinde ses.
    let s = feed(initialBaspare(), 0, 3000, 3)
    expect(s.denemeler).toEqual([])
    expect(s.faz).toBe('sessizlik-bekle')
    // Kısa (700 ms'den az) sessizlik de yetmez.
    s = feed(s, 3050, 3050 + BASPARE_SESSIZLIK_MS - 2 * ADIM, null)
    s = feed(s, 3800, 4500, 3)
    expect(s.denemeler).toEqual([])
  })

  it('hiç susmayan kullanıcıda ilk denemeden sonra ikinci deneme başlamaz', () => {
    const { s: bir, bitis } = birDeneme(initialBaspare(), 1000, 300)
    expect(bir.denemeler).toEqual([300])
    // Üflemeye devam ediyor (hatta ses sapıyor, sonra yine tolerans içi): yeni deneme yok.
    let s = feed(bir, bitis + ADIM, bitis + 3000, 3)
    s = feed(s, bitis + 3050, bitis + 4000, 150)
    s = feed(s, bitis + 4050, bitis + 6000, 3)
    expect(s.denemeler).toEqual([300])
    expect(s.faz).toBe('sessizlik-bekle')
  })

  it('sessizlikten sonra ikinci deneme ayrı sayılır', () => {
    const bir = birDeneme(initialBaspare(), 1000, 300)
    const iki = birDeneme(bir.s, bir.bitis + 2000, 100)
    expect(iki.s.denemeler).toEqual([300, 100])
  })

  it('zaman aşımında sonuç null olur (bulunamadı)', () => {
    let s = feed(initialBaspare(), 0, BASPARE_SESSIZLIK_MS, null)
    s = feed(s, 1000, 1000 + BASPARE_ZAMAN_ASIMI_MS, 200)
    expect(s.denemeler).toEqual([])
    s = stepBaspare(s, { t: 1000 + BASPARE_ZAMAN_ASIMI_MS + ADIM, cents: 200 })
    expect(s.denemeler).toEqual([null])
    expect(s.faz).toBe('sessizlik-bekle')
  })

  it('tolerans içindeyken ilk sesle birlikte başlayan kararlı ses sonuç 0 verir', () => {
    const { s } = birDeneme(initialBaspare(), 1000, 0)
    expect(s.denemeler).toEqual([0])
  })

  it('tolerans dışı kısa sapma kararlılığı sıfırlar', () => {
    let s = feed(initialBaspare(), 0, BASPARE_SESSIZLIK_MS, null)
    s = feed(s, 1000, 1200, 120) // t0 = 1000
    s = feed(s, 1250, 1500, 3) // 300 ms tolerans içinde
    s = stepBaspare(s, { t: 1550, cents: BASPARE_TOLERANS + 10 }) // tek örnek sapma
    s = feed(s, 1600, 1950, 3) // kararlılık yeniden 1600'de başladı; 350 ms yetmez
    expect(s.denemeler).toEqual([])
    s = feed(s, 2000, 2000, 3)
    expect(s.denemeler).toEqual([600]) // 1600 - 1000
  })

  it('tolerans sınırı dahildir; sessizlik (null) de kararlılığı sıfırlar', () => {
    let s = feed(initialBaspare(), 0, BASPARE_SESSIZLIK_MS, null)
    s = feed(s, 1000, 1300, BASPARE_TOLERANS)
    s = stepBaspare(s, { t: 1350, cents: null })
    s = feed(s, 1400, 1700, -BASPARE_TOLERANS)
    expect(s.denemeler).toEqual([])
    s = feed(s, 1750, 1800, -BASPARE_TOLERANS)
    expect(s.denemeler).toEqual([400]) // 1400 - 1000
  })

  it('10 denemeden sonra durum donar', () => {
    let s = initialBaspare()
    let t = 1000
    for (let i = 0; i < BASPARE_DENEME; i++) {
      const r = birDeneme(s, t, 200)
      s = r.s
      t = r.bitis + 2000
    }
    expect(s.denemeler).toHaveLength(BASPARE_DENEME)
    const donmus = stepBaspare(s, { t, cents: null })
    expect(donmus).toBe(s)
    expect(feed(s, t, t + 5000, 3)).toBe(s)
  })

  it('girdi durumunu değiştirmez', () => {
    const s0 = initialBaspare()
    const s1 = stepBaspare(s0, { t: 0, cents: null })
    expect(s0).toEqual(initialBaspare())
    expect(s1).not.toBe(s0)
  })
})

describe('baspareSonuc', () => {
  const durum = (denemeler: (number | null)[]): BaspareState => ({ ...initialBaspare(), denemeler })

  it('10 denemenin 8\'i 1000 ms içinde bulunduysa geçer', () => {
    const r = baspareSonuc(durum([100, 200, 300, 400, 500, 600, 700, 1000, 1500, null]))
    expect(r).toMatchObject({ aninda: 8, toplam: 10, gecti: true })
  })

  it('erken bırakılan tur geçmez: 8/8 anında olsa da 10 deneme dolmadıysa gecti false', () => {
    const r = baspareSonuc(durum([100, 200, 300, 400, 500, 600, 700, 800]))
    expect(r).toMatchObject({ aninda: 8, toplam: 8, gecti: false })
  })

  it('7/10 anında geçmez', () => {
    const r = baspareSonuc(durum([100, 200, 300, 400, 500, 600, 700, 1001, 1500, null]))
    expect(r).toMatchObject({ aninda: 7, toplam: 10, gecti: false })
  })

  it('ortanca yalnız bulunan denemelerden hesaplanır (null sayılmaz)', () => {
    expect(baspareSonuc(durum([100, 300, 900, null, null, null])).ortancaMs).toBe(300)
    expect(baspareSonuc(durum([100, 300, null])).ortancaMs).toBe(200)
  })

  it('hiç bulunan yoksa ortanca null, boş durumda geçmez', () => {
    expect(baspareSonuc(durum([null, null])).ortancaMs).toBeNull()
    expect(baspareSonuc(initialBaspare())).toEqual({ aninda: 0, toplam: 0, gecti: false, ortancaMs: null })
  })
})

describe('baspareSonucMetni', () => {
  it('"10 denemenin 9\'unda anında" biçimindedir; ek sayının okunuşuna uyar', () => {
    const m = (aninda: number, toplam: number) => baspareSonucMetni({ aninda, toplam, gecti: false, ortancaMs: null })
    expect(m(9, 10)).toBe("10 denemenin 9'unda anında")
    expect(m(8, 10)).toBe("10 denemenin 8'inde anında")
    expect(m(2, 5)).toBe("5 denemenin 2'sinde anında")
    expect(m(3, 4)).toBe("4 denemenin 3'ünde anında")
    expect(m(6, 7)).toBe("7 denemenin 6'sında anında")
    expect(m(10, 10)).toBe("10 denemenin 10'unda anında")
    expect(m(0, 3)).toBe("3 denemenin 0'ında anında")
  })

  it('hiç deneme yoksa açıklama verir', () => {
    expect(baspareSonucMetni({ aninda: 0, toplam: 0, gecti: false, ortancaMs: null })).toBe('Henüz deneme yapılmadı.')
  })
})
