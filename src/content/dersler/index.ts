import { DORTLU_DERSLERI } from './dortlu'
import { DIL_ESER_DERSLERI, ETUT_3_DERSLERI, ETUT_4_DERSLERI, ETUT_DERSLERI } from './etut'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { MAKAM_DERSLERI } from './makam'
import { NOTA_DERSLERI } from './nota'
import { NOTA_2_DERSLERI, NOTA_3_DERSLERI, NOTA_4_DERSLERI } from './nota-2'
import { PERDE_DERSLERI } from './perdeler'
import { PERDE_3_DERSLERI } from './perdeler-3'
import { PERDE_4_DERSLERI } from './perdeler-4'
import { USUL_DERSLERI } from './usul'
import type { Etut } from '../etutler'
import type { Ders } from './types'

/** Tüm dersler (Task 35–37, 39, 46, 49, 54, 55, 62 ve 64). */
export const DERSLER: Ders[] = [...HAZIRLIK_DERSLERI, ...NOTA_DERSLERI, ...NOTA_2_DERSLERI, ...NOTA_3_DERSLERI, ...NOTA_4_DERSLERI, ...PERDE_DERSLERI, ...PERDE_3_DERSLERI, ...PERDE_4_DERSLERI, ...ETUT_DERSLERI, ...ETUT_3_DERSLERI, ...ETUT_4_DERSLERI, ...USUL_DERSLERI, ...DORTLU_DERSLERI, ...DIL_ESER_DERSLERI, ...MAKAM_DERSLERI]

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

/** Kendi dersi olmayıp başka bir usulün dersini okutan usuller: Yürük Semâî dersi 6/8 ve 6/4'ü birlikte anlatır. */
const USUL_DERSI_ORTAK: Record<string, string> = { 'yuruk-semai-64': 'yuruk-semai' }

export function usulDersId(usulId: string): string {
  return `usul:${USUL_DERSI_ORTAK[usulId] ?? usulId}`
}

/** Usul bölümünde sırayla okunacak dersler: önce giriş, sonra (varsa) usulün kendi dersi. */
export function usulDersleri(usulId: string): string[] {
  const kendi = usulDersId(usulId)
  return dersById(kendi) ? ['usul:giris', kendi] : ['usul:giris']
}

export function makamDersId(makamId: string): string {
  return `makam:${makamId}`
}

/** Makam ekranında sırayla okunacak dersler: önce giriş, sonra (varsa) makamın kendi dersi. */
export function makamDersleri(makamId: string): string[] {
  const kendi = makamDersId(makamId)
  return dersById(kendi) ? ['makam:giris', kendi] : ['makam:giris']
}

/** Ölçü, ölçü çizgisi ve nefes işareti dersi: usul etütlerinde ölçüler usule göre bölünür ve nefes (`,`) işareti çıkar. */
const OLCU_DERS_ID = 'okuma:olcu'

/**
 * Etütten önce sırayla okunacak dersler. Usul etüdünde önce ölçü ve nefes işareti, sonra usulün giriş ve kendi dersi;
 * makam dizisi etüdünde önce "Makam nedir?", sonra makamın dersi (son ders hep etüdün `dersId`'sidir); öteki etütlerde
 * yalnız kendi dersi. Okunmuş dersler `DersKapisi`'nde atlanır.
 */
export function etutDersleri(e: Pick<Etut, 'dersId' | 'usulId'>): string[] {
  if (e.usulId) return [OLCU_DERS_ID, ...usulDersleri(e.usulId)]
  // Makam dizisi etüdü: makam ekranındaki gibi önce "Makam nedir?", sonra makamın kendi dersi.
  if (e.dersId.startsWith('makam:')) return makamDersleri(e.dersId.slice('makam:'.length))
  return [e.dersId]
}
