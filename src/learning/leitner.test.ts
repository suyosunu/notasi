import { describe, expect, it } from 'vitest'
import type { CardRec } from '../store/db'
import { BOX_INTERVAL_DAYS, isDue, review } from './leitner'

const NOW = new Date(2026, 9, 13, 9, 0, 0)
const OLD = '2026-10-01T00:00:00.000Z'

function card(box: CardRec['box'], lastReviewedAt: string): CardRec {
  return { id: 'note:D5', box, lastReviewedAt }
}

describe('review', () => {
  it('sabitler', () => expect(BOX_INTERVAL_DAYS).toEqual([0, 1, 3, 7, 14]))
  it('yeni kart doğru cevaplanınca kutu 2', () => {
    const c = review(undefined, 'note:D5', true, NOW)
    expect(c.box).toBe(2)
    expect(c.id).toBe('note:D5')
    expect(c.lastReviewedAt).toBe(NOW.toISOString())
  })
  it('yeni kart yanlış cevaplanınca kutu 1', () => {
    expect(review(undefined, 'note:D5', false, NOW).box).toBe(1)
  })
  it('doğru cevap kutuyu bir artırır', () => {
    expect(review(card(2, OLD), 'note:D5', true, NOW).box).toBe(3)
  })
  it('kutu 5te doğru cevap 5te kalır', () => {
    expect(review(card(5, OLD), 'note:D5', true, NOW).box).toBe(5)
  })
  it('yanlış cevap kutu 1e düşürür', () => {
    expect(review(card(4, OLD), 'note:D5', false, NOW).box).toBe(1)
  })
  it('lastReviewedAt = now ve girdi kartı değişmez', () => {
    const c = card(3, OLD)
    const out = review(c, 'note:D5', true, NOW)
    expect(out.lastReviewedAt).toBe(NOW.toISOString())
    expect(c).toEqual(card(3, OLD))
  })
})

describe('isDue', () => {
  const last = new Date(2026, 9, 10, 12, 0, 0).toISOString()
  it('kutu 3, 10 Ekim: 12 Ekim değil', () => expect(isDue(card(3, last), '2026-10-12')).toBe(false))
  it('kutu 3, 10 Ekim + 3 gün = 13 Ekim: vadesi gelmiş', () => expect(isDue(card(3, last), '2026-10-13')).toBe(true))
  it('vadesi geçmiş', () => expect(isDue(card(3, last), '2026-11-01')).toBe(true))
  it('kutu 1: aynı gün vadesi gelmiş', () => expect(isDue(card(1, last), '2026-10-10')).toBe(true))
  it('kutu 5: 14 gün', () => {
    expect(isDue(card(5, last), '2026-10-23')).toBe(false)
    expect(isDue(card(5, last), '2026-10-24')).toBe(true)
  })
  it('ay sonunu aşan tarih aritmetiği', () => {
    const l = new Date(2026, 9, 28, 12, 0, 0).toISOString()
    expect(isDue(card(4, l), '2026-11-03')).toBe(false)
    expect(isDue(card(4, l), '2026-11-04')).toBe(true)
  })
  it('yerel gün esas alınır, saat değil', () => {
    const late = new Date(2026, 9, 10, 23, 59, 0).toISOString()
    expect(isDue(card(2, late), '2026-10-11')).toBe(true)
  })
})
