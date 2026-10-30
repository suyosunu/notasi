import { FFT_SIZE } from '../audio/mic'
import { NEY_PERDELER, type NeyPerde } from '../content/ney-perdeler'
import { soundingHz, type Tuning } from '../music/ahenk'
import { beats, type MusicEvent } from '../music/notation'
import { centsBetween, samePitch, type WrittenPitch } from '../music/pitch'
import { median } from './smoothing'

/** Hedefe uzaklığı bu kadar sentten az olan nota doğru sayılır. */
export const TAKIP_TOLERANS_SENT = 25
/** Bundan uzaksa nota pes/tiz değil, başka bir perde (yanlış) sayılır. */
export const YANLIS_PERDE_SENT = 70
/**
 * Bir koma (≈ 22.6 sent) toleranstan küçüktür; Bûselik yerine Segâh ya da Dik Kürdî yerine Kürdî doğru sayılmasın diye:
 * beklenen nota bir ney perdesiyse, çalınan sesin (katlanmış) en yakın perdesi başkaysa ve sapma en az bu kadarsa
 * nota yanlış sayılır.
 */
export const KOMA_AYIRT_SENT = 15
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
/** Tanılamada kısa/uzun nota ayrımı (sn): bundan kısa notalar `kisaNotalar`'da sayılır. */
const KISA_NOTA_S = 0.5
/** Penceredeki sesli örnek oranı bunun altındaysa nota `yok` sayılır. */
const EN_AZ_SESLI_ORAN = 0.3
/** `kisa` denetimi: nota bundan uzunsa (sn) son kısmı da dinlenir. */
const KISA_DENETIM_SURE_S = 0.75
/** Notanın son kısmındaki sesli oran bunun altındaysa nota `kisa`. */
const KISA_SESLI_ORAN = 0.25

export type TakipDurumu = 'dogru' | 'pes' | 'tiz' | 'yanlis' | 'yok' | 'kisa'
/** Beklenen nota: seçimin içindeki yeri, zamanı (sn, ses saati; tur başına göre), yazılı perdesi ve sesi. */
export interface BeklenenNota {
  olcu: number
  nota: number
  bas: number
  son: number
  perde: WrittenPitch
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
  /**
   * Oktav katlaması kapalıyken (`oktavKatla: false`) nota hedefin bir oktav altında (−1, `pes`) ya da üstünde (1, `tiz`)
   * çalındıysa; `sent` o zaman oktav içindeki sapmadır. Doğru oktavda ya da katlama açıkken yoktur.
   */
  oktav?: -1 | 1
}
/** `degerlendir` seçenekleri. */
export interface DegerlendirSecenek {
  /**
   * Hedefin ±1200 sent çevresi katlanır (oktav hatası doğru sayılır; varsayılan true). Kapalıyken bir oktav pes/tiz çalınan
   * nota `pes`/`tiz` olur ve `oktav` taşır (tiz etütlerinde oktav hatası asıl hatadır).
   */
  oktavKatla?: boolean
}
/**
 * Gecikmenin kaynağı: `olcum` = izden bulundu, `varsayilan` = yeterli eşleşme yok (kestirilemedi),
 * `sinir` = aralığın ucunda bulundu (gerçek gecikme aralığın dışında olabilir).
 */
export type GecikmeKaynagi = 'olcum' | 'varsayilan' | 'sinir'
/** Doğru sayılan ve değerlendirilen nota sayısı. */
export interface NotaSayimi {
  dogru: number
  toplam: number
}
export interface TakipSonucu {
  /** Değerlendirilen notalar (pencere çok kısa olanlar yoktur). */
  notalar: NotaSonucu[]
  gecikmeMs: number
  gecikmeKaynagi: GecikmeKaynagi
  /** Tüm örneklerde sesli olanların oranı (tanılama). */
  sesliOran: number
  /** Değerlendirilen notaların çekirdek pencerelerindeki (gecikme uygulanmış) sesli örnek oranı (tanılama). */
  pencereSesliOran: number
  /** Değerlendirilen notalardan 0.5 sn'den kısa olanlar ve geri kalanlar (tanılama). */
  kisaNotalar: NotaSayimi
  uzunNotalar: NotaSayimi
  /** Duyulan (`yok` olmayan) notaların |sent| ortancası; hiç yoksa null (tanılama). */
  ortancaSapmaSent: number | null
  /** Penceresi çok kısa olduğu için değerlendirilmeyen nota sayısı. */
  atlanan: number
}

