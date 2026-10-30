import { Component } from 'preact'
import { useCallback, useLayoutEffect, useMemo, useRef } from 'preact/hooks'
import type { TakipDurumu } from '../learning/takip'
import type { MusicEvent } from '../music/notation'
import type { Secim } from './secim'
import { layoutEvents, Staff, staffWidthFor } from './Staff'

/** Satırın hedef görünüm genişliği (px): 375 pt telefonda notanın kabı bu genişliktedir (375 − 2×20 ekran dolgusu − 2×4 nota dolgusu − 2×1 kenarlık). */
export const ROW_WIDTH = 325
/**
 * Bir olaya düşen en küçük yuva (px). Kalabalık satırda görünüm kutusu genişler ve SVG %100 genişlikte
 * küçülerek sığar; böylece nota başları, bayraklar ve heceler üst üste binmez, yatay kaydırma da gerekmez.
 */
const MIN_SLOT = 17
/** Satırlar bu ölçekten (ROW_WIDTH / görünüm genişliği) daha çok küçülmemelidir. */
export const MIN_SCALE = 0.8

export interface ScoreRow {
  events: MusicEvent[]
  barlinesAfter: number[]
  syllables?: string[]
  /** Staff'a verilecek temel genişlik: görünüm genişliği ortak genişliğe denk gelir. */
  baseWidth: number
  /** Satırın ilk ölçüsünün indisi (0 tabanlı, dahil). */
  olcuBas: number
  /** Satırın son ölçüsünün indisi (0 tabanlı, dahil). */
  olcuSon: number
}

/** SVG'nin ROW_WIDTH genişliğindeki kapta ölçeği. */
export function scoreScale(width: number, container = ROW_WIDTH): number {
  return Math.min(1, container / width)
}

/** Satırın doğal görünüm genişliği: olay başına en az MIN_SLOT; işaret ve heceler gerektiği kadar genişletir. */
function naturalWidth(events: MusicEvent[], syllables?: string[]): number {
  return layoutEvents(events, staffWidthFor(events.length, MIN_SLOT, ROW_WIDTH), syllables).viewWidth
}

/**
 * Görünüm genişliği tam `target` olacak temel genişlik: tüm satırlar aynı ölçekte çizilir ve sağ kenara dek
 * dolar. viewWidth temel genişlikle azalmadan arttığı için ikiye bölme yeterlidir.
 */
function fitWidth(events: MusicEvent[], syllables: string[] | undefined, target: number): number {
  let lo = 0
  let hi = target
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (layoutEvents(events, mid, syllables).viewWidth > target) hi = mid
    else lo = mid
  }
  return lo
}

function joinMeasures(olcu: MusicEvent[][], soz: string[][] | undefined, from: number, count: number) {
  const olcuBas = from
  const olcuSon = Math.min(from + count, olcu.length) - 1
  const events: MusicEvent[] = []
  const barlinesAfter: number[] = []
  const syllables: string[] = []
  for (let j = from; j < Math.min(from + count, olcu.length); j++) {
    const s = soz?.[j]
    olcu[j]!.forEach((e, k) => {
      events.push(e)
      syllables.push(s?.[k] ?? '')
    })
    barlinesAfter.push(events.length - 1)
  }
  return { events, barlinesAfter, syllables: soz ? syllables : undefined, olcuBas, olcuSon }
}

/**
 * Satır kuralı: ölçüler `perRow`'luk gruplara ayrılır. Bir grubun doğal genişliği ROW_WIDTH / MIN_SCALE'i
 * aşarsa (yani ölçek 0,8'in altına inerdi) o grubun ölçüleri birer birer satıra yazılır. Ardından tüm
 * satırlara tek bir ortak görünüm genişliği verilir (en geniş satırınki), böylece ölçek her satırda aynıdır.
 */
