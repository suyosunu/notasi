import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { cardToEvent, topicOfCard } from './cards'

describe('cardToEvent', () => {
  it('note:B4 → Si4 dörtlük', () => {
    expect(cardToEvent('note:B4')).toEqual({
      kind: 'note',
      pitch: { step: 'B', octave: 4, acc: 0 },
      dur: 'quarter',
    })
  })
  it('note:D5 → Re5 dörtlük', () => {
    expect(cardToEvent('note:D5')).toMatchObject({ pitch: { step: 'D', octave: 5 }, dur: 'quarter' })
  })
  it('rest:eighth → sekizlik sus', () => {
    expect(cardToEvent('rest:eighth')).toEqual({ kind: 'rest', dur: 'eighth' })
  })
  it('dur:half → Si4 ikilik nota', () => {
    expect(cardToEvent('dur:half')).toEqual({
      kind: 'note',
      pitch: { step: 'B', octave: 4, acc: 0 },
      dur: 'half',
    })
  })
  it('noktalı süreler', () => {
    expect(cardToEvent('dur:quarter.dotted')).toMatchObject({ kind: 'note', dur: 'quarter', dotted: true })
    expect(cardToEvent('rest:quarter.dotted')).toEqual({ kind: 'rest', dur: 'quarter', dotted: true })
  })
  it.each(['', 'foo', 'note:H4', 'note:C', 'dur:long', 'rest:half.double', 'dur:half.dotted.x', 'x:C4'])(
    'geçersiz kimlik %j hata verir',
    (id) => {
      expect(() => cardToEvent(id)).toThrow(Error)
    },
  )
  it('müfredattaki her kart geçerlidir', () => {
    for (const t of NOTA_TOPICS) for (const c of t.cards) expect(() => cardToEvent(c)).not.toThrow()
  })
})

describe('topicOfCard', () => {
  it('kartın konusunu bulur', () => {
    expect(topicOfCard('note:A5').id).toBe('nota-5')
    expect(topicOfCard('rest:half').id).toBe('sure-3')
  })
  it('bilinmeyen kart hata verir', () => {
    expect(() => topicOfCard('note:C6')).toThrow(Error)
  })
  it('kartlar tekil, konu sırası doğru', () => {
    const all = NOTA_TOPICS.flatMap((t) => t.cards)
    expect(new Set(all).size).toBe(all.length)
    expect(NOTA_TOPICS.map((t) => t.id)).toEqual([
      'nota-1', 'sure-1', 'nota-2', 'sure-2', 'nota-3', 'sure-3', 'nota-4', 'nota-5',
    ])
  })
})