/**
 * Seçili ölçülerin notaları (sus yok; `tie` ile bağlanan notalar ilkinde birleşir), `bas`/`son` = t0 + (girisVurus + vuruş) × 60 / bpm.
 * `olcu` indisi tüm etütteki indistir (`ilkOlcu` + dilim içi). Birleşen nota ilk notanın indislerini ve perdesini taşır;
 * bağ ölçü sınırını da aşabilir. Yalnız aynı perdeye bağlı `tie` birleşir (çalımla aynı kural);
 * farklı perdeye bağ iki ayrı nota verir. Kesik (`kesik`, staccato) nota yalnız ilk yarısında sesli beklenir: `son`
 * yarı noktadadır (çalımla aynı kural: bağlı zincirde yalnız son notanın kesiği sayılır); sonraki notanın `bas`ı değişmez.
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
  /** `bekleyen` notanın yazılı perdesi (bağın aynı perdeye olup olmadığını denetlemek için). */
  let bekleyenPerde: WrittenPitch | null = null
  let vurus = girisVurus
  for (let i = 0; i < olcu.length; i++) {
    for (let j = 0; j < olcu[i].length; j++) {
      const e = olcu[i][j]
      const bas = t0 + vurus * sn
      vurus += beats(e)
      const bitis = t0 + vurus * sn
      if (e.kind === 'rest') {
        // Sus, bağı koparır (bağlı nota susa bağlanmış olamaz; olsa bile ilk nota kendi süresiyle kalır).
        bekleyen = null
        continue
      }
      // Çalımla (`toToneEvents`) aynı kural: kesik nota, bir sonrakine aynı perdeyle bağlı değilse sürenin yarısında susar.
      const sonraki = olcu[i][j + 1] ?? olcu[i + 1]?.[0]
      const bagliDevam = e.tie && sonraki?.kind === 'note' && samePitch(e.pitch, sonraki.pitch)
      const son = e.kesik && !bagliDevam ? bas + (bitis - bas) / 2 : bitis
      // Çalımla (`toToneEvents`) aynı kural: yalnız aynı perdeye bağlı `tie` birleşir.
      if (bekleyen && bekleyenPerde && samePitch(bekleyenPerde, e.pitch)) bekleyen.son = son
      else {
        bekleyen = { olcu: ilkOlcu + i, nota: j, bas, son, perde: e.pitch, hz: soundingHz(e.pitch, tuning) }
        bekleyenPerde = e.pitch
        sonuc.push(bekleyen)
      }
      if (!e.tie) bekleyen = null
    }
  }
  return sonuc
}

/** Hedefe sent `c`; ±1200'e 100 sentten yakınsa o oktava katlanır: katlanmış sapma ve oktav kayması (−1 pes, 0 yok, 1 tiz). */
function oktavAyir(c: number): { sent: number; oktav: -1 | 0 | 1 } {
  for (const k of [-1, 1] as const) {
    const f = c - 1200 * k
    if (Math.abs(f) < OKTAV_KATLAMA_SENT) return { sent: f, oktav: k }
  }
  return { sent: c, oktav: 0 }
}

/** Hedefe sent; ±1200'e 100 sentten yakınsa o oktava katlanır (oktav hatası doğru sayılır). */
export function katlanmisSent(hz: number, hedefHz: number): number {
  return oktavAyir(centsBetween(hz, hedefHz)).sent
}

/** En yakın ney perdesinin kaydı (NEY_PERDELER, soundingHz ile; oktav katlanmadan). */
export function enYakinPerdeKaydi(hz: number, tuning: Tuning): NeyPerde {
  let sec = NEY_PERDELER[0]
  let en = Infinity
  for (const p of NEY_PERDELER) {
    const fark = Math.abs(centsBetween(hz, soundingHz(p.written, tuning)))
    if (fark < en) {
      en = fark
      sec = p
    }
  }
  return sec
}

/** En yakın ney perdesinin adı (NEY_PERDELER, soundingHz ile; oktav katlanmadan). */
export function enYakinPerde(hz: number, tuning: Tuning): string {
  return enYakinPerdeKaydi(hz, tuning).name
}

/** Zamana göre sıralı kopya (girdi değişmez; sıralı gelen izde sıralama ucuzdur). */
function zamanaGoreSirala(ornekler: TakipOrnegi[]): TakipOrnegi[] {
  return [...ornekler].sort((a, b) => a.t - b.t)
}

/** Sıralı izde `t >= bas` olan ilk örneğin indisi (ikili arama). */
function ilkIndis(sirali: TakipOrnegi[], bas: number): number {
  let lo = 0
  let hi = sirali.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sirali[mid].t < bas) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Sıralı izde `bas <= t <= son` aralığına düşen örnekler (dilim). */
