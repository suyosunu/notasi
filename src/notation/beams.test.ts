import { describe, expect, it } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import { beats, type DurationKind, type MusicEvent } from '../music/notation'
import { beamBeatsFor, beamGroups } from './beams'

const n = (dur: DurationKind, dotted = false): MusicEvent => ({
  kind: 'note',
  pitch: { step: 'G', octave: 4, acc: 0 },
  dur,
  ...(dotted ? { dotted: true } : {}),
})
const r = (dur: DurationKind): MusicEvent => ({ kind: 'rest', dur })

describe('beamGroups', () => {
  it("4/4'te 2+2 sekizlik iki grup olur", () => {
    expect(beamGroups([n('eighth'), n('eighth'), n('eighth'), n('eighth')], 1)).toEqual([
      [0, 1],
      [2, 3],
    ])
  })

  it('noktalı sekizlik + onaltılık tek grup olur', () => {
    expect(beamGroups([n('eighth', true), n('sixteenth'), n('quarter')], 1)).toEqual([[0, 1]])
  })

  it('dört onaltılık bir grup, sonraki vuruşa taşmaz', () => {
    const ev = [...Array.from({ length: 4 }, () => n('sixteenth')), n('eighth'), n('sixteenth'), n('sixteenth')]
    expect(beamGroups(ev, 1)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6],
    ])
  })

  it('dört otuzikilik bir grup olur; sekiz otuzikilik iki vuruş penceresinde iki grup', () => {
    const t = (): MusicEvent => n('thirtysecond')
    expect(beamGroups([t(), t(), t(), t(), n('quarter')], 1)).toEqual([[0, 1, 2, 3]])
    // Dört otuzikilik yarım vuruş eder; bir vuruş penceresine sekiz sığar.
    expect(beamGroups([t(), t(), t(), t(), t(), t(), t(), t()], 1)).toEqual([[0, 1, 2, 3, 4, 5, 6, 7]])
    // Sekizlik + dört otuzikilik tam bir vuruştur; sonraki sekizlik yeni pencerede tek kalır.
    expect(beamGroups([n('eighth'), t(), t(), t(), t(), n('eighth')], 1)).toEqual([[0, 1, 2, 3, 4]])
  })

  it('noktalı onaltılık + otuzikilik bir grup olur (iki yönde); bir nota daha sonraki vuruşa geçemez', () => {
    expect(beamGroups([n('sixteenth', true), n('thirtysecond'), n('quarter')], 1)).toEqual([[0, 1]])
    expect(beamGroups([n('thirtysecond'), n('sixteenth', true), n('quarter')], 1)).toEqual([[0, 1]])
    // Noktalı otuzikilik + onaltılık da bir vuruş penceresi içindedir.
    expect(beamGroups([n('thirtysecond', true), n('thirtysecond'), n('eighth')], 1)).toEqual([[0, 1, 2]])
  })

  it('otuzikilik sus grubu böler; otuzikilik sus kirişlenmez', () => {
    expect(beamGroups([n('thirtysecond'), r('thirtysecond'), n('thirtysecond'), n('thirtysecond')], 1)).toEqual([[2, 3]])
  })

  it('sus işareti grubu böler', () => {
    // Vuruş: s r s s → sus yüzünden önceki tek onaltılık gruplanmaz.
    expect(beamGroups([n('sixteenth'), r('sixteenth'), n('sixteenth'), n('sixteenth')], 1)).toEqual([[2, 3]])
    expect(beamGroups([n('eighth'), r('eighth'), n('eighth'), n('eighth')], 1)).toEqual([[2, 3]])
  })

  it('ölçü çizgisi grubu böler ve vuruş konumunu sıfırlar', () => {
    // Ölçü 1: q q q e e | ölçü 2: e e q ...
    const ev = [n('quarter'), n('quarter'), n('quarter'), n('eighth'), n('eighth'), n('eighth'), n('eighth')]
    expect(beamGroups(ev, 1, [4])).toEqual([
      [3, 4],
      [5, 6],
    ])
    // Kısa (eksik) ölçüden sonra da konum sıfırlanır: e | e e
    expect(beamGroups([n('eighth'), n('eighth'), n('eighth')], 1, [0])).toEqual([[1, 2]])
  })

  it("12/8'de 3+3 sekizlik iki grup olur", () => {
    expect(beamGroups(Array.from({ length: 6 }, () => n('eighth')), 1.5)).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ])
  })

  it('tek sekizlik grup oluşturmaz', () => {
    expect(beamGroups([n('eighth')], 1)).toEqual([])
    expect(beamGroups([n('quarter'), n('eighth'), n('quarter')], 1)).toEqual([])
  })

  it('vuruş sınırını aşan nota grup başlatmaz', () => {
    // e q e: ortadaki dörtlük ikinci vuruşa taşar; iki sekizlik ayrı vuruşlarda tek kalır.
    expect(beamGroups([n('eighth'), n('quarter'), n('eighth')], 1)).toEqual([])
    // 12/8: q e. s e → noktalı sekizlik (1–1,75) vuruş sınırını (1,5) aşar ve gruba girmez;
    // ardından gelen onaltılık + sekizlik (1,75–2,5) ikinci vuruşun içindedir.
    expect(beamGroups([n('quarter'), n('eighth', true), n('sixteenth'), n('eighth')], 1.5)).toEqual([[2, 3]])
  })

  it("12/8 yedek geçişi: Dolap ölçüsü (e e e q e q e. s q) iki grup verir", () => {
    const m = [
      n('eighth'),
      n('eighth'),
      n('eighth'),
      n('quarter'),
      n('eighth'),
      n('quarter'),
      n('eighth', true),
      n('sixteenth'),
      n('quarter'),
    ]
    expect(beamGroups(m, 1.5)).toEqual([
      [0, 1, 2],
      [6, 7],
    ])
    // İki ölçü art arda: her ölçüde aynı iki grup, ölçü çizgisi aşılmaz.
    expect(beamGroups([...m, ...m], 1.5, [8, 17])).toEqual([
      [0, 1, 2],
      [6, 7],
      [9, 10, 11],
      [15, 16],
    ])
  })

  it('12/8 yedek geçişi: bir dörtlükten uzun ya da sekizlik ızgarasında başlamayan çift gruplanmaz', () => {
    // q e. e: noktalı sekizlik + sekizlik 1,25 dörtlük sürer.
    expect(beamGroups([n('quarter'), n('eighth', true), n('eighth')], 1.5)).toEqual([])
    // q (s sus) e. s: noktalı sekizlik 1,25'te başlar (ızgara dışı).
    expect(beamGroups([n('quarter'), r('sixteenth'), n('eighth', true), n('sixteenth')], 1.5)).toEqual([])
    // Ölçü çizgisi yedek grubu da böler: q e. | s
    expect(beamGroups([n('quarter'), n('eighth', true), n('sixteenth')], 1.5, [1])).toEqual([])
  })

  it("12/8 yedek geçişi: vuruş sınırını aşan yalın sekizlik çifti gruplanmaz (q e | e q)", () => {
    // q (0–1) e (1–1,5) | e (1,5–2) q: 3. ve 4. sekizlik farklı vuruşlarda.
    expect(beamGroups([n('quarter'), n('eighth'), n('eighth'), n('quarter')], 1.5)).toEqual([])
    // Aynı çift vuruşun içindeyse (e e e: 0–1,5) normal kirişlenir.
    expect(beamGroups([n('eighth'), n('eighth'), n('eighth')], 1.5)).toEqual([[0, 1, 2]])
  })

  it("12/8 yedek geçişi: vuruş sınırını aşan e. s ve s e. çiftleri hâlâ kirişlenir", () => {
    // q e. s: noktalı sekizlik 1–1,75 sınırı (1,5) aşar; yedek geçiş yine de kirişler.
    expect(beamGroups([n('quarter'), n('eighth', true), n('sixteenth')], 1.5)).toEqual([[1, 2]])
    // q s e.: onaltılık 1–1,25, noktalı sekizlik 1,25–2 sınırı aşar; s e. çifti kirişlenir.
    expect(beamGroups([n('quarter'), n('sixteenth'), n('eighth', true)], 1.5)).toEqual([[1, 2]])
  })

  it("4/4'te yedek geçiş uygulanmaz: vuruşu aşan e e çifti gruplanmaz", () => {
    // e q e e q e: 1,5–2,5 arasındaki iki sekizlik 2. ve 3. vuruşa yayılır.
    const ev = [n('eighth'), n('quarter'), n('eighth'), n('eighth'), n('quarter'), n('eighth')]
    expect(beamGroups(ev, 1)).toEqual([])
  })

  it('üçlemeli sekizlikler bir vuruşta tek kiriş', () => {
    const u = (): MusicEvent => ({ ...n('eighth'), uclu: true })
    expect(beamGroups([u(), u(), u(), n('quarter')], 1)).toEqual([[0, 1, 2]])
  })

  it('3 üçleme + 2 sekizlik: iki ayrı grup', () => {
    const u = (): MusicEvent => ({ ...n('eighth'), uclu: true })
    expect(beamGroups([u(), u(), u(), n('eighth'), n('eighth')], 1)).toEqual([
      [0, 1, 2],
      [3, 4],
    ])
  })

  it('usulden vuruş birimi: mertebe 8 → 1,5, aksi halde 1', () => {
    expect(beamBeatsFor(USULLER.find((u) => u.id === 'dolap'))).toBe(1.5)
    expect(beamBeatsFor(USULLER.find((u) => u.id === 'sofyan'))).toBe(1)
    expect(beamBeatsFor(undefined)).toBe(1)
  })
})

