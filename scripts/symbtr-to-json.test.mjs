import { describe, expect, it } from 'vitest'
import { convertSymbTr, durationOf, formatParca, komaAEOf, parseSymbTrTxt, pitchOf } from './symbtr-to-json.mjs'

const HEADER = 'Sira\tKod\tNota53\tNotaAE\tKoma53\tKomaAE\tPay\tPayda\tMs\tLNS\tBas\tSoz1\tOffset'
const txt = (rows) => [HEADER, ...rows.map((r) => r.join('\t'))].join('\n') + '\n'

// "Benim adım dertli dolap" (SymbTr ussak--ilahi--dolap--benim_adim--.txt) ilk iki ölçüsü.
const BENIM_ADIM = [
  [1, 51, '', '', 0, 0, 12, 8, 0, 76, 0, 'Dolap', '0.0'],
  [2, 9, 'Sol4', 'G4', 296, 296, 1, 8, 500, 95, 96, 'Be', '0.0833333333333'],
  [3, 9, 'Do5', 'C5', 318, 318, 1, 8, 500, 95, 96, 'nim_', '0.166666666667'],
  [4, 9, 'Si4b2', 'B4b1', 312, 313, 1, 8, 500, 95, 96, 'a', '0.25'],
  [5, 9, 'Do5', 'C5', 318, 318, 1, 4, 1000, 95, 96, 'dım ', '0.416666666667'],
  [6, 9, 'Si4b2', 'B4b1', 312, 313, 1, 8, 500, 95, 96, 'dert', '0.5'],
  [7, 9, 'Do5', 'C5', 318, 318, 1, 4, 1000, 95, 96, 'li ', '0.666666666667'],
  [8, 9, 'Re5', 'D5', 327, 327, 3, 16, 750, 99, 96, 'do', '0.791666666667'],
  [9, 9, 'Do5', 'C5', 318, 318, 1, 16, 250, 95, 96, '', '0.833333333333'],
  [10, 9, 'Si4b2', 'B4b1', 312, 313, 1, 4, 1000, 95, 96, 'lap  ', '1.0'],
  [11, 9, 'La4', 'A4', 305, 305, 1, 8, 500, 95, 96, 'Su', '1.08333333333'],
  [12, 9, 'Si4b2', 'B4b1', 312, 313, 1, 8, 500, 95, 96, 'yum_', '1.16666666667'],
  [13, 9, 'La4', 'A4', 305, 305, 1, 8, 500, 95, 96, 'a', '1.25'],
  [14, 9, 'Si4b2', 'B4b1', 312, 313, 1, 4, 1000, 95, 96, 'kar ', '1.41666666667'],
  [15, 9, 'La4', 'A4', 305, 305, 1, 8, 500, 95, 96, 'ya', '1.5'],
  [16, 9, 'Si4b2', 'B4b1', 312, 313, 1, 4, 1000, 95, 96, 'lap ', '1.66666666667'],
  [17, 9, 'Do5', 'C5', 318, 318, 3, 16, 750, 99, 96, 'ya', '1.79166666667'],
  [18, 9, 'Si4b2', 'B4b1', 312, 313, 1, 16, 250, 95, 96, '', '1.83333333333'],
  [19, 9, 'La4', 'A4', 305, 305, 1, 4, 1000, 95, 96, 'lap  ', '2.0'],
]

const DOLAP = { zaman: 12, mertebe: 8 }
const SOFYAN = { zaman: 4, mertebe: 4 }
const n = (step, octave, acc, dur, dotted) => ({
  kind: 'note',
  pitch: { step, octave, acc },
  dur,
  ...(dotted ? { dotted: true } : {}),
})

