import { describe, expect, it } from 'vitest'
import { USULLER } from './usuller'

const usul = (id: string) => USULLER.find((u) => u.id === id)!

describe('USULLER (araştırma §3)', () => {
  it('Sofyan, Düyek, Semâî, Yürük Semâî, Aksak, Dolap sırasıyla', () => {
    expect(USULLER.map((u) => u.name)).toEqual(['Sofyan', 'Düyek', 'Semâî', 'Yürük Semâî', 'Aksak', 'Dolap'])
    expect(new Set(USULLER.map((u) => u.id)).size).toBe(USULLER.length)
  })

  it('vuruşlu her usulde süreler toplamı zaman değerine eşittir', () => {
    const withStrokes = USULLER.filter((u) => u.vurus !== null)
    expect(withStrokes).toHaveLength(5)
    for (const u of withStrokes) {
      expect(u.vurus!.reduce((sum, v) => sum + v.sure, 0)).toBe(u.zaman)
    }
  })

  it('zaman ve mertebe: 4/4, 8/8, 3/4, 6/8, 9/8, 12/8', () => {
    expect(USULLER.map((u) => `${u.zaman}/${u.mertebe}`)).toEqual(['4/4', '8/8', '3/4', '6/8', '9/8', '12/8'])
  })

  it('vuruş kalıpları araştırmadaki gibidir', () => {
    const kalip = (id: string) =>
      usul(id)
        .vurus!.map((v) => `${v.ses}${v.sure}`)
        .join(' ')
    expect(kalip('sofyan')).toBe('düm2 te1 ke1')
    expect(kalip('duyek')).toBe('düm1 tek2 tek1 düm2 tek2')
    expect(kalip('semai')).toBe('düm1 tek1 tek1')
    expect(kalip('yuruk-semai')).toBe('düm1 tek1 tek1 düm1 tek2')
    expect(kalip('aksak')).toBe('düm2 te1 ke1 düm2 tek2 tek1')
  })

  it('Dolap: 12/8, vuruş kalıbı yoktur (kaynaklarda doğrulanamadı)', () => {
    const dolap = usul('dolap')
    expect(dolap.zaman).toBe(12)
    expect(dolap.mertebe).toBe(8)
    expect(dolap.vurus).toBeNull()
  })
})
