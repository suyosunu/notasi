import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { cardToEvent, cardToEvents, topicOfCard } from './cards'

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
    for (const t of NOTA_TOPICS) {
      for (const c of t.cards) if (!c.startsWith('seq:') && !c.startsWith('perde')) expect(() => cardToEvent(c)).not.toThrow()
    }
  })
})

describe('cardToEvents', () => {
  it("seq:D5-C5-B4-A4 → 4 dörtlük nota: Re5, Do5, Si4, La4", () => {
    const events = cardToEvents('seq:D5-C5-B4-A4')
    expect(events).toHaveLength(4)
    expect(events.every((e) => e.kind === 'note' && e.dur === 'quarter')).toBe(true)
    expect(events.map((e) => (e.kind === 'note' ? `${e.pitch.step}${e.pitch.octave}` : '?'))).toEqual([
      'D5', 'C5', 'B4', 'A4',
    ])
    for (const e of events) expect(e).toMatchObject({ pitch: { acc: 0 } })
  })
  it('note:B4 → tek olay', () => {
    expect(cardToEvents('note:B4')).toEqual([cardToEvent('note:B4')])
    expect(cardToEvents('dur:half')).toEqual([cardToEvent('dur:half')])
    expect(cardToEvents('rest:eighth')).toEqual([cardToEvent('rest:eighth')])
  })
  it.each(['seq:', 'seq:H4-A4', 'seq:C5-', 'seq:C5--D5', 'seq:C-D5', 'seq:C5-D'])(
    'hatalı seq kimliği %j hata verir',
    (id) => {
      expect(() => cardToEvents(id)).toThrow(Error)
    },
  )
  it('cardToEvent seq kimliğinde hata verir (tek olaylı kartlar için)', () => {
    expect(() => cardToEvent('seq:C5-D5-E5-F5')).toThrow(Error)
  })
  it('müfredattaki her kart geçerlidir (perde-ters hariç hepsi porte çizer)', () => {
    for (const t of NOTA_TOPICS) {
      for (const c of t.cards) {
        const n = cardToEvents(c).length
        if (c.startsWith('perde-ters:')) expect(n).toBe(0)
        else expect(n).toBeGreaterThan(0)
      }
    }
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
    const ids = NOTA_TOPICS.map((t) => t.id)
    expect(ids).toEqual([
      'nota-1', 'sure-1', 'nota-2', 'sure-2', 'nota-3', 'sure-3', 'nota-4', 'nota-5',
      'dizi-1', 'perde-1', 'dizi-2', 'perde-2', 'koma-1', 'koma-2', 'perde-3', 'perde-4',
    ])
  })
  it('dizi konuları sequence türünde ve 6 karttan oluşur', () => {
    for (const id of ['dizi-1', 'dizi-2']) {
      const t = NOTA_TOPICS.find((x) => x.id === id)!
      expect(t.kind).toBe('sequence')
      expect(t.cards).toHaveLength(6)
    }
    expect(NOTA_TOPICS.find((x) => x.id === 'dizi-1')!.title).toBe('Dizi okuma: adım adım')
    expect(NOTA_TOPICS.find((x) => x.id === 'dizi-2')!.title).toBe('Dizi okuma: atlamalı')
    expect(topicOfCard('seq:D5-C5-B4-A4').id).toBe('dizi-1')
  })
})

describe('perde kartları', () => {
  it('perde:D5 → tek dörtlük Re5; perde-ters:D5 → olay yok', () => {
    expect(cardToEvents('perde:D5')).toEqual([
      { kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'quarter' },
    ])
    expect(cardToEvents('perde-ters:D5')).toEqual([])
  })
  it.each(['perde:', 'perde:H4', 'perde:C4', 'perde-ters:C6', 'perde-ters:', 'perde:D'])(
    'geçersiz perde kimliği %j hata verir',
    (id) => {
      expect(() => cardToEvents(id)).toThrow(Error)
    },
  )
  it('perde konuları perde-name türünde ve kartları doğru', () => {
    const p1 = NOTA_TOPICS.find((t) => t.id === 'perde-1')!
    const p2 = NOTA_TOPICS.find((t) => t.id === 'perde-2')!
    expect(p1.kind).toBe('perde-name')
    expect(p1.title).toBe("Perde adları: Rast'tan Nevâ'ya")
    expect(p1.cards).toEqual([
      'perde:G4', 'perde:A4', 'perde:B4', 'perde:C5', 'perde:D5',
      'perde-ters:G4', 'perde-ters:A4', 'perde-ters:B4', 'perde-ters:C5', 'perde-ters:D5',
    ])
    expect(p2.kind).toBe('perde-name')
    expect(p2.title).toBe("Perde adları: Hüseynî'den Muhayyer'e")
    expect(p2.cards).toEqual([
      'perde:E5', 'perde:F5', 'perde:G5', 'perde:A5',
      'perde-ters:E5', 'perde-ters:F5', 'perde-ters:G5', 'perde-ters:A5',
    ])
    expect(topicOfCard('perde-ters:A5').id).toBe('perde-2')
  })
})
