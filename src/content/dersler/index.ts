import { DORTLU_DERSLERI } from './dortlu'
import { DIL_ESER_DERSLERI, ETUT_DERSLERI } from './etut'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { NOTA_2_DERSLERI } from './nota-2'
import { PERDE_DERSLERI } from './perdeler'
import { USUL_DERSLERI } from './usul'
import type { Etut } from '../etutler'
import type { Ders } from './types'

/** Tüm dersler (Task 35–37, 39, 46 ve 49). */
export const DERSLER: Ders[] = [...HAZIRLIK_DERSLERI, ...NOTA_DERSLERI, ...NOTA_2_DERSLERI, ...PERDE_DERSLERI, ...ETUT_DERSLERI, ...USUL_DERSLERI, ...DORTLU_DERSLERI, ...DIL_ESER_DERSLERI]

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

export function usulDersId(usulId: string): string {
  return `usul:${usulId}`
}

/** Usul bölümünde sırayla okunacak dersler: önce giriş, sonra (varsa) usulün kendi dersi. */
export function usulDersleri(usulId: string): string[] {
  const kendi = usulDersId(usulId)
  return dersById(kendi) ? ['usul:giris', kendi] : ['usul:giris']
}

/** Ölçü, ölçü çizgisi ve nefes işareti dersi: usul etütlerinde ölçüler usule göre bölünür ve nefes (`,`) işareti çıkar. */
const OLCU_DERS_ID = 'okuma:olcu'

/**
 * Etütten önce sırayla okunacak dersler. Usul etüdünde önce ölçü ve nefes işareti, sonra usulün giriş ve kendi dersi
 * (son ders etüdün `dersId`'sidir); öteki etütlerde yalnız kendi dersi. Okunmuş dersler `DersKapisi`'nde atlanır.
 */
export function etutDersleri(e: Pick<Etut, 'dersId' | 'usulId'>): string[] {
  return e.usulId ? [OLCU_DERS_ID, ...usulDersleri(e.usulId)] : [e.dersId]
}
