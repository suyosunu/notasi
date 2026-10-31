import { NEFES_HEDEF_ID } from '../learning/baspare'
import { ETUTLER } from './etutler'
import { NEY_PERDELER } from './ney-perdeler'
import type { PerdeId } from './ney-perdeler'
import { USULLER } from './usuller'

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
  | { tur: 'usul-vurma'; usulId: string } // usulId vurulanUsuller'de mi

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
    olcut: { tur: 'etutler', etutIds: ETUTLER.filter((e) => e.tur === 'tek' || e.tur === 'iki').map((e) => e.id) },
    rota: '/ney',
  },
  {
    id: 's1-rast-besli',
    metin: 'Rast beşlisi etütleri ♩ = 60',
    olcut: { tur: 'etutler', etutIds: ['rast-besli-1', 'rast-besli-2'] },
    rota: '/etut/rast-besli-1',
  },
  { id: 's1-rast-gur', metin: 'Rast sesim gür ve sağlam çıkıyor', olcut: { tur: 'onay' } },
  {
    id: 's1-olcu',
    metin: 'Ölçü, ölçü çizgisi ve nefes işareti dersini okudum',
    olcut: { tur: 'ders', dersId: 'okuma:olcu' },
    rota: dersRotasi('okuma:olcu'),
  },
]

const ARA_SESLER: { id: PerdeId; ad: string }[] = [
  { id: 'buselik', ad: 'Bûselik' },
  { id: 'kurdi', ad: 'Kürdî' },
  { id: 'dik-kurdi', ad: 'Dik Kürdî' },
  { id: 'nim-hicaz', ad: 'Nim Hicaz' },
  { id: 'huseyni', ad: 'Hüseynî' },
]

// Seviye 2'nin usul sırası: Nim Sofyan → Semâî → Sofyan (kaynaklarda uzlaşı var).
const SEVIYE_2_USULLER = ['nim-sofyan', 'semai', 'sofyan']

const SEVIYE_2: Hedef[] = [
  {
    id: 's2-nota',
    metin: 'Koma işaretleri, ara sesler, onaltılık ve üçleme konuları',
    olcut: { tur: 'konular', topicIds: ['koma-1', 'koma-2', 'perde-3', 'perde-4', 'sure-4'] },
    rota: '/nota',
  },
  {
    id: 's2-ropriz',
    metin: 'Röpriz ve bağ dersini okudum',
    olcut: { tur: 'ders', dersId: 'okuma:ropriz' },
    rota: dersRotasi('okuma:ropriz'),
  },
  ...ARA_SESLER.map(
    (p): Hedef => ({
      id: `s2-${p.id}-8`,
      metin: `${p.ad}: 8 sn uzun ses`,
      olcut: { tur: 'uzun-ses', perdeId: p.id, ms: 8000, cent: 20 },
      rota: `/ney/${p.id}`,
    }),
  ),
  ...SEVIYE_2_USULLER.map((id): Hedef => {
    const ad = USULLER.find((u) => u.id === id)!.name
    return {
      id: `s2-vur-${id}`,
      metin: `${ad} usulünü vurdum`,
      olcut: { tur: 'usul-vurma', usulId: id },
      rota: `/usul/vur/${id}`,
    }
  }),
  {
    id: 's2-usul-etut',
    metin: 'Üç usulde birer etüt',
    olcut: { tur: 'etutler', etutIds: ['usul-nim-sofyan', 'usul-semai', 'usul-sofyan'] },
    rota: '/ney',
  },
  {
    id: 's2-dortlu',
    metin: 'Çârgâh, Kürdî ve Hicaz dörtlüleri',
    olcut: { tur: 'etutler', etutIds: ['dortlu-cargah', 'dortlu-kurdi', 'dortlu-hicaz'] },
    rota: '/ney',
  },
  {
    id: 's2-dil',
    metin: 'Dil ve bağ etüdü',
    olcut: { tur: 'etutler', etutIds: ['dil-1'] },
    rota: '/etut/dil-1',
  },
  {
    id: 's2-ezgi',
    metin: 'Bir ezgiyi ezbere çaldım (Benim Adım Dertli Dolap)',
    olcut: { tur: 'onay' },
    rota: '/parcalar/benim-adim-dertli-dolap',
  },
]

