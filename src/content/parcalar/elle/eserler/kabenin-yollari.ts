// kabenin_yollari_ney_v2.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Ö1–8 ve Ö17–24: ikişer satır aynı melodi yazılı (tekrar işareti yok, açık yazılmış); Ö8, Ö16, Ö24 sonunda
//   çift çizgi. Ö25 |: ... Ö32 :| (Cânım Kâbem nakaratı, söz 1. geçiş 'Cânım kâbem varsam sana', 2. geçiş 'Yüzlerimi
//   sürsem sana' — ikisi de ayrı ölçüler olarak yazılı, Ö25–28 ile Ö29–32 neredeyse aynı). Ö33 |: ... Ö36 :| 'Saz'
//   (sözsüz ara nağme, Ö29–32 melodisinin çarpmalı hâli, Ö34 son yarım yerine iki G4 dörtlük). Sözler: Ö1–24 altında
//   iki satır var; 'soz' alanına üst satır (1. kıta) konuldu, alt satır 2. kıta: 'Eşim dostum yüklesinler yükümü /
//   Komşularım helâl etsin hakkını / Görmez oldum ırağ ile yakını'. PDF'te Beste: ?, Güfte: ? (güfte alanı
//   yazılmadı). Yaylar (slur) yazılmadı; aynı perde bağı yok. Bölüm 'Cânım Kâbem' sözlü nakarat sınırı olan Ö25–32
//   alındı; Ö33–36 saz kısmı da yalnız G4 A4 B4b1 C5 D5 ve sekizlik içerir, istenirse 25–36 yapılabilir (çarpmalar
//   yazılmadığından sorun yok). Ö1–8 ve Ö17–24 E5 içerdiği için Seviye 1 dışı.
// Belirsiz: Ö12, Ö28: G4 dörtlükten B4b1 dörtlüğe giden S biçimli eğri çizgi (katalogdaki 'G4~B4'). Bağ değil
//   (perdeler farklı), 'gliss.' yazısı ya da düz/dalgalı glissando çizgisi de yok; nota başının altından başlayıp
//   sonraki notanın üstünde biten, uçları ters yana düşmüş bir legato yayı (Finale'de bozuk çizilmiş slur) gibi
//   görünüyor. Süreye ve perdeye etkisi yok; aynı hece (Ö12 'tir', Ö28 'na') iki notaya yayılıyor. Neyzen bunu G'den
//   Si'ye çekme/portamento olarak da yorumlayabilir; yazıya yay olarak bile eklenmedi.
// Belirsiz: Ö28, Ö32: B4b1 dörtlükten A4 sekizliğe aynı türden dalgalı/S biçimli yay ('sa' hecesinin melizması).
//   Legato yayı olarak okundu, yazılmadı.
// Belirsiz: Ö27, Ö31, Ö34, Ö35: A4 sekizlikten önce kesik çizgili küçük B4 çarpması (altında küçük yay işareti);
//   kurala göre yazılmadı.
// Belirsiz: Donanım: Fa diyezinin solunda küçük, kısmen nota anahtarına yapışık bir bemol işareti Si çizgisinde; Si
//   koma bemolü (B4b1) olarak okundu. Parçada Fa notası yok, Eviç donanımı etkisiz.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'kabenin-yollari',
  title: "Kâbe'nin Yolları",
  makam: 'rast',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/075_rast/kabenin_yollari_ney_v2.pdf',
  notasyon: [
    'D5:2 E5:4 E5:8 D5:8',
    'D5:4 D5:8 C5:8 B4b1:8 A4:8 B4b1:4',
    'C5:8 D5:8 C5:8 B4b1:8 C5:4 D5:4',
    'D5:8 C5:8 C5:8 B4b1:8 B4b1:4 D5:4',
    'D5:2 E5:4 E5:8 D5:8',
    'D5:4 D5:8 C5:8 B4b1:8 A4:8 B4b1:4',
    'C5:8 D5:8 C5:8 B4b1:8 C5:4 D5:4',
    'D5:8 C5:8 C5:8 B4b1:8 B4b1:4 r:4',
    'B4b1:2 D5:4 C5:8 B4b1:8',
    'A4:4 A4:8 B4b1:8 G4:4 G4:4',
    'A4:4 A4:8 G4:8 A4:4 C5:4',
    'B4b1:4 B4b1:8 A4:8 G4:4 B4b1:4',
    'B4b1:2 D5:4 C5:8 B4b1:8',
    'A4:4 A4:8 B4b1:8 G4:4 G4:4',
    'A4:4 A4:8 G4:8 A4:4 C5:4',
    'B4b1:4 B4b1:8 A4:8 G4:4 r:4',
    'D5:2 E5:4 E5:8 D5:8',
    'D5:4 D5:8 C5:8 B4b1:8 A4:8 B4b1:4',
    'C5:8 D5:8 C5:8 B4b1:8 C5:4 D5:4',
    'D5:8 C5:8 C5:8 B4b1:8 B4b1:4 D5:4',
    'D5:2 E5:4 E5:8 D5:8',
    'D5:4 D5:8 C5:8 B4b1:8 A4:8 B4b1:4',
    'C5:8 D5:8 C5:8 B4b1:8 C5:4 D5:4',
    'D5:8 C5:8 C5:8 B4b1:8 B4b1:4 r:4',
    'B4b1:2 D5:4 C5:8 B4b1:8',
    'A4:4 A4:8 B4b1:8 G4:2',
    'A4:4 A4:8 G4:8 A4:4 C5:4',
    'B4b1:4 B4b1:8 A4:8 G4:4 B4b1:4',
    'B4b1:2 D5:4 C5:8 B4b1:8',
    'A4:4 A4:8 B4b1:8 G4:2',
    'A4:4 A4:8 G4:8 A4:4 C5:4',
    'B4b1:4 B4b1:8 A4:8 G4:4 r:4',
    'B4b1:2 D5:4 C5:8 B4b1:8',
    'A4:4 A4:8 B4b1:8 G4:4 G4:4',
    'A4:4 A4:8 G4:8 A4:4 C5:4',
    'B4b1:4 B4b1:8 A4:8 G4:4 B4b1:4',
  ].join(' | '),
  soz: [
    ['Kâ', '', 'be', ''],
    ['nin', 'yol', '', 'la', '', 'rı'],
    ['bö', '', '', '', '', 'lük'],
    ['bö', '', 'lük', '', 'tür', ''],
    ['Kâ', '', 'be', ''],
    ['nin', 'yol', '', 'la', '', 'rı'],
    ['bö', '', '', '', '', 'lük'],
    ['bö', '', 'lük', '', 'tür', ''],
    ['Be', '', 'nim', ''],
    ['yü', 're', '', 'ci', 'ğim'],
    ['de', '', '', '', 'lik'],
    ['de', 'lik', '', 'tir', ''],
    ['Be', '', 'nim', ''],
    ['yü', 're', '', 'ci', 'ğim'],
    ['de', '', '', '', 'lik'],
    ['de', 'lik', '', 'tir', ''],
    ['Dün', '', 'ya', ''],
    ['de', 'dik', '', 'le', '', 'ri'],
    ['bir', '', '', '', '', 'göl'],
    ['ge', '', 'lik', '', 'tir', ''],
    ['Dün', '', 'ya', ''],
    ['de', 'dik', '', 'le', '', 'ri'],
    ['bir', '', '', '', '', 'göl'],
    ['ge', '', 'lik', '', 'tir', ''],
    ['Câ', '', 'nım', ''],
    ['kâ', '', '', 'bem'],
    ['var', '', '', '', 'sam'],
    ['sa', '', '', 'na', ''],
    ['Yüz', '', 'le', ''],
    ['ri', '', '', 'mi'],
    ['sür', '', '', '', 'sem'],
    ['sa', '', '', 'na', ''],
    ['', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ],
  bolumler: [
    { id: 'benim-yurecigim', baslik: 'Benim yüreciğim', olcuAraligi: [9, 16] },
    { id: 'canim-kabem', baslik: 'Cânım Kâbem', olcuAraligi: [25, 32] },
  ],
}

export default parca
