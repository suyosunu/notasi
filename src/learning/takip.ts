import { FFT_SIZE } from '../audio/mic'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { soundingHz, type Tuning } from '../music/ahenk'
import { beats, type MusicEvent } from '../music/notation'
import { centsBetween } from '../music/pitch'
import { median } from './smoothing'

/** Hedefe uzaklığı bu kadar sentten az olan nota doğru sayılır. */
export const TAKIP_TOLERANS_SENT = 25
/** Bundan uzaksa nota pes/tiz değil, başka bir perde (yanlış) sayılır. */
export const YANLIS_PERDE_SENT = 70
/** Çalma gecikmesi aday aralığı (ms, adım 10): negatif = erken, pozitif = geç. */
export const GECIKME_ARALIGI_MS: readonly [number, number] = [-100, 400]
/** Gecikme belirlenemezse varsayılan (ms): kulaklık/hoparlör + üfleme + analiz payı. */
export const VARSAYILAN_GECIKME_MS = 120
/** Perde analizinin baktığı pencerenin yarısı (sn); örnek damgasından düşülür. */
export const ANALIZ_PENCERESI_S = FFT_SIZE / 2 / 48000

/** Gecikme aramasında örnek, hedefe bu kadar sentten yakınsa "eşleşti" sayılır. */
const GECIKME_ESLESME_SENT = 50
/** Oktav hatası katlaması: hedefin ±1200 sent çevresinde bu kadar yakınlık. */
const OKTAV_KATLAMA_SENT = 100
/** Çekirdek pencerenin bundan kısaysa nota değerlendirilmez (sn). */
const EN_KISA_PENCERE_S = 0.04
/** Penceredeki sesli örnek oranı bunun altındaysa nota `yok` sayılır. */
const EN_AZ_SESLI_ORAN = 0.3
/** `kisa` denetimi: nota bundan uzunsa (sn) son kısmı da dinlenir. */
const KISA_DENETIM_SURE_S = 0.75
/** Notanın son kısmındaki sesli oran bunun altındaysa nota `kisa`. */
const KISA_SESLI_ORAN = 0.25

export type TakipDurumu = 'dogru' | 'pes' | 'tiz' | 'yanlis' | 'yok' | 'kisa'
/** Beklenen nota: seçimin içindeki yeri ve zamanı (sn, ses saati; tur başına göre). */
export interface BeklenenNota {
  olcu: number
  nota: number
  bas: number
  son: number
  hz: number
}
/** Mikrofon örneği; `t` ses saatindedir (sn), `hz` null ise o karede perde yoktur. */
export interface TakipOrnegi {
  t: number
  hz: number | null
}
export interface NotaSonucu {
  olcu: number
  nota: number
  durum: TakipDurumu
  /** Çekirdek penceredeki sesli örneklerin (katlanmış) medyan sapması; `yok` iken null. */
  sent: number | null
  /** 'yanlis' iken en yakın perdenin adı */
  calinan?: string
}
export interface TakipSonucu {
  /** Değerlendirilen notalar (pencere çok kısa olanlar yoktur). */
  notalar: NotaSonucu[]
  gecikmeMs: number
  /** Tüm örneklerde sesli olanların oranı (tanılama). */
  sesliOran: number
  /** Penceresi çok kısa olduğu için değerlendirilmeyen nota sayısı. */
  atlanan: number
}

/**
 * Seçili ölçülerin notaları (sus yok; `tie` ile bağlanan notalar ilkinde birleşir), `bas`/`son` = t0 + (girisVurus + vuruş) × 60 / bpm.
 * `olcu` indisi tüm etütteki indistir (`ilkOlcu` + dilim içi). Birleşen nota ilk notanın indislerini ve perdesini taşır;
 * bağ ölçü sınırını da aşabilir.
 */
export function beklenenNotalar(
  olcu: MusicEvent[][],
  ilkOlcu: number,
  tuning: Tuning,
  bpm: number,
  t0: number,
  girisVurus: number,
): BeklenenNota[] {
  const sn = 60 / bpm
  const sonuc: BeklenenNota[] = []
  /** Bağı süren (henüz kapanmamış) nota. */
  let bekleyen: BeklenenNota | null = null
  let vurus = girisVurus
  for (let i = 0; i < olcu.length; i++) {
    for (let j = 0; j < olcu[i].length; j++) {
      const e = olcu[i][j]
      const bas = t0 + vurus * sn
      vurus += beats(e)
      const son = t0 + vurus * sn
      if (e.kind === 'rest') {
        // Sus, bağı koparır (bağlı nota susa bağlanmış olamaz; olsa bile ilk nota kendi süresiyle kalır).
        bekleyen = null
        continue
      }
      if (bekleyen) bekleyen.son = son
      else {
        bekleyen = { olcu: ilkOlcu + i, nota: j, bas, son, hz: soundingHz(e.pitch, tuning) }
        sonuc.push(bekleyen)
      }
      if (!e.tie) bekleyen = null
    }
  }
  return sonuc
}