function aralik(sirali: TakipOrnegi[], bas: number, son: number): TakipOrnegi[] {
  const i0 = ilkIndis(sirali, bas)
  let i1 = i0
  while (i1 < sirali.length && sirali[i1].t <= son) i1++
  return sirali.slice(i0, i1)
}

/**
 * Çalma gecikmesini (ms) ve kaynağını bulur: her aday gecikmede, nota aralıklarına düşen ve hedefe ±50 sent yakın
 * sesli örnekleri sayar; en çok eşleşen aday kazanır (eşitlikte varsayılana yakın olan).
 * Yeterli eşleşme yoksa (en iyi puan sesli örneklerin %20'sinden ya da 5'ten azsa) varsayılan döner (`varsayilan`);
 * kazanan aralığın ucundaysa `sinir`, değilse `olcum`.
 * `ornekler` zamana göre sıralı olmak zorunda değildir (sıralı bir kopya üzerinde çalışılır, girdi değişmez);
 * her aday ve nota için pencerenin başı ikili aramayla bulunur, yalnız pencere içi örnekler gezilir.
 */
export function gecikmeKestir(notalar: BeklenenNota[], ornekler: TakipOrnegi[]): { ms: number; kaynak: GecikmeKaynagi } {
  const sesli = zamanaGoreSirala(ornekler.filter((o) => o.hz !== null))
  let enIyiPuan = -1
  let enIyi = VARSAYILAN_GECIKME_MS
  for (let d = GECIKME_ARALIGI_MS[0]; d <= GECIKME_ARALIGI_MS[1]; d += 10) {
    const kayma = d / 1000
    let puan = 0
    for (const n of notalar) {
      const bas = n.bas + kayma
      const son = n.son + kayma
      for (let i = ilkIndis(sesli, bas); i < sesli.length && sesli[i].t <= son; i++) {
        if (Math.abs(katlanmisSent(sesli[i].hz as number, n.hz)) <= GECIKME_ESLESME_SENT) puan++
      }
    }
    if (puan > enIyiPuan || (puan === enIyiPuan && Math.abs(d - VARSAYILAN_GECIKME_MS) < Math.abs(enIyi - VARSAYILAN_GECIKME_MS))) {
      enIyiPuan = puan
      enIyi = d
    }
  }
  if (enIyiPuan < 5 || enIyiPuan < 0.2 * sesli.length) return { ms: VARSAYILAN_GECIKME_MS, kaynak: 'varsayilan' }
  return { ms: enIyi, kaynak: enIyi === GECIKME_ARALIGI_MS[0] || enIyi === GECIKME_ARALIGI_MS[1] ? 'sinir' : 'olcum' }
}

/** Çalma gecikmesi (ms); kaynağıyla birlikte: `gecikmeKestir`. */
export function gecikmeBul(notalar: BeklenenNota[], ornekler: TakipOrnegi[]): number {
  return gecikmeKestir(notalar, ornekler).ms
}

/**
 * Notaları çalınan izle karşılaştırır. Önce gecikme bulunur ve bütün nota pencerelerine uygulanır;
 * her notanın çekirdek penceresi (başı: geçiş/atak payı, sonu: nefes payı) içindeki sesli örneklerin
 * katlanmış sent medyanı notayı sınıflar. Beklenen nota bir ney perdesiyse ve medyan sesin en yakın perdesi
 * başkaysa, sapma `KOMA_AYIRT_SENT` ve üstünde olunca nota yanlış sayılır (bir koma komşuları ayrılsın);
 * değilse eşikler: ≤ 25 doğru, ≤ 70 pes/tiz, ötesi yanlış. Pencere 0.04 sn'den kısaysa nota değerlendirilmez
 * (`atlanan`). Tanılama alanları (gecikme kaynağı, pencere içi sesli oran, kısa/uzun sayımı, ortanca sapma) da
 * döner. `ornekler` zamana göre sıralı olmak zorunda değildir (sıralı kopya kullanılır, girdi değişmez).
 * `oktavKatla: false` ise hedefin bir oktav altı/üstü çalınan nota katlanmaz: `pes`/`tiz` olur ve `oktav` taşır
 * (gecikme aramasında katlama her zaman açıktır).
 */
