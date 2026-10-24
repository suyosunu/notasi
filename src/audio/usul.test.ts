import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))

const player = vi.hoisted(() => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playLoop: vi.fn((_code: string) => Promise.resolve()),
  stopAudio: vi.fn(),
}))
vi.mock('./player', () => player)

import { buildUsulPatternCode, startUsul, stopUsul } from './usul'

const usul = (id: string): Usul => USULLER.find((u) => u.id === id)!

beforeEach(() => {
  player.unlockAudio.mockReset().mockImplementation(() => Promise.resolve())
  player.playLoop.mockReset().mockImplementation(() => Promise.resolve())
  player.stopAudio.mockReset()
})

describe('buildUsulPatternCode', () => {
  it('Sofyan: düm (gövde + deri), te/ke (ton + tık) katmanları; cpm = bpm / zaman', () => {
    const code = buildUsulPatternCode(usul('sofyan'), 60)
    expect(code.startsWith('stack(')).toBe(true)
    expect(code).toContain('freq("65@2 ~@1 ~@1").s("sine")')
    expect(code).toContain('s("white@2 ~@1 ~@1")')
    expect(code).toContain('freq("~@2 450@1 450@1").s("sine")')
    expect(code).toContain('s("~@2 white@1 white@1")')
    // Vuruşlarla hizalı sönme deseni: 0.9 × vuruş süresi (saniye); bpm 60'ta 1 zaman = 1 sn.
    expect(code).toContain('.decay("1.8@2 0.9@1 0.9@1")')
    expect(code.endsWith('.cpm(15)')).toBe(true)
  })

  it('düm için perde zarfı (penv/pattack/pdecay), tek için bant geçiren filtre (bpf/bpq) kullanılır', () => {
    const code = buildUsulPatternCode(usul('duyek'), 80)
    expect(code).toMatch(
      /freq\("65@1 [^"]*"\)\.s\("sine"\)\.penv\(9\.11\)\.pattack\([\d.]+\)\.pdecay\(0\.12\)\.psustain\(0\)/,
    )
    expect(code).toMatch(/s\("~@1 white@2 white@1 ~@2 white@2"\)\.bpf\(3000\)\.bpq\(3\)/)
    expect(code).toMatch(/s\("white@1 ~@2 ~@1 white@2 ~@2"\)\.lpf\(\d+\)/)
    expect(code.endsWith('.cpm(10)')).toBe(true)
  })

  it('tek, te ve ke aynı ses; te 0.7×, ke 0.6× tek', () => {
    const code = buildUsulPatternCode(usul('aksak'), 60)
    const gains = [...code.matchAll(/\.gain\("([^"]*)"\)/g)].map((m) => m[1]!.split(' '))
    expect(gains).toHaveLength(2) // ton ve tık katmanı
    for (const g of gains) {
      const [te, ke, tek] = [g[1]!, g[2]!, g[4]!].map((x) => Number(x.split('@')[0]))
      expect(te! / tek!).toBeCloseTo(0.7, 2)
      expect(ke! / tek!).toBeCloseTo(0.6, 2)
    }
  })

  it('bpm mertebe birimine göredir: cpm = bpm / zaman', () => {
    expect(buildUsulPatternCode(usul('aksak'), 90).endsWith('.cpm(10)')).toBe(true)
    expect(buildUsulPatternCode(usul('semai'), 60).endsWith('.cpm(20)')).toBe(true)
  })

  it('Dolap (vuruş yok): zaman sayısı kadar tık, ilki vurgulu; tık süresi zaman birimine göre', () => {
    const code = buildUsulPatternCode(usul('dolap'), 60)
    expect(code.match(/800@1/g)).toHaveLength(11)
    expect(code).toContain('freq("1200@1 800@1')
    expect(code).toContain('.gain("0.9@1 0.5@1')
    expect(code).toContain('.s("sine")')
    expect(code).toContain('.decay(0.3)') // 0.3 × 1 sn
    expect(buildUsulPatternCode(usul('dolap'), 120)).toContain('.decay(0.15)')
    expect(code.endsWith('.cpm(5)')).toBe(true)
    expect(code).not.toContain('white')
    expect(code).not.toContain('stack(')
  })

  it('geçersiz tempoda RangeError', () => {
    expect(() => buildUsulPatternCode(usul('sofyan'), 0)).toThrow(RangeError)
    expect(() => buildUsulPatternCode(usul('sofyan'), Number.NaN)).toThrow(RangeError)
  })

  it('örnek ses dosyası kullanmaz: yalnızca sine ve white', () => {
    for (const u of USULLER) {
      const code = buildUsulPatternCode(u, 60)
      const sounds = [...code.matchAll(/\bs\("([^"]*)"\)/g)]
        .flatMap((m) => m[1]!.split(/[\s@\d~.]+/))
        .filter(Boolean)
      for (const s of sounds) expect(['sine', 'white']).toContain(s)
    }
  })
})

interface UsulHit {
  /** Başlangıç (saniye). */
  at: number
  /** Tutma süresi (saniye; clip dahil). */
  hold: number
  s?: string
  freq?: number
  gain?: number
  decay?: number
  sustain?: number
  release?: number
  penv?: number
  pdecay?: number
  bandf?: number
  cutoff?: number
}

describe('buildUsulPatternCode: gerçek Strudel çekirdeğiyle', () => {
  /**
   * Çekirdeğin cpm'i `fast(cpm / 60)` (cps = 1) olduğundan bir sorgu-döngüsü bir saniyedir
   * (gerçek zamanlayıcı cps'e böler, sonuç aynıdır). Bir ölçü zaman × 60 / bpm saniye sürer.
   */
  async function haps(u: Usul, bpm = 60): Promise<UsulHit[]> {
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { pattern } = await evaluate(buildUsulPatternCode(u, bpm), transpiler)
    return pattern
      .queryArc(0, (u.zaman * 60) / bpm)
      .filter((h) => h.hasOnset())
      .map((h) => ({ at: Number(h.whole.begin), hold: Number(h.duration), ...h.value }) as UsulHit)
      .sort((a, b) => a.at - b.at)
  }
  /** bpm 60'ta zaman birimi cinsinden konum. */
  const z = (h: UsulHit) => Math.round(h.at * 1e6) / 1e6

  it('Sofyan: düm 0 (gövde 65 Hz + deri), te ve ke 2 ve 3 (ton 450 Hz + tık)', async () => {
    const hs = await haps(usul('sofyan'))
    expect(hs.filter((h) => h.s === 'sine' && h.freq === 65).map(z)).toEqual([0])
    expect(hs.filter((h) => h.s === 'sine' && h.freq === 450).map(z)).toEqual([2, 3])
    expect(hs.filter((h) => h.s === 'white' && h.bandf === 3000).map(z)).toEqual([2, 3])
    expect(hs.filter((h) => h.s === 'white' && h.bandf === undefined).map(z)).toEqual([0])
  })

  it("Aksak: 2 zamanlık düm'ün sönme ve tutma süresi 1 zamanlık vuruşun ~2 katıdır", async () => {
    for (const bpm of [60, 90]) {
      const hs = await haps(usul('aksak'), bpm)
      const dum = hs.filter((h) => h.freq === 65)
      const tone = hs.filter((h) => h.freq === 450)
      expect(dum).toHaveLength(2)
      expect(tone).toHaveLength(4)
      const one = 60 / bpm // 1 zaman (sn)
      expect(dum[0]!.decay).toBeCloseTo(0.9 * 2 * one, 2)
      expect(tone[0]!.decay).toBeCloseTo(0.9 * one, 2) // te, 1 zaman
      expect(dum[0]!.decay! / tone[0]!.decay!).toBeCloseTo(2, 2)
      expect(dum[0]!.hold / tone[0]!.hold).toBeCloseTo(2, 6)
      // 2 zamanlık tek ile 1 zamanlık son tek
      expect(tone[2]!.decay! / tone[3]!.decay!).toBeCloseTo(2, 2)
      // düm duyulur biçimde tınlar (tık + sessizlik değil); tek düm'den az tınlar.
      expect(dum[0]!.sustain).toBeGreaterThanOrEqual(0.2)
      expect(tone[0]!.sustain).toBeLessThan(dum[0]!.sustain!)
    }
  })

  it("düm perdesi ~110 Hz'den ~65 Hz'e ~120 ms'de iner; deri vuruşu kısa; tek tıkı bant geçirenli (~3 kHz)", async () => {
    const hs = await haps(usul('aksak'))
    const dum = hs.find((h) => h.freq === 65)!
    expect(65 * 2 ** (dum.penv! / 12)).toBeCloseTo(110, 0)
    expect(dum.pdecay).toBeCloseTo(0.12, 3)
    const click = hs.find((h) => h.bandf !== undefined)!
    expect(click.bandf).toBeGreaterThanOrEqual(2500)
    expect(click.bandf).toBeLessThanOrEqual(3500)
    const skin = hs.find((h) => h.s === 'white' && h.cutoff !== undefined)!
    expect(skin.decay).toBeLessThanOrEqual(0.02)
  })

  it('hiçbir vuruşun sesi sonraki vuruşun başlangıcını aşmaz (her usul, yavaş ve hızlı tempolar)', async () => {
    for (const u of USULLER) {
      for (const bpm of [40, 60, 120, 200]) {
        const hs = await haps(u, bpm)
        const measure = (u.zaman * 60) / bpm
        const onsets = [...new Set(hs.map((h) => h.at)), measure].sort((a, b) => a - b)
        for (const h of hs) {
          const next = onsets.find((t) => t > h.at + 1e-9)!
          expect(h.release).toBeLessThanOrEqual(0.03)
          // tutma + sönüş; superdough düğümü sönüşten 10 ms sonra durdurur
          expect(h.at + h.hold + h.release! + 0.01).toBeLessThanOrEqual(next + 1e-6)
          // sönme tutma süresini aşmaz
          expect(h.decay!).toBeLessThanOrEqual(h.hold + 1e-6)
        }
      }
    }
  })

  it('Dolap: 12 tık, ilki 1200 Hz ve en yüksek sesli', async () => {
    const hs = await haps(usul('dolap'))
    expect(hs).toHaveLength(12)
    expect(hs[0]).toMatchObject({ freq: 1200, gain: 0.9 })
    for (const h of hs.slice(1)) expect(h).toMatchObject({ freq: 800, gain: 0.5 })
  })
})

describe('startUsul / stopUsul', () => {
  it('önce sesi açar, sonra döngü kodunu playLoop ile çalar', async () => {
    await startUsul(usul('sofyan'), 60)
    expect(player.unlockAudio).toHaveBeenCalledTimes(1)
    expect(player.playLoop).toHaveBeenCalledWith(buildUsulPatternCode(usul('sofyan'), 60))
    expect(player.unlockAudio.mock.invocationCallOrder[0]!).toBeLessThan(
      player.playLoop.mock.invocationCallOrder[0]!,
    )
  })

  it('unlockAudio dokunuş içinde eşzamanlı çağrılır (await öncesi)', () => {
    void startUsul(usul('sofyan'), 60)
    expect(player.unlockAudio).toHaveBeenCalledTimes(1)
  })

  it('ikinci başlatma yeniden playLoop çağırır (playLoop öncekini durdurur)', async () => {
    await startUsul(usul('sofyan'), 60)
    await startUsul(usul('duyek'), 90)
    expect(player.playLoop).toHaveBeenCalledTimes(2)
    expect(player.playLoop.mock.calls[1]![0]).toBe(buildUsulPatternCode(usul('duyek'), 90))
  })

  it('stopUsul stopAudio çağırır', () => {
    stopUsul()
    expect(player.stopAudio).toHaveBeenCalledTimes(1)
  })

  it('sesi açarken durdurulursa döngü başlamaz', async () => {
    let release: () => void = () => {}
    player.unlockAudio.mockImplementation(() => new Promise<void>((r) => (release = r)))
    const p = startUsul(usul('sofyan'), 60)
    stopUsul()
    release()
    await p
    expect(player.playLoop).not.toHaveBeenCalled()
  })

  it('sesi açarken yenisi başlatılırsa yalnızca sonuncusu çalar', async () => {
    const releases: (() => void)[] = []
    player.unlockAudio.mockImplementation(() => new Promise<void>((r) => releases.push(r)))
    const a = startUsul(usul('sofyan'), 60)
    const b = startUsul(usul('duyek'), 60)
    releases.forEach((r) => r())
    await Promise.all([a, b])
    expect(player.playLoop).toHaveBeenCalledTimes(1)
    expect(player.playLoop.mock.calls[0]![0]).toBe(buildUsulPatternCode(usul('duyek'), 60))
  })
})
