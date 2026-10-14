import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let nextResult: [number, number] = [440, 0.95]
vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: () => ({ findPitch: () => nextResult }),
  },
}))

import { FFT_SIZE, MicError, startPitchStream, toSample } from './mic'
import type { PitchSample } from './mic'

describe('toSample', () => {
  it('eşik içinde hz korunur', () => {
    expect(toSample(0, 440, 0.95).hz).toBe(440)
  })
  it('düşük netlikte hz null olur', () => {
    expect(toSample(0, 440, 0.5).hz).toBeNull()
  })
  it('aralık dışında hz null olur', () => {
    expect(toSample(0, 50, 0.99).hz).toBeNull()
    expect(toSample(0, 3000, 0.99).hz).toBeNull()
  })
  it('NaN hz null olur', () => {
    expect(toSample(0, Number.NaN, 0.99).hz).toBeNull()
  })
  it('t ve clarity korunur', () => {
    expect(toSample(12, 440, 0.95)).toEqual({ t: 12, hz: 440, clarity: 0.95 })
  })
})

function setMediaDevices(getUserMedia: unknown) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: getUserMedia === undefined ? undefined : { getUserMedia },
    configurable: true,
  })
}

describe('MicError', () => {
  it('neden ve ad taşır', () => {
    const e = new MicError('izin-yok')
    expect(e).toBeInstanceOf(Error)
    expect(e.reason).toBe('izin-yok')
    expect(e.name).toBe('MicError')
  })
})

describe('startPitchStream', () => {
  const trackStop = vi.fn()
  const close = vi.fn(() => Promise.resolve())
  const resume = vi.fn(() => Promise.resolve())
  let analyser: { fftSize: number; getFloatTimeDomainData: ReturnType<typeof vi.fn> }
  let rafCb: FrameRequestCallback | null
  let cancelRaf: ReturnType<typeof vi.fn>

  beforeEach(() => {
    trackStop.mockClear()
    close.mockClear()
    resume.mockClear()
    nextResult = [440, 0.95]
    analyser = { fftSize: 0, getFloatTimeDomainData: vi.fn() }
    class FakeCtx {
      sampleRate = 44100
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }))
      createAnalyser = vi.fn(() => analyser)
      resume = resume
      close = close
    }
    vi.stubGlobal('AudioContext', FakeCtx)
    rafCb = null
    cancelRaf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 7
    })
    vi.stubGlobal('cancelAnimationFrame', cancelRaf)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    setMediaDevices(undefined)
    Reflect.deleteProperty(navigator, 'audioSession')
  })

  it('mediaDevices yoksa desteklenmiyor fırlatır', async () => {
    setMediaDevices(undefined)
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ name: 'MicError', reason: 'desteklenmiyor' })
  })

  it('NotAllowedError izin-yok olur', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')))
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ reason: 'izin-yok' })
  })

  it('SecurityError izin-yok olur', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('no', 'SecurityError')))
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ reason: 'izin-yok' })
  })

  it('NotFoundError acilamadi olur', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('none', 'NotFoundError')))
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ reason: 'acilamadi' })
  })

  it('AbortError acilamadi olur', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('iptal', 'AbortError')))
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ reason: 'acilamadi' })
  })

  it('bilinmeyen hata (adsız) acilamadi olur, ayrıntı taşır', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new Error('garip')))
    const err = await startPitchStream(() => {}).catch((e: unknown) => e)
    expect((err as MicError).reason).toBe('acilamadi')
    expect((err as MicError).detail).toContain('garip')
  })

  it('akış açar, örnek üretir ve durdurucu her şeyi kapatır', async () => {
    const gum = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] })
    setMediaDevices(gum)
    const samples: PitchSample[] = []
    const stop = await startPitchStream((s) => samples.push(s))

    expect(gum).toHaveBeenCalledWith({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    expect(analyser.fftSize).toBe(FFT_SIZE)
    expect(resume).toHaveBeenCalled()

    rafCb?.(123)
    expect(samples).toHaveLength(1)
    expect(samples[0]).toMatchObject({ hz: 440, clarity: 0.95 })

    stop()
    expect(trackStop).toHaveBeenCalledTimes(1)
    expect(cancelRaf).toHaveBeenCalledWith(7)
    expect(close).toHaveBeenCalledTimes(1)

    stop() // ikinci çağrı güvenli
    expect(trackStop).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('durdurulduktan sonra örnek göndermez', async () => {
    setMediaDevices(vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] }))
    const samples: PitchSample[] = []
    const stop = await startPitchStream((s) => samples.push(s))
    const cb = rafCb
    stop()
    cb?.(1)
    expect(samples).toHaveLength(0)
  })

  it('NotReadableError acilamadi olur ve ayrıntıda hata adı ile oturum türü bulunur', async () => {
    Object.defineProperty(navigator, 'audioSession', { value: { type: 'playback' }, configurable: true })
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('meşgul', 'NotReadableError')))
    const err = await startPitchStream(() => {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(MicError)
    expect((err as MicError).reason).toBe('acilamadi')
    expect((err as MicError).detail).toContain('NotReadableError')
    expect((err as MicError).detail).toContain('meşgul')
    expect((err as MicError).detail).toContain('audioSession: playback')
  })

  it('audioSession yoksa ayrıntıda yok yazar', async () => {
    setMediaDevices(vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')))
    const err = await startPitchStream(() => {}).catch((e: unknown) => e)
    expect((err as MicError).reason).toBe('izin-yok')
    expect((err as MicError).detail).toContain('audioSession: yok')
  })

  it('getUserMedia yoksa sabit ayrıntı verir', async () => {
    setMediaDevices(undefined)
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ detail: 'getUserMedia yok' })
  })

  it('AudioContext yoksa sabit ayrıntı verir', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    setMediaDevices(vi.fn())
    await expect(startPitchStream(() => {})).rejects.toMatchObject({ detail: 'AudioContext yok' })
  })

  it('AudioContext kurucusu fırlatırsa MicError olur ve getUserMedia çağrılmaz', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new DOMException('kurulamadı', 'NotSupportedError')
        }
      },
    )
    const gum = vi.fn()
    setMediaDevices(gum)
    const err = await startPitchStream(() => {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(MicError)
    expect((err as MicError).reason).toBe('acilamadi')
    expect((err as MicError).detail).toContain('NotSupportedError')
    expect(gum).not.toHaveBeenCalled()
  })
})
