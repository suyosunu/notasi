import { setPlaybackSession } from './ios'
import { buildPatternCode, toToneEvents } from './pattern'
import type { NeySesi, ToneEvent } from './pattern'
import { isaretiSifirla, ISARET_SESI, kaydetIsaret } from './sesSaati'
import { loadShakuhachi, SHAKUHACHI_SOUND } from './shakuhachi'
import { insanSesiInCode, kaydetInsanSesi, konusmayiAc, soylemeyiDurdur } from './soyle'
import { getUsulSesi, insanSesiMi, loadUsulSamples, usulSesiInCode } from './usulSamples'
import type { Tuning } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'

type StrudelWeb = typeof import('@strudel/web')

const TAIL_MS = 150

let strudelModule: StrudelWeb | null = null
let modulePromise: Promise<StrudelWeb> | null = null
let initPromise: Promise<unknown> | null = null
let ready = false
let timer: ReturnType<typeof setTimeout> | null = null
let finishCurrent: (() => void) | null = null
/** Her stopAudio/playTones'ta artar; eski çağrılar bununla bayatlığını anlar. */
let generation = 0
/** Şu an çalan (ya da başlatılmakta olan) playTones çağrısının belirteci; durdurulunca null. */
let active: number | null = null
/** Seçili ney sesi (Ayarlar). Açılışta ayarlardan yüklenir, Ayarlar'da değişince hemen uygulanır. */
let neySesi: NeySesi = 'shakuhachi'

export function setNeySesi(v: NeySesi): void {
  neySesi = v
}

export function getNeySesi(): NeySesi {
  return neySesi
}

/** Seçili usul sesi (Ayarlar → "Usul sesi"); durum usulSamples.ts'tedir, ney sesi gibi buradan da kullanılır. */
export { getUsulSesi, setUsulSesi } from './usulSamples'

/** Dil belirginliği (Ayarlar, 0–1); durum pattern.ts'tedir, bütün melodi çalımlarına uygulanır. */
export { getDilBelirginligi, setDilBelirginligi } from './pattern'

/**
 * Strudel'i (büyük paket) arka planda yükler. Kullanıcı hareketi gerekmez;
 * uygulama açılışında çağrılır ki dokunuş anında içe aktarma beklenmesin.
 */
export function preloadAudio(): Promise<void> {
  if (!modulePromise) {
    modulePromise = import('@strudel/web').then(
      (m) => {
        strudelModule = m
        return m
      },
      (err: unknown) => {
        modulePromise = null // sonraki denemede yeniden yüklensin
        throw err
      },
    )
  }
  return modulePromise.then(() => undefined)
}

function loadModule(): Promise<StrudelWeb> {
  void preloadAudio().catch(() => {})
  return modulePromise!
}

function ensureInit(m: StrudelWeb): Promise<unknown> {
  if (!initPromise) {
    // prebake verilmez: ağdan örnek (sample) yüklenmez, uygulama çevrimdışı çalışır.
    initPromise = Promise.resolve(m.initStrudel()).then(
      () => {
        ready = true
      },
      (err: unknown) => {
        initPromise = null // sonraki dokunuşta yeniden denenebilsin
        throw err
      },
    )
  }
  return initPromise
}

function startAudio(m: StrudelWeb): Promise<void> {
  const init = ensureInit(m)
  // iOS, AudioContext'i yalnızca kullanıcı hareketi içinde (eşzamanlı) açar.
  try {
    void m.getAudioContext().resume()
  } catch {
    // ses bağlamı yoksa init hatayı zaten bildirir
  }
  return init.then(() => undefined)
}

/**
 * Yalnızca dokunuş (kullanıcı hareketi) işleyicilerinden çağrılır. Strudel önceden
 * yüklenmişse resume'a kadar hiç await yoktur; değilse içe aktarma beklenir (en iyi çaba).
 */
export function unlockAudio(): Promise<void> {
  setPlaybackSession()
  if (insanSesiMi(getUsulSesi())) konusmayiAc()
  if (strudelModule) return startAudio(strudelModule)
  return loadModule().then(startAudio)
}

/**
 * Kod yerel kayıtları kullanıyorsa onları (her biri bir kez) yükler: shakuhachi ney sesi ve kayıt tabanlı usul sesi
 * (Konga, Tahta, Darbuka). İnsan sesi usulünün heceleri ve ses saati işareti dosyasızdır, yalnızca kaydedilir. Diğer sesler sentezdir.
 */
