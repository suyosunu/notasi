// Yalnızca geliştiricinin çalıştırdığı araç; uygulamaya dahil edilmez.
// SymbTr txt dosyalarını (https://github.com/MTG/SymbTr, CC BY-NC-SA 4.0, Karaosmanoğlu 2012)
// uygulamanın parça JSON biçimine çevirir. Sütun biçimi: docs/superpowers/notes/2026-10-19-surum-2-arastirma.md §5.
//
// Kullanım:
//   node scripts/symbtr-to-json.mjs                 # kaynakları SymbTr deposundan indirir
//   node scripts/symbtr-to-json.mjs --src <klasör>  # yerel kopyaları (aynı dosya adlarıyla) okur
//
// Perde NotaAE/KomaAE sütunlarından, süre Pay/Payda'dan okunur. Temsil edilemeyen süreler
// (üçleme, 1/32, 5/8 gibi bağ gerektiren değerler) ya da desteklenmeyen işaretler dönüştürmeyi
// durdurur; yaklaştırma yapılmaz. Bir parça başarısız olursa diğerleri yine üretilir.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseNoteKey } from '../src/music/accidentals.ts'
import { KOMA_PER_OCTAVE, writtenKoma } from '../src/music/pitch.ts'
import { USULLER } from '../src/content/usuller.ts'

const RAW_BASE = 'https://raw.githubusercontent.com/MTG/SymbTr/master/txt/'

/** Kolay → zor sırasıyla. */
export const PIECES = [
  {
    id: 'benim-adim-dertli-dolap',
    title: 'Benim Adım Dertli Dolap',
    makam: 'ussak',
    usul: 'dolap',
    composer: 'Anonim',
    file: 'ussak--ilahi--dolap--benim_adim--.txt',
  },
  {
    id: 'hak-teala',
    title: 'Hak Teâlâ',
    makam: 'ussak',
    usul: 'sofyan',
    composer: 'Ali Ufkî',
    file: 'ussak--ilahi--sofyan--hak_taala--ali_ufki.txt',
  },
  {
    id: 'daglar-ile-taslar-ile',
    title: 'Dağlar ile Taşlar ile',
    makam: 'hicaz',
    usul: 'sofyan',
    composer: 'Kutbî Dede',
    file: 'hicaz--ilahi--sofyan--daglar_ile--kutbi_dede.txt',
  },
]

const COLUMNS = ['Sira', 'Kod', 'NotaAE', 'KomaAE', 'Pay', 'Payda', 'Soz1', 'Offset']
const KOD_NOTA = 9
const KOD_USUL = 51
/** Süreler bu birimin (tam notanın 1/64'ü) tam katı olarak hesaplanır. */
const UNIT = 64
/** SymbTr KomaAE ölçeğinde Do4 (bizim 0 noktamız): 53 × (4 + 1). */
const KOMA_AE_C4 = KOMA_PER_OCTAVE * 5
const OFFSET_TOL = 0.001

const BASES = [
  ['whole', 1],
  ['half', 2],
  ['quarter', 4],
  ['eighth', 8],
  ['sixteenth', 16],
]

/** Sekmeyle ayrılmış SymbTr txt'yi okur. Hecedeki boşluklar korunur. */
export function parseSymbTrTxt(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  while (lines.length > 0 && lines.at(-1) === '') lines.pop()
  const header = lines[0].split('\t')
  const col = {}
  for (const name of COLUMNS) {
    const i = header.indexOf(name)
    if (i < 0) throw new Error(`Başlıkta "${name}" sütunu yok`)
    col[name] = i
  }
  const rows = []
  for (const [li, line] of lines.slice(1).entries()) {
    const c = line.split('\t')
    const num = (name) => {
      const v = Number(c[col[name]])
      if (c[col[name]] === undefined || c[col[name]] === '' || !Number.isFinite(v)) {
        throw new Error(`Satır ${li + 2}: "${name}" sayı değil (${c[col[name]]})`)
      }
      return v
    }
    const row = {
      sira: num('Sira'),
      kod: num('Kod'),
      notaAE: c[col.NotaAE] ?? '',
      komaAE: num('KomaAE'),
      pay: num('Pay'),
      payda: num('Payda'),
      soz: c[col.Soz1] ?? '',
      offset: num('Offset'),
    }
    if (row.sira !== li + 1) throw new Error(`Satır ${li + 2}: Sira ${row.sira}, beklenen ${li + 1}`)
    rows.push(row)
  }
  return rows
}

