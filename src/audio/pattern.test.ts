import { describe, expect, it } from 'vitest'
import { DEFAULT_TUNING } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import { buildPatternCode, SOUND_CHAIN, toToneEvents } from './pattern'

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