export function scoreLayout(
  olcu: MusicEvent[][],
  soz: string[][] | undefined,
  perRow: number,
): { rows: ScoreRow[]; width: number } {
  const groups: ReturnType<typeof joinMeasures>[] = []
  for (let start = 0; start < olcu.length; start += perRow) {
    const group = joinMeasures(olcu, soz, start, perRow)
    if (perRow > 1 && naturalWidth(group.events, group.syllables) > ROW_WIDTH / MIN_SCALE) {
      for (let j = start; j < Math.min(start + perRow, olcu.length); j++) groups.push(joinMeasures(olcu, soz, j, 1))
    } else {
      groups.push(group)
    }
  }
  const width = Math.max(ROW_WIDTH, ...groups.map((g) => naturalWidth(g.events, g.syllables)))
  const rows = groups.map((g) => ({
    events: g.events,
    barlinesAfter: g.barlinesAfter,
    ...(g.syllables ? { syllables: g.syllables } : {}),
    baseWidth: fitWidth(g.events, g.syllables, width),
    olcuBas: g.olcuBas,
    olcuSon: g.olcuSon,
  }))
  return { rows, width }
}

/** Vurgulanan olayın, kendi satırındaki sırası; olay bu satırda değilse (veya yoksa) `undefined`. */
function vurguSirasi(olcu: MusicEvent[][], row: ScoreRow, vurgu: { olcu: number; nota: number }): number | undefined {
  if (vurgu.olcu < row.olcuBas || vurgu.olcu > row.olcuSon) return undefined
  if (vurgu.nota < 0 || vurgu.nota >= (olcu[vurgu.olcu]?.length ?? 0)) return undefined
  let sira = vurgu.nota
  for (let j = row.olcuBas; j < vurgu.olcu; j++) sira += olcu[j]!.length
  return sira
}

/** Takip sonucu: `olcu` ölçü indisi, `nota` o ölçüdeki olay sırası. */
export interface Sonuc {
  olcu: number
  nota: number
  durum: TakipDurumu
}

/** Satırın olaylarıyla hizalı durum dizisi; bu satıra düşen sonuç yoksa `undefined` (satır eskisi gibi çizilir). */
function satirDurumlari(olcu: MusicEvent[][], row: ScoreRow, sonuclar: Sonuc[] | null | undefined) {
  if (!sonuclar) return undefined
  let durumlar: (TakipDurumu | undefined)[] | undefined
  for (const s of sonuclar) {
    const sira = vurguSirasi(olcu, row, s)
    if (sira === undefined) continue
    durumlar ??= new Array<TakipDurumu | undefined>(row.events.length).fill(undefined)
    durumlar[sira] = s.durum
  }
  return durumlar
}

/** İki durum dizisi içerikçe eşit mi (her çizimde yeni dizi üretildiği için kimliğe bakılmaz). */
function ayniDurumlar(a: (TakipDurumu | undefined)[] | undefined, b: (TakipDurumu | undefined)[] | undefined): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((d, i) => d === b[i])
}

interface SatirProps {
  row: ScoreRow
  beamBeats: number | undefined
  highlightIndex: number | undefined
  /** Satırın olaylarıyla hizalı takip sonuçları; içerikçe karşılaştırılır. */
  durumlar: (TakipDurumu | undefined)[] | undefined
  secili: boolean
  /** Verilirse satır dokunulabilir; kimliği çizimden çizime sabit olmalıdır (bkz. ScoreView). */
  onDokun: ((satir: Secim) => void) | undefined
}

/**
 * Tek satır. Yalnız kendi değerleri (vurgu sırası, seçili, satır) değişince yeniden çizilir: çalarken vurgu her notada
 * değişir, öteki satırların porteleri yeniden hesaplanmasın. (`preact/compat`'ın `memo`'su kullanılmaz: compat yüklenince
 * girdilerin `onChange`'i `onInput`'a çevrilir, hız kaydırıcısı sürüklerken durur.)
 */
class Satir extends Component<SatirProps> {
  shouldComponentUpdate(next: SatirProps): boolean {
    const p = this.props
    return (
      next.row !== p.row ||
      next.beamBeats !== p.beamBeats ||
      next.highlightIndex !== p.highlightIndex ||
      !ayniDurumlar(next.durumlar, p.durumlar) ||
      next.secili !== p.secili ||
      next.onDokun !== p.onDokun
    )
  }

