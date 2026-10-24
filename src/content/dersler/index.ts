import { HAZIRLIK_DERSLERI } from './hazirlik'
import type { Ders } from './types'

/** Tüm dersler; içerik Task 35–37 ve 39'da eklenir. */
export const DERSLER: Ders[] = [...HAZIRLIK_DERSLERI]

export function dersById(id: string): Ders | undefined {
  return DERSLER.find((d) => d.id === id)
}

export function notaDersId(topicId: string): string {
  return `nota:${topicId}`
}

export function perdeDersId(perdeId: string): string {
  return `perde:${perdeId}`
}
