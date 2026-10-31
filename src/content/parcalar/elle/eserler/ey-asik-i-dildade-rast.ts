// ey_asiki_dildade_ney.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Donanım: Si koma bemolü (B4b1) + Fa diyezi (Eviç); parçada yazılan tek Fa'lar (Ö5) ♮ ile bozulmuş, düz F5.
//   Tekrar işaretleri: Ö9 başında |: , Ö18 sonunda :| (Ö9–18 nakarat tekrarı); Ö18 sonunda D.C. Açılmadı. Söz: 1.
//   kıta (Ey âşık-ı dildâde...), Ö9–18 nakarat tek satır. Bölüm seçimi: önerilen Ö7–11 ve Ö14–18 adayları ifade
//   ortasında kesiliyor (Ö11 'Canlar sana' kurban'sız, Ö14 'zikrullah' Hay kalbim'siz; Ö12 ve Ö13 E5/onaltılık
//   içeriyor); bunun yerine aynı perde kümesinde kalan ve tam bir söz/ezgi cümlesi olan Ö15–18 (Lâ ilâhe illallah
//   Muhammedün resulullah, Rast karar G4) seçildi. ♩=112.
// Belirsiz: Ö18 / D.C.: PDF'te Fine ya da bitiş işareti (fermata vb.) yok; D.C. sonrası parçanın nerede biteceği (Ö8
//   sonu mu, nakaratla Ö18 mi) notadan okunamıyor.
// Belirsiz: Ö5: ♮ yalnız ilk Fa'nın önünde; ikinci Fa (F5:8) kural gereği ölçü sonuna kadar natürel sayılıp düz F5
//   yazıldı (Eviç değil).
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'ey-asik-i-dildade-rast',
  title: 'Ey Âşık-ı Dildâde (Rast)',
  makam: 'rast',
  usul: 'sofyan',
  composer: 'Sadık Efendi (Şeyh)',
  lyricist: 'Sezâî',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/075_rast/ey_asiki_dildade_ney.pdf',
  notasyon: [
    'G4:4 B4b1:4 A4:4 C5:4',
    'B4b1:4 A4:8 B4b1:8 G4:4 r:4',
    'D5:4 D5:4 D5:4 C5:8 B4b1:8',
    'C5:8 D5:8 E5:8 D5:8 D5:4 r:4',
    'D5:4 G5:8 F5:8 F5:8 E5:8 E5:8 D5:8',
    'D5:8 E5:8 D5:8 C5:8 B4b1:4 r:4',
    'G4:4 A4:4 G4:8 A4:8 B4b1:8 C5:8',
    'D5:8 C5:8 B4b1:8 A4:8 G4:4 r:4',
    'G4:4 B4b1:4 B4b1:4 r:4',
    'A4:4 C5:4 C5:8 B4b1:8 A4:4',
    'B4b1:8 C5:8 D5:4 D5:8 D5:8 C5:8 B4b1:8',
    'C5:8. D5:16 E5:4 E5:8 D5:8 D5:4',
    'E5:8 E5:8 C5:8 B4b1:8 C5:4. B4b1:8',
    'D5:8 C5:8 B4b1:8 A4:8 A4:4 r:4',
    'A4:4. G4:8 A4:8 B4b1:8 C5:8 D5:8',
    'B4b1:4 G4:4 D5:4 r:4',
    'B4b1:8 B4b1:4 G4:8 A4:4 B4b1:8 C5:8',
    'D5:8 C5:8 B4b1:8 A4:8 G4:4 r:4',
  ].join(' | '),
  soz: [
    ['Ey', 'a', 'şı', 'kı'],
    ['dil', 'da', '', 'de', ''],
    ['Gel', 'nuş', 'e', 'de', ''],
    ['lim', '', 'ba', '', 'de', ''],
    ['Bir', 'ba', '', 'de', '', 'ge', ''],
    ['rek', '', 'am', '', 'ma', ''],
    ['Ki', 'i', 'çi', '', 'le', ''],
    ['me', '', 'ya', '', 'de', ''],
    ['Can', 'Al', 'lah', ''],
    ['ca', 'nan', 'Al', '', 'lah'],
    ['Can', '', 'lar', 'sa', '', 'na', ''],
    ['kur', '', 'ban', 'Al', '', 'lah'],
    ['Hay', '', 'kal', '', 'bim', ''],
    ['zik', '', 'rul', '', 'lah', ''],
    ['La', 'i', 'la', '', 'he', ''],
    ['il', 'lal', 'lah', ''],
    ['Mu', 'ham', 'me', 'dün', 're', ''],
    ['su', '', 'lul', '', 'lah', ''],
  ],
  bolumler: [
    { id: 'la-ilahe-illallah', baslik: 'Lâ ilâhe illallah', olcuAraligi: [15, 18] },
  ],
}

export default parca
