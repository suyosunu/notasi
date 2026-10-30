import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'
import { currentTopic, isMastered, MASTERY_THRESHOLD, MASTERY_WINDOW, needsReview, topicStatuses } from './mastery'

function attempts(topicId: string, results: boolean[], startMinute = 0): AttemptRec[] {
  return results.map((correct, i) => ({
    id: `${topicId}-${startMinute + i}`,
    topicId,
    cardId: 'note:D5',
    correct,
    at: new Date(Date.UTC(2026, 9, 13, 8, startMinute + i)).toISOString(),
  }))
}

const mk = (right: number, total: number) =>
  attempts('nota-1', [...Array(right).fill(true), ...Array(total - right).fill(false)])

describe('isMastered', () => {
  it('sabitler', () => {
    expect(MASTERY_WINDOW).toBe(10)
    expect(MASTERY_THRESHOLD).toBe(0.8)
  })
  it('10 denemeden 8 doğru: var', () => expect(isMastered(mk(8, 10), false)).toBe(true))
  it('10 denemeden 7 doğru: yok', () => expect(isMastered(mk(7, 10), false)).toBe(false))
  it('9 deneme hepsi doğru: yok', () => expect(isMastered(mk(9, 9), false)).toBe(false))
  it('placedOut: var', () => expect(isMastered([], true)).toBe(true))
  it('yalnızca son 10 denemeye bakar', () => {
    const old = attempts('nota-1', Array(5).fill(false), 0)
    const recent = attempts('nota-1', [true, true, true, true, true, true, true, true, false, false], 10)
    expect(isMastered([...old, ...recent], false)).toBe(true)
  })
  it('girdi sırasına güvenmez; son 10 zamana göre seçilir', () => {
    const old = attempts('nota-1', Array(5).fill(false), 0)
    const recent = attempts('nota-1', [true, true, true, true, true, true, true, true, false, false], 10)
    expect(isMastered([...recent, ...old].reverse(), false)).toBe(true)
    expect(isMastered([...old, ...recent].reverse(), false)).toBe(true)
  })
  it('yapışkan: bir kez 8/10 görülünce sonradan gelen yanlışlar ustalığı geri almaz', () => {
    const results = [...Array(8).fill(true), false, false, false, false, false]
    expect(isMastered(attempts('nota-1', results), false)).toBe(true)
  })
  it('yapışkan: ustalık penceresi geçmişin ortasında da olabilir (girdi sırasından bağımsız)', () => {
    const results = [false, false, ...Array(8).fill(true), false, false, false, false, false, false]
    expect(isMastered(attempts('nota-1', results).reverse(), false)).toBe(true)
  })
  it('hiçbir 10 denemelik pencere %80 e varmıyorsa yok', () => {
    const results = [true, false, true, false, true, false, true, false, true, false, true, false, true, false]
    expect(isMastered(attempts('nota-1', results), false)).toBe(false)
  })
  it('girdiyi değiştirmez', () => {
    const input = mk(8, 10).reverse()
    const copy = [...input]
    isMastered(input, false)
    expect(input).toEqual(copy)
  })
})

