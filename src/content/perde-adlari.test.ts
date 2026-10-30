import { describe, expect, it } from 'vitest'
import { notaEtiketi, PERDE_ADLARI, perdeEtiketi } from './perde-adlari'

describe('PERDE_ADLARI', () => {
  it('dokuz perde adı ile koma perdelerini birebir içerir', () => {
    expect(PERDE_ADLARI).toEqual({
      B4b1: 'Segâh',
      B4b5: 'Kürdî',
      B4b4: 'Dik Kürdî',
      'C5#4': 'Nim Hicaz',
      'C5#5': 'Hicaz',
      'F5#4': 'Eviç',
      'G5#4': 'Nim Şehnaz',
      E5b5: 'Nim Hisar',
      'F4#4': 'Irak',
      G4: 'Rast',
      A4: 'Dügâh',
      B4: 'Bûselik',
      C5: 'Çârgâh',
      D5: 'Nevâ',
      E5: 'Hüseynî',
      F5: 'Acem',
      G5: 'Gerdâniye',
      A5: 'Muhayyer',
      B5b1: 'Tiz Segâh',
      C6: 'Tiz Çârgâh',
      D6: 'Tiz Nevâ',
      'C6#4': 'Tiz Nim Hicaz',
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
  it('tiz perdeler "tiz" önekiyle gelir (Tiz Segâh, Tiz Çârgâh, Tiz Nevâ, Tiz Nim Hicaz)', () => {
    expect(notaEtiketi('B5b1')).toBe('tiz Si (koma bemolü)')
    expect(notaEtiketi('C6')).toBe('tiz Do')
    expect(notaEtiketi('C6#4')).toBe('tiz Do (bakiye diyezi)')
    expect(notaEtiketi('D6')).toBe('tiz Re')
    expect(notaEtiketi('B5b1')).not.toBe(notaEtiketi('B4b1'))
    expect(notaEtiketi('C6')).not.toBe(notaEtiketi('C5'))
    expect(notaEtiketi('D6')).not.toBe(notaEtiketi('D5'))
    expect(notaEtiketi('C6#4')).not.toBe(notaEtiketi('C5#4'))
  })
  it('işaretli anahtarlarda "Solfej (işaret adı)" biçimini kullanır', () => {
    expect(notaEtiketi('B4b1')).toBe('Si (koma bemolü)')
    expect(notaEtiketi('B4b5')).toBe('Si (küçük mücenneb bemolü)')
    expect(notaEtiketi('B4b4')).toBe('Si (bakiye bemolü)')
    expect(notaEtiketi('C5#4')).toBe('Do (bakiye diyezi)')
    expect(notaEtiketi('C5#5')).toBe('Do (küçük mücenneb diyezi)')
    expect(notaEtiketi('F5#4')).toBe('Fa (bakiye diyezi)')
    expect(notaEtiketi('F4#4')).toBe('Fa (bakiye diyezi)')
    expect(notaEtiketi('G5#4')).toBe('Sol (bakiye diyezi)')
    expect(notaEtiketi('E5b5')).toBe('Mi (küçük mücenneb bemolü)')
  })
})

describe('perdeEtiketi', () => {
  it('yazılı perdeden nota etiketi üretir', () => {
    expect(perdeEtiketi({ step: 'D', octave: 5, acc: 0 })).toBe('Re')
    expect(perdeEtiketi({ step: 'B', octave: 4, acc: -1 })).toBe('Si (koma bemolü)')
    expect(perdeEtiketi({ step: 'C', octave: 5, acc: 4 })).toBe('Do (bakiye diyezi)')
    expect(perdeEtiketi({ step: 'G', octave: 5, acc: 0 })).toBe('tiz Sol')
    expect(perdeEtiketi({ step: 'B', octave: 5, acc: -1 })).toBe('tiz Si (koma bemolü)')
    expect(perdeEtiketi({ step: 'C', octave: 6, acc: 0 })).toBe('tiz Do')
    expect(perdeEtiketi({ step: 'C', octave: 6, acc: 4 })).toBe('tiz Do (bakiye diyezi)')
    expect(perdeEtiketi({ step: 'D', octave: 6, acc: 0 })).toBe('tiz Re')
  })
})
