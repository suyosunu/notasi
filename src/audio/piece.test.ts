import { describe, expect, it, vi } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import type { Parca } from '../content/parcalar'
import { DEFAULT_TUNING } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import { SOUND_CHAIN, toToneEvents } from './pattern'
import { buildPieceCode, measureBeats } from './piece'
import { USULLER } from '../content/usuller'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))

const parca = (id: string): Parca => PARCALAR.find((p) => p.id === id)!
const A4: MusicEvent = { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' }

/** Sofyan, ilk ölçüsü tek dörtlük (anacrusis), ardından iki tam ölçü: toplam 9 vuruş. */
const anacrusis: Parca = {
  id: 'deneme',
  title: 'Deneme',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Anonim',
  source: '',
  olcu: [[A4], [A4, A4, A4, A4], [A4, A4, A4, A4]],
}

interface Hit {
  at: number
  s?: string
  freq?: number
  gain?: number
}

/**
 * bpm = 60: .cpm(60 / toplamVuruş) = fast(1 / toplamVuruş) ⇒ bir sorgu-döngüsü bir dörtlük vuruştur.
 * Dönen `at` değerleri dörtlük vuruş cinsindendir.
 */
async function hits(code: string, from: number, to: number): Promise<Hit[]> {
  const { evalScope } = await import('@strudel/core')
  const { evaluate, transpiler } = await import('@strudel/transpiler')
  await evalScope(import('@strudel/core'), import('@strudel/mini'))
  const { pattern } = await evaluate(code, transpiler)
  return pattern
    .queryArc(from, to)
    .filter((h) => h.hasOnset())
    .map((h) => ({ at: Math.round(Number(h.whole.begin) * 1e6) / 1e6, ...h.value }))
    .sort((a, b) => a.at - b.at)
}

const totalBeats = (p: Parca) => toToneEvents(p.olcu.flat(), DEFAULT_TUNING).reduce((s, e) => s + e.beats, 0)

describe('measureBeats', () => {
  const usul = (id: string) => USULLER.find((u) => u.id === id)!
  it('ölçü süresi dörtlük cinsindendir (Sofyan 4/4 → 4, Dolap 12/8 → 6)', () => {
    expect(measureBeats(usul('sofyan'))).toBe(4)
    expect(measureBeats(usul('dolap'))).toBe(6)
  })
})

describe('buildPieceCode', () => {
  it('usulsüz: tüm parça tek freq döngüsü, ses zinciri, cpm = bpm / toplam vuruş; süre toplam vuruştan', () => {
    const p = parca('hak-teala')
    const { code, durationMs } = buildPieceCode(p, DEFAULT_TUNING, 60, false)
    expect(totalBeats(p)).toBe(124)
    expect(code.startsWith('freq("')).toBe(true)
    expect(code).toContain(SOUND_CHAIN)
    expect(code).toContain(`.cpm(${60 / 124})`)
    expect(code).not.toContain('white')
    expect(durationMs).toBe(124000)
    expect(buildPieceCode(p, DEFAULT_TUNING, 80, false).durationMs).toBe((124 * 60000) / 80)
  })

  it('melodi adım sayısı bağlar birleştirilmiş ToneEvent sayısına eşittir', () => {
    for (const p of PARCALAR) {
      const { code } = buildPieceCode(p, DEFAULT_TUNING, 60, true)
      const steps = /freq\("([^"]*)"\)/.exec(code)![1]!.split(' ')
      expect(steps).toHaveLength(toToneEvents(p.olcu.flat(), DEFAULT_TUNING).length)
    }
  })

  it('usul eşliği açıkken kod usul desenini (stack, düm ve gürültü) içerir', () => {
    const { code } = buildPieceCode(parca('hak-teala'), DEFAULT_TUNING, 60, true)
    expect(code.startsWith('stack(')).toBe(true)
    expect(code).toContain('freq("70@2 ~@1 ~@1")')
    expect(code).toContain('white')
    expect(code).toContain('.fast(31)')
  })

  it('geçersiz tempo ya da bilinmeyen usul RangeError fırlatır', () => {
    expect(() => buildPieceCode(parca('hak-teala'), DEFAULT_TUNING, 0, true)).toThrow(RangeError)
    expect(() => buildPieceCode({ ...anacrusis, usul: 'yok' }, DEFAULT_TUNING, 60, true)).toThrow(RangeError)
  })
})