function ensureSounds(m: StrudelWeb, code: string): Promise<void> {
  const loads: Promise<void>[] = []
  if (code.includes(`s("${SHAKUHACHI_SOUND}")`)) loads.push(loadShakuhachi(m))
  const usulSesi = usulSesiInCode(code)
  if (usulSesi) loads.push(loadUsulSamples(m, usulSesi))
  const insan = insanSesiInCode(code)
  if (insan) kaydetInsanSesi(m, insan)
  if (code.includes(`s("${ISARET_SESI}")`)) kaydetIsaret(m)
  return Promise.all(loads).then(() => undefined)
}

function safeHush(): void {
  if (!ready || !strudelModule) return
  try {
    strudelModule.hush()
  } catch {
    // zaten durmuş olabilir
  }
}

export function stopAudio(): void {
  generation++
  active = null
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  const finish = finishCurrent
  finishCurrent = null
  safeHush()
  soylemeyiDurdur() // insan sesi: zamanlanmış heceler de susar
  isaretiSifirla()
  finish?.()
}

/**
 * Ses saati (sn), çıkış gecikmesi düşülmüş: kullanıcının o an duyduğu ana karşılık gelir. Strudel yüklenmediyse null.
 */
export function sesSaatiSimdi(): number | null {
  if (!strudelModule) return null
  const ctx = strudelModule.getAudioContext()
  return ctx.currentTime - (ctx.outputLatency || 0)
}

/** `voice` verilmezse seçili ney sesiyle çalar. */
export async function playTones(events: ToneEvent[], bpm = 60, voice: NeySesi = neySesi): Promise<void> {
  if (events.length === 0) {
    stopAudio()
    return
  }
  const { code, durationMs } = buildPatternCode(events, bpm, voice)
  return playCode(code, durationMs)
}

/**
 * Tek seferlik çalma: önce çalan her şeyi durdurur (aynı anda yalnızca bir ses), kodu evaluate eder ve
 * `durationMs` + kuyruk sonra susturur; bitince ya da durdurulunca çözülür. Kod kendi tek seferlik maskesini
 * ve `.cpm()`'ini taşır (bkz. buildPatternCode, buildCalismaCode).
 * `onStart`: evaluate başarıyla bitince ve çağrı hâlâ güncelse (durdurulmadı, yenisi devralmadı) bir kez çağrılır;
 * desenin ilk sesi bundan yaklaşık zamanlayıcının ileri bakışı kadar (~0.1 sn) sonra duyulur (bkz. UsulVurma).
 */
export async function playCode(code: string, durationMs: number, onStart?: () => void): Promise<void> {
  stopAudio()
  const mine = generation
  active = mine
  const m = await loadModule()
  await ensureInit(m)
  if (mine !== generation) return
  try {
    await ensureSounds(m, code)
    if (mine !== generation) return
    await m.evaluate(code)
  } catch (err) {
    if (mine !== generation) return // bayat çağrının hatası kimseyi ilgilendirmez
    active = null
    throw err
  }
  if (mine !== generation) {
    // evaluate sürerken durduruldu: desen şimdi başlamış olabilir. Başkası devralmadıysa sustur.
    if (active === null) safeHush()
    return
  }
  await new Promise<void>((resolve) => {
    finishCurrent = resolve
    timer = setTimeout(() => {
      timer = null
      finishCurrent = null
      if (active === mine) active = null
      try {
        safeHush()
      } finally {
        resolve()
      }
    }, durationMs + TAIL_MS)
    // Zamanlayıcı kurulduktan sonra: onStart fırlatırsa söz reddedilir ama ses yine süresinde susar.
    onStart?.()
  })
}

/**
 * Süresiz döngü: kodu maskesiz ve zamanlayıcısız çalar; `stopAudio()` ya da yeni bir çalma durdurana kadar sürer.
 * Önce çalan her şeyi durdurur (aynı anda yalnızca bir ses). Kod, döngüyü kendi `.cpm()` ile kurar.
 */
export async function playLoop(code: string): Promise<void> {
  stopAudio()
  const mine = generation
  active = mine
  const m = await loadModule()
  await ensureInit(m)
  if (mine !== generation) return
  try {
    await ensureSounds(m, code)
    if (mine !== generation) return
    await m.evaluate(code)
  } catch (err) {
    if (mine !== generation) return
    active = null
    throw err
  }
  if (mine !== generation && active === null) safeHush() // evaluate sürerken durduruldu; başkası devralmadıysa sustur
}

export function playWritten(events: MusicEvent[], t: Tuning, bpm = 60, voice: NeySesi = neySesi): Promise<void> {
  return playTones(toToneEvents(events, t), bpm, voice)
}
