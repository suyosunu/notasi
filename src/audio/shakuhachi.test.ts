import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadShakuhachi,
  resetShakuhachiForTests,
  playbackRate,
  SHAKUHACHI_BASE_HZ,
  SHAKUHACHI_SOUND,
  SHAKUHACHI_URL,
  SHAKUHACHI_ZONE,
} from './shakuhachi'
import type { ShakuhachiHost } from './shakuhachi'

const root = resolve(__dirname, '../..')

describe('shakuhachi kaydı', () => {
  it('dosya public/ altında yereldir ve bir MP3 kaydıdır', () => {
    expect(SHAKUHACHI_URL).toBe('/sounds/shakuhachi.mp3')
    const bytes = readFileSync(resolve(root, 'public', SHAKUHACHI_URL.slice(1)))
    expect(bytes.subarray(0, 3).toString('latin1')).toBe('ID3')
    expect(bytes.length).toBeLessThan(64 * 1024)
  })

  it('PWA önbelleği mp3 dosyalarını da kapsar (çevrimdışı çalma)', () => {
    const config = readFileSync(resolve(root, 'vite.config.ts'), 'utf8')
    const globs = /globPatterns:\s*\[([^\]]*)\]/.exec(config)![1]!
    expect(globs).toMatch(/\{[^}]*\bmp3\b[^}]*\}/)
  })

  it('lisans metni kaydın yanında durur (MIT, Frank Wen)', () => {
    const text = readFileSync(resolve(root, 'public/sounds/LISANS.txt'), 'utf8')
    expect(text).toContain('Frank Wen')
    expect(text).toContain('Permission is hereby granted, free of charge')
  })
})

describe('playbackRate: koma doğruluğu', () => {
  it('kaydın kök perdesi Do5 (MIDI 72) ≈ 523.25 Hz', () => {
    expect(SHAKUHACHI_ZONE.originalPitch).toBe(7200)
    expect(SHAKUHACHI_BASE_HZ).toBeCloseTo(523.2511, 3)
    expect(playbackRate(SHAKUHACHI_BASE_HZ)).toBeCloseTo(1, 12)
  })

  it('istenen frekans yuvarlanmadan elde edilir (yarım ses adımına oturtulmaz)', () => {
    // Kız ahenkte Dügâh, Segâh (koma bemolü), Çârgâh, Nevâ ve bir koma farkı.
    for (const hz of [494.96, 527.85, 556.8, 742.43, 494.96 * 2 ** (1 / 53)]) {
      expect(playbackRate(hz) * SHAKUHACHI_BASE_HZ).toBeCloseTo(hz, 9)
    }
  })
})

function fakeHost() {
  const sources: {
    buffer: unknown
    playbackRate: { value: number }
    detune: object
    loop: boolean
    loopStart: number
    loopEnd: number
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    connect: (n: unknown) => unknown
  }[] = []
  const buffer = { duration: 2 }
  const ctx = {
    decodeAudioData: vi.fn((_d: ArrayBuffer) => Promise.resolve(buffer)),
    createBufferSource: vi.fn(() => {
      const src = {
        buffer: null as unknown,
        playbackRate: { value: 1 },
        detune: {},
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        start: vi.fn(),
        stop: vi.fn(),
        connect: (n: unknown) => n,
      }
      sources.push(src)
      return src
    }),
    createGain: vi.fn(() => ({ gain: {} })),
  }
  const host = {
    getAudioContext: () => ctx,
    registerSound: vi.fn(),
    getADSRValues: vi.fn((_v: unknown[]) => [0.03, 0.001, 1, 0.1]),
    getParamADSR: vi.fn(),
    getVibratoOscillator: vi.fn(() => undefined),
    onceEnded: vi.fn(),
    releaseAudioNode: vi.fn(),
  }
  return { host: host as unknown as ShakuhachiHost, raw: host, ctx, sources, buffer }
}

describe('loadShakuhachi', () => {
  beforeEach(() => resetShakuhachiForTests())

  it('dosyayı yükler, çözer ve yalnızca shakuhachi sesini kaydeder', async () => {
    const { host, raw, ctx } = fakeHost()
    const fetchFn = vi.fn((_u: string) => Promise.resolve(new Response(new ArrayBuffer(4))))
    await loadShakuhachi(host, fetchFn)
    expect(fetchFn).toHaveBeenCalledWith(SHAKUHACHI_URL)
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1)
    expect(raw.registerSound).toHaveBeenCalledTimes(1)
    expect(raw.registerSound.mock.calls[0]![0]).toBe(SHAKUHACHI_SOUND)
  })

  it('tetiklenince istenen frekansta, döngülü ve süresince çalar', async () => {
    const { host, raw, sources, buffer } = fakeHost()
    await loadShakuhachi(host, () => Promise.resolve(new Response(new ArrayBuffer(4))))
    const onTrigger = raw.registerSound.mock.calls[0]![1] as (
      t: number,
      v: Record<string, unknown>,
      onended: () => void,
    ) => { node: unknown }
    const handle = onTrigger(10, { freq: 527.85, duration: 0.5 }, () => {})
    expect(handle.node).toBeTruthy()
    const src = sources[0]!
    expect(src.buffer).toBe(buffer)
    expect(src.playbackRate.value * SHAKUHACHI_BASE_HZ).toBeCloseTo(527.85, 9)
    expect(src.loop).toBe(true)
    expect(src.loopStart).toBeCloseTo(SHAKUHACHI_ZONE.loopStart / SHAKUHACHI_ZONE.sampleRate, 9)
    expect(src.loopEnd).toBeCloseTo(SHAKUHACHI_ZONE.loopEnd / SHAKUHACHI_ZONE.sampleRate, 9)
    expect(src.start).toHaveBeenCalledWith(10, 0)
    // tutma sonu + release (0.1) + küçük pay
    expect(src.stop.mock.calls[0]![0]).toBeCloseTo(10.61, 9)
    expect(raw.getVibratoOscillator).toHaveBeenCalledWith(src.detune, expect.anything(), 10)
  })

  it('begin: 1 (bağlı ses) baştaki üfleme geçişini atlayıp döngü bölgesinden başlar', async () => {
    const { host, raw, sources } = fakeHost()
    await loadShakuhachi(host, () => Promise.resolve(new Response(new ArrayBuffer(4))))
    const onTrigger = raw.registerSound.mock.calls[0]![1] as (t: number, v: Record<string, unknown>, e: () => void) => void
    onTrigger(3, { freq: 440, duration: 0.5, begin: 1 }, () => {})
    expect(sources[0]!.start).toHaveBeenCalledWith(3, SHAKUHACHI_ZONE.loopStart / SHAKUHACHI_ZONE.sampleRate)
  })
})
