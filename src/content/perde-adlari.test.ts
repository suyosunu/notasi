import { describe, expect, it } from 'vitest'
import { notaEtiketi, PERDE_ADLARI } from './perde-adlari'

describe('PERDE_ADLARI', () => {
  it('dokuz perde adını birebir içerir', () => {
    expect(PERDE_ADLARI).toEqual({
      G4: 'Rast',
      A4: 'Dügâh',
      B4: 'Bûselik',
      C5: 'Çârgâh',
      D5: 'Nevâ',
      E5: 'Hüseynî',
      F5: 'Acem',
      G5: 'Gerdâniye',
      A5: 'Muhayyer',
    })
  })
})

describe('notaEtiketi', () => {
  it('solfej adını döner; üst Sol ve La için "tiz" ekler', () => {
    expect(notaEtiketi('G4')).toBe('Sol')
    expect(notaEtiketi('A4')).toBe('La')
    expect(notaEtiketi('D5')).toBe('Re')
    expect(notaEtiketi('G5')).toBe('tiz Sol')
    expect(notaEtiketi('A5')).toBe('tiz La')
  })
})
