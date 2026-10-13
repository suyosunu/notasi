import { describe, expect, it } from 'vitest'
import { centsBetween, komaToHz, NATURAL_KOMA, SOLFEJ, writtenKoma } from './pitch'

describe('writtenKoma', () => {
  it('Do4 sıfırdır', () => {
    expect(writtenKoma({ step: 'C', octave: 4, acc: 0 })).toBe(0)
  })
  it('Re5 = 62', () => {
    expect(writtenKoma({ step: 'D', octave: 5, acc: 0 })).toBe(62)
  })
  it('değiştirgeç koma olarak eklenir', () => {
    expect(writtenKoma({ step: 'B', octave: 4, acc: -5 })).toBe(44)
    expect(writtenKoma({ step: 'F', octave: 4, acc: 4 })).toBe(26)
  })
  it('oktav altı negatif olur', () => {
    expect(writtenKoma({ step: 'C', octave: 3, acc: 0 })).toBe(-53)
  })
})

describe('tablolar', () => {
  it('doğal koma konumları', () => {
    expect(NATURAL_KOMA).toEqual({ C: 0, D: 9, E: 18, F: 22, G: 31, A: 40, B: 49 })
  })
  it('solfej adları', () => {
    expect(SOLFEJ).toEqual({ C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' })
  })
})

describe('komaToHz', () => {
  it('La4 = 440 Hz', () => {
    expect(komaToHz(40)).toBeCloseTo(440, 2)
  })
  it('Do4 ≈ 260.77 Hz', () => {
    expect(komaToHz(0)).toBeCloseTo(260.77, 2)
  })
  it('oktav 53 koma, frekans iki katı', () => {
    expect(komaToHz(93)).toBeCloseTo(880, 2)
  })
})

describe('centsBetween', () => {
  it('445 Hz, 440 Hz üstünde ≈ 19.56 sent', () => {
    expect(centsBetween(445, 440)).toBeCloseTo(19.56, 2)
  })
  it('hedefin altı negatif', () => {
    expect(centsBetween(220, 440)).toBeCloseTo(-1200, 2)
  })
})
