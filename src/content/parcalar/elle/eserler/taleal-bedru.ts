// 075_rast-taleal_bedru_v2.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Başlık 'Rast Şuul', 'Talea'l bedru aleynâ — 1 —'; Sofyân ♩=112, 2/4 yazılmış → usul nim-sofyan, ölçü süresi
//   2 vuruş. Anahtar: Si koma bemolü + Fa diyezi (bütün Si'ler B4b1; parçada Fa notası yok, Eviç donanımı etkisiz).
//   31 ölçü (satırlar 5+5+5+5+5+6). Tekrar işareti (|: :|) ve volta yok, çıkarılan ölçü yok. Ö31'de son çizgi, üstünde
//   segno, altında '–Son–'; başta segno yok. Anacrusis yok (Ö1 tam), son ölçü tam. Bağ, geçici işaret, çarpma yok.
//   soz: notaların altındaki ilk söz satırı (Talea'l bedru aleynâ / Min seniyyeti'l vedâ'i / Vecebe'ş şükru aleynâ /
//   Mâ deâ lillâhi dâ'i), heceler PDF'teki gibi; 2. satır (Eyyühe'l meb'usü fînâ…) yazılmadı.
//   Bölümler (Seviye 1: yalnız G4 A4 B4b1 C5 D5 ve sekizlik+): Ö1–8 'Talea'l bedru aleynâ' (iki kez) ve Ö17–20
//   'Vecebe'ş şükru aleynâ'. Seviye 2 ölçüler: Ö10, Ö26 (E5, onaltılık), Ö11, Ö15, Ö23, Ö27, Ö31 (noktalı sekizlik).
// Belirsiz: Ö1: ilk vuruşta iki ses üst üste: üstte dörtlük sus, altta (sap aşağı) B4b1 dörtlük. Söz ('Ta le')
//   sekizliklerde başlıyor; sus sözlü ses, B4b1 saz girişi gibi. Çalınan ses olarak B4b1:4 yazıldı (sözü '').
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'taleal-bedru',
  title: 'Tâleal Bedru',
  makam: 'rast',
  usul: 'nim-sofyan',
  composer: 'Bilinmiyor',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/075_rast/taleal_bedru_v2.pdf',
  notasyon: [
    'B4b1:4 B4b1:8 B4b1:8',
    'B4b1:4 B4b1:4',
    'B4b1:8 B4b1:8 A4:8 B4b1:8',
    'C5:8 D5:8 B4b1:8 C5:8',
    'A4:8 B4b1:8 G4:8 A4:8',
    'A4:4 A4:4',
    'A4:8 A4:8 B4b1:8 A4:8',
    'G4:4 D5:4',
    'D5:8 D5:8 D5:4',
    'D5:4 D5:16 C5:16 D5:16 E5:16',
    'D5:8 B4b1:8 C5:8. B4b1:16',
    'A4:8 B4b1:8 A4:4',
    'G4:8 A4:8 B4b1:4',
    'B4b1:8 A4:8 A4:4',
    'A4:8 G4:8 B4b1:8. A4:16',
    'G4:4 B4b1:4',
    'B4b1:8 B4b1:8 B4b1:4',
    'B4b1:4 B4b1:8 B4b1:8',
    'A4:8 B4b1:8 C5:8 D5:8',
    'B4b1:8 C5:8 A4:8 B4b1:8',
    'G4:8 A4:8 A4:4',
    'A4:4 A4:8 A4:8',
    'B4b1:8. A4:16 G4:4',
    'D5:4 D5:8 D5:8',
    'D5:4 D5:4',
    'D5:16 C5:16 D5:16 E5:16 D5:8 B4b1:8',
    'C5:8. B4b1:16 A4:8 B4b1:8',
    'A4:4 G4:8 A4:8',
    'B4b1:4 B4b1:8 A4:8',
    'A4:4 A4:8 G4:8',
    'B4b1:8. A4:16 G4:4',
  ].join(' | '),
  soz: [
    ['', 'Ta', 'le'],
    ["a'l", 'bed'],
    ['ru', 'a', 'ley', ''],
    ['nâ', '', '', ''],
    ['', '', 'Ta', 'le'],
    ["a'l", 'bed'],
    ['ru', 'a', 'ley', ''],
    ['nâ', ''],
    ['Ta', 'le', "a'l"],
    ['bed', 'ru', '', '', ''],
    ['', 'a', 'ley', ''],
    ['nâ', '', ''],
    ['Min', 'se', 'niy'],
    ['ye', '', "ti'l"],
    ['ve', '', 'dâ', ''],
    ['i', ''],
    ['Ve', 'ce', "be'ş"],
    ['şük', 'ru', 'a'],
    ['ley', '', 'nâ', ''],
    ['', '', '', ''],
    ['Ve', 'ce', "be'ş"],
    ['şük', 'ru', 'a'],
    ['ley', '', 'nâ'],
    ['', 'Ve', 'ce'],
    ["be'ş", 'şük'],
    ['ru', '', '', '', '', 'a'],
    ['ley', '', 'nâ', ''],
    ['', 'Ma', 'de'],
    ['â', 'lil', ''],
    ['lâ', 'hi', ''],
    ['dâ', '', 'i'],
  ],
  bolumler: [
    { id: 'taleal-bedru-aleyna', baslik: "Talea'l bedru aleynâ", olcuAraligi: [1, 8] },
    { id: 'vecebes-sukru-aleyna', baslik: "Vecebe'ş şükru aleynâ", olcuAraligi: [17, 20] },
  ],
}

export default parca
