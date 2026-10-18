import { describe, expect, it } from 'vitest'
import { ACCIDENTAL_NAMES } from './accidentals'

describe('ACCIDENTAL_NAMES', () => {
  it('sekiz AEU işaretinin Türkçe adını birebir içerir', () => {
    expect(ACCIDENTAL_NAMES).toEqual({
      [-1]: 'koma bemolü',
      [-4]: 'bakiye bemolü',
      [-5]: 'küçük mücenneb bemolü',
      [-8]: 'büyük mücenneb bemolü',
      1: 'koma diyezi',
      4: 'bakiye diyezi',
      5: 'küçük mücenneb diyezi',
      8: 'büyük mücenneb diyezi',
    })
  })
})
