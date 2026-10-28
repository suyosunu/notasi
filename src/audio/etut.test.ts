import { describe, expect, it, vi } from 'vitest'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { beats } from '../music/notation'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))
vi.mock('./player', () => ({ unlockAudio: vi.fn(), playLoop: vi.fn(), stopAudio: vi.fn() }))

import { USULLER } from '../content/usuller'
import { buildEtutCode } from './etut'
import { buildUsulBody } from './usul'
import { melodyChain, ONE_SHOT } from './pattern'
import { SHAKUHACHI_SOUND } from './shakuhachi'

const tekNeva = ETUTLER.find((e) => e.id === 'tek-neva')!
const iki = ETUTLER.find((e) => e.id === 'iki-neva-cargah')!
const toplam = (olcu: typeof tekNeva.olcu) => olcu.flat().reduce((t, e) => t + beats(e), 0)
const TIK = [1200, 800]
const NEVA_YAZIM = NEY_PERDELER.find((p) => p.id === 'neva')!.written

interface Hit {
  at: number
  s?: string
  freq?: number
}

/** Gerçek Strudel çekirdeğiyle: bpm 60'ta bir vuruş 1 saniyedir; `saniye` boyunca başlayan sesler. */
async function haps(code: string, from: number, to: number): Promise<Hit[]> {
  const { evalScope } = await import('@strudel/core')
  const { evaluate, transpiler } = await import('@strudel/transpiler')
  await evalScope(import('@strudel/core'), import('@strudel/mini'))
  const { pattern } = await evaluate(code, transpiler)
  return pattern
    .queryArc(from, to)
    .filter((h) => h.hasOnset())
    .map((h) => ({ at: Math.round(Number(h.whole.begin) * 1e6) / 1e6, ...h.value }) as Hit)
    .sort((a, b) => a.at - b.at)
}
const clicks = (hs: Hit[]) => hs.filter((h) => h.freq !== undefined && TIK.includes(h.freq))
const melody = (hs: Hit[]) => hs.filter((h) => h.freq === undefined || !TIK.includes(h.freq))

