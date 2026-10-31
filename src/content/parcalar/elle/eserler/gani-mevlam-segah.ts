// gani_mevlam_nasib_etse.pdf (neyzen.com, 082_segah), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Sofyan 4/4, ♩ = 60. Donanım: Si koma bemolü (B4b1), Mi koma bemolü (E5b1) ve Fa diyezi; bütün Si'ler B4b1,
//   bütün Mi'ler E5b1 yazıldı. Fa notası parçada hiç geçmiyor. Geçici işaret, bağ, sus, çarpma yok. PDF 13 ölçü:
//   PDF Ö1–5, Ö6 = 1. volta (A4 G4 C5 B4b1 sekizlikler + B4b1 ikilik, ':|' başa), Ö7 = 2. volta (çift çizgi);
//   PDF Ö8 '|:' … Ö13 ':|' + D.C. Tek geçiş kuralıyla 1. volta (PDF Ö6) yazılmadı, 2. volta yazıldı; bu yüzden
//   buradaki Ö6 = PDF Ö7, Ö7–12 = PDF Ö8–13. Ö10–12 nota olarak Ö1–3'ün aynısı. soz: notaların altındaki ilk söz
//   satırı (Gani Mevlâm nasîb etse / Varsam ağlayı ağlayı / Medine'de Muhammed'i / Görsem ağlayı ağlayı). PDF'te
//   ikinci satır (Âşık Yunus der can ile / Kul olmuşum iman ile / Dilim zikr ü Kur'an ile / Varsam ağlayı ağlayı) ve
//   alttaki öteki kıtalar yazılmadı. PDF'te Beste: Meçhûl, Güfte: Yûnus Emre.
// Bölüm: Ö6 (2. volta), Ö7, Ö8 E5b1 içerir; kalan ölçüler yalnız G4 A4 B4b1 C5 D5 ve sekizlik ile üstü (Seviye 1).
//   Ö9–12 ('…d'i / Görsem ağlayı ağlayı', karar B4b1'de biter) bölüm yapıldı. Ön incelemedeki Ö1–6 kesiti 1. volta ile
//   tamamlanıyordu; 1. volta yazılmadığından Ö1–5 'ağ-' hecesinin ortasında kalıyor, Ö1–3 ise 3 ölçü; bölüm yapılmadı.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'gani-mevlam-segah',
  title: 'Ganî Mevlâm Nasîb Etse',
  makam: 'segah',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/082_segah/gani_mevlam_nasib_etse.pdf',
  notasyon: [
    'G4:4 B4b1:4 B4b1:2',
    'B4b1:4 B4b1:4 C5:8 D5:8 C5:8 B4b1:8',
    'A4:8 G4:8 C5:8 B4b1:8 B4b1:2',
    'G4:4 B4b1:4 B4b1:2',
    'B4b1:4 B4b1:4 C5:8 D5:8 C5:8 B4b1:8',
    'A4:8 G4:8 E5b1:8 D5:8 D5:2',
    'D5:4 E5b1:8 D5:8 D5:2',
    'D5:4 D5:4 D5:4. E5b1:8',
    'D5:8 C5:8 B4b1:8 D5:8 C5:8 D5:8 C5:8 B4b1:8',
    'G4:4 B4b1:4 B4b1:2',
    'B4b1:4 B4b1:4 C5:8 D5:8 C5:8 B4b1:8',
    'A4:8 G4:8 C5:8 B4b1:8 B4b1:2',
  ].join(' | '),
  soz: [
    ['Ga', 'ni', 'Mev'],
    ['lâm', 'na', 'sîb', '', '', ''],
    ['et', '', '', '', 'se'],
    ['var', 'sam', 'ağ'],
    ['la', 'yı', 'ağ', '', '', ''],
    ['la', '', '', '', 'yı'],
    ['Me', 'di', '', 'ne'],
    ['de', 'Mu', 'ham', ''],
    ['me', '', '', '', "d'i", '', '', ''],
    ['gör', 'sem', 'ağ'],
    ['la', 'yı', 'ağ', '', '', ''],
    ['la', '', '', '', 'yı'],
  ],
  bolumler: [
    { id: 'gorsem-aglayi-aglayi', baslik: 'Görsem ağlayı ağlayı', olcuAraligi: [9, 12] },
  ],
}

export default parca
