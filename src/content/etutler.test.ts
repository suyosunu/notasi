import { describe, expect, it } from 'vitest'
import { beats } from '../music/notation'
import { NEY_PERDELER } from './ney-perdeler'
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
    ])
  })

  it('her ölçü 4 vuruş', () => {
    for (const e of ETUTLER) {
      for (const [i, olcu] of e.olcu.entries()) {
        expect(olcu.reduce((t, n) => t + beats(n), 0), `${e.id} ${i + 1}. ölçü`).toBe(4)
      }
    }
  })

  it('her notanın perdesi etüdün perdelerinden birinin yazımıdır; etüt perdelerinin hepsi kullanılır', () => {
    for (const e of ETUTLER) {
      const yazimlar = e.perdeler.map(yazim)
      const kullanilan = e.olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
      for (const p of kullanilan) expect(yazimlar, e.id).toContainEqual(p)
      for (const y of yazimlar) expect(kullanilan, e.id).toContainEqual(y)
    }
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
    expect(ETUTLER.every((e) => e.bpm === 60 && e.seviye === 1)).toBe(true)
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