export function degerlendir(
  notalar: BeklenenNota[],
  ornekler: TakipOrnegi[],
  tuning: Tuning,
  secenek: DegerlendirSecenek = {},
): TakipSonucu {
  const oktavKatla = secenek.oktavKatla ?? true
  const { ms: gecikmeMs, kaynak: gecikmeKaynagi } = gecikmeKestir(notalar, ornekler)
  const kayma = gecikmeMs / 1000
  const sirali = zamanaGoreSirala(ornekler)
  const sonuc: NotaSonucu[] = []
  let atlanan = 0
  /** Değerlendirilen notaların pencerelerindeki örnek ve sesli örnek sayısı (tanılama). */
  let pencereOrnek = 0
  let pencereSesli = 0
  const kisaNotalar: NotaSayimi = { dogru: 0, toplam: 0 }
  const uzunNotalar: NotaSayimi = { dogru: 0, toplam: 0 }
  const say = (sure: number, r: NotaSonucu) => {
    const k = sure < KISA_NOTA_S ? kisaNotalar : uzunNotalar
    k.toplam++
    if (r.durum === 'dogru') k.dogru++
  }
  for (const n of notalar) {
    const sure = n.son - n.bas
    const bas = n.bas + kayma + Math.min(0.15, Math.max(0.06, 0.2 * sure))
    const son = n.son + kayma - 0.1 * sure
    if (son - bas < EN_KISA_PENCERE_S) {
      atlanan++
      continue
    }
    const pencere = aralik(sirali, bas, son)
    const sesli = pencere.filter((o): o is { t: number; hz: number } => o.hz !== null)
    pencereOrnek += pencere.length
    pencereSesli += sesli.length
    if (sesli.length < 2 || sesli.length / pencere.length < EN_AZ_SESLI_ORAN) {
      const r: NotaSonucu = { olcu: n.olcu, nota: n.nota, durum: 'yok', sent: null }
      sonuc.push(r)
      say(sure, r)
      continue
    }
    // Katlama kapalıyken ham medyan alınır, sonra oktava ayrılır (sapma oktav içinde ölçülür).
    const { sent: m, oktav } = oktavKatla
      ? { sent: median(sesli.map((o) => katlanmisSent(o.hz, n.hz))), oktav: 0 as const }
      : oktavAyir(median(sesli.map((o) => centsBetween(o.hz, n.hz))))
    // Bir koma komşusu: beklenen perde ney perdesiyse medyan sesin (katlanmış, beklenen oktavda) en yakın perdesine bakılır.
    const beklenenPerde = NEY_PERDELER.find((p) => samePitch(p.written, n.perde))
    const komsu =
      beklenenPerde && Math.abs(m) >= KOMA_AYIRT_SENT && Math.abs(m) <= YANLIS_PERDE_SENT
        ? enYakinPerdeKaydi(n.hz * 2 ** (m / 1200), tuning)
        : null
    let r: NotaSonucu
    if (komsu && komsu.id !== beklenenPerde?.id) r = { olcu: n.olcu, nota: n.nota, durum: 'yanlis', sent: m, calinan: komsu.name }
    else if (Math.abs(m) <= TAKIP_TOLERANS_SENT) r = { olcu: n.olcu, nota: n.nota, durum: 'dogru', sent: m }
    else if (Math.abs(m) <= YANLIS_PERDE_SENT) r = { olcu: n.olcu, nota: n.nota, durum: m < 0 ? 'pes' : 'tiz', sent: m }
    else r = { olcu: n.olcu, nota: n.nota, durum: 'yanlis', sent: m, calinan: enYakinPerde(median(sesli.map((o) => o.hz)), tuning) }
    if (oktav !== 0 && r.durum !== 'yanlis') r = { ...r, durum: oktav < 0 ? 'pes' : 'tiz', oktav }
    if (sure >= KISA_DENETIM_SURE_S && r.durum !== 'yanlis') {
      // Kuyrukta hiç örnek yoksa (kayıt notanın ortasında bitti) nota kısa sayılmaz; yalnız örnekli ama sessiz kuyruk sayılır.
      const kuyruk = aralik(sirali, n.son + kayma - 0.35 * sure, n.son + kayma - 0.05 * sure)
      if (kuyruk.length > 0 && kuyruk.filter((o) => o.hz !== null).length / kuyruk.length < KISA_SESLI_ORAN) {
        r = { ...r, durum: 'kisa' }
      }
    }
    sonuc.push(r)
    say(sure, r)
  }
  const sesliOran = ornekler.length ? ornekler.filter((o) => o.hz !== null).length / ornekler.length : 0
  const sapmalar = sonuc.filter((r) => r.sent !== null).map((r) => Math.abs(r.sent as number))
  return {
    notalar: sonuc,
    gecikmeMs,
    gecikmeKaynagi,
    sesliOran,
    pencereSesliOran: pencereOrnek ? pencereSesli / pencereOrnek : 0,
    kisaNotalar,
    uzunNotalar,
    ortancaSapmaSent: sapmalar.length ? median(sapmalar) : null,
    atlanan,
  }
}
