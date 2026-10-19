import { describe, expect, it } from 'vitest'
import { beats } from '../../music/notation'
import type { MusicEvent } from '../../music/notation'
import { writtenKoma } from '../../music/pitch'
import { USULLER } from '../usuller'
import { PARCALAR, toParca } from './index'
import lisans from './LISANS.md?raw'

/** SymbTr KomaAE ölçeği: Do4 = 265 (53 × 5). */
const komaAE = (e: MusicEvent): number => (e.kind === 'rest' ? -1 : writtenKoma(e.pitch) + 265)
const durKey = (e: MusicEvent): string => `${e.dur}${e.dotted ? '.' : ''}`
const byId = (id: string) => PARCALAR.find((p) => p.id === id)!

describe('PARCALAR', () => {
  it('üç parça kolaydan zora sıralı', () => {
    expect(PARCALAR.map((p) => p.id)).toEqual(['benim-adim-dertli-dolap', 'hak-teala', 'daglar-ile-taslar-ile'])
    expect(PARCALAR.map((p) => p.title)).toEqual(['Benim Adım Dertli Dolap', 'Hak Teâlâ', 'Dağlar ile Taşlar ile'])
  })

  it('makam, usul ve kaynak bilgisi', () => {
    expect(byId('benim-adim-dertli-dolap')).toMatchObject({ makam: 'ussak', usul: 'dolap' })
    expect(byId('hak-teala')).toMatchObject({ makam: 'ussak', usul: 'sofyan', composer: 'Ali Ufkî' })
    expect(byId('daglar-ile-taslar-ile')).toMatchObject({ makam: 'hicaz', usul: 'sofyan', composer: 'Kutbî Dede' })
    for (const p of PARCALAR) {
      expect(p.source).toMatch(/^https:\/\/raw\.githubusercontent\.com\/MTG\/SymbTr\/master\/txt\/.+\.txt$/)
    }
  })

  for (const p of PARCALAR) {
    describe(p.id, () => {
      const usul = USULLER.find((u) => u.id === p.usul)!
      const measureBeats = (usul.zaman * 4) / usul.mertebe

      it('usul tanımlı', () => {
        expect(usul).toBeDefined()
      })

      it('her ölçünün vuruş toplamı usul zamanına eşit (ilk ölçü anacrusis olabilir)', () => {
        p.olcu.forEach((m, i) => {
          const total = m.reduce((s, e) => s + beats(e), 0)
          if (i === 0) {
            expect(total).toBeGreaterThan(0)
            expect(total).toBeLessThanOrEqual(measureBeats)
          } else {
            expect(total, `ölçü ${i + 1}`).toBe(measureBeats)
          }
        })
      })

      it('söz ölçü başına olaylarla hizalı, suslarda boş', () => {
        expect(p.soz).toBeDefined()
        expect(p.soz!).toHaveLength(p.olcu.length)
        p.olcu.forEach((m, i) => {
          expect(p.soz![i]).toHaveLength(m.length)
          m.forEach((e, j) => {
            if (e.kind === 'rest') expect(p.soz![i]![j]).toBe('')
          })
        })
      })

      it('heceler kırpılmış, ulama ‿ ile yazılmış', () => {
        for (const s of p.soz!.flat()) {
          expect(s).toBe(s.trim())
          expect(s).not.toContain('_')
        }
      })

      it('bağ yalnızca aynı ölçüdeki aynı perdeye gider; bağlı parçanın hecesi boştur', () => {
        p.olcu.forEach((m, i) => {
          m.forEach((e, j) => {
            if (e.kind !== 'note' || !e.tie) return
            const next = m[j + 1]
            expect(next, `ölçü ${i + 1} olay ${j + 1}`).toBeDefined()
            expect(next!.kind).toBe('note')
            if (next!.kind === 'note') expect(next!.pitch).toEqual(e.pitch)
            expect(p.soz![i]![j + 1]).toBe('')
          })
        })
      })
    })
  }

  it('Benim Adım: 8 × 12/8, ilk ölçü KomaAE ve süreleri kaynakla aynı', () => {
    const p = byId('benim-adim-dertli-dolap')
    expect(p.olcu).toHaveLength(8)
    const m1 = p.olcu[0]!
    // SymbTr Sira 2–10.
    expect(m1.map(komaAE)).toEqual([296, 318, 313, 318, 313, 318, 327, 318, 313])
    expect(m1.map(durKey)).toEqual([
      'eighth',
      'eighth',
      'eighth',
      'quarter',
      'eighth',
      'quarter',
      'eighth.',
      'sixteenth',
      'quarter',
    ])
    expect(p.soz![0]).toEqual(['Be', 'nim‿', 'a', 'dım', 'dert', 'li', 'do', '', 'lap'])
  })

  it('Hak Teâlâ: 31 × 4/4, ilk ve son ölçü kaynakla aynı', () => {
    const p = byId('hak-teala')
    expect(p.olcu).toHaveLength(31)
    // Sira 2–7.
    expect(p.olcu[0]!.map(komaAE)).toEqual([305, 313, 313, 305, 296, 305])
    expect(p.olcu[0]!.map(durKey)).toEqual(['quarter', 'quarter', 'eighth', 'eighth', 'eighth', 'eighth'])
    // Sira 149–151 (son satır yarımlık Es).
    expect(p.olcu[30]!.map(komaAE)).toEqual([305, 305, -1])
    expect(p.olcu[30]!.map(durKey)).toEqual(['quarter', 'quarter', 'half'])
  })

  it('Dağlar ile: 40 × 4/4, ilk ölçü ve 5/8 süreli Mi5 bağlı ikilik + sekizlik', () => {
    const p = byId('daglar-ile-taslar-ile')
    expect(p.olcu).toHaveLength(40)
    // Sira 2–8.
    expect(p.olcu[0]!.map(komaAE)).toEqual([305, 327, 336, 327, 327, 322, 327])
    expect(p.olcu[0]!.map(durKey)).toEqual([
      'quarter',
      'quarter',
      'sixteenth',
      'sixteenth',
      'sixteenth',
      'sixteenth',
      'quarter',
    ])
    expect(p.soz![0]).toEqual(['Dağ', 'lar‿', 'i', '', '', '', 'le'])
    // Sira 33–34: Re5 3/8 "ni", Mi5 5/8 (melizma) → noktalı dörtlük, bağlı ikilik + sekizlik.
    for (const i of [4, 9, 24, 29]) {
      const m = p.olcu[i]!
      expect(m.map(komaAE), `ölçü ${i + 1}`).toEqual([327, 336, 336])
      expect(m.map(durKey)).toEqual(['quarter.', 'half', 'eighth'])
      expect(m.map((e) => e.kind === 'note' && e.tie === true)).toEqual([false, true, false])
      expect(p.soz![i]).toEqual(['ni', '', ''])
    }
    const ties = p.olcu.flat().filter((e) => e.kind === 'note' && e.tie)
    expect(ties).toHaveLength(4)
  })

  it('başka parçada bağ yok', () => {
    for (const id of ['benim-adim-dertli-dolap', 'hak-teala']) {
      expect(byId(id).olcu.flat().some((e) => e.kind === 'note' && e.tie)).toBe(false)
    }
  })

  it('perde dağılımı araştırma notundaki sayımlarla aynı (§5; bağlı parçalar tek nota sayılır)', () => {
    const counts = (id: string) => {
      const c: Record<string, number> = {}
      const flat = byId(id).olcu.flat()
      for (const [i, e] of flat.entries()) {
        if (e.kind !== 'note') continue
        const prev = flat[i - 1]
        if (prev?.kind === 'note' && prev.tie) continue
        const { step, octave, acc } = e.pitch
        const key = `${step}${octave}${acc === 0 ? '' : `${acc < 0 ? 'b' : '#'}${Math.abs(acc)}`}`
        c[key] = (c[key] ?? 0) + 1
      }
      return c
    }
    expect(counts('benim-adim-dertli-dolap')).toEqual({ G4: 4, A4: 16, B4b1: 28, C5: 20, D5: 4 })
    expect(counts('hak-teala')).toEqual({ G4: 6, A4: 45, B4b1: 37, C5: 27, D5: 21, E5: 7, F5: 2, G5: 4 })
    expect(counts('daglar-ile-taslar-ile')).toEqual({
      'F4#4': 4,
      G4: 12,
      A4: 40,
      B4b4: 32,
      B4: 4,
      'C5#4': 56,
      D5: 76,
      E5: 32,
      F5: 8,
      G5: 4,
    })
  })
})

