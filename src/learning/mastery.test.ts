import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'
import { currentTopic, isMastered, MASTERY_THRESHOLD, MASTERY_WINDOW, topicStatuses } from './mastery'

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
  it('hepsi öğrenildiyse currentTopic null', () => {
    const s = topicStatuses(NOTA_TOPICS, [], new Set(NOTA_TOPICS.map((t) => t.id)))
    expect(currentTopic(NOTA_TOPICS, s)).toBeNull()
  })
})
