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
  it('Sofyan: düm katmanı ve tek/te/ke gürültü katmanı, cpm = bpm / zaman', () => {
    expect(buildUsulPatternCode(usul('sofyan'), 60)).toBe(
      'stack(' +
        'freq("70@2 ~@1 ~@1").s("sine").attack(0.001).decay(0.3).sustain(0).gain(0.9), ' +
        's("~@2 white@1 white@1").decay(0.06).sustain(0).hpf(2000).gain("~@2 0.35@1 0.35@1")' +
        ').cpm(15)',
    )
  })

  it('Düyek: tek vuruşları te/ke vuruşlarından yüksek sesle (0.5) çalınır', () => {
    const code = buildUsulPatternCode(usul('duyek'), 80)
    expect(code).toContain('freq("70@1 ~@2 ~@1 70@2 ~@2")')
    expect(code).toContain('s("~@1 white@2 white@1 ~@2 white@2")')
    expect(code).toContain('.gain("~@1 0.5@2 0.5@1 ~@2 0.5@2")')
    expect(code.endsWith('.cpm(10)')).toBe(true)
  })

  it('bpm mertebe birimine göredir: cpm = bpm / zaman', () => {
    expect(buildUsulPatternCode(usul('aksak'), 90).endsWith('.cpm(10)')).toBe(true)
    expect(buildUsulPatternCode(usul('semai'), 60).endsWith('.cpm(20)')).toBe(true)
  })

  it('Dolap (vuruş yok): zaman sayısı kadar tık, ilki vurgulu (yüksek ve gürültülü)', () => {
    const code = buildUsulPatternCode(usul('dolap'), 60)
    expect(code.match(/800@1/g)).toHaveLength(11)
    expect(code).toContain('freq("1200@1 800@1')
    expect(code).toContain('.gain("0.9@1 0.5@1')
    expect(code).toContain('.s("sine")')
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

describe('buildUsulPatternCode: gerçek Strudel çekirdeğiyle', () => {
  /** bpm = 60: .cpm(60 / zaman) = fast(1 / zaman) ⇒ bir usul ölçüsü `zaman` sorgu-döngüsü sürer. */
  async function haps(u: Usul) {
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { pattern } = await evaluate(buildUsulPatternCode(u, 60), transpiler)
    return pattern
      .queryArc(0, u.zaman)
      .filter((h) => h.hasOnset())
      .map((h) => ({ at: Number(h.whole.begin) / u.zaman, ...h.value }))
      .sort((a, b) => a.at - b.at)
  }

  it('Sofyan: düm 0, gürültü 2/4 ve 3/4 (gain .35)', async () => {
    const hs = await haps(usul('sofyan'))
    expect(hs.map((h) => [h.at, h.s, h.freq ?? null, h.gain])).toEqual([
      [0, 'sine', 70, 0.9],
      [0.5, 'white', null, 0.35],
      [0.75, 'white', null, 0.35],
    ])
  })

  it('Aksak: 2 düm, 4 gürültü vuruşu; tek 0.5, te ve ke 0.35', async () => {
    const hs = await haps(usul('aksak'))
    expect(hs.filter((h) => h.s === 'sine').map((h) => Math.round(h.at * 9))).toEqual([0, 4])
    expect(hs.filter((h) => h.s === 'white').map((h) => [Math.round(h.at * 9), h.gain])).toEqual([
      [2, 0.35],
      [3, 0.35],
      [6, 0.5],
      [8, 0.5],
    ])
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
