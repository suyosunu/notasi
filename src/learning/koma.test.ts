import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { seededRng } from '../util/rng'
import { cardToEvent, cardToEvents, perdeKey, topicOfCard } from './cards'
import { buildMixedQuestions } from './mixed'
import { makeQuestion } from './questions'

const NEW_IDS = ['koma-1', 'koma-2', 'perde-3', 'perde-4']
const NEW_CARDS = NOTA_TOPICS.filter((t) => NEW_IDS.includes(t.id)).flatMap((t) => t.cards)

describe('işaretli (NotaAE) kartlar', () => {
  it('note:B4b1 → Si4 koma bemolü', () => {
    expect(cardToEvent('note:B4b1')).toEqual({
      kind: 'note',
      pitch: { step: 'B', octave: 4, acc: -1 },
      dur: 'quarter',
    })
    expect(cardToEvent('note:C5#4')).toMatchObject({ pitch: { step: 'C', octave: 5, acc: 4 } })
    expect(cardToEvents('note:B4b8')).toEqual([cardToEvent('note:B4b8')])
  })

  it.each(['note:B4b3', 'note:B4b0', 'note:B4b9', 'note:C5#2', 'note:C5#', 'note:B4b', 'note:B4x1', 'note:B4b11'])(
    'geçersiz koma sayısı %j hata verir',
    (id) => {
      expect(() => cardToEvent(id)).toThrow(Error)
    },
  )

  it('perde:B4b1 → işaretli tek nota; perde-ters porte çizmez', () => {
    expect(cardToEvents('perde:B4b1')).toEqual([{ kind: 'note', pitch: { step: 'B', octave: 4, acc: -1 }, dur: 'quarter' }])
    expect(cardToEvents('perde:F5#4')).toEqual([{ kind: 'note', pitch: { step: 'F', octave: 5, acc: 4 }, dur: 'quarter' }])
    expect(cardToEvents('perde-ters:F5#4')).toEqual([])
    expect(perdeKey('perde-ters:C5#5')).toBe('C5#5')
  })

  it.each(['perde:B4b3', 'perde:B4b2', 'perde:G4#4'])('tanımsız perde anahtarı %j hata verir', (id) => {
    expect(() => cardToEvents(id)).toThrow(Error)
  })

  it('yeni konular: koma-1, koma-2, perde-3, perde-4', () => {
    const t = (id: string) => NOTA_TOPICS.find((x) => x.id === id)!
    expect(t('koma-1')).toMatchObject({
      title: 'Koma işaretleri: bemoller',
      kind: 'accidental-name',
      cards: ['note:B4b1', 'note:B4b4', 'note:B4b5', 'note:B4b8'],
    })
    expect(t('koma-2')).toMatchObject({
      title: 'Koma işaretleri: diyezler',
      kind: 'accidental-name',
      cards: ['note:C5#1', 'note:C5#4', 'note:C5#5', 'note:C5#8'],
    })
    expect(t('perde-3')).toMatchObject({
      title: 'Perdeler: Segâh, Kürdî, Dik Kürdî',
      kind: 'perde-name',
      cards: ['perde:B4b1', 'perde:B4b5', 'perde:B4b4', 'perde-ters:B4b1', 'perde-ters:B4b5', 'perde-ters:B4b4'],
    })
    expect(t('perde-4')).toMatchObject({
      title: 'Perdeler: Nim Hicaz, Hicaz, Eviç',
      kind: 'perde-name',
      cards: ['perde:C5#4', 'perde:C5#5', 'perde:F5#4', 'perde-ters:C5#4', 'perde-ters:C5#5', 'perde-ters:F5#4'],
    })
    expect(topicOfCard('note:B4b4').id).toBe('koma-1')
    expect(topicOfCard('perde-ters:F5#4').id).toBe('perde-4')
  })

  it('Irak için hiçbir kart yoktur', () => {
    expect(NOTA_TOPICS.flatMap((t) => t.cards).some((c) => c.includes('F4#4'))).toBe(false)
  })
})