/** Pay/Payda (tam notanın kesri) → süre; temsil edilemezse null. */
export function durationOf(pay, payda) {
  if (!(pay > 0 && payda > 0)) return null
  for (const [dur, base] of BASES) {
    if (pay * base === payda) return { dur }
    if (2 * pay * base === 3 * payda) return { dur, dotted: true }
  }
  return null
}

/** Bölmede kullanılan parçalar, büyükten küçüğe (birim: tam notanın 1/64'ü). */
const PARTS = [
  [64, { dur: 'whole' }],
  [48, { dur: 'half', dotted: true }],
  [32, { dur: 'half' }],
  [24, { dur: 'quarter', dotted: true }],
  [16, { dur: 'quarter' }],
  [12, { dur: 'eighth', dotted: true }],
  [8, { dur: 'eighth' }],
  [6, { dur: 'sixteenth', dotted: true }],
  [4, { dur: 'sixteenth' }],
]

/**
 * Pay/Payda → bağlanacak süre parçaları. Tek değerle yazılabiliyorsa tek parça; değilse en az
 * parçaya, büyükten küçüğe bölünür (5/8 → ikilik + sekizlik). Tam bölünemiyorsa null (üçleme, 1/32…).
 */
export function splitDuration(pay, payda) {
  const single = durationOf(pay, payda)
  if (single) return [single]
  if (!(pay > 0 && payda > 0)) return null
  const total = units(pay, payda)
  if (!Number.isInteger(total)) return null
  // best[u]: u birimi dolduran en kısa parça dizisi; eşitlikte büyük parça önce gelir.
  const best = [[]]
  for (let u = 1; u <= total; u++) {
    let pick = null
    for (const [len, part] of PARTS) {
      const rest = len <= u ? best[u - len] : null
      if (rest && (pick === null || rest.length + 1 < pick.length)) pick = [part, ...rest]
    }
    best[u] = pick
  }
  return best[total] ? best[total].map((part) => ({ ...part })) : null
}

/** Soz1 hecesi → gösterim: baştaki/sondaki boşluklar atılır, ulama (`_`) `‿` olur. */
export function cleanSyllable(soz) {
  return soz.trim().replaceAll('_', '‿')
}

const BASE_UNITS = { whole: 64, half: 32, quarter: 16, eighth: 8, sixteenth: 4 }
function eventUnits(e) {
  return BASE_UNITS[e.dur] * (e.dotted ? 1.5 : 1)
}

/** NotaAE → WrittenPitch; işaret b/# 1, 4, 5, 8 dışındaysa null. */
export function pitchOf(notaAE) {
  return parseNoteKey(notaAE)
}

/** WrittenPitch → SymbTr KomaAE değeri (Do5 = 318). */
export function komaAEOf(pitch) {
  return writtenKoma(pitch) + KOMA_AE_C4
}

function units(pay, payda) {
  return (pay * UNIT) / payda
}

function nearInt(x) {
  return Math.abs(x - Math.round(x)) < OFFSET_TOL
}

/**
 * SymbTr txt → { olcu, soz, skipped, summary }. Hatalar toplanır ve dosya + Sira numaralarıyla
 * tek bir Error olarak fırlatılır.
 */
