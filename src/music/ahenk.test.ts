import { describe, expect, it } from 'vitest'
import { AHENKLER, DEFAULT_TUNING, soundingHz } from './ahenk'
import type { Tuning } from './ahenk'
import type { WrittenPitch } from './pitch'

const sol4: WrittenPitch = { step: 'G', octave: 4, acc: 0 }
const la4: WrittenPitch = { step: 'A', octave: 4, acc: 0 }
const re5: WrittenPitch = { step: 'D', octave: 5, acc: 0 }
const kiz = (over: Partial<Tuning> = {}): Tuning => ({ ...DEFAULT_TUNING, ...over })

describe('AHENKLER', () => {
  it('sekiz ahenk, doğru ad ve kaydırma', () => {
    expect(AHENKLER.map((a) => [a.id, a.name, a.shiftKoma])).toEqual([
      ['bolahenk', 'Bolâhenk', -22],
      ['davud', 'Davud', -13],
      ['sah', 'Şah', -9],
      ['mansur', 'Mansur', 0],
      ['kiz', 'Kız', 9],
      ['yildiz', 'Yıldız', 13],
      ['mustahsen', 'Müstahsen', 18],
      ['sipurde', 'Sipürde', 22],
    ])
  })
  it('her ahenkte rastSoundsAs dolu', () => {
    for (const a of AHENKLER) expect(a.rastSoundsAs.length).toBeGreaterThan(0)
  })
})

describe('DEFAULT_TUNING', () => {
  it('Kız, oktav 0, 0 sent', () => {
    expect(DEFAULT_TUNING).toEqual({ ahenk: 'kiz', octaveOffset: 0, tuningCents: 0 })
  })
})

describe('soundingHz', () => {
  it('Kız: Sol4 → 440', () => {
    expect(soundingHz(sol4, kiz())).toBeCloseTo(440.0, 2)
  })
  it('Kız: La4 → 494.96', () => {
    expect(soundingHz(la4, kiz())).toBeCloseTo(494.96, 2)
  })
  it('Kız: Re5 → 659.97', () => {
    expect(soundingHz(re5, kiz())).toBeCloseTo(659.97, 2)
  })
  it('Kız, oktav −1: Re5 → 329.99', () => {
    expect(soundingHz(re5, kiz({ octaveOffset: -1 }))).toBeCloseTo(329.99, 2)
  })
  it('Bolâhenk: Sol4 → 293.34', () => {
    expect(soundingHz(sol4, kiz({ ahenk: 'bolahenk' }))).toBeCloseTo(293.34, 2)
  })
  it('Mansur: Sol4 → 391.14', () => {
    expect(soundingHz(sol4, kiz({ ahenk: 'mansur' }))).toBeCloseTo(391.14, 2)
  })
  it('akort sentleri uygulanır', () => {
    expect(soundingHz(sol4, kiz({ tuningCents: 1200 }))).toBeCloseTo(880, 2)
  })
})
