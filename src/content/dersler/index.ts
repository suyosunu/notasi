import { ETUT_DERSLERI } from './etut'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { PERDE_DERSLERI } from './perdeler'
import type { Ders } from './types'

/** Tüm dersler; içerik Task 35–37 ve 39'da eklenir. */
export const DERSLER: Ders[] = [...HAZIRLIK_DERSLERI, ...NOTA_DERSLERI, ...PERDE_DERSLERI, ...ETUT_DERSLERI]

export function dersById(id: string): Ders | undefined {
  return DERSLER.find((d) => d.id === id)
}

export function notaDersId(topicId: string): string {
  return `nota:${topicId}`
}

export function perdeDersId(perdeId: string): string {
  return `perde:${perdeId}`
}
