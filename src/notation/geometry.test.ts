import { describe, expect, it } from 'vitest'
import type { WrittenPitch } from '../music/pitch'
import { ledgerLineYs, noteY, staffIndex } from './geometry'

const p = (step: WrittenPitch['step'], octave: number): WrittenPitch => ({ step, octave, acc: 0 })

describe('staffIndex', () => {
  it('Mi4 (alt çizgi) = 0', () => expect(staffIndex(p('E', 4))).toBe(0))
  it('Fa5 (üst çizgi) = 8', () => expect(staffIndex(p('F', 5))).toBe(8))
  it('Do4 = -2', () => expect(staffIndex(p('C', 4))).toBe(-2))
  it('La5 = 10', () => expect(staffIndex(p('A', 5))).toBe(10))
  it('değiştirgeç dizini etkilemez', () => expect(staffIndex({ step: 'E', octave: 4, acc: -1 })).toBe(0))
})

describe('noteY', () => {
  it('Mi4 alt çizgide: y = 70', () => expect(noteY(p('E', 4))).toBe(70))
  it('Fa5 üst çizgide: y = 30', () => expect(noteY(p('F', 5))).toBe(30))
})

describe('ledgerLineYs', () => {
  it('Do4 → [80]', () => expect(ledgerLineYs(p('C', 4))).toEqual([80]))
  it('La5 → [20]', () => expect(ledgerLineYs(p('A', 5))).toEqual([20]))
  it('Sol4 → []', () => expect(ledgerLineYs(p('G', 4))).toEqual([]))
  it('Re4 (alt çizginin altındaki boşluk) → []', () => expect(ledgerLineYs(p('D', 4))).toEqual([]))
  it('Sol5 (üst çizginin üstündeki boşluk) → []', () => expect(ledgerLineYs(p('G', 5))).toEqual([]))
  it('La3 → [80, 90]', () => expect(ledgerLineYs(p('A', 3))).toEqual([80, 90]))
  it('Mi4 ve Fa5 → []', () => {
    expect(ledgerLineYs(p('E', 4))).toEqual([])
    expect(ledgerLineYs(p('F', 5))).toEqual([])
  })
})