/** Hedefe sent; ±1200'e 100 sentten yakınsa o oktava katlanır (oktav hatası doğru sayılır). */
export function katlanmisSent(hz: number, hedefHz: number): number {
  const c = centsBetween(hz, hedefHz)
  for (const k of [-1, 1]) {
    const f = c - 1200 * k
    if (Math.abs(f) < OKTAV_KATLAMA_SENT) return f
  }
  return c
}

/** En yakın ney perdesi (NEY_PERDELER, soundingHz ile; oktav katlanmadan). */
export function enYakinPerde(hz: number, tuning: Tuning): string {
  let ad = NEY_PERDELER[0].name
  let en = Infinity
  for (const p of NEY_PERDELER) {
    const fark = Math.abs(centsBetween(hz, soundingHz(p.written, tuning)))
    if (fark < en) {
      en = fark
      ad = p.name
    }
  }
  return ad
}

/**
 * Çalma gecikmesini (ms) bulur: her aday gecikmede, nota aralıklarına düşen ve hedefe ±50 sent yakın
 * sesli örnekleri sayar; en çok eşleşen aday kazanır (eşitlikte varsayılana yakın olan).
 * Yeterli eşleşme yoksa (en iyi puan sesli örneklerin %20'sinden ya da 5'ten azsa) varsayılan döner.
 */
export function gecikmeBul(notalar: BeklenenNota[], ornekler: TakipOrnegi[]): number {
  const sesli = ornekler.filter((o) => o.hz !== null)
  let enIyiPuan = -1
  let enIyi = VARSAYILAN_GECIKME_MS
  for (let d = GECIKME_ARALIGI_MS[0]; d <= GECIKME_ARALIGI_MS[1]; d += 10) {
    const kayma = d / 1000
    let puan = 0
    for (const n of notalar) {
      const bas = n.bas + kayma
      const son = n.son + kayma
      for (const o of sesli) {
        if (o.t >= bas && o.t <= son && Math.abs(katlanmisSent(o.hz as number, n.hz)) <= GECIKME_ESLESME_SENT) puan++
      }
    }
    if (puan > enIyiPuan || (puan === enIyiPuan && Math.abs(d - VARSAYILAN_GECIKME_MS) < Math.abs(enIyi - VARSAYILAN_GECIKME_MS))) {
      enIyiPuan = puan
      enIyi = d
    }
  }
  if (enIyiPuan < 5 || enIyiPuan < 0.2 * sesli.length) return VARSAYILAN_GECIKME_MS
  return enIyi
}

/**
 * Notaları çalınan izle karşılaştırır. Önce gecikme bulunur ve bütün nota pencerelerine uygulanır;
 * her notanın çekirdek penceresi (başı: geçiş/atak payı, sonu: nefes payı) içindeki sesli örneklerin
 * katlanmış sent medyanı notayı sınıflar. Pencere 0.04 sn'den kısaysa nota değerlendirilmez (`atlanan`).
 */
export function degerlendir(notalar: BeklenenNota[], ornekler: TakipOrnegi[], tuning: Tuning): TakipSonucu {
  const gecikmeMs = gecikmeBul(notalar, ornekler)
  const kayma = gecikmeMs / 1000
  const sonuc: NotaSonucu[] = []
  let atlanan = 0
  for (const n of notalar) {
    const sure = n.son - n.bas
    const bas = n.bas + kayma + Math.min(0.15, Math.max(0.06, 0.2 * sure))
    const son = n.son + kayma - 0.1 * sure
    if (son - bas < EN_KISA_PENCERE_S) {
      atlanan++
      continue
    }
    const pencere = ornekler.filter((o) => o.t >= bas && o.t <= son)
    const sesli = pencere.filter((o): o is { t: number; hz: number } => o.hz !== null)
    if (sesli.length < 2 || sesli.length / pencere.length < EN_AZ_SESLI_ORAN) {
      sonuc.push({ olcu: n.olcu, nota: n.nota, durum: 'yok', sent: null })
      continue
    }
    const m = median(sesli.map((o) => katlanmisSent(o.hz, n.hz)))
    const r: NotaSonucu = { olcu: n.olcu, nota: n.nota, durum: 'dogru', sent: m }
    if (Math.abs(m) <= TAKIP_TOLERANS_SENT) r.durum = 'dogru'
    else if (Math.abs(m) <= YANLIS_PERDE_SENT) r.durum = m < 0 ? 'pes' : 'tiz'
    else {
      r.durum = 'yanlis'
      r.calinan = enYakinPerde(median(sesli.map((o) => o.hz)), tuning)
    }
    if (sure >= KISA_DENETIM_SURE_S && r.durum !== 'yanlis') {
      const kBas = n.son + kayma - 0.35 * sure
      const kSon = n.son + kayma - 0.05 * sure
      const kuyruk = ornekler.filter((o) => o.t >= kBas && o.t <= kSon)
      const oran = kuyruk.length ? kuyruk.filter((o) => o.hz !== null).length / kuyruk.length : 0
      if (oran < KISA_SESLI_ORAN) r.durum = 'kisa'
    }
    sonuc.push(r)
  }
  const sesliOran = ornekler.length ? ornekler.filter((o) => o.hz !== null).length / ornekler.length : 0
  return { notalar: sonuc, gecikmeMs, sesliOran, atlanan }
}