export function convertSymbTr(text, { file, usul }) {
  const rows = parseSymbTrTxt(text)
  const errors = []
  const fail = (row, msg) => errors.push(`Sira ${row.sira}: ${msg}`)
  const skipped = []
  const measureUnits = units(usul.zaman, usul.mertebe)
  const measureLen = usul.zaman / usul.mertebe

  const first = rows[0]
  if (!first || first.kod !== KOD_USUL) {
    throw new Error(`${file}: ilk satır usul satırı (Kod 51) olmalı`)
  }
  if (first.pay !== usul.zaman || first.payda !== usul.mertebe) {
    throw new Error(`${file}: usul ${first.pay}/${first.payda} (${first.soz}), beklenen ${usul.zaman}/${usul.mertebe}`)
  }

  const olcu = []
  const soz = []
  let events = []
  let syllables = []
  let measureTotal = 0
  let prevOffset = null
  let notes = 0
  let rests = 0
  let komaChecked = 0
  const tiedRows = []

  for (const row of rows.slice(1)) {
    if (row.kod === KOD_USUL) {
      fail(row, `usul değişimi (${row.soz}) desteklenmiyor`)
      continue
    }
    if (row.kod !== KOD_NOTA) {
      skipped.push({ sira: row.sira, reason: `Kod ${row.kod} (nota/sus değil)`, soz: row.soz })
      continue
    }
    if (row.pay === 0) {
      skipped.push({ sira: row.sira, reason: `sıfır süreli ${row.notaAE}`, soz: row.soz })
      continue
    }
    const parts = splitDuration(row.pay, row.payda)
    if (!parts) {
      fail(row, `${row.notaAE} süresi ${row.pay}/${row.payda} temsil edilemiyor`)
      // Ölçü bölmeyi bozmamak için süreyi sayarak devam et.
    } else if (parts.length > 1) {
      tiedRows.push({ sira: row.sira, notaAE: row.notaAE, pay: row.pay, payda: row.payda, parts })
    }
    const len = units(row.pay, row.payda)

    if (row.notaAE === 'Es') {
      if (row.komaAE !== -1) fail(row, `Es için KomaAE ${row.komaAE}, beklenen -1`)
      // Bölünen sus bağsız ardışık suslardır.
      for (const part of parts ?? []) {
        events.push({ kind: 'rest', ...part })
        syllables.push('')
      }
      rests++
    } else {
      const pitch = pitchOf(row.notaAE)
      if (!pitch) {
        fail(row, `NotaAE "${row.notaAE}" desteklenmiyor (yalnız b/# 1, 4, 5, 8)`)
      } else if (komaAEOf(pitch) !== row.komaAE) {
        fail(row, `${row.notaAE} → koma ${komaAEOf(pitch)}, oysa KomaAE ${row.komaAE}`)
      } else if (parts) {
        komaChecked++
        // Son parça dışındaki her parça sonrakine bağlıdır; hece yalnızca ilk parçadadır.
        parts.forEach((part, k) => {
          const last = k === parts.length - 1
          events.push({ kind: 'note', pitch: { ...pitch }, ...part, ...(last ? {} : { tie: true }) })
          syllables.push(k === 0 ? cleanSyllable(row.soz) : '')
        })
      }
      notes++
    }

    // Offset olayın bitişidir; ardışık iki olay arasındaki fark süreye eşit olmalı.
    if (prevOffset !== null && Math.abs(row.offset - prevOffset - len / UNIT / measureLen) > OFFSET_TOL) {
      fail(row, `Offset ${row.offset}, süreyle beklenen ${(prevOffset + len / UNIT / measureLen).toFixed(4)}`)
    }
    prevOffset = row.offset
    measureTotal += len

    if (nearInt(row.offset)) {
      const isFirst = olcu.length === 0
      const ok = isFirst ? measureTotal > 0 && measureTotal <= measureUnits : measureTotal === measureUnits
      if (!ok) {
        fail(row, `ölçü ${olcu.length + 1} toplamı ${measureTotal}/${UNIT}, usul ${measureUnits}/${UNIT}`)
      }
      olcu.push(events)
      soz.push(syllables)
      events = []
      syllables = []
      measureTotal = 0
    }
  }
  if (measureTotal > 0) {
    errors.push(`son ölçü tamamlanmamış (${measureTotal}/${UNIT}, Offset ${prevOffset})`)
  }
  if (errors.length > 0) {
    throw new Error(`${file}: ${errors.length} satır dönüştürülemedi:\n  ${errors.join('\n  ')}`)
  }

  const verified = verifyAgainstSource(olcu, rows, file)
  return {
    olcu,
    soz,
    skipped,
    tiedRows,
    summary: {
      measures: olcu.length,
      notes,
      rests,
      komaChecked,
      events: olcu.reduce((s, m) => s + m.length, 0),
      tiedRows: tiedRows.length,
      verifiedRows: verified.rows,
      verifiedEvents: verified.events,
    },
  }
}

/**
 * Üretilen olayları kaynak satırlara geri eşler: her kaynak satırı bir ya da (bölünmüşse) birkaç
 * ardışık olaydır. Her parçanın perdesi KomaAE'ye, parçaların süre toplamı Pay/Payda'ya eşit olmalı;
 * bağ yalnızca aynı satırın son parçası dışındaki notalarda bulunur.
 */
