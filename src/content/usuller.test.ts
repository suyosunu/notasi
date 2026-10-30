import { describe, expect, it } from 'vitest'
import { USULLER } from './usuller'

const usul = (id: string) => USULLER.find((u) => u.id === id)!

describe('USULLER (araştırma §3)', () => {
  it('öğretim sırası: Nim Sofyan, Semâî, Sofyan, Yürük Semâî (6/8, 6/4), Türk Aksağı, Devr-i Hindî, Düyek, Aksak, Dolap', () => {
    expect(USULLER.map((u) => u.id)).toEqual([
      'nim-sofyan',
      'semai',
      'sofyan',
      'yuruk-semai',
      'yuruk-semai-64',
      'turk-aksagi',
      'devr-i-hindi',
      'duyek',
      'aksak',
      'dolap',
    ])
    expect(USULLER.map((u) => u.name)).toEqual([
      'Nim Sofyan',
      'Semâî',
      'Sofyan',
      'Yürük Semâî',
      'Yürük Semâî (6/4)',
      'Türk Aksağı',
      'Devr-i Hindî',
      'Düyek',
      'Aksak',
      'Dolap',
    ])
    expect(new Set(USULLER.map((u) => u.id)).size).toBe(USULLER.length)
  })

  it('Nim Sofyan 2/4, düm tek; ilk usul Nim Sofyan; vuruş süreleri toplamı zaman', () => {
    const nim = USULLER[0]!
    expect(nim.id).toBe('nim-sofyan')
    expect(nim.name).toBe('Nim Sofyan')
    expect(`${nim.zaman}/${nim.mertebe}`).toBe('2/4')
    expect(nim.vurus!.map((x) => `${x.ses}${x.sure}`)).toEqual(['düm1', 'tek1'])
    expect(nim.vurus!.reduce((sum, x) => sum + x.sure, 0)).toBe(nim.zaman)
  })

  it('vuruşlu her usulde süreler toplamı zaman değerine eşittir', () => {
    const withStrokes = USULLER.filter((u) => u.vurus !== null)
    expect(withStrokes).toHaveLength(9)
    for (const u of withStrokes) {
      expect(u.vurus!.reduce((sum, v) => sum + v.sure, 0)).toBe(u.zaman)
    }
  })

  it('zaman ve mertebe: 2/4, 3/4, 4/4, 6/8, 6/4, 5/8, 7/8, 8/8, 9/8, 12/8', () => {
    expect(USULLER.map((u) => `${u.zaman}/${u.mertebe}`)).toEqual([
      '2/4',
      '3/4',
      '4/4',
      '6/8',
      '6/4',
      '5/8',
      '7/8',
      '8/8',
      '9/8',
      '12/8',
    ])
  })

  it('vuruş kalıpları araştırmadaki gibidir', () => {
    const kalip = (id: string) =>
      usul(id)
        .vurus!.map((v) => `${v.ses}${v.sure}`)
        .join(' ')
    expect(kalip('nim-sofyan')).toBe('düm1 tek1')
    expect(kalip('sofyan')).toBe('düm2 te1 ke1')
    expect(kalip('duyek')).toBe('düm1 tek2 tek1 düm2 tek2')
    expect(kalip('semai')).toBe('düm1 tek1 tek1')
    expect(kalip('yuruk-semai')).toBe('düm1 tek1 tek1 düm1 tek2')
    expect(kalip('turk-aksagi')).toBe('düm2 tek2 tek1')
    expect(kalip('devr-i-hindi')).toBe('düm1 tek1 tek1 düm2 tek2')
    expect(kalip('aksak')).toBe('düm2 te1 ke1 düm2 tek2 tek1')
  })

  it('Yürük Semâî (6/4) 6/8 ile aynı vuruşu taşır; yalnız mertebesi farklıdır', () => {
    const sekizlik = usul('yuruk-semai')
    const dortluk = usul('yuruk-semai-64')
    expect(dortluk.vurus).toEqual(sekizlik.vurus)
    expect(dortluk.zaman).toBe(sekizlik.zaman)
    expect([sekizlik.mertebe, dortluk.mertebe]).toEqual([8, 4])
  })

  it('Dolap: 12/8, vuruş kalıbı yoktur (kaynaklarda doğrulanamadı)', () => {
    const dolap = usul('dolap')
    expect(dolap.zaman).toBe(12)
    expect(dolap.mertebe).toBe(8)
    expect(dolap.vurus).toBeNull()
  })
})
