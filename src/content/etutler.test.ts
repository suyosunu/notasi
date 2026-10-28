import { describe, expect, it } from 'vitest'
import { beats } from '../music/notation'
import { NEY_PERDELER } from './ney-perdeler'
import { USULLER } from './usuller'
import { ETUTLER, parseEtut } from './etutler'

const yazim = (id: string) => NEY_PERDELER.find((p) => p.id === id)!.written

describe('parseEtut', () => {
  it('süreler: birlik, ikilik, dörtlük, sekizlik', () => {
    expect(parseEtut('D5:1 | D5:2 | D5:4 | D5:8').map((o) => o[0]!.dur)).toEqual(['whole', 'half', 'quarter', 'eighth'])
  })

  it('nota: harf, oktav ve perde; ölçüler | ile, notalar boşlukla ayrılır', () => {
    const olcular = parseEtut('G4:4 A4:4 C5:2 | D5:1')
    expect(olcular).toHaveLength(2)
    expect(olcular[0]).toEqual([
      { kind: 'note', pitch: { step: 'G', octave: 4, acc: 0 }, dur: 'quarter' },
      { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' },
      { kind: 'note', pitch: { step: 'C', octave: 5, acc: 0 }, dur: 'half' },
    ])
    expect(olcular[1]).toEqual([{ kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'whole' }])
  })

  it('nokta: noktalı süre', () => {
    const [[e]] = parseEtut('D5:2.')
    expect(e).toEqual({ kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'half', dotted: true })
    expect(beats(e!)).toBe(3)
  })

  it('koma: b<koma> pes, #<koma> tiz değiştirgeç', () => {
    const [[bemol, diyez]] = parseEtut('B4b1:4 C5#4:4')
    expect(bemol).toMatchObject({ pitch: { step: 'B', octave: 4, acc: -1 } })
    expect(diyez).toMatchObject({ pitch: { step: 'C', octave: 5, acc: 4 } })
  })

  it('sus: r:<süre>, noktalı da olur', () => {
    const [[sus, noktali]] = parseEtut('r:4 r:2.')
    expect(sus).toEqual({ kind: 'rest', dur: 'quarter' })
    expect(noktali).toEqual({ kind: 'rest', dur: 'half', dotted: true })
  })

  it('bağ ve nefes işareti: nota sonundaki _ ve tek başına ,', () => {
    const [olcu] = parseEtut('G4:4_ A4:4 , B4b1:2')
    expect(olcu).toHaveLength(3)
    expect(olcu![0]).toEqual({ kind: 'note', pitch: { step: 'G', octave: 4, acc: 0 }, dur: 'quarter', bag: true })
    expect(olcu![1]).toEqual({ kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter', nefes: true })
    expect(olcu![2]).toEqual({ kind: 'note', pitch: { step: 'B', octave: 4, acc: -1 }, dur: 'half' })
    expect(parseEtut('D5:2._')[0]![0]).toMatchObject({ dur: 'half', dotted: true, bag: true })
    expect(parseEtut('r:4 ,')[0]![0]).toEqual({ kind: 'rest', dur: 'quarter', nefes: true })
  })

  it.each([', G4:4', 'G4:4 | , A4:4', 'r:4_', 'G4:4._.'])('ölçü , ile başlayamaz; bağ yalnız notada: %s', (s) => {
    expect(() => parseEtut(s)).toThrow(Error)
  })

  it.each(['X4:4', 'D:4', 'D5', 'D5:3', 'D5:16', 'D5:4:', 'D5b2:4', 'r', 'r:5', 'D5:4 | | D5:4', '', 'd5:4', 'D5:4,'])(
    'geçersiz belirteç Error fırlatır: %s',
    (s) => {
      expect(() => parseEtut(s)).toThrow(Error)
    },
  )
})

describe('ETUTLER', () => {
  it('kimlikler benzersiz ve sıra brief gibidir', () => {
    const ids = ETUTLER.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual([
      'tek-neva',
      'tek-cargah',
      'iki-neva-cargah',
      'tek-segah',
      'iki-cargah-segah',
      'tek-dugah',
      'iki-segah-dugah',
      'tek-rast',
      'iki-dugah-rast',
      'rast-besli-1',
      'rast-besli-2',
      'usul-nim-sofyan',
      'usul-semai',
      'usul-sofyan',
      'dortlu-cargah',
      'dortlu-kurdi',
      'dortlu-hicaz',
      'dil-1',
    ])
  })

  it('her etüdün her ölçüsü kendi ölçü zamanını doldurur (usulsüz 4, usullü usul.zaman)', () => {
    for (const e of ETUTLER) {
      const zaman = e.usulId ? USULLER.find((u) => u.id === e.usulId)!.zaman : 4
      for (const [i, olcu] of e.olcu.entries()) {
        const toplam = olcu.reduce((t, n) => t + beats(n), 0)
        expect(Math.abs(toplam - zaman), `${e.id} ${i + 1}. ölçü: ${toplam}`).toBeLessThan(1e-6)
      }
    }
  })

  it('her etütte yalnız perdeler listesindeki perdelerin yazımı geçer', () => {
    for (const e of ETUTLER) {
      const yazimlar = e.perdeler.map(yazim)
      for (const n of e.olcu.flat()) if (n.kind === 'note') expect(yazimlar, e.id).toContainEqual(n.pitch)
    }
  })

  it('etüt perdelerinin hepsi kullanılır', () => {
    for (const e of ETUTLER) {
      const kullanilan = e.olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
      for (const y of e.perdeler.map(yazim)) expect(kullanilan, e.id).toContainEqual(y)
    }
  })

  it('Seviye 2 etütleri: tür, usul, perdeler ve ders brief gibidir; hepsi 8 ölçü', () => {
    const ozet = ETUTLER.filter((e) => e.seviye === 2).map((e) => [e.id, e.tur, e.usulId, e.perdeler, e.dersId])
    expect(ozet).toEqual([
      ['usul-nim-sofyan', 'usul', 'nim-sofyan', ['neva', 'cargah', 'segah'], 'usul:nim-sofyan'],
      ['usul-semai', 'usul', 'semai', ['cargah', 'segah', 'dugah'], 'usul:semai'],
      ['usul-sofyan', 'usul', 'sofyan', ['segah', 'dugah', 'rast'], 'usul:sofyan'],
      ['dortlu-cargah', 'dortlu', undefined, ['rast', 'dugah', 'buselik', 'cargah'], 'dortlu:cargah'],
      ['dortlu-kurdi', 'dortlu', undefined, ['dugah', 'kurdi', 'cargah', 'neva'], 'dortlu:kurdi'],
      ['dortlu-hicaz', 'dortlu', undefined, ['dugah', 'dik-kurdi', 'nim-hicaz', 'neva'], 'dortlu:hicaz'],
      ['dil-1', 'dil', undefined, ['neva', 'cargah', 'segah'], 'dil:tu-bag'],
    ])
    for (const e of ETUTLER.filter((x) => x.seviye === 2)) {
      expect(e.olcu, e.id).toHaveLength(8)
      expect(e.baslik.length, e.id).toBeGreaterThan(0)
    }
  })

  it('Seviye 2 etütleri yalnız uzun seslerden oluşur: onaltılık ve üçleme yok', () => {
    for (const e of ETUTLER.filter((x) => x.seviye === 2)) {
      for (const n of e.olcu.flat()) {
        expect(['whole', 'half', 'quarter', 'eighth'], e.id).toContain(n.dur)
        expect(n.uclu, e.id).toBeFalsy()
      }
    }
  })

  it("usul etütlerinin usulId'si USULLER'de var ve vuruşu null değil", () => {
    const usulluler = ETUTLER.filter((e) => e.tur === 'usul')
    expect(usulluler).toHaveLength(3)
    for (const e of usulluler) {
      const u = USULLER.find((x) => x.id === e.usulId)
      expect(u, e.id).toBeDefined()
      expect(u!.vurus, e.id).not.toBeNull()
    }
    expect(ETUTLER.filter((e) => e.tur !== 'usul').every((e) => e.usulId === undefined)).toBe(true)
  })

  it("usul etütlerinde her ölçünün ilk olayı düm'e denk gelen bir notadır ve ölçünün en uzun sesidir", () => {
    for (const e of ETUTLER.filter((x) => x.tur === 'usul')) {
      for (const [i, olcu] of e.olcu.entries()) {
        const ilk = olcu[0]!
        expect(ilk.kind, `${e.id} ${i + 1}. ölçü`).toBe('note')
        expect(beats(ilk), `${e.id} ${i + 1}. ölçü`).toBeGreaterThanOrEqual(Math.max(...olcu.map(beats)))
      }
    }
  })

  it('usul-sofyan nefes işaretlidir', () => {
    const e = ETUTLER.find((x) => x.id === 'usul-sofyan')!
    expect(e.olcu.flat().filter((n) => n.nefes).length).toBeGreaterThanOrEqual(2)
  })

  it('dörtlü etütleri dörtlünün dört perdesinin hepsini kullanır', () => {
    const DORTLULER: Record<string, string> = {
      'dortlu-cargah': 'G4:4 A4:4 B4:4 C5:4',
      'dortlu-kurdi': 'A4:4 B4b5:4 C5:4 D5:4',
      'dortlu-hicaz': 'A4:4 B4b4:4 C5#4:4 D5:4',
    }
    for (const [id, yazilis] of Object.entries(DORTLULER)) {
      const e = ETUTLER.find((x) => x.id === id)!
      const kullanilan = e.olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
      const dortlu = parseEtut(yazilis)[0]!.map((n) => (n.kind === 'note' ? n.pitch : null))
      for (const p of dortlu) expect(kullanilan, id).toContainEqual(p)
      // Etüdün perdeleri dörtlünün perdeleridir (aynı yazım, aynı sıra).
      expect(e.perdeler.map(yazim), id).toEqual(dortlu)
    }
  })

  it('dörtlü etütleri dörtlünün durak perdesinde (Rast ya da Dügâh) biter', () => {
    const son = (id: string) => ETUTLER.find((x) => x.id === id)!.olcu.at(-1)!.at(-1)!
    expect(son('dortlu-cargah')).toMatchObject({ pitch: yazim('rast') })
    expect(son('dortlu-kurdi')).toMatchObject({ pitch: yazim('dugah') })
    expect(son('dortlu-hicaz')).toMatchObject({ pitch: yazim('dugah') })
  })

  it("dil-1'de en az 4 bağlı nota, ilk dört ölçüde hiç bağ yok; son dört ölçü aynı ezgidir", () => {
    const e = ETUTLER.find((x) => x.id === 'dil-1')!
    const bagli = (o: typeof e.olcu) => o.flat().filter((n) => n.kind === 'note' && n.bag)
    expect(bagli(e.olcu.slice(0, 4))).toHaveLength(0)
    expect(bagli(e.olcu.slice(4)).length).toBeGreaterThanOrEqual(4)
    const bagsiz = e.olcu.slice(4).map((m) => m.map((n) => (n.kind === 'note' ? (({ bag: _b, ...r }) => r)(n) : n)))
    expect(bagsiz).toEqual(e.olcu.slice(0, 4))
  })

  it('tür, perdeler, başlık, ders, tempo ve seviye', () => {
    const get = (id: string) => ETUTLER.find((e) => e.id === id)!
    expect(get('tek-neva')).toMatchObject({ baslik: 'Tek perde: Nevâ', tur: 'tek', perdeler: ['neva'], dersId: 'etut:giris', bpm: 60, seviye: 1 })
    expect(get('tek-segah')).toMatchObject({ baslik: 'Tek perde: Segâh', perdeler: ['segah'] })
    expect(get('iki-neva-cargah')).toMatchObject({ baslik: 'İki perde: Nevâ–Çârgâh', tur: 'iki', perdeler: ['neva', 'cargah'], dersId: 'etut:giris' })
    expect(get('iki-dugah-rast')).toMatchObject({ baslik: 'İki perde: Dügâh–Rast', perdeler: ['dugah', 'rast'] })
    expect(get('rast-besli-1')).toMatchObject({
      baslik: 'Rast beşlisi 1 (dörtlükler)',
      tur: 'besli',
      perdeler: ['neva', 'cargah', 'segah', 'dugah', 'rast'],
      dersId: 'etut:rast-besli',
    })
    expect(get('rast-besli-2').baslik).toBe('Rast beşlisi 2 (sekizlikler)')
    expect(ETUTLER.every((e) => e.bpm === 60)).toBe(true)
    expect(ETUTLER.slice(0, 11).every((e) => e.seviye === 1 && e.usulId === undefined)).toBe(true)
    expect(ETUTLER.slice(11).every((e) => e.seviye === 2)).toBe(true)
  })

  it('tek-neva içeriği', () => {
    const e = ETUTLER[0]!
    expect(e.olcu).toEqual(parseEtut('D5:1 | D5:2 r:2 | D5:4 D5:4 D5:4 r:4 | D5:2 D5:2 | D5:1'))
  })

  it('iki-neva-cargah: A önceki, B yeni perde', () => {
    const e = ETUTLER.find((x) => x.id === 'iki-neva-cargah')!
    expect(e.olcu).toEqual(
      parseEtut('D5:2 C5:2 | D5:2 C5:2 | D5:4 C5:4 D5:4 C5:4 | C5:1 | C5:2 D5:2 | C5:4 D5:4 C5:2 | D5:4 D5:4 C5:4 r:4 | C5:1'),
    )
  })

  it('rast beşlisi etütleri brief içeriğindedir; ikincisi sekizlik içerir', () => {
    const b1 = ETUTLER.find((x) => x.id === 'rast-besli-1')!
    const b2 = ETUTLER.find((x) => x.id === 'rast-besli-2')!
    expect(b1.olcu).toHaveLength(8)
    expect(b1.olcu).toEqual(
      parseEtut(
        'G4:4 A4:4 B4b1:4 C5:4 | D5:1 | D5:4 C5:4 B4b1:4 A4:4 | G4:1 | G4:4 A4:4 B4b1:2 | C5:4 D5:4 C5:2 | B4b1:4 A4:4 B4b1:4 A4:4 | G4:1',
      ),
    )
    expect(b2.olcu).toHaveLength(5)
    expect(b2.olcu.flat().some((n) => n.dur === 'eighth')).toBe(true)
    expect(b1.olcu.flat().some((n) => n.dur === 'eighth')).toBe(false)
  })
})
