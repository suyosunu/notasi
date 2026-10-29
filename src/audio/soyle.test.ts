import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USULLER } from '../content/usuller'
import { hece, soyleAdimlari, soylemeyiDurdur, soyleUsul } from './soyle'

const usul = (id: string) => USULLER.find((u) => u.id === id)!

describe('soyleAdimlari', () => {
  it("Sofyan ♩ = 60, 2 ölçü: düüüm 0, te 2 sn, ke 3 sn; ikinci ölçü 4 sn'den", () => {
    const a = soyleAdimlari(usul('sofyan'), 60, 2)
    expect(a.map((x) => [x.at, x.metin])).toEqual([
      [0, 'düüüm'],
      [2000, 'te'],
      [3000, 'ke'],
      [4000, 'düüüm'],
      [6000, 'te'],
      [7000, 'ke'],
    ])
    expect(a[0]!.hiz).toBeLessThan(1) // uzun hece yavaş
    expect(a[1]!.hiz).toBeGreaterThan(1)
  })

  it('1 zamanlık düm kısa yazılır; Dolap (vuruşsuz) boş', () => {
    expect(hece({ ses: 'düm', sure: 1 })).toBe('düm')
    expect(hece({ ses: 'tek', sure: 2 })).toBe('tek')
    expect(soyleAdimlari(usul('dolap'), 60, 1)).toEqual([])
  })
})

describe('soyleUsul', () => {
  const spoken: { text: string; lang: string; rate: number }[] = []
  class Utterance {
    lang = ''
    rate = 1
    voice: unknown = null
    text: string
    constructor(text: string) {
      this.text = text
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    speak: vi.fn((u: Utterance) => spoken.push({ text: u.text, lang: u.lang, rate: u.rate })),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ lang: 'en-US' }, { lang: 'tr-TR', name: 'Yelda' }]),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    spoken.length = 0
    synth.speak.mockClear()
    synth.cancel.mockClear()
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  })
  afterEach(() => {
    soylemeyiDurdur()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ilk hece eşzamanlı söylenir (iOS dokunuşu); diğerleri zamanında; Türkçe; bitince çözülür', async () => {
    let done = false
    const p = soyleUsul(usul('sofyan'), 60, 1).then(() => (done = true))
    expect(spoken.map((s) => s.text)).toEqual(['düüüm'])
    expect(spoken[0]!.lang).toBe('tr-TR')
    vi.advanceTimersByTime(2000)
    expect(spoken.map((s) => s.text)).toEqual(['düüüm', 'te'])
    vi.advanceTimersByTime(1000)
    expect(spoken.map((s) => s.text)).toEqual(['düüüm', 'te', 'ke'])
    await Promise.resolve()
    expect(done).toBe(false)
    vi.advanceTimersByTime(1000)
    await p
    expect(done).toBe(true)
  })

  it('durdurulunca sonraki heceler söylenmez ve söz çözülür', async () => {
    const p = soyleUsul(usul('sofyan'), 60, 2)
    soylemeyiDurdur()
    await p
    vi.advanceTimersByTime(10000)
    expect(spoken.map((s) => s.text)).toEqual(['düüüm'])
    expect(synth.cancel).toHaveBeenCalled()
  })

  it('konuşma sesi yoksa reddedilir', async () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('speechSynthesis', undefined)
    // jsdom'da speechSynthesis hiç tanımlı değildir
    delete (window as { speechSynthesis?: unknown }).speechSynthesis
    await expect(soyleUsul(usul('sofyan'), 60)).rejects.toThrow()
  })
})
