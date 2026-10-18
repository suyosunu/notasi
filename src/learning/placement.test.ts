import { describe, expect, it } from 'vitest'
import { seededRng } from '../util/rng'
import { buildPlacement, placementResult } from './placement'

describe('buildPlacement', () => {
  it('8 soru: 5 nota-1, 3 sure-1', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const qs = buildPlacement(seededRng(seed))
      expect(qs).toHaveLength(8)
      expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(5)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(3)
      expect(new Set(qs.map((q) => q.id)).size).toBe(8)
    }
  })

  it('aynı tohum aynı soruları verir', () => {
    expect(buildPlacement(seededRng(7))).toEqual(buildPlacement(seededRng(7)))
  })

  it('sure-1 sorularında her kart bir kez sorulur', () => {
    const qs = buildPlacement(seededRng(3)).filter((q) => q.topicId === 'sure-1')
    expect(qs.map((q) => q.cardId).sort()).toEqual(['dur:half', 'dur:quarter', 'dur:whole'])
  })
})

describe('placementResult', () => {
  const nota = (correct: boolean) => ({ topicId: 'nota-1', correct })
  const sure = (correct: boolean) => ({ topicId: 'sure-1', correct })

  it('nota-1 tamamen doğru, sure-1 birisi yanlış → sadece nota-1', () => {
    const answers = [nota(true), nota(true), nota(true), nota(true), nota(true), sure(true), sure(false), sure(true)]
    expect(placementResult(answers)).toEqual(['nota-1'])
  })

  it('hepsi doğruysa iki konu da atlanır', () => {
    const answers = [...Array(5).fill(nota(true)), ...Array(3).fill(sure(true))]
    expect(placementResult(answers)).toEqual(['nota-1', 'sure-1'])
  })

  it('hiçbiri tam doğru değilse boş, cevapsız konu atlanmaz', () => {
    expect(placementResult([nota(true), nota(false)])).toEqual([])
    expect(placementResult([])).toEqual([])
  })
})