describe('beamGroups: gerçek parçalar', () => {
  it('gerçek parçalarda hiçbir kiriş vuruş sınırını (12/8 yedek dörtlük grupları dışında), ölçü çizgisini ya da susu aşmaz', () => {
    expect(PARCALAR.length).toBeGreaterThanOrEqual(8)
    let total = 0
    for (const p of PARCALAR) {
      const beat = beamBeatsFor(USULLER.find((u) => u.id === p.usul))
      const events = p.olcu.flat()
      const barlinesAfter: number[] = []
      const measureStart: number[] = []
      let k = 0
      for (const m of p.olcu) {
        m.forEach(() => measureStart.push(k))
        k += m.length
        barlinesAfter.push(k - 1)
      }
      // Her olayın ölçü içindeki başlangıcı (dörtlük cinsinden).
      const startOf = (i: number) =>
        events.slice(measureStart[i], i).reduce((s, e) => s + beats(e), 0)
      const groups = beamGroups(events, beat, barlinesAfter)
      expect(groups.length, p.id).toBeGreaterThan(0)
      for (const g of groups) {
        total++
        expect(g.length).toBeGreaterThanOrEqual(2)
        g.forEach((i, j) => {
          const e = events[i]!
          expect(e.kind, `${p.id} olay ${i}`).toBe('note')
          expect(['eighth', 'sixteenth', 'thirtysecond']).toContain(e.dur)
          if (j > 0) expect(i).toBe(g[j - 1]! + 1)
          expect(measureStart[i]).toBe(measureStart[g[0]!])
        })
        const first = g[0]!
        const last = g.at(-1)!
        const start = startOf(first)
        const end = startOf(last) + beats(events[last]!)
        const beatIndex = Math.floor(start / beat + 1e-9)
        const inBeat = end <= (beatIndex + 1) * beat + 1e-9
        // Yedek grup (yalnızca 12/8): sekizlik ızgarasında başlar ve tam bir dörtlük sürer.
        const quarterOnGrid =
          beat !== 1 && Math.abs(start * 2 - Math.round(start * 2)) < 1e-9 && Math.abs(end - start - 1) < 1e-9
        expect(inBeat || quarterOnGrid, `${p.id} grup ${g.join(',')}`).toBe(true)
      }
    }
    expect(total).toBeGreaterThan(20)
  })
})
