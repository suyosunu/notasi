import { describe, expect, it } from 'vitest'
import { parcaSeviyesi } from '../../../learning/parca-seviye'
import { samePitch } from '../../../music/pitch'
import { NEY_PERDELER } from '../../ney-perdeler'
import { PARCALAR } from '../index'
import { ELLE_PARCALAR } from './index'
import { ellePiecesFrom } from './tur'
import type { ElleParca } from './tur'

/** Yalnız testte: gönderilmeyen küçük örnek (Sofyan 4/4, ilk ölçü anacrusis). */
const ORNEK: ElleParca = {
  id: 'ornek',
  title: 'Örnek Eser',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Anonim',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/ornek.pdf',
  notasyon: 'G4:4 | A4:2 B4b1:2 | C5:2~ C5:4 r:4 | D5:1',
  soz: [['a'], ['b', 'c'], ['d', '', ''], ['e']],
  bolumler: [{ id: 'giris', baslik: 'giriş', olcuAraligi: [2, 3] }],
}
const kopya = (o: Partial<ElleParca>): ElleParca => ({ ...ORNEK, ...o })

describe('ellePiecesFrom', () => {
  it('parçayı Parca yapar: kaynak source olur, ölçüler ve söz korunur', () => {
    const [p] = ellePiecesFrom([ORNEK])
    expect(p).toMatchObject({
      id: 'ornek',
      title: 'Örnek Eser',
      makam: 'ussak',
      usul: 'sofyan',
      composer: 'Anonim',
      lyricist: 'Yunus Emre',
      source: 'https://www.neyzen.com/ornek.pdf',
    })
    expect(p!.olcu).toHaveLength(4)
    expect(p!.olcu[2]![0]).toMatchObject({ dur: 'half', tie: true })
    expect(p!.soz).toEqual(ORNEK.soz)
  })

  it('bölüm ayrı parça olur: kimlik, başlık, kesilmiş ölçü ve söz', () => {
    const [ana, bolum, ...geri] = ellePiecesFrom([ORNEK])
    expect(geri).toEqual([])
    expect(bolum).toMatchObject({
      id: 'ornek--giris',
      title: 'Örnek Eser — giriş',
      makam: 'ussak',
      usul: 'sofyan',
      composer: 'Anonim',
      lyricist: 'Yunus Emre',
      source: 'https://www.neyzen.com/ornek.pdf',
    })
    expect(bolum!.olcu).toEqual(ana!.olcu.slice(1, 3))
    expect(bolum!.soz).toEqual([['b', 'c'], ['d', '', '']])
  })

  it('güftesiz parçada lyricist alanı yok', () => {
    const [p, b] = ellePiecesFrom([kopya({ lyricist: undefined })])
    expect('lyricist' in p!).toBe(false)
    expect('lyricist' in b!).toBe(false)
  })

  it('sözsüz parçada söz alanı yok', () => {
    const [p, b] = ellePiecesFrom([kopya({ soz: undefined })])
    expect('soz' in p!).toBe(false)
    expect('soz' in b!).toBe(false)
  })

  it('başlığa göre (Türkçe) sıralar; bölüm ana parçanın hemen arkasındadır', () => {
    const liste = ellePiecesFrom([
      kopya({ id: 'z', title: 'Zeki', bolumler: undefined }),
      kopya({ id: 'i', title: 'Işık' }),
      kopya({ id: 'c', title: 'Çeçen', bolumler: undefined }),
    ])
    expect(liste.map((p) => p.id)).toEqual(['c', 'i', 'i--giris', 'z'])
  })

  it('ilk ölçü tam ya da kısa olabilir; ortadaki kısa ölçü hata verir', () => {
    expect(() => ellePiecesFrom([kopya({ notasyon: 'G4:1 | A4:1 | D5:1', soz: undefined, bolumler: undefined })])).not.toThrow()
    expect(() =>
      ellePiecesFrom([kopya({ notasyon: 'G4:4 | A4:2 | C5:1 | D5:1', soz: undefined, bolumler: undefined })]),
    ).toThrow(/ölçü 2/)
  })

  it('bozuk veri Error fırlatır', () => {
    const bozuk: Partial<ElleParca>[] = [
      { notasyon: 'G4:1 | A4:1 | D5:2 D5:1' }, // taşan ölçü
      { notasyon: 'G4:4 | A4:2 B4b1:2 | C5:2 | D5:1' }, // ortada kısa ölçü
      { notasyon: 'G4:4 | A4:2 B4b1:2 | C5:2~ C5:4 r:4 | D5:1 | E5:4~' }, // bağ sonraki notaya gitmiyor
      { notasyon: 'X9:4' },
      { usul: 'yok' },
      { makam: 'nihavent' as ElleParca['makam'] },
      { soz: [['a'], ['b', 'c'], ['d', '', '']] }, // ölçü eksik
      { soz: [['a'], ['b'], ['d', '', ''], ['e']] }, // hece eksik
      { bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [0, 2] }] },
      { bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [3, 2] }] },
      { bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [2, 5] }] },
      { bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [1.5, 2] }] },
      { bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [2, 3] }, { id: 'x', baslik: 'y', olcuAraligi: [2, 3] }] },
    ]
    for (const b of bozuk) {
      expect(() => ellePiecesFrom([kopya(b)]), JSON.stringify(b)).toThrow(Error)
    }
  })

  it('ilk ölçü usulden uzunsa hata verir', () => {
    expect(() => ellePiecesFrom([kopya({ notasyon: 'G4:1 G4:4 | A4:1 | D5:1', soz: undefined, bolumler: undefined })])).toThrow(/ölçü 1/)
  })

  it('bağlı notayla biten bölüm hata verir', () => {
    expect(() =>
      ellePiecesFrom([
        kopya({ notasyon: 'G4:4 | A4:2 B4b1:2 | C5:2 C5:2~ | C5:1', soz: undefined, bolumler: [{ id: 'x', baslik: 'x', olcuAraligi: [2, 3] }] }),
      ]),
    ).toThrow(/bağlı/)
  })

  it('kimlik çakışması hata verir', () => {
    expect(() => ellePiecesFrom([ORNEK, ORNEK])).toThrow(/tekrar/)
  })
})

