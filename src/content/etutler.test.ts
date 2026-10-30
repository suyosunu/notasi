import { describe, expect, it } from 'vitest'
import { beats } from '../music/notation'
import { samePitch } from '../music/pitch'
import { NEY_PERDELER } from './ney-perdeler'
import { SEVIYELER } from './seviyeler'
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

  it('otuzikilik :32 ve kesik ! belirteçleri', () => {
    const [olcu] = parseEtut('A4:32 A4:4! A4:32. r:32 G4:8._!')
    expect(olcu![0]).toEqual({ kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'thirtysecond' })
    expect(beats(olcu![0]!)).toBeCloseTo(0.125, 9)
    expect(olcu![1]).toEqual({ kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter', kesik: true })
    expect(olcu![2]).toMatchObject({ dur: 'thirtysecond', dotted: true })
    expect(olcu![3]).toEqual({ kind: 'rest', dur: 'thirtysecond' })
    expect(olcu![4]).toMatchObject({ dur: 'eighth', dotted: true, bag: true, kesik: true })
  })

  it('kesik işareti bağdan önce de yazılabilir; yalnızca kesik olmayan notada alan yoktur', () => {
    expect(parseEtut('G4:4!_')[0]![0]).toMatchObject({ kesik: true, bag: true })
    expect('kesik' in parseEtut('G4:4')[0]![0]!).toBe(false)
  })

  it.each(['r:4!', 'r:32!', 'G4:4!!', 'G4:4.!!', 'G4:16', 'G4:64', 'G4:3', '!', 'G4:!'])(
    'kesik yalnız notada ve bir kez; :32 dışında yeni süre yok: %s',
    (s) => {
      expect(() => parseEtut(s)).toThrow(Error)
    },
  )

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
      'kademe-dugah-huseyni',
      'kademe-rast-kapali-neva',
      'kademe-cargah-gerdaniye',
      'kademe-ara',
      'kademe-nim-hisar',
      'neva-rast-besli',
      'neva-buselik-besli',
      'dizi-rast',
      'dizi-neva',
      'tiz-segah-oktav',
      'tiz-cargah-oktav',
      'tiz-neva-oktav',
      'kapali-oktav',
      'tiz-nim-hicaz-oktav',
      'dizi-ussak-tiz',
      'dizi-bayati',
      'dizi-huseyni',
      'dizi-muhayyer',
      'dizi-kurdi',
      'dizi-hicaz',
      'dil-2',
      'usul-turk-aksagi',
      'usul-devr-i-hindi',
    ])
  })

  it('her etüdün her ölçüsü kendi ölçü vuruşunu doldurur (usulsüz 4, usullü zaman × 4 / mertebe dörtlük)', () => {
    for (const e of ETUTLER) {
      const usul = e.usulId ? USULLER.find((u) => u.id === e.usulId)! : undefined
      const zaman = usul ? (usul.zaman * 4) / usul.mertebe : 4
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
    expect(usulluler).toHaveLength(5)
    for (const e of usulluler) {
      const u = USULLER.find((x) => x.id === e.usulId)
      expect(u, e.id).toBeDefined()
      expect(u!.vurus, e.id).not.toBeNull()
    }
    expect(ETUTLER.filter((e) => e.tur !== 'usul').every((e) => e.usulId === undefined)).toBe(true)
  })

  it("usul etütlerinde her ölçünün ilk olayı düm'e denk gelen bir notadır; dörtlük birimli usullerde ölçünün en uzun sesidir, sekizlik birimlilerde düm'ü doldurur", () => {
    for (const e of ETUTLER.filter((x) => x.tur === 'usul')) {
      const usul = USULLER.find((u) => u.id === e.usulId)!
      const dum = (usul.vurus![0]!.sure * 4) / usul.mertebe
      for (const [i, olcu] of e.olcu.entries()) {
        const ilk = olcu[0]!
        expect(ilk.kind, `${e.id} ${i + 1}. ölçü`).toBe('note')
        // Sekizlik birimli usulde (Devr-i Hindî düm'ü bir sekizliktir) ilk ses kısa olabilir; en az düm süresi kadardır.
        if (usul.mertebe === 4) expect(beats(ilk), `${e.id} ${i + 1}. ölçü`).toBeGreaterThanOrEqual(Math.max(...olcu.map(beats)))
        else expect(beats(ilk), `${e.id} ${i + 1}. ölçü`).toBeGreaterThanOrEqual(dum - 1e-6)
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
    expect(ETUTLER.slice(11, 18).every((e) => e.seviye === 2)).toBe(true)
    expect(ETUTLER.slice(18, 27).every((e) => e.seviye === 3)).toBe(true)
    expect(ETUTLER.slice(27).every((e) => e.seviye === 4)).toBe(true)
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

describe('Seviye 3 etütleri', () => {
  const s3 = ETUTLER.filter((e) => e.seviye === 3)

  it("dokuz etüt Seviye 2'nin ardından, brief sırasıyla; tür, perdeler, ders ve tempo", () => {
    expect(ETUTLER.slice(18, 27)).toEqual(s3)
    expect(s3.map((e) => [e.id, e.baslik, e.tur, e.perdeler, e.dersId, e.bpm, e.usulId])).toEqual([
      ['kademe-dugah-huseyni', 'Aynı parmak: Dügâh–Hüseynî', 'kademe', ['dugah', 'huseyni'], 'etut:kademe', 60, undefined],
      ['kademe-rast-kapali-neva', 'Aynı parmak: Rast–Nevâ (kapalı)', 'kademe', ['rast', 'kapali-neva'], 'etut:kademe', 60, undefined],
      [
        'kademe-cargah-gerdaniye',
        'Aynı parmak: Çârgâh–Gerdâniye, Nevâ–Muhayyer',
        'kademe',
        ['cargah', 'gerdaniye', 'neva', 'muhayyer'],
        'etut:kademe',
        60,
        undefined,
      ],
      [
        'kademe-ara',
        'Aynı parmak: Segâh–Eviç, Nim Hicaz–Nim Şehnaz',
        'kademe',
        ['segah', 'evic', 'nim-hicaz', 'nim-sehnaz', 'neva'],
        'etut:kademe',
        60,
        undefined,
      ],
      [
        'kademe-nim-hisar',
        'Nim Hisar: Hüseynî ile Nevâ arasında',
        'kademe',
        ['huseyni', 'nim-hisar', 'neva'],
        'etut:kademe',
        60,
        undefined,
      ],
      [
        'neva-rast-besli',
        "Nevâ'da Rast beşlisi",
        'besli',
        ['neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer'],
        'dortlu:besli',
        60,
        undefined,
      ],
      [
        'neva-buselik-besli',
        "Nevâ'da Bûselik beşlisi",
        'besli',
        ['neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer'],
        'dortlu:besli',
        60,
        undefined,
      ],
      [
        'dizi-rast',
        'Rast dizisi: çıkışta Eviç, inişte Acem',
        'dizi',
        ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'acem'],
        'makam:rast',
        60,
        undefined,
      ],
      [
        'dizi-neva',
        'Nevâ dizisi (inişte kapalı Nevâ)',
        'dizi',
        ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer', 'kapali-neva'],
        'makam:neva',
        60,
        undefined,
      ],
    ])
  })

  it('her ölçü 4 vuruştur', () => {
    for (const e of s3) {
      for (const [i, olcu] of e.olcu.entries()) {
        const toplam = olcu.reduce((t, n) => t + beats(n), 0)
        expect(Math.abs(toplam - 4), `${e.id} ${i + 1}. ölçü: ${toplam}`).toBeLessThan(1e-6)
      }
    }
  })

  it('her notanın yazılı perdesi etüdün perdelerinden biridir; her perde notalarda geçer (Nevâ ve kapalı Nevâ aynı D5)', () => {
    for (const e of s3) {
      const yazimlar = e.perdeler.map(yazim)
      const kullanilan = e.olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
      for (const p of kullanilan) expect(yazimlar.some((y) => samePitch(y, p)), `${e.id} ${p.step}${p.octave}${p.acc}`).toBe(true)
      for (const y of yazimlar) expect(kullanilan.some((p) => samePitch(y, p)), `${e.id} ${y.step}${y.octave}${y.acc}`).toBe(true)
    }
  })

  it('beşli ve dizi etütleri durak perdesinde biter; buselik beşlisinde Eviç yerine Acem (F5) vardır', () => {
    const get = (id: string) => ETUTLER.find((e) => e.id === id)!
    const notalar = (id: string) => get(id).olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
    expect(notalar('neva-rast-besli')).toContainEqual({ step: 'F', octave: 5, acc: 4 })
    expect(notalar('neva-rast-besli')).not.toContainEqual({ step: 'F', octave: 5, acc: 0 })
    expect(notalar('neva-buselik-besli')).toContainEqual({ step: 'F', octave: 5, acc: 0 })
    expect(notalar('neva-buselik-besli')).not.toContainEqual({ step: 'F', octave: 5, acc: 4 })
    expect(get('neva-buselik-besli').olcu).toEqual(
      parseEtut(
        'D5:4 E5:4 F5:4 G5:4 | A5:1 | A5:4 G5:4 F5:4 E5:4 | D5:1 | D5:4 E5:4 F5:2 | G5:4 A5:4 G5:2 | F5:4 E5:4 F5:4 E5:4 | D5:1',
      ),
    )
  })

  it('s1-etut-iki hedefi yeni türleri saymaz', () => {
    const hedef = SEVIYELER[1]!.hedefler.find((h) => h.id === 's1-etut-iki')!
    if (hedef.olcut.tur !== 'etutler') throw new Error('etütler ölçütü bekleniyordu')
    expect(hedef.olcut.etutIds).toHaveLength(9)
    for (const id of hedef.olcut.etutIds) expect(id.startsWith('tek-') || id.startsWith('iki-'), id).toBe(true)
  })
})

describe('Seviye 4 etütleri', () => {
  const s4 = ETUTLER.filter((e) => e.seviye === 4)
  const get = (id: string) => s4.find((e) => e.id === id)!

  it('on dört etüt ETUTLER\'in sonunda, brief sırasıyla; tür, perdeler, ders, usul ve tempo', () => {
    expect(ETUTLER.slice(-14)).toEqual(s4)
    expect(s4.map((e) => [e.id, e.baslik, e.tur, e.perdeler, e.dersId, e.usulId, e.bpm])).toEqual([
      ['tiz-segah-oktav', 'Oktav: Segâh–Tiz Segâh', 'tiz', ['segah', 'tiz-segah'], 'etut:tiz', undefined, 60],
      ['tiz-cargah-oktav', 'Oktav: Çârgâh–Tiz Çârgâh', 'tiz', ['cargah', 'tiz-cargah'], 'etut:tiz', undefined, 60],
      ['tiz-neva-oktav', 'Oktav: Nevâ–Tiz Nevâ', 'tiz', ['neva', 'tiz-neva'], 'etut:tiz', undefined, 60],
      [
        'kapali-oktav',
        'Oktav: Rast–Gerdâniye, Dügâh–Muhayyer (kapalı)',
        'tiz',
        ['rast', 'kapali-gerdaniye', 'dugah', 'kapali-muhayyer'],
        'etut:tiz',
        undefined,
        60,
      ],
      [
        'tiz-nim-hicaz-oktav',
        'Oktav: Nim Hicaz–Tiz Nim Hicaz',
        'tiz',
        ['nim-hicaz', 'tiz-nim-hicaz', 'neva'],
        'etut:tiz',
        undefined,
        60,
      ],
      [
        'dizi-ussak-tiz',
        "Uşşak dizisi Tiz Nevâ'ya kadar",
        'dizi',
        ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer', 'tiz-segah', 'tiz-cargah', 'tiz-neva'],
        'makam:ussak',
        undefined,
        60,
      ],
      [
        'dizi-bayati',
        "Bayâtî: Nevâ'dan başla",
        'dizi',
        ['neva', 'huseyni', 'cargah', 'segah', 'acem', 'gerdaniye', 'muhayyer', 'dugah'],
        'makam:bayati',
        undefined,
        60,
      ],
      [
        'dizi-huseyni',
        'Hüseynî dizisi (çıkışta Eviç, inişte Acem)',
        'dizi',
        ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer', 'acem'],
        'makam:huseyni',
        undefined,
        60,
      ],
      [
        'dizi-muhayyer',
        'Muhayyer: tizden iniş',
        'dizi',
        ['muhayyer', 'tiz-segah', 'gerdaniye', 'evic', 'huseyni', 'neva', 'acem', 'cargah', 'segah', 'dugah'],
        'makam:muhayyer',
        undefined,
        60,
      ],
      [
        'dizi-kurdi',
        'Kürdî dizisi',
        'dizi',
        ['dugah', 'kurdi', 'cargah', 'neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer'],
        'makam:kurdi',
        undefined,
        60,
      ],
      [
        'dizi-hicaz',
        'Hicaz dizisi',
        'dizi',
        ['dugah', 'dik-kurdi', 'nim-hicaz', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer'],
        'makam:hicaz',
        undefined,
        60,
      ],
      ['dil-2', 'Dil: bağsız, bağlı, kesik', 'dil', ['dugah', 'segah', 'cargah', 'neva', 'huseyni'], 'dil:teknikler', undefined, 60],
      ['usul-turk-aksagi', 'Usul: Türk Aksağı', 'usul', ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni'], 'usul:turk-aksagi', 'turk-aksagi', 60],
      [
        'usul-devr-i-hindi',
        'Usul: Devr-i Hindî',
        'usul',
        ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni'],
        'usul:devr-i-hindi',
        'devr-i-hindi',
        60,
      ],
    ])
  })

  it("ölçü vuruşu: usulsüzde 4, Türk Aksağı'nda 2.5, Devr-i Hindî'de 3.5; usul etütleri 8 ölçü", () => {
    for (const e of s4) {
      const beklenen = e.id === 'usul-turk-aksagi' ? 2.5 : e.id === 'usul-devr-i-hindi' ? 3.5 : 4
      for (const [i, o] of e.olcu.entries()) {
        const toplam = o.reduce((t, n) => t + beats(n), 0)
        expect(Math.abs(toplam - beklenen), `${e.id} ${i + 1}. ölçü: ${toplam}`).toBeLessThan(1e-6)
      }
    }
    expect(get('usul-turk-aksagi').olcu).toHaveLength(8)
    expect(get('usul-devr-i-hindi').olcu).toHaveLength(8)
  })

  it('her notanın yazılı perdesi etüdün perdelerinden biridir; her perde notalarda geçer (G5 ve A5 açık ve kapalı için ortak)', () => {
    for (const e of s4) {
      const yazimlar = e.perdeler.map(yazim)
      const kullanilan = e.olcu.flat().flatMap((n) => (n.kind === 'note' ? [n.pitch] : []))
      for (const p of kullanilan) expect(yazimlar.some((y) => samePitch(y, p)), `${e.id} ${p.step}${p.octave}${p.acc}`).toBe(true)
      for (const y of yazimlar) expect(kullanilan.some((p) => samePitch(y, p)), `${e.id} ${y.step}${y.octave}${y.acc}`).toBe(true)
    }
  })

  it('oktav etütleri aynı kalıpta: alt ve tiz perde bir oktav arayla', () => {
    const kalip = (alt: string, tiz: string) =>
      parseEtut(`${alt}:1 | ${tiz}:1 | ${alt}:2 ${tiz}:2 | ${tiz}:2 ${alt}:2 | ${alt}:4 ${tiz}:4 ${alt}:4 ${tiz}:4 | ${tiz}:2. r:4 | ${alt}:1`)
    expect(get('tiz-segah-oktav').olcu).toEqual(kalip('B4b1', 'B5b1'))
    expect(get('tiz-cargah-oktav').olcu).toEqual(kalip('C5', 'C6'))
    expect(get('tiz-neva-oktav').olcu).toEqual(kalip('D5', 'D6'))
  })

  it('dil-2: ilk 4 ölçüde bağ ve kesik yok; 5–8. ölçülerde bağ var; 9–12. ölçülerde kesik var', () => {
    const e = get('dil-2')
    expect(e.olcu).toHaveLength(12)
    const notalar = (a: number, b: number) => e.olcu.slice(a, b).flat().filter((n) => n.kind === 'note')
    for (const n of notalar(0, 4)) expect(n.bag || n.kesik, 'ilk dört ölçü').toBeFalsy()
    expect(notalar(4, 8).filter((n) => n.bag).length).toBeGreaterThanOrEqual(4)
    expect(notalar(4, 8).some((n) => n.kesik)).toBe(false)
    expect(notalar(8, 12).filter((n) => n.kesik).length).toBeGreaterThanOrEqual(8)
    expect(notalar(8, 12).some((n) => n.bag)).toBe(false)
  })

  it("usullerin USULLER'de olması: yalnız usul etütlerinde usulId var", () => {
    for (const e of s4) {
      if (e.tur === 'usul') expect(USULLER.some((u) => u.id === e.usulId), e.id).toBe(true)
      else expect(e.usulId, e.id).toBeUndefined()
    }
  })
})
