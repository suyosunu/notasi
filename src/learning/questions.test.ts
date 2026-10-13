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

  it('id deterministik, farklı rng durumunda farklı', () => {
    const a = makeQuestion('note:C5', seededRng(7))
    expect(makeQuestion('note:C5', seededRng(7)).id).toBe(a.id)
    expect(makeQuestion('note:C5', seededRng(8)).id).not.toBe(a.id)
    expect(a.id.startsWith('note:C5')).toBe(true)
  })
})
