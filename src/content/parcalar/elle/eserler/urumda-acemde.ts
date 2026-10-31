// urumda_acemde.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Anahtar: Si koma bemolü (bütün Si'ler B4b1). Tekrar işareti (|: :|) yok; Ö24 sonunda çift çizgi ve D.C.
//   (baştan). Ö13–24 notaca Ö1–12'nin aynısı. Anacrusis yok, son ölçü tam. Bağ, sus, geçici işaret, çarpma yok. soz:
//   notaların altındaki ilk söz satırı yazıldı; Ö1–12'de bu 1. kıta (Urum'da Acem'de… / Allah'ın habibi…), Ö13–24'te
//   ise 1. satır 2. kıtadır (Sabah namazını… / Anın işi gücü…); PDF'te Ö3–4 'ka râ nî', Ö5–6 'Ka râ nî', Ö9–12 ve
//   Ö21–24 'Ka ra ni' diye basılmış, olduğu gibi aktarıldı. PDF'teki 2. ve 3. söz satırları (Bin deveyi…, Yastığı
//   taş…, Elinde asası…, Yunus eydür…) ve 2. sayfadaki ek kıtalar yazılmadı.
// Belirsiz: Bölüm: katalogdaki '≈20 ölçü Mi5'siz' tutmuyor. Mi5 Ö2, Ö8, Ö14, Ö20'de var; Mi5'siz ve cümle sınırlı en
//   uzun parça 4 ölçü (Ö3–6, Ö9–12, Ö15–18, Ö21–24, dördü de nota olarak özdeş). Ö9–12 seçildi.
// Belirsiz: Ö24: sonda D.C. var ama Fine/segno yok; tekrarın nerede biteceği PDF'te belirtilmemiş (muhtemelen sonraki
//   kıtalar için baştan sona tekrar).
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'urumda-acemde',
  title: "Urum'da Acem'de",
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/096_ussak/urumda_acemde.pdf',
  notasyon: [
    'A4:8 A4:8 D5:8 D5:8 D5:4 C5:4',
    'E5:4 D5:8 D5:8 C5:4 B4b1:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 D5:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 A4:4',
    'A4:8 A4:8 D5:8 D5:8 D5:4 C5:4',
    'E5:4 D5:8 D5:8 C5:4 B4b1:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 D5:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 A4:4',
    'A4:8 A4:8 D5:8 D5:8 D5:4 C5:4',
    'E5:4 D5:8 D5:8 C5:4 B4b1:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 D5:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 A4:4',
    'A4:8 A4:8 D5:8 D5:8 D5:4 C5:4',
    'E5:4 D5:8 D5:8 C5:4 B4b1:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 D5:4',
    'D5:8 D5:8 C5:8 C5:8 B4b1:4 A4:4',
    'C5:4 B4b1:8 B4b1:8 A4:4 A4:4',
  ].join(' | '),
  soz: [
    ['U', 'rum', 'da', 'a', 'cem', 'de'],
    ['â', 'şık', 'ol', 'du', 'ğum'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'ka', 'râ', 'nî'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'Ka', 'râ', 'nî'],
    ['Al', 'lah', 'hın', 'ha', 'bi', 'bi'],
    ['dos', 'tum', 'de', 'di', 'ği'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'Ka', 'ra', 'ni'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'Ka', 'ra', 'ni'],
    ['Sa', 'bah', 'na', 'ma', 'zı', 'nı'],
    ['kı', 'lar', 'gi', 'der', 'di'],
    ['giz', 'li', 'ce', 'Rab', 'bi', 'ne'],
    ['Ni', 'yaz', 'e', 'der', 'di'],
    ['giz', 'li', 'de', 'Rab', 'bi', 'ne'],
    ['ni', 'yaz', 'e', 'der', 'di'],
    ['A', 'nın', 'i', 'şi', 'gü', 'cü'],
    ['de', 've', 'gü', 'der', 'di'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'Ka', 'ra', 'ni'],
    ['ye', 'men', 'el', 'le', 'rin', 'de'],
    ['Vey', 'sel', 'Ka', 'ra', 'ni'],
  ],
  bolumler: [
    { id: 'yemen-ellerinde', baslik: 'Yemen Ellerinde', olcuAraligi: [9, 12] },
  ],
}

export default parca
