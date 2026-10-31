// 096_ussak-ben_melamet_hirkasini.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Uşşâk Nefes. Anahtar: Si koma bemolü (bütün Si'ler B4b1). Geçici işaret, bağ, çarpma, noktalı süre yok.
//   Usul: PDF'te 'Sofyân - Düyek' yazıyor, ölçü işareti 4/4. Uygulamada `sofyan` 4/4, `duyek` 8/8 tanımlı; yazılı
//   ölçü 4/4 olduğu için `sofyan` seçildi (ölçü süresi ikisinde de 4 vuruş, nota değişmez).
//   Yapı: Ö1 segno; Ö1–7 Aranağme (sözsüz), Ö7 son vuruşu 1./2. volta ve :|. Ö8 |: ... Ö11 :| (Ö11 son vuruşu
//   1./2. volta, 'SAZ'). Ö12 |: ... Ö18 :| (Ö18 son vuruşu 1./2. volta), sonda segno (D.S., baştan Aranağme'ye).
//   Tek geçiş yazıldı, tekrarlar açılmadı. Ölçü içi seçenekler (her biri ölçüyü 4 vuruşa tamamlar):
//   - Ö1 ilk vuruş ①/②: ① (1. geçiş) dörtlük sus alındı; ② E5 dörtlük yazılmadı.
//   - Ö7 son vuruş volta: 2. bitiş A4 dörtlük alındı; 1. bitiş A4 B4b1 C5 D5 onaltılıklar yazılmadı.
//   - Ö8 ilk vuruş ①/②: ① (1. geçiş, Ö7'nin 2. bitişinden gelen) dörtlük sus alındı; ② A4 dörtlük yazılmadı.
//   - Ö11 son vuruş volta: 2. bitiş (ileri götüren) A4 B4b1 C5 D5 onaltılıklar alındı; 1. bitiş A4 B4b1 C5 B4b1
//     onaltılıklar yazılmadı. PDF'te 1. volta parantezi A4 dörtlüğün üstünden başlar; A4 iki geçişte ortak sayıldı ('me' hecesi), ölçü 4 vuruş.
//   - Ö18 son vuruş volta: 2. bitiş (son geçiş) A4 dörtlük alındı; 1. bitiş A4 B4b1 C5 D5 onaltılıklar yazılmadı.
//   Ölçü numaraları yazılan sırayla 1–18; PDF'teki ölçülerle bire bir aynı (volta parçaları ölçü içinde).
//   Notaca tekrarlar: Ö12 = Ö1 (② ile), Ö13 = Ö2, Ö14 = Ö3, Ö15 = Ö4, Ö16 = Ö5, Ö17 = Ö6 = Ö10.
//   soz: notanın altındaki ilk söz satırı (1. kıta: 'Ben melâmet hırkasını kendim giydim eğnime / Âr-ü nâmus
//   şişesini taşa çaldım kime ne'). Heceler PDF'teki konumlarına göre hizalandı: Ö8, Ö10, Ö12, Ö17'nin ilk vuruşu
//   hecesiz (sus ya da önceki hecenin uzatması). 'SAZ' yazan yerler (Ö11 voltası, Ö14 ve Ö16 başı) sözsüz sayıldı.
//   PDF'teki 2. ve 3. söz satırları ve alttaki ek kıtalar yazılmadı. Beste: ?, Güfte: Nesîmî.
//   Bölümler: G5 yalnız Ö2 ve Ö13'te (Seviye 3); bunları içermeyen Seviye 2 kesitleri verildi. Seviye 1 kesiti yok
//   (16'lıklar ve E5 hemen her ölçüde).
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'ben-melamet-hirkasini',
  title: 'Ben Melâmet Hırkasını',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  lyricist: 'Nesîmî',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/096_ussak/ben_melamet_hirkasini.pdf',
  notasyon: [
    'r:4 C5:8 D5:8 E5:4 E5:8 D5:8',
    'D5:8 G5:8 E5:8 E5:16 D5:16 D5:16 C5:16 C5:16 B4b1:16 D5:4',
    'D5:16 C5:16 B4b1:16 A4:16 B4b1:8 C5:8 C5:8 B4b1:8 B4b1:8 A4:8',
    'r:8 G4:16 A4:16 G4:8 A4:8 A4:4 D5:4',
    'D5:16 C5:16 B4b1:16 A4:16 C5:8 C5:8 C5:8 B4b1:16 A4:16 G4:8 A4:16 B4b1:16',
    'C5:4 B4b1:8 C5:8 C5:8 B4b1:8 B4b1:8 A4:8',
    'r:8 G4:16 A4:16 G4:8 A4:8 A4:4 A4:4',
    'r:4 G4:8 A4:8 A4:4 A4:4',
    'r:8 B4b1:16 A4:16 B4b1:8 C5:8 C5:16 B4b1:16 B4b1:16 A4:16 G4:8 A4:16 B4b1:16',
    'C5:4 B4b1:8 C5:8 C5:8 B4b1:8 B4b1:8 A4:8',
    'r:8 G4:16 A4:16 G4:8 A4:8 A4:4 A4:16 B4b1:16 C5:16 D5:16',
    'E5:4 C5:8 D5:8 E5:4 E5:8 D5:8',
    'D5:8 G5:8 E5:8 E5:16 D5:16 D5:16 C5:16 C5:16 B4b1:16 D5:4',
    'D5:16 C5:16 B4b1:16 A4:16 B4b1:8 C5:8 C5:8 B4b1:8 B4b1:8 A4:8',
    'r:8 G4:16 A4:16 G4:8 A4:8 A4:4 D5:4',
    'D5:16 C5:16 B4b1:16 A4:16 C5:8 C5:8 C5:8 B4b1:16 A4:16 G4:8 A4:16 B4b1:16',
    'C5:4 B4b1:8 C5:8 C5:8 B4b1:8 B4b1:8 A4:8',
    'r:8 G4:16 A4:16 G4:8 A4:8 A4:4 A4:4',
  ].join(' | '),
  soz: [
    ['', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', 'Ben', 'me', 'lâ', 'met'],
    ['', 'hır', '', '', 'ka', 'sı', '', '', '', 'nı', '', ''],
    ['', 'ken', 'dim', 'giy', '', 'dim', ''],
    ['', 'eğ', '', '', 'ni', 'me', '', '', '', ''],
    ['', 'Â', 'rü', 'nâ', 'müs', ''],
    ['', 'şi', '', 'şe', '', 'si', '', '', '', 'ni'],
    ['', '', '', '', 'ta', 'şa', 'çal', '', 'dım', ''],
    ['', 'ki', '', '', 'me', 'ne', 'ah'],
    ['', '', '', '', 'hay', 'dar', 'hay', '', '', 'dar', '', ''],
    ['', 'ta', 'şa', 'çal', '', 'dım', ''],
    ['', 'ki', '', '', 'me', 'ne', ''],
  ],
  bolumler: [
    { id: 'aranagme', baslik: 'Aranağme', olcuAraligi: [3, 7] },
    { id: 'ben-melamet', baslik: 'Ben melâmet hırkasını', olcuAraligi: [8, 11] },
    { id: 'tasa-caldim', baslik: 'Taşa çaldım kime ne', olcuAraligi: [14, 18] },
  ],
}

export default parca