describe('parseSymbTrTxt', () => {
  it('sekmeyle ayrılmış satırları sütun adlarıyla okur', () => {
    const rows = parseSymbTrTxt(txt(BENIM_ADIM.slice(0, 3)))
    expect(rows).toHaveLength(3)
    expect(rows[1]).toEqual({
      sira: 2,
      kod: 9,
      notaAE: 'G4',
      komaAE: 296,
      pay: 1,
      payda: 8,
      soz: 'Be',
      offset: 0.0833333333333,
    })
  })
  it('CRLF satır sonlarını kabul eder, hecedeki boşlukları korur', () => {
    const rows = parseSymbTrTxt(txt(BENIM_ADIM.slice(0, 10)).replaceAll('\n', '\r\n'))
    expect(rows.at(-1).soz).toBe('lap  ')
    expect(rows.at(-1).offset).toBe(1)
  })
  it('eksik sütunlu başlık hata verir', () => {
    expect(() => parseSymbTrTxt('Sira\tKod\n1\t51\n')).toThrow(/NotaAE/)
  })
  it('ardışık olmayan Sira hata verir', () => {
    const rows = [BENIM_ADIM[0], BENIM_ADIM[2]]
    expect(() => parseSymbTrTxt(txt(rows))).toThrow(/Sira/)
  })
})

describe('durationOf', () => {
  it('temel ve noktalı süreler', () => {
    expect(durationOf(1, 1)).toEqual({ dur: 'whole' })
    expect(durationOf(1, 2)).toEqual({ dur: 'half' })
    expect(durationOf(1, 4)).toEqual({ dur: 'quarter' })
    expect(durationOf(2, 8)).toEqual({ dur: 'quarter' })
    expect(durationOf(1, 8)).toEqual({ dur: 'eighth' })
    expect(durationOf(1, 16)).toEqual({ dur: 'sixteenth' })
    expect(durationOf(3, 2)).toEqual({ dur: 'whole', dotted: true })
    expect(durationOf(3, 4)).toEqual({ dur: 'half', dotted: true })
    expect(durationOf(3, 8)).toEqual({ dur: 'quarter', dotted: true })
    expect(durationOf(3, 16)).toEqual({ dur: 'eighth', dotted: true })
    expect(durationOf(3, 32)).toEqual({ dur: 'sixteenth', dotted: true })
  })
  it('temsil edilemeyen süreler null döner (yaklaştırma yok)', () => {
    expect(durationOf(5, 8)).toBeNull()
    expect(durationOf(1, 12)).toBeNull()
    expect(durationOf(1, 32)).toBeNull()
    expect(durationOf(5, 16)).toBeNull()
    expect(durationOf(7, 16)).toBeNull()
    expect(durationOf(0, 8)).toBeNull()
  })
})

describe('pitchOf / komaAEOf', () => {
  it('NotaAE işaretlerini koma değerlerimize çevirir', () => {
    expect(pitchOf('G4')).toEqual({ step: 'G', octave: 4, acc: 0 })
    expect(pitchOf('B4b1')).toEqual({ step: 'B', octave: 4, acc: -1 })
    expect(pitchOf('B4b4')).toEqual({ step: 'B', octave: 4, acc: -4 })
    expect(pitchOf('B4b5')).toEqual({ step: 'B', octave: 4, acc: -5 })
    expect(pitchOf('B4b8')).toEqual({ step: 'B', octave: 4, acc: -8 })
    expect(pitchOf('C5#4')).toEqual({ step: 'C', octave: 5, acc: 4 })
    expect(pitchOf('F4#4')).toEqual({ step: 'F', octave: 4, acc: 4 })
    expect(pitchOf('C5#5')).toEqual({ step: 'C', octave: 5, acc: 5 })
    expect(pitchOf('F5#1')).toEqual({ step: 'F', octave: 5, acc: 1 })
    expect(pitchOf('G5#8')).toEqual({ step: 'G', octave: 5, acc: 8 })
  })
  it('başka işaretler null döner', () => {
    expect(pitchOf('B4b2')).toBeNull()
    expect(pitchOf('F5#3')).toBeNull()
    expect(pitchOf('B4b9')).toBeNull()
    expect(pitchOf('Si4')).toBeNull()
    expect(pitchOf('')).toBeNull()
  })
  it('SymbTr KomaAE ölçeği (Do5 = 318, Do4 = 265)', () => {
    expect(komaAEOf(pitchOf('C5'))).toBe(318)
    expect(komaAEOf(pitchOf('G4'))).toBe(296)
    expect(komaAEOf(pitchOf('A4'))).toBe(305)
    expect(komaAEOf(pitchOf('B4b1'))).toBe(313)
    expect(komaAEOf(pitchOf('B4b4'))).toBe(310)
    expect(komaAEOf(pitchOf('C5#4'))).toBe(322)
    expect(komaAEOf(pitchOf('E5'))).toBe(336)
  })
})

