import { PitchDetector } from 'pitchy'

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
  readonly reason: 'izin-yok' | 'desteklenmiyor'

  constructor(reason: 'izin-yok' | 'desteklenmiyor') {
    super(reason)
    this.name = 'MicError'
    this.reason = reason
  }
}

type AudioContextCtor = typeof AudioContext

function audioContextCtor(): AudioContextCtor | undefined {
  const w = globalThis as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext
}

function errorName(err: unknown): string {
  return typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : ''
}

/**
 * Mikrofonu açar ve her animasyon karesinde perde ölçer. Kullanıcı dokunuşundan
 * (iOS) çağrılmalıdır. Ses cihazdan çıkmaz; yalnızca yerel AnalyserNode'a gider.
 * Dönen fonksiyon akışı, döngüyü ve ses bağlamını kapatır (iki kez çağrılabilir).
 */
export async function startPitchStream(onSample: (s: PitchSample) => void): Promise<() => void> {
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices)
  const Ctx = audioContextCtor()
  if (!getUserMedia || !Ctx) throw new MicError('desteklenmiyor')

  // Bağlam, dokunuş anında (await'ten önce) oluşturulur; iOS aksi halde askıda bırakabilir.
  const ctx = new Ctx()
  const resumed = ctx.resume().catch(() => undefined)

  let stream: MediaStream
  try {
    stream = await getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    await resumed
  } catch (err) {
    void ctx.close().catch(() => undefined)
    const name = errorName(err)
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new MicError('izin-yok')
    throw new MicError('desteklenmiyor')
  }

  let stopped = false
  let rafId = 0
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(rafId)
    for (const track of stream.getTracks()) track.stop()
    void ctx.close().catch(() => undefined)
  }

  try {
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    ctx.createMediaStreamSource(stream).connect(analyser)
    const detector = PitchDetector.forFloat32Array(FFT_SIZE)
    const buffer = new Float32Array(FFT_SIZE)

    const tick = () => {
      if (stopped) return
      analyser.getFloatTimeDomainData(buffer)
      const [hz, clarity] = detector.findPitch(buffer, ctx.sampleRate)
      onSample(toSample(performance.now(), hz, clarity))
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  } catch {
    stop()
    throw new MicError('desteklenmiyor')
  }
  return stop
}
