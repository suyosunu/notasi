import { NEFES_HEDEF_ID } from '../learning/baspare'
import { ETUTLER } from './etutler'
import type { PerdeId } from './ney-perdeler'

// Seviyeler ve geçme ölçütleri (yol haritası §1, karar §4.2 b: hiçbir şey kilitlenmez).
// Sayısal hedefler (süre, sent) öneridir; kaynaklar kesin değer vermez.

export type HedefOlcut =
  | { tur: 'ders'; dersId: string }
  | { tur: 'onay' } // hedef.id onaylananHedefler'de mi
  | { tur: 'ilk-ses' }
  | { tur: 'uzun-ses'; perdeId: PerdeId; ms: number; cent: number }
  | { tur: 'baspare' }
  | { tur: 'konular'; topicIds: string[] }
  | { tur: 'etutler'; etutIds: string[] }

export interface Hedef {
  id: string
  metin: string
  olcut: HedefOlcut
  /** Hedefe götüren ekranın rotası (varsa "Git" bağlantısı). */
  rota?: string
}

export interface Seviye {
  no: number
  ad: string
  sure: string
  ozet: string
  hedefler: Hedef[]
}

const BES_SES: { id: PerdeId; ad: string }[] = [
  { id: 'neva', ad: 'Nevâ' },
  { id: 'cargah', ad: 'Çârgâh' },
  { id: 'segah', ad: 'Segâh' },
  { id: 'dugah', ad: 'Dügâh' },
  { id: 'rast', ad: 'Rast' },
]

const dersRotasi = (dersId: string): string => '/ders/' + encodeURIComponent(dersId)

const SEVIYE_0: Hedef[] = [
  {
    id: 's0-tani',
    metin: 'Neyin bölümlerini öğrendim',
    olcut: { tur: 'ders', dersId: 's0:neyi-tani' },
    rota: dersRotasi('s0:neyi-tani'),
  },
  {
    id: 's0-durus',
    metin: 'Duruş ve tutuş dersini okudum',
    olcut: { tur: 'ders', dersId: 's0:durus' },
    rota: dersRotasi('s0:durus'),
  },
  {
    id: 's0-ayna',
    metin: 'Duruşumu ve tutuşumu aynada kontrol ettim',
    olcut: { tur: 'onay' },
    rota: dersRotasi('s0:durus'),
  },
  {
    id: NEFES_HEDEF_ID,
    metin: '4-4-4 nefes egzersizini tamamladım',
    olcut: { tur: 'onay' },
    rota: '/hazirlik/nefes',
  },
  { id: 's0-ilk-ses', metin: 'İlk sesi çıkardım', olcut: { tur: 'ilk-ses' }, rota: '/aksam' },
  {
    id: 's0-neva-5',
    metin: "Nevâ'da 5 sn kararlı ses (öneri: ±20 sent)",
    olcut: { tur: 'uzun-ses', perdeId: 'neva', ms: 5000, cent: 20 },
    rota: '/ney/neva',
  },
  {
    id: 's0-baspare',
    metin: "Başpâreyi koyunca Nevâ'yı aramadan buldum (10 denemenin 8'i)",
    olcut: { tur: 'baspare' },
    rota: '/hazirlik/baspare',
  },
]

const SEVIYE_1: Hedef[] = [
  {
    id: 's1-nota',
    metin: 'Nota okuma konuları',
    olcut: {
      tur: 'konular',
      topicIds: ['nota-1', 'sure-1', 'nota-2', 'sure-2', 'nota-3', 'sure-3', 'nota-4', 'nota-5', 'dizi-1', 'perde-1'],
    },
    rota: '/nota',
  },
  ...BES_SES.map(
    (p): Hedef => ({
      id: `s1-${p.id}-8`,
      metin: `${p.ad}: 8 sn uzun ses`,
      olcut: { tur: 'uzun-ses', perdeId: p.id, ms: 8000, cent: 20 },
      rota: `/ney/${p.id}`,
    }),
  ),
  {
    id: 's1-etut-iki',
    metin: 'Tek ve iki perde etütleri',
    olcut: { tur: 'etutler', etutIds: ETUTLER.filter((e) => e.tur !== 'besli').map((e) => e.id) },
    rota: '/ney',
  },
  {
    id: 's1-rast-besli',
    metin: 'Rast beşlisi etütleri ♩ = 60',
    olcut: { tur: 'etutler', etutIds: ['rast-besli-1', 'rast-besli-2'] },
    rota: '/etut/rast-besli-1',
  },
  { id: 's1-rast-gur', metin: 'Rast sesim gür ve sağlam çıkıyor', olcut: { tur: 'onay' } },
]

export const SEVIYELER: Seviye[] = [
  {
    no: 0,
    ad: 'Hazırlık',
    sure: '1–3 hafta',
    ozet: 'Neyin bölümleri, duruş ve tutuş, nefes, ilk ses ve Nevâ uzun sesi.',
    hedefler: SEVIYE_0,
  },
  {
    no: 1,
    ad: 'İlk beş ses',
    sure: '3–10. hafta',
    ozet: 'Porte ve süreler; Nevâ, Çârgâh, Segâh, Dügâh, Rast uzun sesleri; tek ve iki perde etütleri; rast beşlisi.',
    hedefler: SEVIYE_1,
  },
  {
    no: 2,
    ad: 'Ara sesler, ilk usuller',
    sure: '2,5–5. ay',
    ozet: 'Diyez, bemol ve koma işaretleri; Nim Hicaz, Kürdî, Bûselik; Nim Sofyan, Semâî ve Sofyan usulleri.',
    hedefler: [],
  },
  {
    no: 3,
    ad: 'Üçüncü kademe, ilk makam',
    sure: '5–9. ay',
    ozet: 'Hüseynî, Acem, Gerdâniye, Muhayyer ve kademe geçişleri; ilk makam Rast.',
    hedefler: [],
  },
  {
    no: 4,
    ad: 'Tiz sesler, basit makamlar',
    sure: '9–13. ay',
    ozet: 'Tiz sesler ve dil teknikleri; Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî, Hicaz; Aksak, Yürük Semâî, Devr-i Hindî.',
    hedefler: [],
  },
  {
    no: 5,
    ad: 'Dem ve köprü perdeler',
    sure: '13–17. ay',
    ozet: 'Dem sesler ve köprü perdeler; Segâh, Bûselik, Karcığar, Acemaşiran, Nihâvend; Düyek ve Aksak.',
    hedefler: [],
  },
  {
    no: 6,
    ad: 'Süslemeler',
    sure: '17–21. ay',
    ozet: 'Çarpma, portamento ve vibrato; Hüzzam, Sabâ, Mâhur, Hicazkâr, Nikriz; saz semaisinin tamamı.',
    hedefler: [],
  },
  {
    no: 7,
    ad: 'Taksime giriş',
    sure: '21–24. ay',
    ozet: 'Kaba ara sesler, geveşt ve farklı ahenkte ney; bildiğin makamlarda açış ve kısa taksim.',
    hedefler: [],
  },
]

/** Parça, makam ve usullerin önerildiği seviye (etiket olarak gösterilir; hiçbiri kilitli değildir). Dolap etiketsizdir. */
export const ONERILEN_SEVIYE: { parca: Record<string, number>; makam: Record<string, number>; usul: Record<string, number> } = {
  parca: { 'benim-adim-dertli-dolap': 2, 'hak-teala': 3, 'daglar-ile-taslar-ile': 4 },
  makam: { rast: 3, ussak: 4, hicaz: 4 },
  usul: { sofyan: 2, semai: 2, 'yuruk-semai': 4, duyek: 5, aksak: 5 },
}
