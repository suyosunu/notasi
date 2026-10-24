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

  it('usulden vuruş birimi: mertebe 8 → 1,5, aksi halde 1', () => {
    expect(beamBeatsFor(USULLER.find((u) => u.id === 'dolap'))).toBe(1.5)
    expect(beamBeatsFor(USULLER.find((u) => u.id === 'sofyan'))).toBe(1)
    expect(beamBeatsFor(undefined)).toBe(1)
  })
})

describe('beamGroups: gerçek parçalar', () => {
  it('üç gerçek parçada hiçbir kiriş vuruş sınırını, ölçü çizgisini ya da susu aşmaz', () => {
    expect(PARCALAR).toHaveLength(3)
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
          expect(['eighth', 'sixteenth']).toContain(e.dur)
          if (j > 0) expect(i).toBe(g[j - 1]! + 1)
          expect(measureStart[i]).toBe(measureStart[g[0]!])
        })
        const first = g[0]!
        const last = g.at(-1)!
        const start = startOf(first)
        const end = startOf(last) + beats(events[last]!)
        const beatIndex = Math.floor(start / beat + 1e-9)
        expect(end, `${p.id} grup ${g.join(',')}`).toBeLessThanOrEqual((beatIndex + 1) * beat + 1e-9)
      }
    }
    expect(total).toBeGreaterThan(20)
  })
})