  render() {
    const { row, beamBeats, highlightIndex, durumlar, secili, onDokun } = this.props
    const staff = (
      <Staff
        events={row.events}
        width={row.baseWidth}
        barlinesAfter={row.barlinesAfter}
        syllables={row.syllables}
        beamBeats={beamBeats}
        highlightIndex={highlightIndex}
        durumlar={durumlar}
      />
    )
    if (!onDokun) {
      return (
        <div class={secili ? 'score-row secili' : 'score-row'} data-testid="score-row">
          {staff}
        </div>
      )
    }
    const satir: Secim = { bas: row.olcuBas, son: row.olcuSon }
    const etiket =
      row.olcuBas === row.olcuSon ? `${row.olcuBas + 1}. ölçüyü seç` : `${row.olcuBas + 1}–${row.olcuSon + 1}. ölçüleri seç`
    return (
      <div
        class={secili ? 'score-row secili' : 'score-row'}
        data-testid="score-row"
        role="button"
        tabIndex={0}
        aria-pressed={secili}
        aria-label={etiket}
        onClick={() => onDokun(satir)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault() // Boşluk sayfayı kaydırmasın
          onDokun(satir)
        }}
      >
        {staff}
      </div>
    )
  }
}

/**
 * Ölçüleri satırlara böler: her satır (genellikle) `olcuPerSatir` ölçülük bir porte, ölçüler arasında ve satır
 * sonunda ölçü çizgisi vardır. Donanım yazılmaz (işaretler nota yanında). Heceler nota altında yazılır.
 */
export function ScoreView(props: {
  olcu: MusicEvent[][]
  soz?: string[][]
  olcuPerSatir?: number
  /** Kiriş vuruş birimi (dörtlük cinsinden; bkz. `beamBeatsFor`). Verilmezse kiriş çizilmez. */
  beamBeats?: number
  /** Seçili ölçü aralığı; tümüyle bu aralığın içinde kalan satırlar seçili görünür. */
  secim?: Secim | null
  /** Verilirse satırlar dokunulabilir olur (role="button"); argüman satırın ölçü aralığıdır. */
  onSatirDokun?: (satir: Secim) => void
  /** Çalan nota: `olcu` ölçü indisi, `nota` o ölçüdeki olay sırası. İlgili olay vurgulanır. */
  vurgu?: { olcu: number; nota: number } | null
  /** Takip sonuçları: ilgili olaylar durum rengiyle ve işaretle çizilir (bkz. `Staff`). */
  sonuclar?: Sonuc[] | null
}) {
  const { olcu, soz, olcuPerSatir = 2, beamBeats, secim, onSatirDokun, vurgu, sonuclar } = props
  const perRow = Math.max(1, Math.floor(olcuPerSatir))
  // Hız kaydırıcısı gibi üst bileşen güncellemelerinde yerleşim yeniden hesaplanmaz.
  const { rows } = useMemo(() => scoreLayout(olcu, soz, perRow), [olcu, soz, perRow])
  // Satırlara sabit kimlikli bir işlev verilir (üst bileşenin her çizimde yeni işlevi satırları yeniden çizdirmesin);
  // dokunuş her zaman son verilen `onSatirDokun`'a gider.
  const dokunRef = useRef(onSatirDokun)
  useLayoutEffect(() => {
    dokunRef.current = onSatirDokun
  })
  const dokun = useCallback((satir: Secim) => dokunRef.current?.(satir), [])
  return (
    <div class="score">
      {rows.map((row, i) => (
        <Satir
          key={i}
          row={row}
          beamBeats={beamBeats}
          highlightIndex={vurgu ? vurguSirasi(olcu, row, vurgu) : undefined}
          durumlar={satirDurumlari(olcu, row, sonuclar)}
          secili={!!secim && row.olcuBas >= secim.bas && row.olcuSon <= secim.son}
          onDokun={onSatirDokun ? dokun : undefined}
        />
      ))}
    </div>
  )
}
