import { describe, expect, it } from 'vitest'
import { beats, durationName } from './notation'
import type { MusicEvent, NoteEvent } from './notation'

const pitch = { step: 'G', octave: 4, acc: 0 } as const
const note = (dur: NoteEvent['dur'], dotted?: boolean): MusicEvent =>
  dotted === undefined ? { kind: 'note', pitch, dur } : { kind: 'note', pitch, dur, dotted }
const rest = (dur: NoteEvent['dur'], dotted?: boolean): MusicEvent =>
  dotted === undefined ? { kind: 'rest', dur } : { kind: 'rest', dur, dotted }

describe('beats', () => {
  it('temel süreler', () => {
    expect(beats(note('whole'))).toBe(4)
    expect(beats(note('half'))).toBe(2)
    expect(beats(note('quarter'))).toBe(1)
    expect(beats(note('eighth'))).toBe(0.5)
    expect(beats(note('sixteenth'))).toBe(0.25)
  })
  it('noktalı onaltılık 0.375', () => {
    expect(beats(note('sixteenth', true))).toBe(0.375)
  })
  it('noktalı ikilik 3 vuruş', () => {
    expect(beats(note('half', true))).toBe(3)
  })
  it('noktalı dörtlük sus 1.5, nokta false ise çarpan yok', () => {
    expect(beats(rest('quarter', true))).toBe(1.5)
    expect(beats(rest('quarter', false))).toBe(1)
  })
})

describe('durationName', () => {
  it('nota adları', () => {
    expect(durationName(note('whole'))).toBe('Birlik')
    expect(durationName(note('half'))).toBe('İkilik')
    expect(durationName(note('quarter'))).toBe('Dörtlük')
    expect(durationName(note('eighth'))).toBe('Sekizlik')
    expect(durationName(note('sixteenth'))).toBe('Onaltılık')
  })
  it('onaltılık sus ve noktalı onaltılık', () => {
    expect(durationName(rest('sixteenth'))).toBe('Onaltılık sus')
    expect(durationName(note('sixteenth', true))).toBe('Noktalı onaltılık')
  })
  it('sus sona " sus" ekler', () => {
    expect(durationName({ kind: 'rest', dur: 'quarter' })).toBe('Dörtlük sus')
  })
  it('noktalı ikilik', () => {
    expect(durationName({ kind: 'note', dur: 'half', dotted: true, pitch })).toBe('Noktalı ikilik')
  })
  it('noktalı sus küçük harfle', () => {
    expect(durationName(rest('quarter', true))).toBe('Noktalı dörtlük sus')
    expect(durationName(note('quarter', true))).toBe('Noktalı dörtlük')
  })
  it('noktalı İkilik Türkçe küçük harfe çevrilir', () => {
    expect(durationName(rest('half', true))).toBe('Noktalı ikilik sus')
  })
})
