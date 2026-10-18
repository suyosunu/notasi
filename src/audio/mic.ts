import { PitchDetector } from 'pitchy'
import { audioSessionType } from './ios'

export interface PitchSample {
  t: number
  hz: number | null
  clarity: number
}

export const MIN_CLARITY = 0.9
export const MIN_HZ = 100
export const MAX_HZ = 2000
export const FFT_SIZE = 2048

/** Eşik dışı (belirsiz ya da aralık dışı) ölçümlerde hz = null olur. */
export function toSample(t: number, hz: number, clarity: number): PitchSample {
  const ok = Number.isFinite(hz) && clarity >= MIN_CLARITY && hz >= MIN_HZ && hz <= MAX_HZ
  return { t, hz: ok ? hz : null, clarity }
}

export class MicError extends Error {
  readonly reason: 'izin-yok' | 'desteklenmiyor' | 'acilamadi'
  /** Tanılama metni (hata adı/mesajı vb.); kullanıcıya küçük satırda gösterilir. */
  readonly detail?: string

  constructor(reason: 'izin-yok' | 'desteklenmiyor' | 'acilamadi', detail?: string) {
    super(reason)
    this.name = 'MicError'
    this.reason = reason
    this.detail = detail
  }
}

type AudioContextCtor = typeof AudioContext

/** Mikrofon izni geldikten sonra ses bağlamının çalışmaya başlaması için beklenen en uzun süre. */
export const RESUME_TIMEOUT_MS = 2000

/** `p` dönünce, `ms` dolunca ya da `signal` iptal edilince (hangisi önceyse) sonuçlanır; asla reddetmez. */
function settleWithin(p: Promise<unknown>, ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(id)
      signal?.removeEventListener('abort', done)
      resolve()
    }
    const id = setTimeout(done, ms)
    signal?.addEventListener('abort', done, { once: true })
    void p.then(done, done)
  })
}

function audioContextCtor(): AudioContextCtor | undefined {
  const w = globalThis as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext
}

function errorName(err: unknown): string {
  return typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : ''
}

function describeError(err: unknown): string {
  const name = errorName(err) || 'Error'
  const message =
    typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : ''
  return `${name}: ${message} (audioSession: ${audioSessionType() ?? 'yok'})`
}

/**
 * Mikrofonu açar ve her animasyon karesinde perde ölçer. Kullanıcı dokunuşundan
 * (iOS) çağrılmalıdır. Ses cihazdan çıkmaz; yalnızca yerel AnalyserNode'a gider.
 * Dönen fonksiyon akışı, döngüyü ve ses bağlamını kapatır (iki kez çağrılabilir).
 * `signal` başlatma sürerken iptal edilirse gelen izler hemen durdurulur ve `MicError` fırlatılır.
 */
export async function startPitchStream(
  onSample: (s: PitchSample) => void,
  signal?: AbortSignal,
): Promise<() => void> {
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
  const Ctx = audioContextCtor()
  if (!getUserMedia) throw new MicError('desteklenmiyor', 'getUserMedia yok')
  if (!Ctx) throw new MicError('desteklenmiyor', 'AudioContext yok')

  // Bağlam, dokunuş anında (await'ten önce) oluşturulur; iOS aksi halde askıda bırakabilir.
  let ctx: AudioContext
  try {
    ctx = new Ctx()
  } catch (err) {
    throw new MicError('acilamadi', describeError(err))
  }
  const resumed = ctx.resume().catch(() => undefined)

  let stream: MediaStream
  try {
    stream = await getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
  } catch (err) {
    void ctx.close().catch(() => undefined)
    const name = errorName(err)
    const detail = describeError(err)
    // Yalnızca açık izin reddi 'izin-yok'; geri kalan her şey 'acilamadi' (destek eksikliği sanılmasın).
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('izin-yok', detail)
    throw new MicError('acilamadi', detail)
  }

  const release = () => {
    for (const track of stream.getTracks()) track.stop()
    void ctx.close().catch(() => undefined)
  }
  if (signal?.aborted) {
    release()
    throw new MicError('acilamadi', 'iptal edildi')
  }
  // iOS bağlamı askıda bırakabilir: resume'u sınırlı bekle, çalışmıyorsa mikrofonu bırak.
  await settleWithin(resumed, RESUME_TIMEOUT_MS, signal)
  if (signal?.aborted) {
    release()
    throw new MicError('acilamadi', 'iptal edildi')
  }
  if (ctx.state !== 'running') {
    release()
    throw new MicError('acilamadi', 'AudioContext başlatılamadı')
  }

  let stopped = false
  let rafId = 0
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(rafId)
    release()
  }

  try {
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    ctx.createMediaStreamSource(stream).connect(analyser)
    const detector = PitchDetector.forFloat32Array(FFT_SIZE)
    const buffer = new Float32Array(FFT_SIZE)

    const tick = () => {
      if (stopped) return
      // Sonraki kare önce istenir: işleme sırasında bir hata döngüyü sessizce öldürmesin.
      rafId = requestAnimationFrame(tick)
      try {
        analyser.getFloatTimeDomainData(buffer)
        const [hz, clarity] = detector.findPitch(buffer, ctx.sampleRate)
        onSample(toSample(performance.now(), hz, clarity))
      } catch {
        // bu kare atlanır
      }
    }
    rafId = requestAnimationFrame(tick)
  } catch (err) {
    stop()
    throw new MicError('acilamadi', describeError(err))
  }
  return stop
}
