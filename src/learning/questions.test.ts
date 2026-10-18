import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { seededRng } from '../util/rng'
import { makeQuestion } from './questions'

const LINES = 'Çizgiler alttan: Mi, Sol, Si, Re, Fa'
const SPACES = 'Aralıklar alttan: Fa, La, Do, Mi'
const BELOW = "Portenin altındaki ilk ek çizgi Do'dur"
const ABOVE = "Portenin üstündeki ilk ek çizgi La'dır"

describe('makeQuestion', () => {
  for (const topic of NOTA_TOPICS) {
    for (const card of topic.cards) {
      it(`${card}: 4 farklı seçenek, cevap içinde, aynı seed aynı soru`, () => {
        for (let seed = 1; seed <= 20; seed++) {
          const q = makeQuestion(card, seededRng(seed))
          expect(q.options).toHaveLength(4)
          expect(new Set(q.options).size).toBe(4)
          expect(q.options).toContain(q.answer)
          expect(q.cardId).toBe(card)
          expect(q.topicId).toBe(topic.id)
          expect(makeQuestion(card, seededRng(seed))).toEqual(q)
        }
      })
    }
  }

  it('note-name soru metni ve cevabı', () => {
    const q = makeQuestion('note:D5', seededRng(1))
    expect(q.prompt).toBe('Bu notanın adı ne?')
    expect(q.answer).toBe('Re')
    expect(q.events).toEqual([expect.objectContaining({ kind: 'note', dur: 'quarter' })])
  })

  it('ipuçları perdenin yerine göre', () => {
    const hint = (c: string) => makeQuestion(c, seededRng(1)).hint
    expect(hint('note:C4')).toBe(BELOW)
    expect(hint('note:D4')).toBe(BELOW)
    expect(hint('note:A5')).toBe(ABOVE)
    expect(hint('note:G5')).toBe(ABOVE)
    for (const c of ['note:E4', 'note:G4', 'note:B4', 'note:D5', 'note:F5']) expect(hint(c)).toBe(LINES)
    for (const c of ['note:F4', 'note:A4', 'note:C5', 'note:E5']) expect(hint(c)).toBe(SPACES)
  })

  it('süre soruları', () => {
    const q = makeQuestion('dur:quarter.dotted', seededRng(3))
    expect(q.prompt).toBe('Bu hangi süre?')
    expect(q.answer).toBe('Noktalı dörtlük')
    expect(q.hint).toBe('Birlik 4, ikilik 2, dörtlük 1, sekizlik ½ vuruş; nokta yarısı kadar ekler')
    expect(makeQuestion('rest:quarter', seededRng(3)).answer).toBe('Dörtlük sus')
  })

  it('sure-1 yalnızca 3 ad içerir; seçenekler diğer süre adlarından tamamlanır', () => {
    const seen = new Set<string>()
    for (let s = 1; s <= 50; s++) makeQuestion('dur:whole', seededRng(s)).options.forEach((o) => seen.add(o))
    expect(seen.has('Birlik')).toBe(true)
    expect(seen.size).toBeGreaterThan(3)
  })

  it('erken süre konularında ileri konuların adları (sus) sızmaz', () => {
    for (let s = 1; s <= 50; s++) {
      const q = makeQuestion('dur:eighth', seededRng(s))
      expect(q.options.filter((o) => o.endsWith('sus')).length).toBe(0)
    }
  })

  describe('dizi okuma (seq:)', () => {
    it('soru metni, cevap, ipucu ve olaylar', () => {
      const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(1))
      expect(q.prompt).toBe('Bu dizi nasıl okunur?')
      expect(q.answer).toBe('Re – Do – Si – La')
      expect(q.hint).toBe('Soldan sağa tek tek oku: önce çizgi mi aralık mı olduğuna bak.')
      expect(q.events).toHaveLength(4)
      expect(q.topicId).toBe('dizi-1')
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
    })

    it('seçenekler düz solfejdir (tiz yok), EN DASH ile birleşir', () => {
      const q = makeQuestion('seq:C5-E5-G5-E5', seededRng(2))
      expect(q.answer).toBe('Do – Mi – Sol – Mi')
      for (const o of q.options) {
        expect(o).not.toMatch(/tiz/)
        expect(o.split(' – ')).toHaveLength(4)
      }
    })

    it('çeldiriciler C4..A5 aralığında kalır (sınır dizilerde de 3 çeldirici)', () => {
      const RANGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
      for (const card of ['seq:A4-C5-E5-A5', 'seq:G4-A4-B4-C5', 'seq:G5-F5-E5-D5']) {
        for (let seed = 1; seed <= 20; seed++) {
          const q = makeQuestion(card, seededRng(seed))
          expect(new Set(q.options).size).toBe(4)
          for (const o of q.options) for (const n of o.split(' – ')) expect(RANGE).toContain(n)
        }
      }
    })

    it('A5 ile biten dizide yukarı kaydırma aday olmaz (aralık dışı)', () => {
      // A4-C5-E5-A5 bir adım yukarı → B5 üstü aralık dışı; yine de 4 farklı seçenek vardır.
      const q = makeQuestion('seq:A4-C5-E5-A5', seededRng(5))
      expect(q.options).not.toContain('Si – Re – Fa – Si')
      expect(q.options).toHaveLength(4)
    })

    it('bir adım aşağı kaydırılmış dizi bir çeldiricidir', () => {
      const seen = new Set<string>()
      for (let s = 1; s <= 30; s++) makeQuestion('seq:D5-C5-B4-A4', seededRng(s)).options.forEach((o) => seen.add(o))
      expect(seen.has('Do – Si – La – Sol')).toBe(true)
      expect(seen.has('Mi – Re – Do – Si')).toBe(true)
    })
  })

  it('id deterministik, farklı rng durumunda farklı', () => {
    const a = makeQuestion('note:C5', seededRng(7))
    expect(makeQuestion('note:C5', seededRng(7)).id).toBe(a.id)
    expect(makeQuestion('note:C5', seededRng(8)).id).not.toBe(a.id)
    expect(a.id.startsWith('note:C5')).toBe(true)
  })
})

