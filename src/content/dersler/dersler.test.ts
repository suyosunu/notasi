import { describe, expect, it } from 'vitest'
import { rotaBilinir } from '../../app'
import { NEY_PERDELER } from '../ney-perdeler'
import { NOTA_TOPICS } from '../nota-topics'
import { DERSLER, dersById, notaDersId, perdeDersId } from './index'
import type { Ders, DersBlok } from './types'

/** Bir dersteki tüm metinler (başlık, anlatım, açıklamalar, adımlar, kaynaklar). */
function metinler(d: Ders): string[] {
  const blokMetni = (b: DersBlok): string[] => {
    switch (b.tur) {
      case 'metin':
        return [b.metin]
      case 'liste':
        return b.maddeler
      case 'dene':
        return b.adimlar
      case 'porte':
      case 'parmak':
      case 'gorsel':
        return b.aciklama ? [b.aciklama] : []
    }
  }
  return [d.baslik, ...d.bloklar.flatMap(blokMetni), ...d.kaynaklar]
}

describe('kimlik yardımcıları', () => {
  it('notaDersId ve perdeDersId', () => {
    expect(notaDersId('nota-1')).toBe('nota:nota-1')
    expect(perdeDersId('neva')).toBe('perde:neva')
  })

  it('dersById bilinmeyen kimlikte undefined', () => {
    expect(dersById('yok:yok')).toBeUndefined()
  })
})

// Task 35–39 ders ekledikçe bu değişmezler onları kendiliğinden kapsar (boş listede de geçer).
describe('DERSLER değişmezleri', () => {
  it('kimlikler benzersiz', () => {
    const ids = DERSLER.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: dene bloğu ve görsel blok var, kaynaklar dolu', (_id, d) => {
    expect(d.bloklar.some((b) => b.tur === 'dene')).toBe(true)
    expect(d.bloklar.some((b) => b.tur === 'porte' || b.tur === 'parmak' || b.tur === 'gorsel')).toBe(true)
    expect(d.kaynaklar.length).toBeGreaterThan(0)
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: kimlik öneki bağlı olduğu içeriğe işaret eder', (_id, d) => {
    if (d.id.startsWith('perde:')) expect(NEY_PERDELER.map((p) => p.id)).toContain(d.id.slice('perde:'.length))
    if (d.id.startsWith('nota:')) expect(NOTA_TOPICS.map((t) => t.id)).toContain(d.id.slice('nota:'.length))
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: parmak blokları var olan perdeye bağlı', (_id, d) => {
    for (const b of d.bloklar) if (b.tur === 'parmak') expect(NEY_PERDELER.map((p) => p.id)).toContain(b.perdeId)
  })

  it.each(DERSLER.filter((d) => d.alistirma).map((d) => [d.id, d.alistirma!] as const))(
    '%s: alıştırma rotası (%s) bilinir',
    (_id, rota) => {
      expect(rotaBilinir(rota)).toBe(true)
    },
  )

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: BELİRSİZ işaretli bilgi yazılmaz', (_id, d) => {
    for (const m of metinler(d)) expect(m).not.toMatch(/BELİRSİZ/i)
  })
})
