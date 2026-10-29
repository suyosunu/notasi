import type { Usul, Vurus } from '../content/usuller'

/**
 * Usulü insan sesiyle söyleme denemesi (Ayarlar → Usul sesi → "▶ Söyle"): cihazın hazır Türkçe konuşma sesi
 * (Web Speech API, `speechSynthesis`) her vuruşun hecesini vuruş anında söyler. Strudel'den bağımsızdır; zamanlama
 * `setTimeout` ve konuşma motorunun gecikmesine bağlı olduğu için tempoya tam oturmayabilir (deneme).
 */

/** 1 zamandan uzun düm uzatılarak yazılır; konuşma sesi onu da daha yavaş söyler. */
export function hece(v: Vurus): string {
  return v.ses === 'düm' && v.sure > 1 ? 'düüüm' : v.ses
}

/** Hece hızı (1 = normal): kısa heceler hızlı söylenir ki sonraki vuruşa taşmasın; uzun vuruş yavaş. */
const HIZLI = 1.4
const YAVAS = 0.8

export interface SoyleAdim {
  /** Başlangıçtan bu yana (ms). */
  at: number
  metin: string
  hiz: number
}

/** `olcu` ölçünün heceleri ve zamanları; `bpm` mertebe birimine göredir. */
export function soyleAdimlari(u: Usul, bpm: number, olcu: number): SoyleAdim[] {
  if (u.vurus === null) return []
  const birim = 60000 / bpm
  const adimlar: SoyleAdim[] = []
  let t = 0
  for (let i = 0; i < olcu; i++) {
    for (const v of u.vurus) {
      adimlar.push({ at: t * birim, metin: hece(v), hiz: v.sure > 1 ? YAVAS : HIZLI })
      t += v.sure
    }
  }
  return adimlar
}

export function konusmaVar(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

let zamanlayicilar: ReturnType<typeof setTimeout>[] = []
let bitir: (() => void) | null = null

export type SesTuru = 'kadin' | 'erkek'

/** Bilinen erkek Türkçe sesler (iOS, Windows, Edge); adı "female" içeren ses erkek sayılmaz. */
function erkekMi(v: SpeechSynthesisVoice): boolean {
  return !/female|kadın/i.test(v.name) && /\b(cem|tolga|ahmet|erkek|male)\b/i.test(v.name)
}

/** Erkek ses bulunamazsa var olan ses kalınlaştırılır (perde 1 = normal). */
const KALIN = 0.6

export interface SesSecimi {
  ses: SpeechSynthesisVoice | undefined
  perde: number
  /** Ayarlar'da gösterilir: hangi ses çaldı. */
  ad: string
}

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

function soyleHece(a: SoyleAdim, secim: SesSecimi) {
  const s = new SpeechSynthesisUtterance(a.metin)
  s.lang = 'tr-TR'
  if (secim.ses) s.voice = secim.ses
  s.rate = a.hiz
  s.pitch = secim.perde
  // Önceki hece hâlâ sürüyorsa kesilir: sıraya girip sonraki vuruşları geciktirmesin.
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel()
  speechSynthesis.speak(s)
}

/** Çalan söyleme varsa durdurur. */
export function soylemeyiDurdur(): void {
  for (const z of zamanlayicilar) clearTimeout(z)
  zamanlayicilar = []
  if (konusmaVar()) speechSynthesis.cancel()
  const b = bitir
  bitir = null
  b?.()
}

/**
 * Dokunuş işleyicisinden çağrılır: ilk hece eşzamanlı söylenir (iOS konuşmayı yalnızca kullanıcı hareketiyle açar).
 * Bitince ya da durdurulunca çözülür. Konuşma sesi yoksa hata fırlatır.
 */
export function soyleUsul(u: Usul, bpm: number, olcu = 2, tur: SesTuru = 'kadin'): Promise<void> {
  soylemeyiDurdur()
  if (!konusmaVar()) return Promise.reject(new Error('Bu cihazda konuşma sesi yok'))
  const adimlar = soyleAdimlari(u, bpm, olcu)
  if (adimlar.length === 0) return Promise.resolve()
  const secim = sesSec(tur)
  const sure = (olcu * u.zaman * 60000) / bpm
  return new Promise<void>((resolve) => {
    bitir = resolve
    for (const a of adimlar) {
      if (a.at === 0) soyleHece(a, secim)
      else zamanlayicilar.push(setTimeout(() => soyleHece(a, secim), a.at))
    }
    zamanlayicilar.push(
      setTimeout(() => {
        zamanlayicilar = []
        bitir = null
        resolve()
      }, sure),
    )
  })
}