describe('koma soruları', () => {
  const FLATS = ['koma bemolü', 'bakiye bemolü', 'küçük mücenneb bemolü', 'büyük mücenneb bemolü']
  const SHARPS = ['koma diyezi', 'bakiye diyezi', 'küçük mücenneb diyezi', 'büyük mücenneb diyezi']

  it('her yeni kartta 4 farklı seçenek ve cevap seçenekler arasındadır', () => {
    expect(NEW_CARDS).toHaveLength(4 + 4 + 6 + 6)
    for (const card of NEW_CARDS) {
      for (let s = 1; s <= 30; s++) {
        const q = makeQuestion(card, seededRng(s))
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.answer)
      }
    }
  })

  it('accidental-name: cevap doğru, soru ve ipucu birebir, porteye işaretli tek nota çizilir', () => {
    const q = makeQuestion('note:B4b4', seededRng(1))
    expect(q.answer).toBe('bakiye bemolü')
    expect(q.prompt).toBe('Bu işaretin adı ne?')
    expect(q.hint).toBe('Bemol sesi pesleştirir, diyez tizleştirir; çizgi ve gövde sayısı koma miktarını gösterir.')
    expect(q.topicId).toBe('koma-1')
    expect(q.events).toEqual([{ kind: 'note', pitch: { step: 'B', octave: 4, acc: -4 }, dur: 'quarter' }])
    expect(makeQuestion('note:C5#8', seededRng(1)).answer).toBe('büyük mücenneb diyezi')
    expect(makeQuestion('note:C5#1', seededRng(1)).answer).toBe('koma diyezi')
  })

  it('koma-1 tam 4 bemol adını, koma-2 tam 4 diyez adını sunar', () => {
    for (let s = 1; s <= 20; s++) {
      for (const c of ['note:B4b1', 'note:B4b4', 'note:B4b5', 'note:B4b8']) {
        expect([...makeQuestion(c, seededRng(s)).options].sort()).toEqual([...FLATS].sort())
      }
      for (const c of ['note:C5#1', 'note:C5#4', 'note:C5#5', 'note:C5#8']) {
        expect([...makeQuestion(c, seededRng(s)).options].sort()).toEqual([...SHARPS].sort())
      }
    }
  })

  it('seçenek sırası karıştırılır', () => {
    const firsts = new Set<string>()
    for (let s = 1; s <= 40; s++) firsts.add(makeQuestion('note:B4b1', seededRng(s)).options[0]!)
    expect(firsts.size).toBeGreaterThan(1)
  })

  it('perde: işaretli notanın perde adı', () => {
    expect(makeQuestion('perde:B4b1', seededRng(1)).answer).toBe('Segâh')
    expect(makeQuestion('perde:B4b5', seededRng(1)).answer).toBe('Kürdî')
    expect(makeQuestion('perde:B4b4', seededRng(1)).answer).toBe('Dik Kürdî')
    expect(makeQuestion('perde:C5#4', seededRng(1)).answer).toBe('Nim Hicaz')
    expect(makeQuestion('perde:C5#5', seededRng(1)).answer).toBe('Hicaz')
    expect(makeQuestion('perde:F5#4', seededRng(1)).answer).toBe('Eviç')
    const q = makeQuestion('perde:B4b1', seededRng(1))
    expect(q.prompt).toBe('Bu notanın perde adı ne?')
    expect(q.events).toEqual([{ kind: 'note', pitch: { step: 'B', octave: 4, acc: -1 }, dur: 'quarter' }])
  })

  it('perde-ters: işaretli etiket cevaptır; çeldiriciler konunun ve önceki perde konularının etiketleridir', () => {
    const q = makeQuestion('perde-ters:F5#4', seededRng(1))
    expect(q.answer).toBe('Fa (bakiye diyezi)')
    expect(q.prompt).toBe('Eviç hangi nota?')
    expect(q.events).toEqual([])
    const earlier = ['Sol', 'La', 'Si', 'Do', 'Re', 'Mi', 'Fa', 'tiz Sol', 'tiz La']
    const p3 = ['Si (koma bemolü)', 'Si (küçük mücenneb bemolü)', 'Si (bakiye bemolü)']
    const p4 = ['Do (bakiye diyezi)', 'Do (küçük mücenneb diyezi)', 'Fa (bakiye diyezi)']
    for (let s = 1; s <= 40; s++) {
      for (const o of makeQuestion('perde-ters:B4b1', seededRng(s)).options) expect([...p3, ...earlier]).toContain(o)
      for (const o of makeQuestion('perde-ters:C5#4', seededRng(s)).options) expect([...p3, ...p4, ...earlier]).toContain(o)
    }
    for (let s = 1; s <= 20; s++) {
      const o = makeQuestion('perde-ters:B4b1', seededRng(s)).options
      expect(o).toContain('Si (küçük mücenneb bemolü)')
      expect(o).toContain('Si (bakiye bemolü)')
    }
  })

  it('ileri perde sorularında çeldiriciler önceki konuların adlarıdır; Irak hiç çıkmaz', () => {
    const upTo3 = ['Rast', 'Dügâh', 'Bûselik', 'Çârgâh', 'Nevâ', 'Hüseynî', 'Acem', 'Gerdâniye', 'Muhayyer', 'Segâh', 'Kürdî', 'Dik Kürdî']
    for (let s = 1; s <= 40; s++) {
      for (const c of ['perde:B4b1', 'perde:B4b5', 'perde:B4b4', 'perde:C5#4', 'perde:C5#5', 'perde:F5#4']) {
        for (const o of makeQuestion(c, seededRng(s)).options) expect(o).not.toBe('Irak')
      }
      for (const o of makeQuestion('perde:B4b1', seededRng(s)).options) expect(upTo3).toContain(o)
    }
  })
})

describe('koma kartları karışık turda', () => {
  it('accidental-name ve yeni perde kartları makeQuestion üzerinden sorulur', () => {
    const qs = buildMixedQuestions({ pool: NEW_CARDS, attempts: [], dueCards: [], count: 24, rng: seededRng(3) })
    expect(qs).toHaveLength(24)
    expect(qs.some((q) => q.prompt === 'Bu işaretin adı ne?')).toBe(true)
    expect(qs.some((q) => ['Segâh', 'Kürdî', 'Dik Kürdî', 'Nim Hicaz', 'Hicaz', 'Eviç'].includes(q.answer))).toBe(true)
    for (const q of qs) {
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
    }
  })
})