describe('buildPieceCode: gerçek Strudel çekirdeğiyle', () => {
  it('Hak Teâlâ: ilk ölçünün melodi başlangıçları ve frekansları', async () => {
    const p = parca('hak-teala')
    const { code } = buildPieceCode(p, DEFAULT_TUNING, 60, true)
    const melody = (await hits(code, 0, 4)).filter((h) => h.s === 'triangle')
    const first = toToneEvents(p.olcu[0]!, DEFAULT_TUNING)
    const expected: [number, number][] = []
    let t = 0
    for (const e of first) {
      if (e.hz !== null) expected.push([t, Number(e.hz.toFixed(2))])
      t += e.beats
    }
    expect(melody.map((h) => [h.at, h.freq])).toEqual(expected)
  })

  it('Hak Teâlâ (Sofyan): her ölçü başında düm, 3. ve 4. vuruşta te-ke; parça bitince ses yok', async () => {
    const p = parca('hak-teala')
    const { code } = buildPieceCode(p, DEFAULT_TUNING, 60, true)
    const hs = await hits(code, 0, 124)
    const dum = hs.filter((h) => h.s === 'sine').map((h) => h.at)
    expect(dum).toEqual(Array.from({ length: 31 }, (_, i) => i * 4))
    const noise = hs.filter((h) => h.s === 'white').map((h) => h.at)
    expect(noise).toEqual(Array.from({ length: 31 }, (_, i) => [i * 4 + 2, i * 4 + 3]).flat())
    expect(await hits(code, 124, 600)).toEqual([])
  })

  it('usul eşliği kapalıyken yalnızca melodi çalar', async () => {
    const { code } = buildPieceCode(parca('hak-teala'), DEFAULT_TUNING, 60, false)
    const hs = await hits(code, 0, 124)
    expect(hs.length).toBeGreaterThan(0)
    expect(hs.every((h) => h.s === 'triangle')).toBe(true)
  })

  it('Dolap (12/8, vuruş yok): metronom, ölçü = 6 dörtlük, sekizlik başına bir tık, ilki vurgulu', async () => {
    const p = parca('benim-adim-dertli-dolap')
    expect(totalBeats(p)).toBe(48)
    const { code } = buildPieceCode(p, DEFAULT_TUNING, 60, true)
    expect(code).not.toContain('white')
    const clicks = (await hits(code, 0, 48)).filter((h) => h.s === 'sine')
    expect(clicks).toHaveLength(8 * 12)
    expect(clicks.map((h) => h.at)).toEqual(Array.from({ length: 96 }, (_, i) => i / 2))
    expect(clicks.filter((h) => h.freq === 1200).map((h) => h.at)).toEqual([0, 6, 12, 18, 24, 30, 36, 42])
    expect(await hits(code, 48, 300)).toEqual([])
  })

  it('anacrusis: usul ilk tam ölçüde başlar, ilk ölçüde usul sesi yok', async () => {
    const { code, durationMs } = buildPieceCode(anacrusis, DEFAULT_TUNING, 60, true)
    expect(durationMs).toBe(9000)
    const hs = await hits(code, 0, 9)
    expect(hs.filter((h) => h.s === 'triangle').map((h) => h.at)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(hs.filter((h) => h.s === 'sine').map((h) => h.at)).toEqual([1, 5])
    expect(hs.filter((h) => h.s === 'white').map((h) => h.at)).toEqual([3, 4, 7, 8])
    expect(await hits(code, 9, 100)).toEqual([])
  })

  it('tempo iki katına çıkınca her şey yarı sürede çalar', async () => {
    const { code } = buildPieceCode(anacrusis, DEFAULT_TUNING, 120, true)
    const hs = await hits(code, 0, 4.5)
    expect(hs.filter((h) => h.s === 'sine').map((h) => h.at)).toEqual([0.5, 2.5])
    expect(await hits(code, 4.5, 50)).toEqual([])
  })
})