describe('toParca', () => {
  const base = { id: 'x', title: 'X', makam: 'ussak', usul: 'sofyan', composer: 'Y', source: 'u' }
  it('geçerli veriyi kabul eder', () => {
    const data = { ...base, olcu: [[{ kind: 'rest', dur: 'sixteenth' }]] }
    expect(toParca(data).olcu[0]![0]).toEqual({ kind: 'rest', dur: 'sixteenth' })
  })
  it('bağı korur', () => {
    const pitch = { step: 'E', octave: 5, acc: 0 }
    const data = { ...base, olcu: [[{ kind: 'note', pitch, dur: 'half', tie: true }, { kind: 'note', pitch, dur: 'half' }]] }
    expect(toParca(data).olcu[0]).toEqual(data.olcu[0])
    expect(() => toParca({ ...base, olcu: [[{ kind: 'note', pitch, dur: 'half', tie: 1 }]] })).toThrow()
    expect(() => toParca({ ...base, olcu: [[{ kind: 'rest', dur: 'half', tie: true }]] })).toThrow()
  })
  it('bozuk veriyi reddeder', () => {
    expect(() => toParca({ ...base, makam: 'nihavent', olcu: [] })).toThrow()
    expect(() => toParca({ ...base, olcu: [[{ kind: 'note', dur: 'quarter' }]] })).toThrow()
    expect(() => toParca({ ...base, olcu: [[{ kind: 'rest', dur: 'triplet' }]] })).toThrow()
    expect(() => toParca({ ...base, olcu: [[{ kind: 'note', dur: 'quarter', pitch: { step: 'B', octave: 4, acc: -2 } }]] })).toThrow()
    expect(() => toParca({ ...base, olcu: [[{ kind: 'rest', dur: 'half' }]], soz: [] })).toThrow()
  })
})

describe('LISANS.md', () => {
  const text = lisans
  it('CC BY-NC-SA 4.0 atfı ve Karaosmanoğlu 2012', () => {
    expect(text).toContain('CC BY-NC-SA 4.0')
    expect(text).toContain('https://creativecommons.org/licenses/by-nc-sa/4.0/')
    expect(text).toContain('Karaosmanoğlu')
    expect(text).toContain('2012')
    expect(text).toContain('SymbTr')
    expect(text).toContain('https://github.com/MTG/SymbTr')
  })
  it('her parçanın kaynak URL’sini içerir', () => {
    for (const p of PARCALAR) expect(text).toContain(p.source)
  })
})
