import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PIECES,
  buildParca,
  cleanSyllable,
  convertSymbTr,
  durationOf,
  formatParca,
  komaAEOf,
  parseSymbTrTxt,
  pitchOf,
  splitDuration,
} from './symbtr-to-json.mjs'

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
const YURUK = { zaman: 6, mertebe: 8 }
const n = (step, octave, acc, dur, dotted, tie) => ({
  kind: 'note',
  pitch: { step, octave, acc },
  dur,
  ...(dotted ? { dotted: true } : {}),
  ...(tie ? { tie: true } : {}),
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

describe('splitDuration', () => {
  it('tek değerle temsil edilebilen süre tek parçadır', () => {
    expect(splitDuration(1, 4)).toEqual([{ dur: 'quarter' }])
    expect(splitDuration(3, 16)).toEqual([{ dur: 'eighth', dotted: true }])
  })
  it('5/8 → ikilik + sekizlik', () => {
    expect(splitDuration(5, 8)).toEqual([{ dur: 'half' }, { dur: 'eighth' }])
  })
  it('en az parça, büyükten küçüğe', () => {
    expect(splitDuration(5, 16)).toEqual([{ dur: 'quarter' }, { dur: 'sixteenth' }])
    expect(splitDuration(7, 16)).toEqual([{ dur: 'quarter', dotted: true }, { dur: 'sixteenth' }])
    expect(splitDuration(7, 8)).toEqual([{ dur: 'half', dotted: true }, { dur: 'eighth' }])
    expect(splitDuration(9, 8)).toEqual([{ dur: 'whole' }, { dur: 'eighth' }])
    expect(splitDuration(15, 16)).toEqual([{ dur: 'half', dotted: true }, { dur: 'eighth', dotted: true }])
    // Açgözlü seçim (sekizlik) 2/64 artık bırakırdı; en az parça noktalı onaltılık + onaltılık.
    expect(splitDuration(5, 32)).toEqual([{ dur: 'sixteenth', dotted: true }, { dur: 'sixteenth' }])
  })
  it('tam bölünemeyen süre null döner', () => {
    expect(splitDuration(1, 12)).toBeNull()
    expect(splitDuration(1, 32)).toBeNull()
    expect(splitDuration(1, 6)).toBeNull()
    expect(splitDuration(0, 8)).toBeNull()
  })
})

describe('cleanSyllable', () => {
  it('sondaki boşlukları atar, ulamayı ‿ yapar', () => {
    expect(cleanSyllable('Be')).toBe('Be')
    expect(cleanSyllable('dım ')).toBe('dım')
    expect(cleanSyllable('lap  ')).toBe('lap')
    expect(cleanSyllable('nim_')).toBe('nim‿')
    expect(cleanSyllable('')).toBe('')
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
    expect(r.soz[0]).toEqual(['Be', 'nim‿', 'a', 'dım', 'dert', 'li', 'do', '', 'lap'])
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

  it('tek değerle yazılamayan süre aynı ölçüde bağlı notalara bölünür (Dağlar ile Sira 33–34)', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Re5', 'D5', 327, 327, 3, 8, 1364, 99, 96, 'ni  ', '0.375'],
      [3, 9, 'Mi5', 'E5', 336, 336, 5, 8, 2273, 95, 96, '', '1.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'daglar.txt', usul: SOFYAN })
    expect(r.olcu).toEqual([
      [n('D', 5, 0, 'quarter', true), n('E', 5, 0, 'half', false, true), n('E', 5, 0, 'eighth')],
    ])
    expect(r.soz).toEqual([['ni', '', '']])
    expect(r.summary).toMatchObject({ notes: 2, komaChecked: 2, tiedRows: 1, events: 3 })
  })

  it('bölünen notanın hecesi yalnızca ilk parçada kalır', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'La4', 'A4', 305, 305, 7, 8, 909, 95, 96, 'Hak ', '0.875'],
      [3, 9, 'Es', 'Es', -1, -1, 1, 8, 909, 100, 0, '', '1.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    expect(r.olcu[0]).toEqual([n('A', 4, 0, 'half', true, true), n('A', 4, 0, 'eighth'), { kind: 'rest', dur: 'eighth' }])
    expect(r.soz[0]).toEqual(['Hak', '', ''])
  })

  it('bölünen sus bağsız ardışık suslar olur', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Es', 'Es', -1, -1, 5, 8, 909, 100, 0, '', '0.625'],
      [3, 9, 'La4', 'A4', 305, 305, 3, 8, 909, 95, 96, 'a', '1.0'],
    ]
    const r = convertSymbTr(txt(rows), { file: 'x.txt', usul: SOFYAN })
    expect(r.olcu[0]).toEqual([{ kind: 'rest', dur: 'half' }, { kind: 'rest', dur: 'eighth' }, n('A', 4, 0, 'quarter', true)])
    expect(r.soz[0]).toEqual(['', '', 'a'])
  })

  it('temsil edilemeyen süre dosyayı ve satırı adlandıran hatayla durur', () => {
    const rows = [
      [1, 51, '', '', 0, 0, 4, 4, 0, 6, 0, 'Sofyan', '0.0'],
      [2, 9, 'Re5', 'D5', 327, 327, 2, 3, 1364, 99, 96, 'ni  ', '0.6666666666667'],
      [3, 9, 'Mi5', 'E5', 336, 336, 1, 3, 2273, 95, 96, '', '1.0'],
    ]
    expect(() => convertSymbTr(txt(rows), { file: 'daglar.txt', usul: SOFYAN })).toThrow(
      /daglar\.txt.*Sira 2.*2\/3.*Sira 3.*1\/3/s,
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

describe('Kod 10 ve 11 satırları', () => {
  // Yine Bağlandı Dil (neva--sarki--yuruksemai_ii) biçimi: Kod 10 ardçarpmalı, Kod 11 sessiz çarpma, Kod 8 süresiz çarpma.
  const rows = [
    [1, 51, '', '', 0, 0, 6, 8, 0, 87, 0, 'Yürüksemâî II', '0.0'],
    [2, 10, 'Re5', 'D5', 327, 327, 1, 8, 333, 95, 96, 'ARANAĞME', '0.166666666667'],
    [3, 8, 'Mi5', 'E5', 336, 336, 0, 0, 0, 95, 96, '.', '0.166666666667'],
    [4, 9, 'Do5', 'C5', 318, 318, 1, 4, 667, 95, 96, '.', '0.5'],
    [5, 11, 'Re5', 'D5', 327, 327, 1, 8, 333, 95, 96, '.', '0.666666666667'],
    [6, 8, 'Do5', 'C5', 318, 318, 0, 0, 0, 95, 96, '.', '0.666666666667'],
    [7, 9, 'Es', 'Es', -1, -1, 1, 8, 333, 100, 0, '.', '0.833333333333'],
    [8, 9, 'Re5', 'D5', 327, 327, 1, 8, 333, 95, 96, '.', '1.0'],
  ]

  it('Kod 10 ve 11 süreli nota sayılır; Kod 8 süresiz çarpma atlanır', () => {
    const r = convertSymbTr(txt(rows), { file: 'neva.txt', usul: YURUK })
    expect(r.olcu).toEqual([
      [
        n('D', 5, 0, 'eighth'),
        n('C', 5, 0, 'quarter'),
        n('D', 5, 0, 'eighth'),
        { kind: 'rest', dur: 'eighth' },
        n('D', 5, 0, 'eighth'),
      ],
    ])
    expect(r.skipped.map((s) => [s.sira, s.reason])).toEqual([
      [3, 'Kod 8 (nota/sus değil)'],
      [6, 'Kod 8 (nota/sus değil)'],
    ])
    expect(r.summary).toMatchObject({ measures: 1, notes: 4, rests: 1, komaChecked: 4, events: 5, verifiedRows: 5 })
  })

  it('Kod 10 ve 11 satırları olmasaydı Offset zinciri tutmazdı', () => {
    const without = rows.filter((r) => r[1] !== 10 && r[1] !== 11).map((r, i) => [i + 1, ...r.slice(1)])
    expect(() => convertSymbTr(txt(without), { file: 'neva.txt', usul: YURUK })).toThrow(/Offset/)
  })
})

describe('olcuAraligi', () => {
  // 6/8; her ölçü iki noktalı dörtlük. Ölçü k (0'dan) için satırlar.
  const m = (k, kod = 9) => [
    [0, kod, 'Re5', 'D5', 327, 327, 3, 8, 500, 95, 96, `a${k}`, String(k + 0.5)],
    [0, 9, 'Do5', 'C5', 318, 318, 3, 8, 500, 95, 96, `b${k}`, String(k + 1)],
  ]
  // Dördüncü ölçüde üçleme (1/12): aralığın dışında kaldığında dönüştürülmemeli.
  const triplet = [0, 9, 'Re5', 'D5', 327, 327, 1, 12, 500, 95, 96, 'x', '3.1111111111']
  const file = (rows) =>
    txt([[0, 51, '', '', 0, 0, 6, 8, 0, 87, 0, 'Yürüksemâî II', '0.0'], ...rows].map((r, i) => [i + 1, ...r.slice(1)]))
  const opts = { file: 'a.txt', usul: YURUK }
  const all = [...m(0, 10), ...m(1), ...m(2)]

  it('yalnız o ölçüleri alır', () => {
    const r = convertSymbTr(file(all), { ...opts, olcuAraligi: [2, 3] })
    expect(r.olcu).toEqual([
      [n('D', 5, 0, 'quarter', true), n('C', 5, 0, 'quarter', true)],
      [n('D', 5, 0, 'quarter', true), n('C', 5, 0, 'quarter', true)],
    ])
    expect(r.soz).toEqual([
      ['a1', 'b1'],
      ['a2', 'b2'],
    ])
    expect(r.summary).toMatchObject({ measures: 2, notes: 4, verifiedRows: 4 })
    expect(convertSymbTr(file(all), { ...opts, olcuAraligi: [1, 1] }).soz).toEqual([['a0', 'b0']])
    // Aralık verilmezse hepsi.
    expect(convertSymbTr(file(all), opts).olcu).toHaveLength(3)
  })

  it('aralığın dışındaki satırlar dönüştürülmez; içinde kalırsa hata verir', () => {
    const rows = [...all, triplet]
    expect(convertSymbTr(file(rows), { ...opts, olcuAraligi: [1, 3] }).olcu).toHaveLength(3)
    expect(() => convertSymbTr(file(rows), { ...opts, olcuAraligi: [3, 4] })).toThrow(/1\/12/)
  })

  it('aralık ölçü sınırında başlamazsa hata verir', () => {
    // İkinci satır 1. ölçüyü aşıyor (3/8 + 4/8): 2. ölçüden başlayan aralık bir notanın ortasına denk gelir.
    const rows = [
      [0, 9, 'Re5', 'D5', 327, 327, 3, 8, 500, 95, 96, 'a', '0.5'],
      [0, 9, 'Do5', 'C5', 318, 318, 4, 8, 500, 95, 96, 'b', '1.0833333333'],
      [0, 9, 'Re5', 'D5', 327, 327, 2, 8, 500, 95, 96, 'c', '1.4166666667'],
    ]
    expect(() => convertSymbTr(file(rows), { ...opts, olcuAraligi: [2, 2] })).toThrow(/ölçü 2.*sınır/s)
  })

  it('geçersiz ya da dosyayı aşan aralık hata verir', () => {
    for (const a of [[0, 2], [3, 2], [1.5, 2], [1, 4]]) {
      expect(() => convertSymbTr(file(all), { ...opts, olcuAraligi: a }), String(a)).toThrow(/aralık/i)
    }
  })
})

describe('buildParca', () => {
  const piece = { id: 'p', title: 'P', makam: 'neva', usul: 'yuruk-semai', composer: 'Z', file: 'x.txt' }
  const r = { olcu: [[n('D', 5, 0, 'quarter', true)]], soz: [['.']] }

  it('soz:false ile soz alanı yazılmaz', () => {
    const parca = buildParca({ ...piece, soz: false }, r)
    expect('soz' in parca).toBe(false)
    expect(formatParca(parca)).not.toContain('"soz"')
  })

  it('varsayılan: boş olmayan hece varsa soz yazılır, hepsi boşsa yazılmaz', () => {
    expect(buildParca(piece, r).soz).toEqual([['.']])
    expect('soz' in buildParca(piece, { ...r, soz: [['']] })).toBe(false)
  })

  it('source SymbTr ham dosya adresidir', () => {
    expect(buildParca(piece, r).source).toBe('https://raw.githubusercontent.com/MTG/SymbTr/master/txt/x.txt')
  })
})

describe('PIECES', () => {
  it('kolaydan zora sıralı; aranağme Nevâ, Yürük Semâî, ölçü 1–20, söz yok', () => {
    expect(PIECES.map((p) => p.id)).toEqual([
      'benim-adim-dertli-dolap',
      'yine-baglandi-dil-aranagme',
      'hak-teala',
      'daglar-ile-taslar-ile',
    ])
    expect(PIECES[1]).toEqual({
      id: 'yine-baglandi-dil-aranagme',
      title: 'Yine Bağlandı Dil (aranağme)',
      makam: 'neva',
      usul: 'yuruk-semai',
      composer: 'Zekâî Dede',
      file: 'neva--sarki--yuruksemai_ii--yine_baglandi--zekai_dede.txt',
      olcuAraligi: [1, 20],
      soz: false,
    })
  })
})

describe('mevcut üç parça aynı JSON üretir (bayt bayt)', () => {
  // SymbTr txt'leri depoya konmaz (CC BY-NC-SA, indirilir). Bu yüzden her parçanın depodaki JSON'undan
  // kaynak biçiminde (Kod 9, Pay/Payda, Offset, Soz1) bir txt kurulur ve dönüştürücüden geçirilir; çıktı
  // depodaki dosyayla bayt bayt aynı olmalı. Gerçek txt'lerle karşılaştırma elle yapılır: dönüştürücü
  // çalıştırılır ve `git diff --exit-code src/content/parcalar/*.json` boş olmalı.
  const UNITS = { whole: 64, half: 32, quarter: 16, eighth: 8, sixteenth: 4 }
  const unitsOf = (e) => UNITS[e.dur] * (e.dotted ? 1.5 : 1)
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
  const notaAE = ({ step, octave, acc }) => `${step}${octave}${acc === 0 ? '' : `${acc < 0 ? 'b' : '#'}${Math.abs(acc)}`}`

  /** Parça JSON'u → SymbTr txt (bağlı parçalar tek satırda birleşir). */
  function toSymbTr(parca, usul) {
    const measureUnits = (usul.zaman * 64) / usul.mertebe
    const rows = [[1, 51, '', '', 0, 0, usul.zaman, usul.mertebe, 0, 0, 0, 'Usul', '0.0']]
    parca.olcu.forEach((events, mi) => {
      const total = events.reduce((s, e) => s + unitsOf(e), 0)
      let cum = 0
      for (let i = 0; i < events.length; ) {
        let j = i
        let units = unitsOf(events[j])
        while (events[j].kind === 'note' && events[j].tie) units += unitsOf(events[++j])
        cum += units
        const e = events[i]
        const g = gcd(units, 64)
        const offset = mi + 1 - (total - cum) / measureUnits
        const hece = (parca.soz?.[mi]?.[i] ?? '').replaceAll('‿', '_')
        const nota = e.kind === 'rest' ? 'Es' : notaAE(e.pitch)
        const koma = e.kind === 'rest' ? -1 : komaAEOf(e.pitch)
        rows.push([rows.length + 1, 9, '', nota, '', koma, units / g, 64 / g, 0, 0, 0, hece, String(offset)])
        i = j + 1
      }
    })
    return txt(rows)
  }

  for (const id of ['benim-adim-dertli-dolap', 'hak-teala', 'daglar-ile-taslar-ile']) {
    it(id, () => {
      const piece = PIECES.find((p) => p.id === id)
      const repo = readFileSync(resolve('src/content/parcalar', `${id}.json`), 'utf8').replaceAll('\r\n', '\n')
      const usul = { dolap: DOLAP, sofyan: SOFYAN }[piece.usul]
      const r = convertSymbTr(toSymbTr(JSON.parse(repo), usul), { file: piece.file, usul, olcuAraligi: piece.olcuAraligi })
      expect(formatParca(buildParca(piece, r))).toBe(repo)
    })
  }
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