describe('buildEtutCode', () => {
  const opts = { melodi: true, metronom: true, voice: 'mevcut' } as const

  it('durationMs giriş ölçüsünü içerir: (4 + toplam vuruş) · 60000 / bpm', () => {
    const total = toplam(tekNeva.olcu)
    expect(total).toBe(20)
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts).durationMs).toBe(24000)
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 40, opts).durationMs).toBe(36000)
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false }).durationMs).toBe(24000)
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, metronom: false }).durationMs).toBe(24000)
  })

  it('tek seferlik maske ve cpm = bpm / (giriş + toplam vuruş)', () => {
    const { code } = buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts)
    expect(code.endsWith(`${ONE_SHOT}.cpm(2.5)`)).toBe(true)
    expect(buildEtutCode(iki.olcu, DEFAULT_TUNING, 90, opts).code.endsWith(`${ONE_SHOT}.cpm(${90 / 36})`)).toBe(true)
  })

  it('melodi:false: melodi katmanı yoktur, yalnız tık (1200/800 Hz sinüs) çalar', async () => {
    const { code } = buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false })
    expect(code).not.toContain(SHAKUHACHI_SOUND)
    expect(code).not.toContain(melodyChain('mevcut'))
    for (const [, deger] of code.matchAll(/freq\("([^"]*)"\)/g)) {
      expect(deger!.split(' ').every((t) => TIK.includes(Number(t.split('@')[0])))).toBe(true)
    }
    const hs = await haps(code, 0, 24)
    expect(melody(hs)).toHaveLength(0)
    // Giriş + 5 ölçü = 6 ölçü × 4 tık; her ölçünün ilki vurgulu (1200).
    expect(hs.map((h) => h.at)).toEqual(Array.from({ length: 24 }, (_, i) => i))
    expect(hs.map((h) => h.freq)).toEqual(Array.from({ length: 24 }, (_, i) => (i % 4 === 0 ? 1200 : 800)))
  })

  it('metronom:false: tık yalnız giriş ölçüsünde, melodi giriş ölçüsünden sonra başlar', async () => {
    const { code } = buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, metronom: false })
    const hs = await haps(code, 0, 24)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
    expect(clicks(hs).map((h) => h.freq)).toEqual([1200, 800, 800, 800])
    const m = melody(hs)
    expect(m[0]!.at).toBe(4)
    expect(m[0]!.freq).toBeCloseTo(soundingHz(NEVA_YAZIM, DEFAULT_TUNING), 1)
    // tek-neva: ölçü 1 birlik, ölçü 2 ikilik + sus, ölçü 3: üç dörtlük + sus, ölçü 4: iki ikilik, ölçü 5 birlik.
    expect(m.map((h) => h.at)).toEqual([4, 8, 12, 13, 14, 16, 18, 20])
  })

  it('metronom ve melodi açıkken tık sonuna dek sürer, melodi giriş sayımından sonra başlar', async () => {
    const { code, durationMs } = buildEtutCode(iki.olcu, DEFAULT_TUNING, 60, opts)
    const total = toplam(iki.olcu)
    const hs = await haps(code, 0, durationMs / 1000)
    expect(clicks(hs)).toHaveLength((4 + total))
    expect(clicks(hs).map((h) => h.at)).toEqual(Array.from({ length: 4 + total }, (_, i) => i))
    expect(melody(hs)[0]!.at).toBe(4)
    expect(melody(hs).every((h) => h.at >= 4)).toBe(true)
  })

  it('tek seferliktir: ikinci döngüde ses çalmaz', async () => {
    const { code, durationMs } = buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts)
    const T = durationMs / 1000
    expect(await haps(code, T, 3 * T)).toHaveLength(0)
  })

  it('melodi ney sesiyle çalar; tempo tıkın süresini belirler', () => {
    const { code } = buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, voice: 'shakuhachi' })
    expect(code).toContain(melodyChain('shakuhachi'))
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts).code).toContain('.decay(0.3)')
    expect(buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 40, opts).code).toContain('.decay(0.45)')
  })

  describe('usul verilince', () => {
    const semai = USULLER.find((u) => u.id === 'semai')!
    const sofyan = USULLER.find((u) => u.id === 'sofyan')!
    const usulSemai = ETUTLER.find((e) => e.id === 'usul-semai')!
    const usulSofyan = ETUTLER.find((e) => e.id === 'usul-sofyan')!
    const usulHits = (hs: Hit[]) => hs.filter((h) => typeof h.s === 'string' && h.s.startsWith('usul_'))

    it('durationMs = (zaman + toplam) × 60000 / bpm; cpm = bpm / (zaman + toplam)', () => {
      const total = toplam(usulSemai.olcu)
      expect(total).toBe(24)
      const r = buildEtutCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, usul: semai })
      expect(r.durationMs).toBe(27000)
      expect(r.code.endsWith(`${ONE_SHOT}.cpm(${60 / 27})`)).toBe(true)
      expect(buildEtutCode(usulSemai.olcu, DEFAULT_TUNING, 40, { ...opts, metronom: false, usul: semai }).durationMs).toBe(
        (27 * 60000) / 40,
      )
    })

    it('metronom kapalıyken: giriş sayımı usul.zaman tık, usul sesi yok, melodi sayımdan sonra', async () => {
      const { code, durationMs } = buildEtutCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, metronom: false, usul: semai })
      const hs = await haps(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2])
      expect(clicks(hs).map((h) => h.freq)).toEqual([1200, 800, 800])
      expect(usulHits(hs)).toHaveLength(0)
      expect(code).not.toContain('usul_')
      const m = melody(hs).filter((h) => h.s === undefined || !h.s.startsWith('usul_'))
      expect(m[0]!.at).toBe(3)
    })

    it('metronom açıkken: giriş sayımı tık, sonra döngü boyunca usul sesi (her ölçü düm tek tek); başka tık yok', async () => {
      const { code, durationMs } = buildEtutCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, usul: semai })
      expect(code).toContain(buildUsulBody(semai, 60))
      const hs = await haps(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2])
      const u = usulHits(hs)
      // 8 ölçü × 3 vuruş; vuruşlar giriş sayımından sonra başlar.
      expect(u.map((h) => h.at)).toEqual(Array.from({ length: 24 }, (_, i) => 3 + i))
      expect(u.map((h) => h.s)).toEqual(
        Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? 'usul_tahta_dum' : 'usul_tahta_tek')),
      )
      expect(await haps(code, durationMs / 1000, (3 * durationMs) / 1000)).toHaveLength(0)
    })

    it('Sofyan: giriş 4 tık; düm 2 zaman sürer (her ölçüde düm, te, ke)', async () => {
      const { code, durationMs } = buildEtutCode(usulSofyan.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false, usul: sofyan })
      expect(durationMs).toBe((4 + 32) * 1000)
      const hs = await haps(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
      const u = usulHits(hs)
      expect(u.map((h) => h.at)).toEqual(Array.from({ length: 8 }, (_, i) => [4 + 4 * i, 6 + 4 * i, 7 + 4 * i]).flat())
      expect(melody(hs).filter((h) => h.s === undefined || !h.s.startsWith('usul_'))).toHaveLength(0)
    })
  })

  it('ikisi de kapalıysa ya da tempo geçersizse RangeError', () => {
    expect(() => buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false, metronom: false })).toThrow(RangeError)
    expect(() => buildEtutCode(tekNeva.olcu, DEFAULT_TUNING, 0, opts)).toThrow(RangeError)
    expect(() => buildEtutCode([], DEFAULT_TUNING, 60, opts)).toThrow(RangeError)
  })
})
