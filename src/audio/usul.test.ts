import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

import { ONE_SHOT } from './pattern'
import { buildUsulBody, buildUsulOnceCode, buildUsulPatternCode, startUsul, stopUsul } from './usul'
import { getUsulSesi, setUsulSesi, strokeSound } from './usulSamples'
import type { UsulSesi } from './usulSamples'

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
    expect(code).toContain('freq("250@2 ~@1 ~@1").s("triangle")') // telefonda duyulan orta gövde
    expect(code).toContain('s("white@2 ~@1 ~@1")')
    expect(code).toContain('freq("~@2 450@1 450@1").s("sine")')
    expect(code).toContain('s("~@2 white@1 white@1")')
    // Vuruşlarla hizalı sönme deseni: 0.9 × vuruş süresi (saniye); bpm 60'ta 1 zaman = 1 sn.
    expect(code).toContain('.decay("1.8@2 0.9@1 0.9@1")')
    expect(code).toContain('.clip("0.9@2 0.9@1 0.9@1")')
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
    expect(gains).toHaveLength(3) // ton, tık ve tını katmanı
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

  it('örnek ses dosyası kullanmaz: yalnızca sentez (sine, triangle) ve gürültü (white)', () => {
    for (const u of USULLER) {
      const code = buildUsulPatternCode(u, 60)
      const sounds = [...code.matchAll(/\bs\("([^"]*)"\)/g)]
        .flatMap((m) => m[1]!.split(/[\s@\d~.]+/))
        .filter(Boolean)
      for (const s of sounds) expect(['sine', 'triangle', 'white']).toContain(s)
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

  /** Tek'in bant geçirenli, süreye uyan alçak düzeyli tınısı (tık 3 kHz, tını TEK_RING_BPF). */
  const isRing = (h: UsulHit) => h.s === 'white' && h.bandf !== undefined && h.bandf !== 3000

  it("Aksak: 2 zamanlık düm'ün sönme ve tutma süresi 1 zamanlık vuruşun ~2 katıdır", async () => {
    for (const bpm of [60, 90]) {
      const hs = await haps(usul('aksak'), bpm)
      const dum = hs.filter((h) => h.freq === 65)
      const ring = hs.filter(isRing)
      expect(dum).toHaveLength(2)
      expect(ring).toHaveLength(4)
      const one = 60 / bpm // 1 zaman (sn)
      expect(dum[0]!.decay).toBeCloseTo(0.9 * 2 * one, 2)
      expect(ring[0]!.decay).toBeCloseTo(0.9 * one, 2) // te, 1 zaman
      expect(dum[0]!.decay! / ring[0]!.decay!).toBeCloseTo(2, 2)
      expect(dum[0]!.hold / ring[0]!.hold).toBeCloseTo(2, 3)
      // 2 zamanlık tek ile 1 zamanlık son tek
      expect(ring[2]!.decay! / ring[3]!.decay!).toBeCloseTo(2, 2)
      // düm davul gibi tutma boyunca neredeyse sıfıra söner (org gibi kesilmez)
      expect(dum[0]!.sustain).toBeGreaterThan(0)
      expect(dum[0]!.sustain).toBeLessThanOrEqual(0.1)
    }
  })

  it('düm, telefon hoparlöründe duyulan ≥ 150 Hz bir bileşen içerir; o da tutma boyunca süreye göre söner', async () => {
    const hs = await haps(usul('aksak'))
    const low = hs.filter((h) => h.freq === 65)
    const mid = hs.filter((h) => h.freq! >= 150 && h.penv !== undefined)
    expect(mid.every((h) => h.s === 'triangle' && h.freq === 250)).toBe(true)
    // perde zarfı alçak gövdeyle aynı oranda: ~420 Hz'den 250 Hz'e
    expect(250 * 2 ** (mid[0]!.penv! / 12)).toBeCloseTo(423, -1)
    expect(mid.map(z)).toEqual(low.map(z)) // her düm'de
    for (const [i, m] of mid.entries()) {
      expect(m.decay).toBeCloseTo(low[i]!.decay!, 6)
      expect(m.hold).toBeCloseTo(low[i]!.hold, 6)
      expect(m.decay).toBeCloseTo(m.hold, 2) // tutmanın tamamı boyunca
      expect(m.gain).toBeGreaterThanOrEqual(low[i]!.gain!) // küçük hoparlörde baskın
    }
  })

  it('düm başlangıcında katmanların toplam kazancı (alçak + orta + deri) ≤ 1.3: taşma payı', async () => {
    for (const u of USULLER.filter((x) => x.vurus !== null)) {
      const hs = await haps(u)
      const onset = (hs.find((h) => h.freq === 65)!).at
      const dumLayers = hs.filter((h) => h.at === onset && (h.penv !== undefined || h.cutoff !== undefined))
      expect(dumLayers).toHaveLength(3)
      expect(dumLayers.reduce((sum, h) => sum + h.gain!, 0)).toBeLessThanOrEqual(1.3)
    }
  })

  it('tek tonu (450 Hz) vuruş süresinden bağımsız kısadır (≤ 120 ms); süreye yalnızca alçak düzeyli tını uyar', async () => {
    for (const bpm of [40, 60]) {
      const hs = await haps(usul('aksak'), bpm)
      const tone = hs.filter((h) => h.freq === 450)
      expect(tone).toHaveLength(4)
      for (const t of tone) {
        expect(t.decay).toBeLessThanOrEqual(0.12)
        expect(t.sustain).toBe(0)
      }
      const ring = hs.filter(isRing)
      const dumMid = hs.find((h) => h.freq! >= 150 && h.penv !== undefined)!
      for (const r of ring) expect(r.gain).toBeLessThan(dumMid.gain!)
    }
  })

  it("düm perdesi ~110 Hz'den ~65 Hz'e ~120 ms'de iner; deri vuruşu kısa; tek tıkı bant geçirenli (~3 kHz)", async () => {
    const hs = await haps(usul('aksak'))
    const dum = hs.find((h) => h.freq === 65)!
    expect(65 * 2 ** (dum.penv! / 12)).toBeCloseTo(110, 0)
    expect(dum.pdecay).toBeCloseTo(0.12, 3)
    const click = hs.find((h) => h.bandf !== undefined && h.decay! < 0.05)!
    expect(click.bandf).toBeGreaterThanOrEqual(2500)
    expect(click.bandf).toBeLessThanOrEqual(3500)
    const skin = hs.find((h) => h.s === 'white' && h.cutoff !== undefined)!
    expect(skin.decay).toBeLessThanOrEqual(0.03)
    expect(skin.cutoff).toBeGreaterThanOrEqual(2000)
  })

  it('hiçbir vuruşun sesi sonraki vuruşun başlangıcını aşmaz; en hızlı tempolarda da ≥ 5 ms pay kalır', async () => {
    // ♪ 120: usul kaydırıcısının üst sınırı; ♪ 200: parçada Dolap ♩ = 100 (sekizlik 0.3 sn).
    for (const u of USULLER) {
      for (const bpm of [40, 60, 120, 200]) {
        const hs = await haps(u, bpm)
        const measure = (u.zaman * 60) / bpm
        const onsets = [...new Set(hs.map((h) => h.at)), measure].sort((a, b) => a - b)
        for (const h of hs) {
          const next = onsets.find((t) => t > h.at + 1e-9)!
          expect(h.release).toBeLessThanOrEqual(0.03)
          expect(h.release).toBeGreaterThanOrEqual(0.01) // superdough alt sınırı
          // tutma + sönüş + superdough'un 10 ms durdurma payı, sonraki vuruştan en az 5 ms önce biter
          expect(next - (h.at + h.hold + h.release! + 0.01)).toBeGreaterThanOrEqual(0.005 - 1e-9)
          // sönme tutma süresini aşmaz
          expect(h.decay!).toBeLessThanOrEqual(h.hold + 1e-9)
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

describe('usul sesi: kayıt tabanlı seçenekler (Konga, Tahta, Darbuka)', () => {
  const KAYITLI = ['konga', 'tahta', 'darbuka'] as const
  afterEach(() => setUsulSesi('oryantal'))

  /** Bir ölçünün vuruşları; bir sorgu-döngüsü 1 sn (bkz. yukarıdaki haps). */
  async function sampleHaps(u: Usul, bpm: number, ses: UsulSesi): Promise<UsulHit[]> {
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { pattern } = await evaluate(buildUsulPatternCode(u, bpm, ses), transpiler)
    return pattern
      .queryArc(0, (u.zaman * 60) / bpm)
      .filter((h) => h.hasOnset())
      .map((h) => ({ at: Number(h.whole.begin), hold: Number(h.duration), ...h.value }) as UsulHit)
      .sort((a, b) => a.at - b.at)
  }

  it("varsayılan ses 'oryantal': bugünkü sentez kodu aynen üretilir", () => {
    expect(getUsulSesi()).toBe('oryantal')
    for (const u of USULLER) {
      expect(buildUsulPatternCode(u, 60)).toBe(buildUsulPatternCode(u, 60, 'oryantal'))
    }
    setUsulSesi('konga')
    expect(buildUsulPatternCode(usul('sofyan'), 60)).toBe(buildUsulPatternCode(usul('sofyan'), 60, 'konga'))
  })

  it('her vuruş, vuruş zamanında doğru kayıtla çalar (düm/tek/te/ke eşlemesi)', async () => {
    for (const ses of KAYITLI) {
      for (const u of USULLER.filter((x) => x.vurus !== null)) {
        const hs = await sampleHaps(u, 60, ses)
        let t = 0
        const expected = u.vurus!.map((v) => {
          const at = t
          t += v.sure
          return [at, strokeSound(ses, v.ses)]
        })
        expect(hs.map((h) => [Math.round(h.at * 1e6) / 1e6, h.s])).toEqual(expected)
      }
    }
  })

  it('kayıt seçeneklerinde sentez katmanı yoktur; ses adları yalnızca usul_<ses>_ kayıtlarıdır', () => {
    for (const ses of KAYITLI) {
      const code = buildUsulPatternCode(usul('aksak'), 60, ses)
      const names = [...code.matchAll(/\bs\("([^"]*)"\)/g)].flatMap((m) => m[1]!.split(/[\s@\d.]+/)).filter(Boolean)
      expect(names.filter((n) => n !== '~').every((n) => n.startsWith(`usul_${ses}_`))).toBe(true)
      expect(code).not.toMatch(/white|sine|triangle|freq\(/)
    }
  })

  /** Kayıtların ilk 300 ms RMS düzeyi (dBFS; scripts/usul-sesleri.mjs çıktısı, tepe -1 dBFS'e normalleştirilmiş). */
  const RMS_DB = { konga: { dum: -14.7, tek: -16.3 }, tahta: { dum: -22.6, tek: -21.8 }, darbuka: { dum: -12.4, tek: -21.6 } }

  it("seviyeler: tek, düm'den 4-6 dB (RMS) kısık; te ve ke tek'in 0.7× ve 0.6×'i; kazançlar ≤ 1", async () => {
    for (const ses of KAYITLI) {
      const hs = await sampleHaps(usul('aksak'), 60, ses) // düm te ke düm tek tek
      const dum = hs[0]!.gain!
      const [te, ke, tek] = [hs[1]!.gain!, hs[2]!.gain!, hs[4]!.gain!]
      for (const g of [dum, te, ke, tek]) {
        expect(g).toBeGreaterThan(0)
        expect(g).toBeLessThanOrEqual(1)
      }
      const dB = (g: number) => 20 * Math.log10(g)
      const under = RMS_DB[ses].dum + dB(dum) - (RMS_DB[ses].tek + dB(tek))
      expect(under).toBeGreaterThanOrEqual(4)
      expect(under).toBeLessThanOrEqual(6)
      expect(te / tek).toBeCloseTo(0.7, 3)
      expect(ke / tek).toBeCloseTo(0.6, 3)
      expect(hs[3]!.gain).toBe(dum)
      expect(hs[5]!.gain).toBe(tek)
    }
  })

  it('hiçbir vuruş sonrakine taşmaz; en hızlı tempolarda da ≥ 5 ms pay kalır (clip/release sınırı)', async () => {
    for (const ses of KAYITLI) {
      for (const u of USULLER.filter((x) => x.vurus !== null)) {
        for (const bpm of [40, 60, 120, 200]) {
          const hs = await sampleHaps(u, bpm, ses)
          const measure = (u.zaman * 60) / bpm
          const onsets = [...hs.map((h) => h.at), measure]
          for (const [i, h] of hs.entries()) {
            const next = onsets[i + 1]!
            expect(h.release).toBeGreaterThanOrEqual(0.01)
            expect(h.release).toBeLessThanOrEqual(0.03)
            // tutma + bırakma + superdough'un (ve kayıt tetikleyicisinin) 10 ms durdurma payı
            expect(next - (h.at + h.hold + h.release! + 0.01)).toBeGreaterThanOrEqual(0.005 - 1e-9)
          }
        }
      }
    }
  })

  it('Dolap metronomu her seçenekte sentez tık olarak kalır', () => {
    for (const ses of KAYITLI) {
      expect(buildUsulPatternCode(usul('dolap'), 60, ses)).toBe(buildUsulPatternCode(usul('dolap'), 60, 'oryantal'))
    }
  })

  it('startUsul seçili usul sesini kullanır', async () => {
    setUsulSesi('darbuka')
    await startUsul(usul('sofyan'), 60)
    expect(player.playLoop).toHaveBeenCalledWith(buildUsulPatternCode(usul('sofyan'), 60, 'darbuka'))
    expect(player.playLoop.mock.calls[0]![0]).toContain('usul_darbuka_dum')
  })
})

describe('buildUsulOnceCode: bir ölçü, tek seferlik (Ayarlar → Dene)', () => {
  it('Sofyan ♩ = 80: bir ölçü (3 sn), o sesle; ölçüden sonra ses yok', async () => {
    const { code, durationMs } = buildUsulOnceCode(usul('sofyan'), 80, 'tahta')
    expect(durationMs).toBe(3000)
    expect(code).toBe(`${buildUsulBody(usul('sofyan'), 80, 'tahta')}${ONE_SHOT}.cpm(20)`)
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { pattern } = await evaluate(code, transpiler)
    // cpm(20) ⇒ bir ölçü 3 sorgu-döngüsü (cps = 1 kabulü).
    const hs = pattern.queryArc(0, 3).filter((h) => h.hasOnset())
    expect(hs.map((h) => (h.value as { s: string }).s)).toEqual(['usul_tahta_dum', 'usul_tahta_tek', 'usul_tahta_tek'])
    expect(pattern.queryArc(3, 300).filter((h) => h.hasOnset())).toEqual([])
  })

  it('geçersiz tempoda RangeError', () => {
    expect(() => buildUsulOnceCode(usul('sofyan'), 0, 'konga')).toThrow(RangeError)
  })
})
