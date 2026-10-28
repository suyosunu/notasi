import { ETUT_DERSLERI } from './etut'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { NOTA_2_DERSLERI } from './nota-2'
import { PERDE_DERSLERI } from './perdeler'
import type { Ders } from './types'

/** Tüm dersler; içerik Task 35–37 ve 39'da eklenir. */
export const DERSLER: Ders[] = [...HAZIRLIK_DERSLERI, ...NOTA_DERSLERI, ...NOTA_2_DERSLERI, ...PERDE_DERSLERI, ...ETUT_DERSLERI]

export function dersById(id: string): Ders | undefined {
  return DERSLER.find((d) => d.id === id)
}

export function notaDersId(topicId: string): string {
  return `nota:${topicId}`
}

export function perdeDersId(perdeId: string): string {
  return `perde:${perdeId}`
}

/** Akort göstergesini öğreten ders; ilk uzun ses (Nevâ) alıştırmasından önce okunur. */
export const UZUN_SES_DERS_ID = 's0:uzun-ses'

/** Perde alıştırmasından önce sırayla okunacak dersler: Nevâ'da önce gösterge dersi, sonra perde dersi. */
export function perdeDersleri(perdeId: string): string[] {
  return perdeId === 'neva' ? [UZUN_SES_DERS_ID, perdeDersId(perdeId)] : [perdeDersId(perdeId)]
}