// Seviye 3'te 3. kademe perdeleri NEY_PERDELER sırasıyla (Acem … Nim Hisar) çalışılır; Hüseynî Seviye 2'de çalışılır.
const SEVIYE_3: Hedef[] = [
  {
    id: 's3-nota',
    metin: 'Perde adları: Acem, Gerdâniye, Muhayyer; Nim Şehnaz ve Nim Hisar',
    olcut: { tur: 'konular', topicIds: ['perde-2', 'perde-5'] },
    rota: '/nota',
  },
  ...NEY_PERDELER.filter((p) => p.kademe === 3 && p.id !== 'huseyni').map(
    (p): Hedef => ({
      id: `s3-${p.id}-8`,
      metin: `${p.name}: 8 sn uzun ses`,
      olcut: { tur: 'uzun-ses', perdeId: p.id, ms: 8000, cent: 20 },
      rota: `/ney/${p.id}`,
    }),
  ),
  {
    id: 's3-kademe',
    metin: 'Kademe geçiş etütleri',
    olcut: {
      tur: 'etutler',
      etutIds: ['kademe-dugah-huseyni', 'kademe-rast-kapali-neva', 'kademe-cargah-gerdaniye', 'kademe-ara', 'kademe-nim-hisar'],
    },
    rota: '/ney',
  },
  { id: 's3-gecis', metin: 'İkinci ve üçüncü kademe arasında sesim kırılmadan geçiyor', olcut: { tur: 'onay' } },
  {
    id: 's3-besli',
    metin: 'Beşli dersini okudum',
    olcut: { tur: 'ders', dersId: 'dortlu:besli' },
    rota: dersRotasi('dortlu:besli'),
  },
  {
    id: 's3-neva-besli',
    metin: "Nevâ'dan Rast ve Bûselik beşlisi etütleri",
    olcut: { tur: 'etutler', etutIds: ['neva-rast-besli', 'neva-buselik-besli'] },
    rota: '/ney',
  },
  {
    id: 's3-makam',
    metin: 'Makamın unsurları dersini okudum',
    olcut: { tur: 'ders', dersId: 'makam:giris' },
    rota: dersRotasi('makam:giris'),
  },
  {
    id: 's3-rast',
    metin: 'Rast dizisi (çıkışta Eviç, inişte Acem)',
    olcut: { tur: 'etutler', etutIds: ['dizi-rast'] },
    rota: '/etut/dizi-rast',
  },
  { id: 's3-neva', metin: 'Nevâ makamı dizisi', olcut: { tur: 'etutler', etutIds: ['dizi-neva'] }, rota: '/etut/dizi-neva' },
  {
    id: 's3-eser',
    metin: "Bir eseri metronomla çaldım (Yine Bağlandı Dil aranağmesi; öneri: tempo işaretinin %70'inden başla)",
    olcut: { tur: 'onay' },
    rota: '/parcalar/yine-baglandi-dil-aranagme',
  },
  {
    id: 's3-hak-teala',
    metin: "Hak Teâlâ'yı baştan sona çaldım",
    olcut: { tur: 'onay' },
    rota: '/parcalar/hak-teala',
  },
]

// Seviye 4'te 4. kademe (tiz) perdeleri NEY_PERDELER sırasıyla çalışılır; tizde süre kısa tutulur (öneri: 5 sn).
const SEVIYE_4_USULLER = ['turk-aksagi', 'yuruk-semai', 'devr-i-hindi']

