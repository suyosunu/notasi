import { describe, expect, it } from 'vitest'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { PARCALAR } from '../content/parcalar'
import type { DurationKind, MusicEvent } from '../music/notation'
import type { Accidental, Step } from '../music/pitch'
import { parcaSeviyesi, perdeSeviyesi } from './parca-seviye'

const n = (step: Step, octave: number, acc: Accidental = 0, dur: DurationKind = 'quarter', ekstra: Partial<MusicEvent> = {}): MusicEvent =>
  ({ kind: 'note', pitch: { step, octave, acc }, dur, ...ekstra }) as MusicEvent

// Nevâ D5, Çârgâh C5, Segâh B4b1, Dügâh A4, Rast G4: beş perde, Seviye 1
const BES = (dur: DurationKind): MusicEvent[][] => [
  [n('D', 5, 0, dur), n('C', 5, 0, dur), n('B', 4, -1, dur), n('A', 4, 0, dur), n('G', 4, 0, dur)],
]

describe('perdeSeviyesi', () => {
  it('SEVIYELER uzun-ses hedeflerinden türer', () => {
    expect(perdeSeviyesi('rast')).toBe(1)
    expect(perdeSeviyesi('neva')).toBe(1)
    expect(perdeSeviyesi('buselik')).toBe(2)
    expect(perdeSeviyesi('huseyni')).toBe(2)
    expect(perdeSeviyesi('acem')).toBe(3)
    expect(perdeSeviyesi('tiz-neva')).toBe(4)
    expect(perdeSeviyesi('kapali-neva')).toBe(3)
    expect(perdeSeviyesi('kapali-gerdaniye')).toBe(4)
    expect(perdeSeviyesi('kapali-muhayyer')).toBe(4)
  })

  it('her ney perdesinin bir seviyesi vardır', () => {
    for (const p of NEY_PERDELER) expect(perdeSeviyesi(p.id), p.id).not.toBeNull()
  })
})

describe('parcaSeviyesi', () => {
  it('sekizlikli beş perde parçası 1', () => {
    expect(parcaSeviyesi(BES('eighth'))).toBe(1)
  })

  it('aynı parça onaltılıkla 2', () => {
    expect(parcaSeviyesi(BES('sixteenth'))).toBe(2)
  })

  it('noktalı sekizlik ve üçleme 2; noktalı dörtlük 1', () => {
    expect(parcaSeviyesi([[n('G', 4, 0, 'eighth', { dotted: true })]])).toBe(2)
    expect(parcaSeviyesi([[n('G', 4, 0, 'eighth', { uclu: true })]])).toBe(2)
    expect(parcaSeviyesi([[n('G', 4, 0, 'quarter', { dotted: true })]])).toBe(1)
  })

  it('otuzikilik 4', () => {
    expect(parcaSeviyesi(BES('thirtysecond'))).toBe(4)
  })

  it('susun süresi de ritim seviyesini belirler', () => {
    expect(parcaSeviyesi([[n('G', 4), { kind: 'rest', dur: 'sixteenth' }]])).toBe(2)
  })

  it('perde seviyesi ritimden büyükse perde baskındır', () => {
    expect(parcaSeviyesi([[n('G', 4), n('E', 5)]])).toBe(2) // Hüseynî
    expect(parcaSeviyesi([[n('G', 4), n('F', 5, 4)]])).toBe(3) // Eviç
    expect(parcaSeviyesi([[n('G', 4), n('C', 6)]])).toBe(4) // Tiz Çârgâh
  })

  it('aynı perdeyi gösteren iki kayıtta en düşük seviye alınır (D5 Nevâ ve kapalı Nevâ)', () => {
    expect(parcaSeviyesi([[n('D', 5)]])).toBe(1)
  })

  it('Segâh B4b1 ve Bûselik B4 birbirine bir koma uzak olsa da tam eşleşme kazanır', () => {
    expect(parcaSeviyesi([[n('B', 4, -1)]])).toBe(1)
    expect(parcaSeviyesi([[n('B', 4)]])).toBe(2)
  })

  it('perdeden en çok 1 koma uzak yazılmış nota o perdenin seviyesindedir (E5b1 -> Hüseynî)', () => {
    expect(parcaSeviyesi([[n('E', 5, -1, 'eighth'), n('G', 4, 0, 'eighth')]])).toBe(2)
  })

  it('her perdeye 1 komadan uzak nota (F4#4, Irak) null', () => {
    expect(parcaSeviyesi([[n('F', 4, 4), n('G', 4)]])).toBeNull()
  })

  it('boş parça 1', () => {
    expect(parcaSeviyesi([])).toBe(1)
  })

  it('mevcut parçalar çökmez', () => {
    for (const p of PARCALAR) expect(() => parcaSeviyesi(p.olcu), p.id).not.toThrow()
  })
})