function verifyAgainstSource(olcu, rows, file) {
  const src = rows.filter((r) => r.kod === KOD_NOTA && r.pay !== 0)
  const flat = olcu.flat()
  const fail = (r, msg) => {
    throw new Error(`${file}: doğrulama Sira ${r.sira}: ${msg}`)
  }
  let i = 0
  for (const r of src) {
    const want = units(r.pay, r.payda)
    let got = 0
    let k = 0
    while (got < want) {
      const e = flat[i++]
      if (!e) fail(r, 'olaylar bitti')
      if ((e.kind === 'rest') !== (r.notaAE === 'Es')) fail(r, `tür ${e.kind}`)
      const koma = e.kind === 'rest' ? -1 : komaAEOf(e.pitch)
      if (koma !== r.komaAE) fail(r, `parça ${k + 1}: koma ${koma} ≠ KomaAE ${r.komaAE}`)
      got += eventUnits(e)
      const last = got >= want
      if (e.kind === 'note' && !!e.tie === last) fail(r, `parça ${k + 1}: bağ ${e.tie ? 'var' : 'yok'}`)
      if (e.kind === 'rest' && 'tie' in e) fail(r, 'susta bağ')
      k++
    }
    if (got !== want) fail(r, `süre ${got}/${UNIT} ≠ ${r.pay}/${r.payda}`)
  }
  if (i !== flat.length) throw new Error(`${file}: doğrulama: ${flat.length - i} fazla olay`)
  return { rows: src.length, events: flat.length }
}

/** Okunur, diff dostu JSON: her olay kendi satırında. */
export function formatParca(parca) {
  const out = ['{']
  const keys = Object.keys(parca)
  keys.forEach((k, ki) => {
    const comma = ki < keys.length - 1 ? ',' : ''
    const v = parca[k]
    if (k === 'olcu' || k === 'soz') {
      out.push(`  ${JSON.stringify(k)}: [`)
      v.forEach((m, mi) => {
        out.push('    [')
        m.forEach((e, ei) => out.push(`      ${JSON.stringify(e)}${ei < m.length - 1 ? ',' : ''}`))
        out.push(`    ]${mi < v.length - 1 ? ',' : ''}`)
      })
      out.push(`  ]${comma}`)
    } else {
      out.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`)
    }
  })
  out.push('}')
  return out.join('\n') + '\n'
}

async function main() {
  const args = process.argv.slice(2)
  const srcIdx = args.indexOf('--src')
  const srcDir = srcIdx >= 0 ? args[srcIdx + 1] : null
  const outDir = fileURLToPath(new URL('../src/content/parcalar/', import.meta.url))
  let failed = 0
  console.log('SymbTr → JSON özeti')
  for (const p of PIECES) {
    const source = RAW_BASE + p.file
    try {
      const usul = USULLER.find((u) => u.id === p.usul)
      if (!usul) throw new Error(`bilinmeyen usul ${p.usul}`)
      const text = srcDir
        ? readFileSync(join(srcDir, p.file), 'utf8')
        : await fetch(source).then((r) => {
            if (!r.ok) throw new Error(`${source}: HTTP ${r.status}`)
            return r.text()
          })
      const r = convertSymbTr(text, { file: p.file, usul })
      const parca = {
        id: p.id,
        title: p.title,
        makam: p.makam,
        usul: p.usul,
        composer: p.composer,
        source,
        olcu: r.olcu,
        ...(r.soz.some((m) => m.some((s) => s !== '')) ? { soz: r.soz } : {}),
      }
      writeFileSync(join(outDir, `${p.id}.json`), formatParca(parca))
      const s = r.summary
      console.log(
        `✓ ${p.id}: ${s.measures} ölçü (${usul.zaman}/${usul.mertebe}), ${s.notes} nota, ${s.rests} sus; ` +
          `KomaAE eşleşen ${s.komaChecked}/${s.notes}; ${s.verifiedEvents} olay ${s.verifiedRows} kaynak ` +
          `satırına geri eşlendi; bağla bölünen ${s.tiedRows} satır; atlanan ${r.skipped.length} satır`,
      )
      for (const t of r.tiedRows) {
        const parts = t.parts.map((x) => `${x.dotted ? 'noktalı ' : ''}${x.dur}`).join(' + ')
        console.log(`    bölündü Sira ${t.sira}: ${t.notaAE} ${t.pay}/${t.payda} → ${parts}`)
      }
      for (const sk of r.skipped) console.log(`    atlandı Sira ${sk.sira}: ${sk.reason}${sk.soz ? ` (hece "${sk.soz}")` : ''}`)
    } catch (e) {
      failed++
      console.log(`✗ ${p.id}: ${e.message}`)
    }
  }
  if (failed > 0) {
    console.log(`${failed} parça üretilemedi.`)
    process.exitCode = 1
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main()
}