const SEVIYE_4: Hedef[] = [
  {
    id: 's4-nota',
    metin: 'Tiz perde adları ve otuzikilik',
    olcut: { tur: 'konular', topicIds: ['perde-6', 'sure-5'] },
    rota: '/nota',
  },
  ...NEY_PERDELER.filter((p) => p.kademe === 4).map(
    (p): Hedef => ({
      id: `s4-${p.id}-5`,
      metin: `${p.name}: 5 sn uzun ses`,
      olcut: { tur: 'uzun-ses', perdeId: p.id, ms: 5000, cent: 20 },
      rota: `/ney/${p.id}`,
    }),
  ),
  {
    id: 's4-tiz',
    metin: 'Oktav etütleri',
    olcut: {
      tur: 'etutler',
      etutIds: ['tiz-segah-oktav', 'tiz-cargah-oktav', 'tiz-neva-oktav', 'kapali-oktav', 'tiz-nim-hicaz-oktav'],
    },
    rota: '/ney',
  },
  {
    id: 's4-dizi-tiz',
    metin: "Tiz Nevâ'ya kadar dizi",
    olcut: { tur: 'etutler', etutIds: ['dizi-ussak-tiz'] },
    rota: '/etut/dizi-ussak-tiz',
  },
  {
    id: 's4-dil',
    metin: 'Üç farklı artikülasyon (bağsız, bağlı, kesik)',
    olcut: { tur: 'etutler', etutIds: ['dil-2'] },
    rota: '/etut/dil-2',
  },
  ...SEVIYE_4_USULLER.map((id): Hedef => {
    const ad = USULLER.find((u) => u.id === id)!.name
    return {
      id: `s4-vur-${id}`,
      metin: `${ad} usulünü vurdum`,
      olcut: { tur: 'usul-vurma', usulId: id },
      rota: `/usul/vur/${id}`,
    }
  }),
  {
    id: 's4-usul-etut',
    metin: 'Türk Aksağı ve Devr-i Hindî etütleri',
    olcut: { tur: 'etutler', etutIds: ['usul-turk-aksagi', 'usul-devr-i-hindi'] },
    rota: '/ney',
  },
  {
    id: 's4-cesni',
    metin: 'Çeşni ve üçlüler dersini okudum',
    olcut: { tur: 'ders', dersId: 'dortlu:cesni' },
    rota: dersRotasi('dortlu:cesni'),
  },
  {
    id: 's4-makamlar',
    metin: 'Bayâtî, Hüseynî, Muhayyer, Kürdî ve Hicaz dizileri',
    olcut: { tur: 'etutler', etutIds: ['dizi-bayati', 'dizi-huseyni', 'dizi-muhayyer', 'dizi-kurdi', 'dizi-hicaz'] },
    rota: '/ney',
  },
  {
    id: 's4-ilahi',
    metin: 'Bir ilahiyi çaldım (Allah Emrin Tutalım ya da Dağlar ile Taşlar ile)',
    olcut: { tur: 'onay' },
    rota: '/parcalar/allah-emrin-tutalim',
  },
  {
    id: 's4-hane',
    metin: 'Bir eserin bir bölümünü metronomla çaldım (Gül Yüzlülerin ya da Hicran Oku aranağmesi)',
    olcut: { tur: 'onay' },
    rota: '/parcalar/gul-yuzlulerin',
  },
  { id: 's4-cecen', metin: "Çeçen Kızı'nı çaldım", olcut: { tur: 'onay' }, rota: '/parcalar/cecen-kizi' },
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
    ozet: 'Koma işaretleri, onaltılık ve üçleme; Bûselik, Kürdî, Dik Kürdî, Nim Hicaz, Hüseynî; Nim Sofyan, Semâî ve Sofyan usulleri; Çârgâh, Kürdî ve Hicaz dörtlüleri.',
    hedefler: SEVIYE_2,
  },
  {
    no: 3,
    ad: 'Üçüncü kademe, ilk makam',
    sure: '5–9. ay',
    ozet: "Acem'den Muhayyer'e üçüncü kademe, kapalı Nevâ, Eviç, Nim Şehnaz, Nim Hisar; kademe geçişleri; beşliler; Rast ve Nevâ makamları.",
    hedefler: SEVIYE_3,
  },
  {
    no: 4,
    ad: 'Tiz sesler, basit makamlar',
    sure: '9–13. ay',
    ozet: 'Tiz Segâh, Tiz Çârgâh, Tiz Nevâ, Tiz Nim Hicaz; kapalı Gerdâniye ve Muhayyer; bağsız, bağlı, kesik; Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî, Hicaz; Türk Aksağı, Yürük Semâî, Devr-i Hindî.',
    hedefler: SEVIYE_4,
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

/** Makam ve usullerin önerildiği seviye (etiket olarak gösterilir; hiçbiri kilitli değildir). Dolap etiketsizdir. Parça seviyesi notadan hesaplanır (learning/parca-seviye). */
export const ONERILEN_SEVIYE: { makam: Record<string, number>; usul: Record<string, number> } = {
  makam: { rast: 3, neva: 3, ussak: 4, bayati: 4, huseyni: 4, muhayyer: 4, kurdi: 4, hicaz: 4 },
  usul: {
    'nim-sofyan': 2,
    sofyan: 2,
    semai: 2,
    'yuruk-semai': 4,
    'yuruk-semai-64': 4,
    'turk-aksagi': 4,
    'devr-i-hindi': 4,
    duyek: 5,
    aksak: 5,
  },
}
