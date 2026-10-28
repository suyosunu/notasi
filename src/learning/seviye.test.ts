import { describe, expect, it, vi } from 'vitest'
import { SEVIYELER } from '../content/seviyeler'
import type { Hedef, Seviye } from '../content/seviyeler'
import * as db from '../store/db'
import { isaretEkle, resetDbForTests } from '../store/db'
import type { LongToneRec } from '../store/db'
import { BASPARE_ID } from './baspare'
import { ILK_SES_ID } from './evening-plan'
import { hedefDurumlari, loadIlerleme, mevcutSeviye, siradakiHedef } from './seviye'
import type { HedefDurumu, IlerlemeGirdisi } from './seviye'

function girdi(over: Partial<IlerlemeGirdisi> = {}): IlerlemeGirdisi {
  return {
    okunanDersler: new Set(),
    onaylar: new Set(),
    calinanEtutler: new Set(),
    vurulanUsuller: new Set(),
    longTones: [],
    notaStatuses: {},
    ...over,
  }
}

function kayit(perdeId: string, durationMs: number, toleranceCents: number, passed = true): LongToneRec {
  return { id: crypto.randomUUID(), perdeId, durationMs, passed, toleranceCents, at: new Date().toISOString() }
}

const hedef = (id: string): Hedef => SEVIYELER.flatMap((s) => s.hedefler).find((h) => h.id === id)!

describe('hedefDurumlari', () => {
  it('boş girdide hiçbir hedef tamam değildir', () => {
    const d = hedefDurumlari(SEVIYELER, girdi())
    for (const h of SEVIYELER.flatMap((s) => s.hedefler)) expect(d[h.id]!.tamam, h.id).toBe(false)
  })

  it('ders hedefi okunan dersler kümesine bakar', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ okunanDersler: new Set(['s0:neyi-tani']) }))
    expect(d['s0-tani']!.tamam).toBe(true)
    expect(d['s0-durus']!.tamam).toBe(false)
  })

  it('onay hedefi onaylar kümesine bakar', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ onaylar: new Set(['s0-ayna', 's0-nefes']) }))
    expect(d['s0-ayna']!.tamam).toBe(true)
    expect(d['s0-nefes']!.tamam).toBe(true)
    expect(d['s1-rast-gur']!.tamam).toBe(false)
  })

  it('ilk ses ve başpâre: geçmiş kayıt gerekir', () => {
    const yok = hedefDurumlari(
      SEVIYELER,
      girdi({ longTones: [kayit(ILK_SES_ID, 1000, 50, false), kayit(BASPARE_ID, 0, 25, false)] }),
    )
    expect(yok['s0-ilk-ses']!.tamam).toBe(false)
    expect(yok['s0-baspare']!.tamam).toBe(false)
    const var_ = hedefDurumlari(SEVIYELER, girdi({ longTones: [kayit(ILK_SES_ID, 3000, 50), kayit(BASPARE_ID, 0, 25)] }))
    expect(var_['s0-ilk-ses']!.tamam).toBe(true)
    expect(var_['s0-baspare']!.tamam).toBe(true)
  })

  it('uzun ses: 5,5 sn / 20 sent geçiş hedefi tamamlar', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ longTones: [kayit('neva', 5500, 20)] }))
    expect(d['s0-neva-5']).toEqual({ tamam: true, ilerleme: 'en iyi 5,5 sn' })
  })

  it('uzun ses: 6 sn ama 25 sent tamamlamaz ve ilerleme göstermez', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ longTones: [kayit('neva', 6000, 25)] }))
    expect(d['s0-neva-5']!.tamam).toBe(false)
    expect(d['s0-neva-5']!.ilerleme).toBeUndefined()
  })

  it('uzun ses: geçmemiş kayıt sayılmaz; ne tamamlar ne ilerleme gösterir', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ longTones: [kayit('neva', 5800, 20, false)] }))
    expect(d['s0-neva-5']!.tamam).toBe(false)
    expect(d['s0-neva-5']!.ilerleme).toBeUndefined()
  })

  it('uzun ses: yetersiz süre tamam değil; başka perdenin kaydı sayılmaz', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ longTones: [kayit('neva', 4900, 15), kayit('cargah', 9000, 15)] }))
    expect(d['s0-neva-5']).toEqual({ tamam: false, ilerleme: 'en iyi 4,9 sn' })
    expect(d['s0-neva-5']!.tamam).toBe(false)
    expect(d['s1-cargah-8']).toEqual({ tamam: true, ilerleme: 'en iyi 9,0 sn' })
    expect(d['s1-neva-8']!.tamam).toBe(false)
  })

  it('konular: "k/n" ilerlemesi; hepsi öğrenilince tamam', () => {
    const olcut = hedef('s1-nota').olcut
    const ids = olcut.tur === 'konular' ? olcut.topicIds : []
    const kismi = Object.fromEntries(ids.map((id, i) => [id, i < 3 ? 'ogrenildi' : 'acik']))
    const d = hedefDurumlari(SEVIYELER, girdi({ notaStatuses: kismi as IlerlemeGirdisi['notaStatuses'] }))
    expect(d['s1-nota']).toEqual({ tamam: false, ilerleme: '3/10' })
    const hepsi = Object.fromEntries(ids.map((id) => [id, 'ogrenildi']))
    const t = hedefDurumlari(SEVIYELER, girdi({ notaStatuses: hepsi as IlerlemeGirdisi['notaStatuses'] }))
    expect(t['s1-nota']).toEqual({ tamam: true, ilerleme: '10/10' })
  })

  it('etütler: "k/n" ilerlemesi; hepsi çalınınca tamam', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ calinanEtutler: new Set(['rast-besli-1', 'tek-neva']) }))
    expect(d['s1-rast-besli']).toEqual({ tamam: false, ilerleme: '1/2' })
    expect(d['s1-etut-iki']).toEqual({ tamam: false, ilerleme: '1/9' })
    const t = hedefDurumlari(SEVIYELER, girdi({ calinanEtutler: new Set(['rast-besli-1', 'rast-besli-2']) }))
    expect(t['s1-rast-besli']!.tamam).toBe(true)
  })
})

