import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { USULLER } from '../content/usuller'
import { hece, sesSec, soyleAdimlari, soylemeyiDurdur, soyleUsul } from './soyle'

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
    expect(a[1]!.hiz).toBe(1) // kısa hece normal hızda: hızlandırınca kesik duyuluyordu
  })

  it('1 zamanlık düm kısa yazılır; Dolap (vuruşsuz) boş', () => {
    expect(hece({ ses: 'düm', sure: 1 })).toBe('düm')
    expect(hece({ ses: 'tek', sure: 2 })).toBe('tek')
    expect(soyleAdimlari(usul('dolap'), 60, 1)).toEqual([])
  })
})

const YELDA = { lang: 'tr-TR', name: 'Yelda' }
const TOLGA = { lang: 'tr_TR', name: 'Microsoft Tolga - Turkish (Turkey)' }

describe('soyleUsul', () => {
  const spoken: { text: string; lang: string; rate: number; pitch: number; voice: unknown }[] = []
  class Utterance {
    lang = ''
    rate = 1
    pitch = 1
    voice: unknown = null
    text: string
    constructor(text: string) {
      this.text = text
    }
  }
  const synth = {
    speaking: false,
    pending: false,
    speak: vi.fn((u: Utterance) =>
      spoken.push({ text: u.text, lang: u.lang, rate: u.rate, pitch: u.pitch, voice: u.voice }),
    ),
    cancel: vi.fn(),
    getVoices: vi.fn((): { lang: string; name: string }[] => [YELDA]),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    spoken.length = 0
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

  it('erkek ses: Türkçe erkek ses varsa o, normal perdede', () => {
    synth.getVoices.mockImplementation(() => [YELDA, TOLGA])
    expect(sesSec('erkek')).toMatchObject({ ses: TOLGA, perde: 1, ad: TOLGA.name })
    expect(sesSec('kadin')).toMatchObject({ ses: YELDA, perde: 1, ad: 'Yelda' })
  })

  it('erkek ses yoksa kadın ses kalınlaştırılarak söylenir', () => {
    const p = soyleUsul(usul('sofyan'), 60, 1, 'erkek')
    expect(spoken[0]).toMatchObject({ text: 'düüüm', voice: YELDA })
    expect(spoken[0]!.pitch).toBeLessThan(1)
    expect(sesSec('erkek').ad).toBe('Yelda, kalınlaştırılmış')
    soylemeyiDurdur()
    return p
  })

  it('"female" adlı ses erkek sayılmaz', () => {
    const female = { lang: 'tr-TR', name: 'Turkish Female' }
    synth.getVoices.mockImplementation(() => [female])
    expect(sesSec('erkek')).toMatchObject({ ses: female, perde: 0.6 })
  })
})
