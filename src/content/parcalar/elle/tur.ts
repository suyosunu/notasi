import { beats } from '../../../music/notation'
import { parseEtut } from '../../etutler'
import { USULLER } from '../../usuller'
import { MAKAMLAR } from '../types'
import type { Parca, ParcaMakam } from '../types'

export interface ElleBolum {
  /** Parça kimliğine `--` ile eklenir (`<id>--<bolum.id>`). */
  id: string
  /** Başlığa parantez içinde eklenir (`<title> (<baslik>)`). */
  baslik: string
  /** Ana parçanın ölçülerinden 1'den başlayarak, iki ucu dahil: `[1, 3]` ilk üç ölçüdür. */
  olcuAraligi: [number, number]
}

/**
 * neyzen.com notasından elle yazılmış parça. Her eser `elle/eserler/<id>.ts` dosyasında `export default` ile verilir;
 * yükleyici (`elle/index.ts`) hepsini toplayıp `Parca`'ya çevirir. Çarpmalar (süs notaları) yazılmaz, tekrarlar açılmaz.
 */
export interface ElleParca {
  id: string
  title: string
  makam: ParcaMakam
  /** USULLER kimliği. */
  usul: string
  composer: string
  lyricist?: string
  /** neyzen.com PDF adresi. */
  kaynak: string
  /** `parseEtut` biçimi: notalar boşlukla, ölçüler `|` ile ayrılır. İlk ölçü anacrusis olabilir. */
  notasyon: string
  /** Ölçü başına, olaylarla hizalı heceler (bkz. `Parca.soz`). */
  soz?: string[][]
  /** Her biri ayrı bir parça olur (ör. yalnız Seviye 1 perdelerini kullanan ölçüler). */
  bolumler?: ElleBolum[]
}

/** Süre toplamları kayan noktayla karşılaştırılır. */
const PAY = 1e-6

function hata(id: string, ne: string): never {
  throw new Error(`Geçersiz elle yazılmış parça "${id}": ${ne}`)
}

/** Tek parçanın doğrulanmış ölçüleri ve sözü. */
function dogrula(p: ElleParca): { olcu: Parca['olcu']; soz?: string[][] } {
  if (!p.id || !p.title) hata(p.id, 'kimlik ya da başlık boş')
  if (!MAKAMLAR.includes(p.makam)) hata(p.id, `makam "${p.makam}"`)
  const usul = USULLER.find((u) => u.id === p.usul)
  if (!usul) hata(p.id, `usul "${p.usul}" tanımlı değil`)
  let olcu
  try {
    olcu = parseEtut(p.notasyon)
  } catch (e) {
    return hata(p.id, (e as Error).message)
  }
  const tam = (usul.zaman * 4) / usul.mertebe
  olcu.forEach((m, i) => {
    const toplam = m.reduce((s, e) => s + beats(e), 0)
    // Yalnız ilk ölçü eksik olabilir (anacrusis).
    if (i === 0 ? toplam > tam + PAY : Math.abs(toplam - tam) > PAY) {
      hata(p.id, `ölçü ${i + 1} ${toplam} vuruş, usul ${tam} vuruş`)
    }
  })
  if (p.soz) {
    const soz = p.soz
    if (soz.length !== olcu.length) hata(p.id, `söz ${soz.length} ölçü, nota ${olcu.length} ölçü`)
    soz.forEach((m, i) => {
      if (m.length !== olcu[i]!.length) hata(p.id, `ölçü ${i + 1} sözü ${m.length} hece, ölçü ${olcu[i]!.length} olay`)
    })
  }
  return { olcu, soz: p.soz }
}

/**
 * Elle yazılmış parçaları doğrulayıp `Parca`'ya çevirir; başlığa göre (Türkçe) sıralı, her bölüm ana parçanın
 * hemen arkasındadır. Bozuk parça (süre usulle tutmaz, söz hizasız, geçersiz bölüm vb.) `Error` fırlatır.
 */
export function ellePiecesFrom(liste: ElleParca[]): Parca[] {
  const gorulen = new Set<string>()
  const sirali = [...liste].sort((a, b) => a.title.localeCompare(b.title, 'tr'))
  return sirali.flatMap((p) => {
    const { olcu, soz } = dogrula(p)
    const taban = { makam: p.makam, usul: p.usul, composer: p.composer, source: p.kaynak }
    const parcalar: Parca[] = [{ ...taban, id: p.id, title: p.title, olcu, ...(soz ? { soz } : {}) }]
    for (const b of p.bolumler ?? []) {
      const [bas, son] = b.olcuAraligi
      if (!Number.isInteger(bas) || !Number.isInteger(son) || bas < 1 || son < bas || son > olcu.length) {
        hata(p.id, `bölüm "${b.id}" ölçü aralığı [${bas}, ${son}], parça ${olcu.length} ölçü`)
      }
      const kesit = olcu.slice(bas - 1, son)
      const sonOlay = kesit.at(-1)!.at(-1)!
      if (sonOlay.kind === 'note' && sonOlay.tie) hata(p.id, `bölüm "${b.id}" bağlı notayla bitiyor`)
      parcalar.push({
        ...taban,
        id: `${p.id}--${b.id}`,
        title: `${p.title} (${b.baslik})`,
        olcu: kesit,
        ...(soz ? { soz: soz.slice(bas - 1, son) } : {}),
      })
    }
    for (const q of parcalar) {
      if (gorulen.has(q.id)) hata(p.id, `kimlik "${q.id}" tekrar ediyor`)
      gorulen.add(q.id)
    }
    return parcalar
  })
}
