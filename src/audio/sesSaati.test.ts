import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ISARET_SESI, isaretiSifirla, kaydetIsaret, sessizSes, sonIsaret } from './sesSaati'
import type { SampleHost } from './usulSamples'

type Tetik = (time: number, value: unknown, onended: () => void) => unknown

const sounds = new Map<string, Tetik>()
const dugum = () => ({ connect: vi.fn((n: unknown) => n), start: vi.fn(), stop: vi.fn(), offset: { value: 1 } })
const ctx = { currentTime: 10, createConstantSource: vi.fn(dugum), createGain: vi.fn(dugum) }
const onceEnded = vi.fn((_src: unknown, cb: () => void) => cb())
const releaseAudioNode = vi.fn()
const host = {
  getAudioContext: () => ctx,
  registerSound: (key: string, fn: Tetik) => sounds.set(key, fn),
  onceEnded,
  releaseAudioNode,
} as unknown as SampleHost

beforeEach(() => {
  sounds.clear()
  isaretiSifirla()
  ctx.createConstantSource.mockClear()
  ctx.createGain.mockClear()
  onceEnded.mockClear()
  releaseAudioNode.mockClear()
})

describe('sessizSes', () => {
  it('time anında başlayan kısa sessiz kaynak döndürür; bitince düğümü bırakıp onended çağırır', () => {
    const onended = vi.fn()
    const r = sessizSes(host, 12, onended)
    const src = ctx.createConstantSource.mock.results[0]!.value
    expect(src.offset.value).toBe(0)
    expect(src.start).toHaveBeenCalledWith(12)
    expect(src.stop).toHaveBeenCalledWith(12.01)
    expect(releaseAudioNode).toHaveBeenCalledWith(src)
    expect(onended).toHaveBeenCalledTimes(1)
    expect(r.nodes.source).toEqual([src])
    expect(r.node).toBe(ctx.createGain.mock.results[0]!.value)
    expect(() => r.stop()).not.toThrow()
  })
})

describe('ses saati işareti', () => {
  it('kaydetIsaret notasi_isaret adını kaydeder', () => {
    kaydetIsaret(host)
    expect([...sounds.keys()]).toEqual([ISARET_SESI])
    expect(ISARET_SESI).toBe('notasi_isaret')
  })

  it('hiç tetiklenmediyse null; tetik zamanını tutar; sıfırlanınca null', () => {
    kaydetIsaret(host)
    expect(sonIsaret()).toBeNull()
    sounds.get(ISARET_SESI)!(12.5, {}, vi.fn())
    expect(sonIsaret()).toBe(12.5)
    sounds.get(ISARET_SESI)!(20, {}, vi.fn())
    expect(sonIsaret()).toBe(20)
    isaretiSifirla()
    expect(sonIsaret()).toBeNull()
  })

  it('tetik sessiz düğüm döndürür', () => {
    kaydetIsaret(host)
    const r = sounds.get(ISARET_SESI)!(12.5, {}, vi.fn()) as { nodes: { source: unknown[] } }
    expect(r.nodes.source).toHaveLength(1)
  })
})
