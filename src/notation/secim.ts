/** Ölçü aralığı: ölçü indisleri (0 tabanlı), ikisi de dahil, `bas ≤ son`. */
export interface Secim {
  bas: number
  son: number
}

/**
 * Satıra dokunuş: seçim yoksa satır seçilir; tek satırlık seçim varken başka satıra dokunulursa ikisini kapsayan
 * aralık; aynı tek satıra dokunulursa seçim kalkar (null = tümü); aralık varken dokunulan satır tek başına seçilir.
 *
 * Kesin kurallar: önceki seçim null → `satir`; önceki seçim `satir`'a eşit → null; `satir` önceki seçimin dışında →
 * ikisini kapsayan aralık `{ min(bas), max(son) }`; `satir` önceki seçimin içinde ve seçim ondan geniş → `satir`.
 */
export function secimGuncelle(secim: Secim | null, satir: Secim): Secim | null {
  if (!secim) return satir
  if (secim.bas === satir.bas && secim.son === satir.son) return null
  const icinde = satir.bas >= secim.bas && satir.son <= secim.son
  if (icinde) return satir
  return { bas: Math.min(secim.bas, satir.bas), son: Math.max(secim.son, satir.son) }
}
