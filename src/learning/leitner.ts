import type { CardRec } from '../store/db'
import { todayLocal } from '../util/date'

/** Kutu 1..5 için gün aralığı: kartın bir sonraki tekrarına kadar geçmesi gereken gün. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14]

const MAX_BOX = 5

/** Doğru cevap kartı bir kutu yukarı taşır (en fazla 5); yanlış cevap 1. kutuya indirir. Yeni kart 1. kutudan başlar. */
export function review(card: CardRec | undefined, cardId: string, correct: boolean, now: Date): CardRec {
  const box = correct ? Math.min(MAX_BOX, (card?.box ?? 1) + 1) : 1
  return { id: cardId, box: box as CardRec['box'], lastReviewedAt: now.toISOString() }
}

/** `YYYY-MM-DD` tarihine gün ekler (takvim günü aritmetiği, saat dilimi/yaz saatinden bağımsız). */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Son tekrar gününe (yerel) kutu aralığı eklenince `today`'e (yerel `YYYY-MM-DD`) ulaşıldıysa vadesi gelmiştir. */
export function isDue(card: CardRec, today: string): boolean {
  const last = todayLocal(new Date(card.lastReviewedAt))
  return addDays(last, BOX_INTERVAL_DAYS[card.box - 1] ?? 0) <= today
}
