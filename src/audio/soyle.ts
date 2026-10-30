import type { Vurus } from '../content/usuller'
import { sessizSes } from './sesSaati'
import type { SampleHost } from './usulSamples'

/**
 * İnsan sesi usul seçenekleri (Ayarlar → Usul sesi → "İnsan sesi (kadın/erkek)"): cihazın hazır Türkçe konuşma sesi
 * (Web Speech API, `speechSynthesis`) her vuruşun hecesini söyler. Heceler Strudel'de sessiz birer ses olarak çalar
 * (`usul_insan_<tür>_<hece>`); tetiklendiklerinde hece vuruş anına göre zamanlanıp söylenir. Böylece usulün çaldığı her
 * yer (ders, etüt, parça, usul vurma) aynı kodla insan sesini de çalar. Konuşma motoru ses saatinden bağımsız olduğu
 * için zamanlama kayıt sesleri kadar kesin değildir (deneme).
 */

export type SesTuru = 'kadin' | 'erkek'
export const SES_TURLERI: readonly SesTuru[] = ['kadin', 'erkek']

/** Hecenin ses adındaki karşılığı; `duum` ve `teek` 1 zamandan uzun düm ve tek'tir. */
export type HeceAdi = 'duum' | 'dum' | 'teek' | 'tek' | 'te' | 'ke'

/** Söylenen metin ve hız (1 = normal). Kısa heceler normal hızda (hızlandırınca kesik duyuluyordu); uzun düm ve tek yavaş. */
const HECELER: Record<HeceAdi, { metin: string; hiz: number }> = {
  duum: { metin: 'düüüm', hiz: 0.8 },
  dum: { metin: 'düm', hiz: 1 },
  teek: { metin: 'teeek', hiz: 0.8 },
  tek: { metin: 'tek', hiz: 1 },
  te: { metin: 'te', hiz: 1 },
  ke: { metin: 'ke', hiz: 1 },
}

export function heceAdi(v: Vurus): HeceAdi {
  if (v.ses === 'düm') return v.sure > 1 ? 'duum' : 'dum'
  if (v.ses === 'tek') return v.sure > 1 ? 'teek' : 'tek'
  return v.ses
}

/** Vuruşun Strudel ses adı. */
export function insanSesAdi(tur: SesTuru, v: Vurus): string {
  return `usul_insan_${tur}_${heceAdi(v)}`
}

/** Kod insan sesi çalıyorsa türünü döndürür (ses kaydı için). */
export function insanSesiInCode(code: string): SesTuru | null {
  const m = /\busul_insan_(kadin|erkek)_/.exec(code)
  return m ? (m[1] as SesTuru) : null
}

export function konusmaVar(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/** Bilinen erkek Türkçe sesler (iOS, Windows, Edge); adı "female" içeren ses erkek sayılmaz. */
function erkekMi(v: SpeechSynthesisVoice): boolean {
  return !/female|kadın/i.test(v.name) && /\b(cem|tolga|ahmet|erkek|male)\b/i.test(v.name)
}

/** Erkek ses bulunamazsa var olan ses kalınlaştırılır (perde 1 = normal). */
const KALIN = 0.6

export interface SesSecimi {
  ses: SpeechSynthesisVoice | undefined
  perde: number
  /** Ayarlar'da gösterilir: hangi ses çalıyor. */
  ad: string
}

/** Sesler bazı tarayıcılarda geç yüklendiği için her hecede yeniden seçilir. */
export function sesSec(tur: SesTuru): SesSecimi {
  const tr = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('tr'))
  const erkek = tr.find(erkekMi)
  if (tur === 'erkek') {
    if (erkek) return { ses: erkek, perde: 1, ad: erkek.name }
    const ses = tr[0]
    return { ses, perde: KALIN, ad: `${ses?.name ?? 'Türkçe ses'}, kalınlaştırılmış` }
  }
  const ses = tr.find((v) => !erkekMi(v)) ?? tr[0]
  return { ses, perde: 1, ad: ses?.name ?? 'Türkçe ses' }
}

function soyleHece(hece: HeceAdi, tur: SesTuru) {
  const { metin, hiz } = HECELER[hece]
  const secim = sesSec(tur)
  const s = new SpeechSynthesisUtterance(metin)
  s.lang = 'tr-TR'
  if (secim.ses) s.voice = secim.ses
  s.rate = hiz
  s.pitch = secim.perde
  // Önceki hece hâlâ sürüyorsa kesilir: sıraya girip sonraki vuruşları geciktirmesin.
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel()
  speechSynthesis.speak(s)
}

/**
 * iOS konuşmayı yalnızca kullanıcı hareketi içinde açar: dokunuşta (unlockAudio) sessiz bir söyleme yapılır, sonraki
 * heceler zamanlayıcıdan söylenebilir.
 */
export function konusmayiAc(): void {
  if (!konusmaVar()) return
  const s = new SpeechSynthesisUtterance(' ')
  s.volume = 0
  speechSynthesis.speak(s)
}

let zamanlayicilar = new Set<ReturnType<typeof setTimeout>>()

/** Zamanlanmış heceleri iptal eder, söyleneni keser (stopAudio çağırır). */
export function soylemeyiDurdur(): void {
  for (const z of zamanlayicilar) clearTimeout(z)
  zamanlayicilar = new Set()
  if (konusmaVar()) speechSynthesis.cancel()
}

/**
 * Konuşma motorunun "söyle" ile sesin duyulması arasındaki gecikme payı (ms, tahmin): hece vuruş anından bu kadar
 * önce söylenir. Strudel vuruşu ~0,1 sn önceden tetiklediği için hece pratikte tetiklenir tetiklenmez söylenir.
 */
const KONUSMA_GECIKMESI_MS = 100

/** `tur` sesinin hecelerini Strudel'e sessiz ses olarak kaydeder; her tetiklenişte hece vuruş anında söylenir. */
export function kaydetInsanSesi(host: SampleHost, tur: SesTuru): void {
  for (const hece of Object.keys(HECELER) as HeceAdi[]) {
    host.registerSound(
      `usul_insan_${tur}_${hece}`,
      (time, _value, onended) => {
        const ctx = host.getAudioContext()
        // Sessiz düğüm: superdough zinciri bir ses kaynağı bekler.
        const ses = sessizSes(host, time, onended)
        if (konusmaVar()) {
          const z = setTimeout(
            () => {
              zamanlayicilar.delete(z)
              soyleHece(hece, tur)
            },
            Math.max(0, (time - ctx.currentTime) * 1000 - KONUSMA_GECIKMESI_MS),
          )
          zamanlayicilar.add(z)
        }
        return ses
      },
      { type: 'sample' },
    )
  }
}
