import { describe, expect, it } from 'vitest'
import { parcaSeviyesi } from '../../../learning/parca-seviye'
import { PARCALAR } from '../index'
import { ELLE_PARCALAR } from './index'

const byId = (id: string) => ELLE_PARCALAR.find((p) => p.id === id)!

/** Eser kimliği, ölçü sayısı, beklenen seviye ve bölümler (kimlik, ilk ve son ölçü, beklenen seviye). */
const ESERLER = [
  { id: 'kabenin-yollari', olcu: 36, seviye: 2, bolumler: [['benim-yurecigim', 9, 16, 1], ['canim-kabem', 25, 32, 1]] },
  { id: 'urumda-acemde', olcu: 24, seviye: 2, bolumler: [['yemen-ellerinde', 9, 12, 1]] },
  { id: 'bilmem-nideyim', olcu: 16, seviye: 3, bolumler: [] },
  { id: 'ey-asik-i-dildade-rast', olcu: 18, seviye: 3, bolumler: [['la-ilahe-illallah', 15, 18, 1]] },
  { id: 'sol-cennetin-irmaklari-segah', olcu: 24, seviye: 2, bolumler: [['cikmis-islam-bulbulleri', 17, 24, 2]] },
  { id: 'taleal-bedru', olcu: 31, seviye: 2, bolumler: [['taleal-bedru-aleyna', 1, 8, 1], ['vecebes-sukru-aleyna', 17, 20, 1]] },
  { id: 'la-ilahe-illallah-ussak', olcu: 8, seviye: 2, bolumler: [] },
  { id: 'gani-mevlam-segah', olcu: 12, seviye: 2, bolumler: [['gorsem-aglayi-aglayi', 9, 12, 1]] },
  { id: 'ya-rabbi-askin-ver-bana', olcu: 32, seviye: 2, bolumler: [] },
  {
    id: 'ben-melamet-hirkasini',
    olcu: 18,
    seviye: 3,
    bolumler: [['aranagme', 3, 7, 2], ['ben-melamet', 8, 11, 2], ['tasa-caldim', 14, 18, 2]],
  },
  {
    id: 'erler-demine',
    olcu: 30,
    seviye: 3,
    bolumler: [['erler-demine', 1, 4, 2], ['dost-dost', 7, 12, 2], ['la-ilahe-illallah', 19, 22, 2]],
  },
  { id: 'derman-arardim-derdime', olcu: 8, seviye: 3, bolumler: [['burhan-sorardim-aslima', 5, 8, 2]] },
  {
    id: 'ism-i-subhan',
    olcu: 16,
    seviye: 3,
    bolumler: [['bencileyin-derdin-mi-var', 9, 16, 2], ['garip-garip-otme-bulbul', 13, 16, 1]],
  },
] as const

describe('neyzen.com ilahileri', () => {
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

      for (const [bolumId, bas, son, seviye] of e.bolumler) {
        it(`bölüm ${bolumId}: Ö${bas}–${son}, ana parçanın ölçüleri, seviye ${seviye}`, () => {
          const ana = byId(e.id)
          const b = PARCALAR.find((p) => p.id === `${e.id}--${bolumId}`)!
          expect(b).toBeTruthy()
          expect(b.olcu).toEqual(ana.olcu.slice(bas - 1, son))
          expect(parcaSeviyesi(b.olcu), bolumId).toBe(seviye)
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
