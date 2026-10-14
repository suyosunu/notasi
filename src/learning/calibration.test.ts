import { describe, expect, it } from 'vitest'
import { komaToHz } from '../music/pitch'
import { seededRng } from '../util/rng'
import { CALIBRATION_REF, calibrate } from './calibration'

/** ±2 sent rastgele saçılma (tohumlu, deterministik). */
function samples(hz: number, n = 30, seed = 7): number[] {
  const rng = seededRng(seed)
  return Array.from({ length: n }, () => hz * 2 ** (((rng() * 2 - 1) * 2) / 1200))
}

describe('CALIBRATION_REF', () => {
  it('Nevâ: Re5', () => {
    expect(CALIBRATION_REF).toEqual({ step: 'D', octave: 5, acc: 0 })
  })
})

describe('calibrate', () => {
  it('659.97 Hz, seçili kız → kız, oktav 0, ayar ≈ 0', () => {
    const r = calibrate(samples(659.97), 'kiz')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tuning.ahenk).toBe('kiz')
    expect(r.tuning.octaveOffset).toBe(0)
    expect(Math.abs(r.tuning.tuningCents)).toBeLessThan(2)
    expect(r.matchesSelected).toBe(true)
  })

  it('330 Hz → kız, oktav -1', () => {
    const r = calibrate(samples(330.0), 'kiz')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tuning.ahenk).toBe('kiz')
    expect(r.tuning.octaveOffset).toBe(-1)
    expect(Math.abs(r.tuning.tuningCents)).toBeLessThan(2)
  })

  it('664 Hz → kız, ayar ≈ 10.5 sent', () => {
    const r = calibrate(samples(664.0), 'kiz')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tuning.ahenk).toBe('kiz')
    expect(r.tuning.tuningCents).toBeGreaterThan(9.5)
    expect(r.tuning.tuningCents).toBeLessThan(11.5)
  })

  it('586.69 Hz, seçili kız → mansur, matchesSelected false', () => {
    const r = calibrate(samples(586.69), 'kiz')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.tuning.ahenk).toBe('mansur')
    expect(r.tuning.octaveOffset).toBe(0)
    expect(r.matchesSelected).toBe(false)
  })

  it('10 örnek → az-veri', () => {
    expect(calibrate(samples(659.97, 10), 'kiz')).toEqual({ ok: false, reason: 'az-veri' })
  })

  it('19 örnek az-veri, 20 örnek yeterli', () => {
    expect(calibrate(samples(659.97, 19), 'kiz')).toEqual({ ok: false, reason: 'az-veri' })
    expect(calibrate(samples(659.97, 20), 'kiz').ok).toBe(true)
  })

  it('Review Focus 5: 15×660 Hz + 15×330 Hz (oktav sıçraması) → kararsiz', () => {
    const noisy = [...samples(660, 15), ...samples(330, 15, 11)]
    expect(calibrate(noisy, 'kiz')).toEqual({ ok: false, reason: 'kararsiz' })
  })

  it('%80 sınırı: 24/30 kararlı kabul, 23/30 kararsız', () => {
    expect(calibrate([...samples(660, 24), ...samples(330, 6, 3)], 'kiz').ok).toBe(true)
    expect(calibrate([...samples(660, 23), ...samples(330, 7, 3)], 'kiz')).toEqual({
      ok: false,
      reason: 'kararsiz',
    })
  })

  it('hiçbir ahengin 50 sent içine düşmeyen ses → tanimsiz', () => {
    // d = 26.5 koma: en yakın ahenkler Sipürde (22) ve Bolâhenk+oktav (31); ikisi de 4.5 koma (~100 sent) uzakta.
    expect(calibrate(samples(komaToHz(62 + 26.5)), 'kiz')).toEqual({ ok: false, reason: 'tanimsiz' })
  })

  it('eşitlikte seçili ahenk tercih edilir', () => {
    // d = 11 koma: Kız (9) ve Yıldız (13) ikisi de 2 koma uzakta.
    const same = Array.from({ length: 30 }, () => komaToHz(62 + 11))
    const asKiz = calibrate(same, 'kiz')
    const asYildiz = calibrate(same, 'yildiz')
    expect(asKiz.ok && asKiz.tuning.ahenk).toBe('kiz')
    expect(asYildiz.ok && asYildiz.tuning.ahenk).toBe('yildiz')
  })
})