describe('convertSymbTr', () => {
  const opts = { file: 'benim.txt', usul: DOLAP }

  it('örnek SymbTr satırları ölçülere bölünür', () => {
    const r = convertSymbTr(txt(BENIM_ADIM), opts)
    expect(r.olcu).toHaveLength(2)
    expect(r.olcu[0]).toEqual([
      n('G', 4, 0, 'eighth'),
      n('C', 5, 0, 'eighth'),
      n('B', 4, -1, 'eighth'),
      n('C', 5, 0, 'quarter'),
      n('B', 4, -1, 'eighth'),
      n('C', 5, 0, 'quarter'),
      n('D', 5, 0, 'eighth', true),
      n('C', 5, 0, 'sixteenth'),
      n('B', 4, -1, 'quarter'),
    ])
    expect(r.olcu[1].map((e) => e.pitch.step).join('')).toBe('ABABABCBA')
  })

  it('heceleri ölçü başına notalarla hizalar (melizma boş)', () => {
    const r = convertSymbTr(txt(BENIM_ADIM), opts)
    expect(r.soz[0]).toEqual(['Be', 'nim_', 'a', 'dım ', 'dert', 'li ', 'do', '', 'lap  '])
    expect(r.soz[1]).toHaveLength(r.olcu[1].length)
  })

  it('her perde KomaAE ile doğrulanır ve özet döner', () => {
    const r = convertSymbTr(txt(BENIM_ADIM), opts)
    expect(r.summary).toMatchObject({ measures: 2, notes: 18, rests: 0, komaChecked: 18 })
    expect(r.skipped).toEqual([])
  })

  it('Es sus olur, hecesi boş kalır', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 2, 909, 95, 96, 'Dağ', '0.5'],
      [3, 9, 'Es', 'Es', -1, -1, 1, 4, 909, 100, 0, '', '0.75'],
      [4, 9, 'Do5#4', 'C5#4', 322, 322, 1, 4, 909, 95, 96, 'lar', '1.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    expect(r.olcu).toEqual([[n('A', 4, 0, 'half'), { kind: 'rest', dur: 'quarter' }, n('C', 5, 4, 'quarter')]])
    expect(r.soz).toEqual([['Dağ', '', 'lar']])
    expect(r.summary).toMatchObject({ notes: 2, rests: 1 })
  })

  it('kontrol satırlarını ve sıfır süreli satırları atlar ve listeler', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 53, '', '', 0, 0, 0, 0, 0, 0, 0, '', '0.0'],
      [3, 8, 'La4', 'A4', 305, 305, 0, 1, 0, 95, 96, '', '0.0'],
      [4, 9, 'Si4b2', 'B4b1', 312, 313, 0, 1, 0, 95, 96, '', '0.0'],
      [5, 9, 'La4', 'A4', 305, 305, 1, 1, 909, 95, 96, 'Hak', '1.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    expect(r.olcu).toEqual([[n('A', 4, 0, 'whole')]])
    expect(r.skipped.map((s) => s.sira)).toEqual([2, 3, 4])
    expect(r.skipped[0].reason).toMatch(/Kod 53/)
    expect(r.skipped[2].reason).toMatch(/sıfır/)
  })

  it('temsil edilemeyen süre dosyayı ve satırı adlandıran hatayla durur', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Re5', 'D5', 327, 327, 3, 8, 1364, 99, 96, 'ni  ', '0.375'],
      [3, 9, 'Mi5', 'E5', 336, 336, 5, 8, 2273, 95, 96, '', '1.0'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'daglar.txt', usul: SOFYAN })).toThrow(
      /daglar\.txt.*Sira 3.*5\/8/s,
    )
  })

  it('üçleme ve 1/32 de durdurur; bütün engelleyen satırlar listelenir', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 12, 300, 95, 96, '', '0.0833333333333'],
      [3, 9, 'La4', 'A4', 305, 305, 1, 32, 100, 95, 96, '', '0.1145833333333'],
    ]
    let err
    try {
      convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toMatch(/Sira 2.*1\/12/s)
    expect(err.message).toMatch(/Sira 3.*1\/32/s)
  })

  it('desteklenmeyen işaret hata verir', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Si4b2', 'B4b2', 312, 312, 1, 1, 909, 95, 96, '', '1.0'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })).toThrow(/Sira 2.*B4b2/s)
  })

  it('NotaAE ile KomaAE uyuşmazsa hata verir', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Si4b2', 'B4b1', 312, 312, 1, 1, 909, 95, 96, '', '1.0'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })).toThrow(/Sira 2.*KomaAE/s)
  })

  it('usul satırı beklenen usulle uyuşmalı', () => {
    expect(() => convertSymbTr(txt(BENIM_ADIM), { file: 'x.txt', usul: SOFYAN })).toThrow(/usul/i)
  })

  it('ölçü toplamı usul zamanından farklıysa hata verir', () => {
    // İkinci ölçü yalnızca 3/4 tutuyor ama Offset tam sayıya ulaşmış (bozuk dosya).
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 1, 909, 95, 96, '', '1.0'],
      [3, 9, 'La4', 'A4', 305, 305, 3, 4, 909, 95, 96, '', '2.0'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })).toThrow(/Sira 3/)
  })

  it('ilk ölçü kısa olabilir (anacrusis), sonrakiler tam olmalı', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 4, 909, 95, 96, '', '1.0'],
      [3, 9, 'La4', 'A4', 305, 305, 1, 1, 909, 95, 96, '', '2.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    expect(r.olcu.map((m) => m.length)).toEqual([1, 1])
  })

  it('Offset artışı süreyle uyuşmazsa hata verir', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 2, 909, 95, 96, '', '0.5'],
      [3, 9, 'La4', 'A4', 305, 305, 1, 4, 909, 95, 96, '', '1.0'],
      [4, 9, 'La4', 'A4', 305, 305, 1, 4, 909, 95, 96, '', '1.25'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })).toThrow(/Sira 3.*Offset/s)
  })

  it('tamamlanmamış son ölçü hata verir', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 1, 1, 909, 95, 96, '', '1.0'],
      [3, 9, 'La4', 'A4', 305, 305, 1, 4, 909, 95, 96, '', '1.25'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })).toThrow(/son ölçü/i)
  })
})

describe('formatParca', () => {
  it('geçerli JSON üretir, her olay kendi satırında', () => {
    const r = convertSymbTr(txt(BENIM_ADIM), { file: 'benim.txt', usul: DOLAP })
    const parca = { id: 'p', title: 'P', makam: 'ussak', usul: 'dolap', composer: '?', source: 'u', olcu: r.olcu, soz: r.soz }
    const s = formatParca(parca)
    expect(JSON.parse(s)).toEqual(parca)
    expect(s).toContain('\n      {"kind":"note","pitch":{"step":"G","octave":4,"acc":0},"dur":"eighth"},\n')
    expect(s.endsWith('\n')).toBe(true)
  })
})
