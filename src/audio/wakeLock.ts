/**
 * Uzun ses çalarken ekranın kararmasını önler (Screen Wake Lock). Destek yoksa ya da istek
 * reddedilirse sessizce vazgeçilir; ses çalma bundan etkilenmez.
 */
let sentinel: WakeLockSentinel | null = null
/** Her release'te artar; istek sürerken bırakılmışsa gelen kilit hemen bırakılır. */
let generation = 0
let pending: { gen: number; promise: Promise<void> } | null = null

function releaseSentinel(s: WakeLockSentinel): void {
  try {
    void Promise.resolve(s.release()).catch(() => {})
  } catch {
    // zaten bırakılmış olabilir
  }
}

export function acquireWakeLock(): Promise<void> {
  if (sentinel) return Promise.resolve()
  if (pending && pending.gen === generation) return pending.promise
  if (typeof navigator === 'undefined' || !navigator.wakeLock) return Promise.resolve()
  const mine = generation
  let request: Promise<WakeLockSentinel>
  try {
    request = navigator.wakeLock.request('screen')
  } catch {
    return Promise.resolve()
  }
  const promise = request.then(
    (s) => {
      if (mine !== generation || sentinel) releaseSentinel(s)
      else sentinel = s
    },
    () => {}, // izin yok / desteklenmiyor: yok say
  )
  pending = { gen: mine, promise }
  return promise
}

export function releaseWakeLock(): void {
  generation++
  pending = null
  const s = sentinel
  sentinel = null
  if (s) releaseSentinel(s)
}
