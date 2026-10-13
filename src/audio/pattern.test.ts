import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_TUNING } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import { buildPatternCode, SOUND_CHAIN, toToneEvents } from './pattern'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))

describe('buildPatternCode', () => {
  const events = [
    { hz: 440, beats: 2 },
    { hz: null, beats: 1 },
    { hz: 494.957, beats: 1 },
  ]

  it('freq mini-notasyonu, ses zinciri ve cpm üretir', () => {
    const { code, durationMs } = buildPatternCode(events, 60)
    expect(code.startsWith('freq("440.00@2 ~@1 494.96@1")')).toBe(true)
    expect(code).toContain(SOUND_CHAIN)
    expect(code).toContain('.cpm(15)')
    expect(durationMs).toBe(4000)
  })

  it('tempoya göre süreyi ve cpm değerini ölçekler', () => {
    const { code, durationMs } = buildPatternCode(events, 120)
    expect(code).toContain('.cpm(30)')
    expect(durationMs).toBe(2000)
  })
})

describe('toToneEvents', () => {
  it('Kız ahenkte La4 dörtlük → ≈494.96 Hz, 1 vuruş', () => {
    const written: MusicEvent[] = [
      { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' },
    ]
    const tones = toToneEvents(written, DEFAULT_TUNING)
    expect(tones).toHaveLength(1)
    expect(tones[0]?.hz).toBeCloseTo(494.96, 2)
    expect(tones[0]?.beats).toBe(1)
  })

  it('sus hz: null olur, noktalı süre vuruşa yansır', () => {
    const written: MusicEvent[] = [{ kind: 'rest', dur: 'half', dotted: true }]
    expect(toToneEvents(written, DEFAULT_TUNING)).toEqual([{ hz: null, beats: 3 }])
  })
})

describe('buildPatternCode: tek seferlik çalma (gerçek Strudel çekirdeği)', () => {
  it('ilk döngüde sesler var, ikinci döngüde ve sonrasında hiç ses yok', async () => {
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { code } = buildPatternCode(
      [
        { hz: 440, beats: 2 },
        { hz: null, beats: 1 },
        { hz: 494.957, beats: 1 },
      ],
      60,
    )
    const { pattern } = await evaluate(code, transpiler)
    const values = (from: number, to: number) =>
      pattern
        .queryArc(from, to)
        .filter((h) => h.hasOnset())
        .map((h) => h.value.freq)
    // Çekirdekteki .cpm(15) = fast(15/60): bir döngü 4 sorgu-döngüsü sürer (REPL'de cps'e bölünür)
    expect(values(0, 4)).toEqual([440, 494.96])
    expect(values(4, 8)).toEqual([])
    expect(values(8, 40)).toEqual([])
  })
})