describe('perde isimleri (perde: / perde-ters:)', () => {
  const NINE = ['Rast', 'Dügâh', 'Bûselik', 'Çârgâh', 'Nevâ', 'Hüseynî', 'Acem', 'Gerdâniye', 'Muhayyer']

  it('perde:D5 → nota göster, perde adı sor', () => {
    const q = makeQuestion('perde:D5', seededRng(1))
    expect(q.prompt).toBe('Bu notanın perde adı ne?')
    expect(q.answer).toBe('Nevâ')
    expect(q.events).toEqual([expect.objectContaining({ kind: 'note', dur: 'quarter', pitch: { step: 'D', octave: 5, acc: 0 } })])
    expect(q.hint).toBe(
      'Sırayla: Rast (Sol), Dügâh, Bûselik, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).',
    )
  })

  it('perde: çeldiricileri dokuz perde adından gelir', () => {
    for (let s = 1; s <= 30; s++) {
      for (const card of ['perde:G4', 'perde:A5']) {
        for (const o of makeQuestion(card, seededRng(s)).options) expect(NINE).toContain(o)
      }
    }
  })

  it('perde-ters:D5 → porte yok, perde adından nota sor', () => {
    const q = makeQuestion('perde-ters:D5', seededRng(1))
    expect(q.prompt).toBe('Nevâ hangi nota?')
    expect(q.answer).toBe('Re')
    expect(q.events).toEqual([])
    expect(q.hint).toBe(
      'Sırayla: Rast (Sol), Dügâh, Bûselik, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).',
    )
  })

  it('perde-ters çeldiricileri konunun notalarındandır', () => {
    for (let s = 1; s <= 30; s++) {
      const opts = makeQuestion('perde-ters:G4', seededRng(s)).options
      for (const o of opts) expect(['Sol', 'La', 'Si', 'Do', 'Re']).toContain(o)
    }
  })

  it('perde-ters:A5 → "tiz La"; seçeneklerde düz "La" ile karışmaz', () => {
    for (let s = 1; s <= 30; s++) {
      const q = makeQuestion('perde-ters:A5', seededRng(s))
      expect(q.prompt).toBe('Muhayyer hangi nota?')
      expect(q.answer).toBe('tiz La')
      expect(q.options).not.toContain('La')
      expect(q.options).not.toContain('Sol')
      expect(new Set(q.options).size).toBe(4)
    }
  })
})