describe('ELLE_PARCALAR (gönderilen eserler)', () => {
  it('PARCALAR SymbTr parçalarından sonra hepsini içerir; kimlikler benzersiz', () => {
    const ids = PARCALAR.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(PARCALAR.slice(8)).toEqual(ELLE_PARCALAR)
  })

  it('SymbTr parçaları önde, sırası değişmez', () => {
    expect(PARCALAR.slice(0, 8).map((p) => p.id)).toEqual([
      'benim-adim-dertli-dolap',
      'yine-baglandi-dil-aranagme',
      'hak-teala',
      'allah-emrin-tutalim',
      'hicran-oku-aranagme',
      'gul-yuzlulerin',
      'daglar-ile-taslar-ile',
      'cecen-kizi',
    ])
  })

  it('kaynakları neyzen.com adresidir ve bütün notalar uygulamanın ney perdelerindedir', () => {
    for (const p of ELLE_PARCALAR) {
      expect(p.source, p.id).toMatch(/^https:\/\/www\.neyzen\.com\//)
      for (const e of p.olcu.flat()) {
        if (e.kind === 'note') {
          // Segâh makamının Mi koma bemolü (E5b1) ney perdelerinde yoktur; 1 koma payıyla Hüseynî sayılır (parcaSeviyesi).
          if (e.pitch.step === 'E' && e.pitch.octave === 5 && e.pitch.acc === -1) continue
          expect(NEY_PERDELER.some((n) => samePitch(n.written, e.pitch)), `${p.id} ${JSON.stringify(e.pitch)}`).toBe(true)
        }
      }
      expect(parcaSeviyesi(p.olcu), p.id).not.toBeNull()
    }
  })

  it('örnek parçanın notaları da ney perdelerinde (denetim yöntemi çalışıyor)', () => {
    for (const p of ellePiecesFrom([ORNEK])) {
      for (const e of p.olcu.flat()) {
        if (e.kind === 'note') expect(NEY_PERDELER.some((n) => samePitch(n.written, e.pitch))).toBe(true)
      }
    }
  })
})
