import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  heceAdi,
  insanSesAdi,
  insanSesiInCode,
  kaydetInsanSesi,
  konusmayiAc,
  sesSec,
  soylemeyiDurdur,
} from './soyle'
import type { SampleHost } from './usulSamples'

describe('hece adları', () => {
  it('1 zamandan uzun düm "duum", kısa düm "dum"; diğerleri kendi adıyla', () => {
    expect(heceAdi({ ses: 'düm', sure: 2 })).toBe('duum')
    expect(heceAdi({ ses: 'düm', sure: 1 })).toBe('dum')
    expect(heceAdi({ ses: 'tek', sure: 2 })).toBe('tek')
    expect(heceAdi({ ses: 'te', sure: 1 })).toBe('te')
    expect(insanSesAdi('erkek', { ses: 'ke', sure: 1 })).toBe('usul_insan_erkek_ke')
  })

  it('koddaki insan sesini bulur', () => {
    expect(insanSesiInCode('s("usul_insan_kadin_duum@2 usul_insan_kadin_te@1")')).toBe('kadin')
    expect(insanSesiInCode('s("usul_tahta_dum@2")')).toBeNull()
  })
})

const YELDA = { lang: 'tr-TR', name: 'Yelda' }
const TOLGA = { lang: 'tr_TR', name: 'Microsoft Tolga - Turkish (Turkey)' }

describe('konuşma sesi', () => {
  const spoken: { text: string; lang: string; rate: number; pitch: number; volume: number; voice: unknown }[] = []
  class Utterance {
    lang = ''
    rate = 1
    pitch = 1
    volume = 1
    voice: unknown = null
    text: string
    constructor(text: string) {
      this.text = text
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    speak: vi.fn((u: Utterance) => spoken.push({ ...u })),
    cancel: vi.fn(),
    getVoices: vi.fn((): { lang: string; name: string }[] => [YELDA]),
  }

  type Tetik = (time: number, value: { duration: number }, onended: () => void) => unknown
  /** Sahte Strudel: kaydedilen sesler ve ses saati (sn). */
  const sounds = new Map<string, Tetik>()
  const node = () => ({ connect: vi.fn((n: unknown) => n), start: vi.fn(), stop: vi.fn(), offset: { value: 1 } })
  const ctx = { currentTime: 10, createConstantSource: vi.fn(node), createGain: vi.fn(node) }
  const host = {
    getAudioContext: () => ctx,
    registerSound: (key: string, fn: Tetik) => sounds.set(key, fn),
    onceEnded: vi.fn(),
    releaseAudioNode: vi.fn(),
  } as unknown as SampleHost

  beforeEach(() => {
    vi.useFakeTimers()
    spoken.length = 0
    sounds.clear()
    synth.speaking = false
    synth.speak.mockClear()
    synth.cancel.mockClear()
    synth.getVoices.mockImplementation(() => [{ lang: 'en-US', name: 'Samantha' }, YELDA])
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  })
  afterEach(() => {
    soylemeyiDurdur()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('beş hece sessiz ses olarak kaydedilir', () => {
    kaydetInsanSesi(host, 'kadin')
    expect([...sounds.keys()].sort()).toEqual(
      ['dum', 'duum', 'ke', 'te', 'tek'].map((h) => `usul_insan_kadin_${h}`),
    )
  })

  it('tetiklenen hece vuruş anından konuşma gecikmesi kadar önce, Türkçe söylenir; uzun düm yavaş', () => {
    kaydetInsanSesi(host, 'kadin')
    sounds.get('usul_insan_kadin_duum')!(10.3, { duration: 1.5 }, () => {})
    vi.advanceTimersByTime(199)
    expect(spoken).toEqual([])
    vi.advanceTimersByTime(1)
    expect(spoken).toMatchObject([{ text: 'düüüm', lang: 'tr-TR', voice: YELDA, pitch: 1 }])
    expect(spoken[0]!.rate).toBeLessThan(1)
    sounds.get('usul_insan_kadin_te')!(10, { duration: 0.75 }, () => {})
    vi.advanceTimersByTime(0)
    expect(spoken[1]).toMatchObject({ text: 'te', rate: 1 })
  })

  it('önceki hece sürüyorsa kesilir ki sonraki vuruş gecikmesin', () => {
    kaydetInsanSesi(host, 'kadin')
    synth.speaking = true
    sounds.get('usul_insan_kadin_ke')!(10, { duration: 0.75 }, () => {})
    vi.advanceTimersByTime(0)
    expect(synth.cancel).toHaveBeenCalled()
    expect(spoken.map((s) => s.text)).toEqual(['ke'])
  })

  it('durdurulunca zamanlanmış heceler söylenmez', () => {
    kaydetInsanSesi(host, 'kadin')
    sounds.get('usul_insan_kadin_te')!(10.5, { duration: 0.75 }, () => {})
    soylemeyiDurdur()
    vi.advanceTimersByTime(1000)
    expect(spoken).toEqual([])
    expect(synth.cancel).toHaveBeenCalled()
  })

  it('erkek ses yoksa kadın ses kalınlaştırılarak söylenir', () => {
    kaydetInsanSesi(host, 'erkek')
    sounds.get('usul_insan_erkek_te')!(10, { duration: 0.75 }, () => {})
    vi.advanceTimersByTime(0)
    expect(spoken[0]).toMatchObject({ text: 'te', voice: YELDA })
    expect(spoken[0]!.pitch).toBeLessThan(1)
    expect(sesSec('erkek').ad).toBe('Yelda, kalınlaştırılmış')
  })

  it('erkek ses: Türkçe erkek ses varsa o, normal perdede', () => {
    synth.getVoices.mockImplementation(() => [YELDA, TOLGA])
    expect(sesSec('erkek')).toMatchObject({ ses: TOLGA, perde: 1, ad: TOLGA.name })
    expect(sesSec('kadin')).toMatchObject({ ses: YELDA, perde: 1, ad: 'Yelda' })
  })

  it('"female" adlı ses erkek sayılmaz', () => {
    const female = { lang: 'tr-TR', name: 'Turkish Female' }
    synth.getVoices.mockImplementation(() => [female])
    expect(sesSec('erkek')).toMatchObject({ ses: female, perde: 0.6 })
  })

  it('konuşmayı açma dokunuşta sessiz bir söyleme yapar', () => {
    konusmayiAc()
    expect(spoken).toMatchObject([{ volume: 0 }])
  })

  it('konuşma sesi olmayan cihazda hece yine sessiz ses olarak çalar, hiçbir şey söylenmez', () => {
    vi.unstubAllGlobals()
    delete (window as { speechSynthesis?: unknown }).speechSynthesis
    kaydetInsanSesi(host, 'kadin')
    expect(() => sounds.get('usul_insan_kadin_te')!(10, { duration: 0.75 }, () => {})).not.toThrow()
    expect(() => konusmayiAc()).not.toThrow()
    vi.advanceTimersByTime(1000)
    expect(spoken).toEqual([])
  })
})