describe('topicStatuses / currentTopic', () => {
  it('hiç deneme yok: ilk konu açık, diğerleri kilitli', () => {
    const s = topicStatuses(NOTA_TOPICS, [], new Set())
    expect(s['nota-1']).toBe('acik')
    for (const t of NOTA_TOPICS.slice(1)) expect(s[t.id]).toBe('kilitli')
    expect(currentTopic(NOTA_TOPICS, s)?.id).toBe('nota-1')
  })
  it('nota-1 öğrenildiyse sure-1 açık, nota-2 kilitli', () => {
    const s = topicStatuses(NOTA_TOPICS, mk(8, 10), new Set())
    expect(s['nota-1']).toBe('ogrenildi')
    expect(s['sure-1']).toBe('acik')
    expect(s['nota-2']).toBe('kilitli')
    expect(currentTopic(NOTA_TOPICS, s)?.id).toBe('sure-1')
  })
  it('placedOut konuyu öğrenilmiş sayar', () => {
    const s = topicStatuses(NOTA_TOPICS, [], new Set(['nota-1', 'sure-1']))
    expect(s['nota-1']).toBe('ogrenildi')
    expect(s['sure-1']).toBe('ogrenildi')
    expect(s['nota-2']).toBe('acik')
  })
  it('denemeleri konuya göre gruplar', () => {
    const mixed = [...mk(8, 10), ...attempts('sure-1', Array(10).fill(false), 30)]
    const s = topicStatuses(NOTA_TOPICS, mixed, new Set())
    expect(s['nota-1']).toBe('ogrenildi')
    expect(s['sure-1']).toBe('acik')
  })
  it('yapışkan: öğrenilmiş konu sonradan yanlış yapılsa da öğrenildi kalır, sonraki konular kilitlenmez', () => {
    const results = [...Array(8).fill(true), false, false, false, false, false]
    const s = topicStatuses(NOTA_TOPICS, attempts('nota-1', results), new Set())
    expect(s['nota-1']).toBe('ogrenildi')
    expect(s['sure-1']).toBe('acik')
    expect(currentTopic(NOTA_TOPICS, s)?.id).toBe('sure-1')
    const later = [...attempts('nota-1', results), ...attempts('sure-1', Array(10).fill(true), 30)]
    const s2 = topicStatuses(NOTA_TOPICS, later, new Set())
    expect(s2['nota-1']).toBe('ogrenildi')
    expect(s2['sure-1']).toBe('ogrenildi')
    expect(s2['nota-2']).toBe('acik')
  })
  it('perde-2, perde-5, perde-6 ve sure-5 en sondadır; koma-1 öğrenilmeden perde-2 kilitli', () => {
    expect(NOTA_TOPICS.slice(-4).map((t) => t.id)).toEqual(['perde-2', 'perde-5', 'perde-6', 'sure-5'])
    const sonraki = NOTA_TOPICS.slice(NOTA_TOPICS.findIndex((t) => t.id === 'koma-1'))
    expect(sonraki.map((t) => t.id)).toEqual(['koma-1', 'koma-2', 'perde-3', 'perde-4', 'sure-4', 'perde-2', 'perde-5', 'perde-6', 'sure-5'])
    // Öğrenilmiş perde-2 denemeleri olsa bile önündeki konular öğrenilmeden kilitli kalır.
    const s = topicStatuses(NOTA_TOPICS, attempts('perde-2', Array(10).fill(true)), new Set())
    expect(s['perde-2']).toBe('kilitli')
    const koma1Oncesi = new Set(NOTA_TOPICS.slice(0, NOTA_TOPICS.findIndex((t) => t.id === 'koma-1')).map((t) => t.id))
    const s2 = topicStatuses(NOTA_TOPICS, attempts('perde-2', Array(10).fill(true)), koma1Oncesi)
    expect(s2['koma-1']).toBe('acik')
    expect(s2['perde-2']).toBe('kilitli')
  })
  it('hepsi öğrenildiyse currentTopic null', () => {
    const s = topicStatuses(NOTA_TOPICS, [], new Set(NOTA_TOPICS.map((t) => t.id)))
    expect(currentTopic(NOTA_TOPICS, s)).toBeNull()
  })
})

describe('needsReview', () => {
  it('8 denemede 3 doğru: gerekli', () => expect(needsReview(mk(3, 8))).toBe(true))
  it('4 denemede 0 doğru: gerekli değil (az deneme)', () => expect(needsReview(mk(0, 4))).toBe(false))
  it('5 denemede 0 doğru: gerekli değil', () => expect(needsReview(mk(0, 5))).toBe(false))
  it('6 denemede 0 doğru: gerekli', () => expect(needsReview(mk(0, 6))).toBe(true))
  it('son 10da 5 doğru: gerekli değil', () => expect(needsReview(mk(5, 10))).toBe(false))
  it('son 10da 4 doğru: gerekli', () => expect(needsReview(mk(4, 10))).toBe(true))
  it('yalnızca son 10 denemeye bakar, girdi sırasına güvenmez', () => {
    const old = attempts('nota-1', Array(10).fill(false), 0)
    const recent = attempts('nota-1', Array(10).fill(true), 10)
    expect(needsReview([...old, ...recent])).toBe(false)
    expect(needsReview([...old, ...recent].reverse())).toBe(false)
  })
  it('girdiyi değiştirmez', () => {
    const input = mk(3, 8).reverse()
    const copy = [...input]
    needsReview(input)
    expect(input).toEqual(copy)
  })
})
