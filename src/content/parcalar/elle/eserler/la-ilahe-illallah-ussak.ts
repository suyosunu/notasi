// 096_ussak-la_ilahe_illallah.pdf (neyzen.com, Tolga Göyenç nota arşivi, 05.12.2009), elle yazıldı 2026-10-31.
//   Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Uşşak İlâhî "Nur Muhammed", Usûlü: Sofyan 4/4, tempo yazılı değil. Beste ve Güfte: Kenan Rifâî. Anahtar: Si
//   çizgisinde küçük (ters çizilmiş) bemol, Uşşak donanımı olarak Si koma bemolü okundu (bütün Si'ler B4b1). Geçici
//   işaret yok. 8 ölçü, 4 satır × 2. Ö1 başında segno; Ö4 sonunda ince çift çizgi; Ö5–8 notaca Ö1–4'ün aynısı, başka
//   dizeyle yazılı tekrar (ikisi de yazıldı). Ö8 sonunda segno ve bitiş çizgisi (D.S., açılmadı). Volta, tekrar
//   çizgisi, bağ, çarpma yok. Ö2 ve Ö6'daki C5–D5–C5–B4b1 üzerindeki yay legato yayıdır, yazılmadı. Anacrusis yok, son
//   ölçü tam (son vuruş dörtlük sus). soz: notanın altındaki ilk söz satırı (Lâ ilâhe illallah nur Muhammed sallallah /
//   Hasbî Rabbî cellallah virdim Allah illallah), PDF'teki yazımla ('La i la he'). Ö2'de 'lal lah' G4 onaltılık ve A4
//   sekizlik altında, Ö6'da ise 'lal' A4 sekizlik, 'lah' C5 sekizlik altında basılmış; olduğu gibi hizalandı. İkinci
//   söz satırı (Aşk beni etti zebun… / Derd-i aşkla gece gün…) ve alttaki beyitler yazılmadı.
// Bölüm yok: 16'lık bulunmayan (Seviye 1) ölçüler yalnız Ö1 ve Ö5; 4 ölçülük Seviye 1 kesiti yok.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'la-ilahe-illallah-ussak',
  title: 'Lâ İlâhe İllallah (Nûr Muhammed)',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Kenan Rifâî',
  lyricist: 'Kenan Rifâî',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/096_ussak/la_ilahe_illallah.pdf',
  notasyon: [
    'G4:4 A4:4 A4:4 A4:4',
    'A4:8. G4:16 A4:8 B4b1:8 C5:8 D5:8 C5:8 B4b1:8',
    'D5:4 D5:8. C5:16 C5:8. B4b1:16 A4:4',
    'B4b1:8 A4:16 B4b1:16 C5:8 B4b1:16 A4:16 A4:4 r:4',
    'G4:4 A4:4 A4:4 A4:4',
    'A4:8. G4:16 A4:8 B4b1:8 C5:8 D5:8 C5:8 B4b1:8',
    'D5:4 D5:8. C5:16 C5:8. B4b1:16 A4:4',
    'B4b1:8 A4:16 B4b1:16 C5:8 B4b1:16 A4:16 A4:4 r:4',
  ].join(' | '),
  soz: [
    ['La', 'i', 'la', 'he'],
    ['il', 'lal', 'lah', '', '', '', '', ''],
    ['nur', 'Mu', '', 'ham', '', 'med'],
    ['sal', '', '', 'lal', '', '', 'lah', ''],
    ['Has', 'bi', 'rab', 'bi'],
    ['cel', '', 'lal', '', 'lah', '', '', ''],
    ['vir', 'dim', '', 'Al', '', 'lah'],
    ['il', '', '', 'lal', '', '', 'lah', ''],
  ],
}

export default parca
