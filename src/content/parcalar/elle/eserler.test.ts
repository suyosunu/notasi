import { describe, expect, it } from 'vitest'
import { parcaSeviyesi } from '../../../learning/parca-seviye'
import { PARCALAR } from '../index'
import { ELLE_PARCALAR } from './index'

const byId = (id: string) => ELLE_PARCALAR.find((p) => p.id === id)!

/** Eser kimliği, ölçü sayısı, beklenen seviye ve bölümler (kimlik, ilk ve son ölçü, beklenen seviye). */
const ESERLER = [
  { id: 'kabenin-yollari', olcu: 36, seviye: 2, bolumler: [['benim-yurecigim', 9, 16], ['canim-kabem', 25, 32]] },
  { id: 'urumda-acemde', olcu: 24, seviye: 2, bolumler: [['yemen-ellerinde', 9, 12]] },
  { id: 'bilmem-nideyim', olcu: 16, seviye: 3, bolumler: [] },
  { id: 'ey-asik-i-dildade-rast', olcu: 18, seviye: 3, bolumler: [['la-ilahe-illallah', 15, 18]] },
  { id: 'sol-cennetin-irmaklari-segah', olcu: 24, seviye: 2, bolumler: [['cikmis-islam-bulbulleri', 17, 24]] },
] as const

describe('neyzen.com ilahileri (Task 70–74)', () => {
  it('toplam: 8 SymbTr + 5 eser + bölümleri', () => {
    const bolumSayisi = ESERLER.reduce((s, e) => s + e.bolumler.length, 0)
    expect(PARCALAR).toHaveLength(8 + ESERLER.length + bolumSayisi)
  })

  for (const e of ESERLER) {
    describe(e.id, () => {
      it(`${e.olcu} ölçü, hesaplanan seviye ${e.seviye}, kaynak neyzen.com PDF adresi`, () => {
        const p = byId(e.id)
        expect(p.olcu).toHaveLength(e.olcu)
        expect(parcaSeviyesi(p.olcu)).toBe(e.seviye)
        expect(p.source).toMatch(/^https:\/\/www\.neyzen\.com\/nota_arsivi\/01_ilahiler\/.+\.pdf$/)
      })

      for (const [bolumId, bas, son] of e.bolumler) {
        it(`bölüm ${bolumId}: Ö${bas}–${son}, ana parçanın ölçüleri, seviye ${e.id === 'sol-cennetin-irmaklari-segah' ? 2 : 1}`, () => {
          const ana = byId(e.id)
          const b = PARCALAR.find((p) => p.id === `${e.id}--${bolumId}`)!
          expect(b).toBeTruthy()
          expect(b.olcu).toEqual(ana.olcu.slice(bas - 1, son))
          expect(parcaSeviyesi(b.olcu), bolumId).toBe(e.id === 'sol-cennetin-irmaklari-segah' ? 2 : 1)
        })
      }
    })
  }

  it('Segâh parçasının makamı segah; yazar bilgisi PDF başlığından', () => {
    expect(byId('sol-cennetin-irmaklari-segah').makam).toBe('segah')
    expect(byId('sol-cennetin-irmaklari-segah').composer).toBe('Münir Nüreddin Selçuk')
    expect(byId('bilmem-nideyim').composer).toBe('Hâfız Mehmet Nezih Tolan')
  })
})
