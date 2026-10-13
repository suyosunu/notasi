import { evaluate, getAudioContext, hush, initStrudel } from '@strudel/web'
import { setPlaybackSession } from './ios'
import { buildPatternCode, toToneEvents } from './pattern'
import type { ToneEvent } from './pattern'
import type { Tuning } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'

const TAIL_MS = 150

let initPromise: Promise<unknown> | null = null
let ready = false
let timer: ReturnType<typeof setTimeout> | null = null
let finishCurrent: (() => void) | null = null
let generation = 0

function ensureInit(): Promise<unknown> {
  if (!initPromise) {
    // prebake verilmez: ağdan örnek (sample) yüklenmez, uygulama çevrimdışı çalışır.
    initPromise = Promise.resolve(initStrudel()).then(
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

/** Yalnızca dokunuş (kullanıcı hareketi) işleyicilerinden çağrılır. */
export function unlockAudio(): Promise<void> {
  setPlaybackSession()
  const init = ensureInit()
  // iOS, AudioContext'i yalnızca kullanıcı hareketi içinde (eşzamanlı) açar.
  try {
    void getAudioContext().resume()
  } catch {
    // ses bağlamı yoksa init hatayı zaten bildirir
  }
  return init.then(() => undefined)
}

export function stopAudio(): void {
  generation++
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  const finish = finishCurrent
  finishCurrent = null
  if (ready) {
    try {
      hush()
    } catch {
      // zaten durmuş olabilir
    }
  }
  finish?.()
}

export async function playTones(events: ToneEvent[], bpm = 60): Promise<void> {
  stopAudio()
  const mine = generation
  if (events.length === 0) return
  const { code, durationMs } = buildPatternCode(events, bpm)
  await ensureInit()
  if (mine !== generation) return
  await evaluate(code)
  if (mine !== generation) return
  await new Promise<void>((resolve) => {
    finishCurrent = resolve
    timer = setTimeout(() => {
      timer = null
      finishCurrent = null
      try {
        hush()
      } finally {
        resolve()
      }
    }, durationMs + TAIL_MS)
  })
}

export function playWritten(events: MusicEvent[], t: Tuning, bpm = 60): Promise<void> {
  return playTones(toToneEvents(events, t), bpm)
}