describe('usul-vurma ve Seviye 2 ölçütleri', () => {
  it("usul-vurma hedefi vurulanUsuller'de usul varsa tamam", () => {
    const yok = hedefDurumlari(SEVIYELER, girdi())
    expect(yok['s2-vur-semai']!.tamam).toBe(false)
    const d = hedefDurumlari(SEVIYELER, girdi({ vurulanUsuller: new Set(['semai']) }))
    expect(d['s2-vur-semai']!.tamam).toBe(true)
    expect(d['s2-vur-sofyan']!.tamam).toBe(false)
    expect(d['s2-vur-nim-sofyan']!.tamam).toBe(false)
  })

  it('Seviye 2 etüt ve ders hedefleri ilgili kümelere bakar', () => {
    const d = hedefDurumlari(
      SEVIYELER,
      girdi({
        okunanDersler: new Set(['okuma:ropriz', 'okuma:olcu']),
        calinanEtutler: new Set(['usul-nim-sofyan', 'dil-1', 'dortlu-cargah']),
      }),
    )
    expect(d['s2-ropriz']!.tamam).toBe(true)
    expect(d['s1-olcu']!.tamam).toBe(true)
    expect(d['s2-usul-etut']).toEqual({ tamam: false, ilerleme: '1/3' })
    expect(d['s2-dortlu']).toEqual({ tamam: false, ilerleme: '1/3' })
    expect(d['s2-dil']).toEqual({ tamam: true, ilerleme: '1/1' })
  })

  it('loadIlerleme vurulanUsuller alanı olmayan ayarla hatasız', async () => {
    await resetDbForTests()
    const g = await loadIlerleme()
    expect(g.vurulanUsuller.size).toBe(0)
    await isaretEkle('vurulanUsuller', 'sofyan')
    expect([...(await loadIlerleme()).vurulanUsuller]).toEqual(['sofyan'])
  })

  it('loadIlerleme settings.vurulanUsuller tanımsızken de çökmez', async () => {
    await resetDbForTests()
    vi.spyOn(db, 'getSettings').mockResolvedValueOnce({} as Awaited<ReturnType<typeof db.getSettings>>)
    const g = await loadIlerleme()
    expect(g.vurulanUsuller.size).toBe(0)
    expect(g.okunanDersler.size).toBe(0)
  })
})

describe('mevcutSeviye ve siradakiHedef', () => {
  const onay = (id: string): Hedef => ({ id, metin: id, olcut: { tur: 'onay' } })
  const seviye = (no: number, hedefler: Hedef[]): Seviye => ({ no, ad: `S${no}`, sure: '', ozet: '', hedefler })

  function hepsiTamam(): Record<string, HedefDurumu> {
    return Object.fromEntries(SEVIYELER.flatMap((s) => s.hedefler).map((h) => [h.id, { tamam: true }]))
  }

  it('boş girdide seviye 0, sıradaki hedef s0-tani', () => {
    const d = hedefDurumlari(SEVIYELER, girdi())
    const s = mevcutSeviye(SEVIYELER, d)
    expect(s.no).toBe(0)
    expect(siradakiHedef(s, d)!.id).toBe('s0-tani')
  })

  it('sıradaki hedef ilk eksik hedeftir', () => {
    const d = hedefDurumlari(SEVIYELER, girdi({ okunanDersler: new Set(['s0:neyi-tani', 's0:durus']) }))
    expect(siradakiHedef(mevcutSeviye(SEVIYELER, d), d)!.id).toBe('s0-ayna')
  })

  it('seviye 0 tamam, 1 eksikse mevcut seviye 1', () => {
    const d = hepsiTamam()
    d['s1-rast-gur'] = { tamam: false }
    expect(mevcutSeviye(SEVIYELER, d).no).toBe(1)
  })

  it('Seviye 0–1 tamam, Seviye 2 eksik → mevcutSeviye 2, siradakiHedef s2-nota', () => {
    const d = hedefDurumlari(SEVIYELER, girdi())
    for (const s of SEVIYELER.slice(0, 2)) for (const h of s.hedefler) d[h.id] = { tamam: true }
    const s = mevcutSeviye(SEVIYELER, d)
    expect(s.no).toBe(2)
    expect(siradakiHedef(s, d)!.id).toBe('s2-nota')
  })

  it('hepsi tamamsa mevcut seviye 3 (hedefsiz); sıradaki hedef null', () => {
    const d = hepsiTamam()
    const s = mevcutSeviye(SEVIYELER, d)
    expect(s.no).toBe(3)
    expect(siradakiHedef(s, d)).toBeNull()
  })

  it('hedefsiz seviye atlanır: sonraki eksik hedefli seviye mevcut olur', () => {
    const seviyeler = [seviye(0, [onay('x')]), seviye(1, []), seviye(2, [onay('y')])]
    expect(mevcutSeviye(seviyeler, { x: { tamam: true }, y: { tamam: false } }).no).toBe(2)
  })

  it('son seviye sınırı: hedefli son seviye tamamsa ve sonrası yoksa orada kalır', () => {
    const seviyeler = [seviye(0, [onay('x')]), seviye(1, [onay('y')])]
    expect(mevcutSeviye(seviyeler, { x: { tamam: true }, y: { tamam: true } }).no).toBe(1)
  })
})
