// sol_cennetin_irmaklari_munir_nureddin.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Yürük Semâî, ♪ = 120. Ö1–12 Aranağme. Ö4 sonunda tekrar bitiş işareti var, başlangıç işareti yok: Ö1–4
//   baştan tekrarlanır. Ö13 |: ... Ö16 :| (ilk dize iki kez). Ö24 sonunda D.C. (sonraki kıtalar için başa dönülür).
//   Ö5–12 ile Ö17–24 nota olarak aynı. PDF'te Ö15 sözü 'Al ah' diye basılmış; 'Al lah' yazıldı. Söz olarak yalnız
//   birinci kıta (Şol cennetin ırmakları / Akar Allah deyu deyu / Çıkmış islam bülbülleri / Öter Allah deyu deyu)
//   girildi; notaların altında 2. ve 3. satırda 'Aydan aydındır yüzleri…' ve 'Yunus Emre var yarına…' kıtaları da
//   var. Kirişli onaltılıklar Ö8, Ö10, Ö12, Ö20, Ö22, Ö24'te ikili gruplar halinde. Bağ ve yay yok.
// Belirsiz: Donanım: Si koma bemolü (B4b1) ve Fa diyezi (Eviç, F5#4) dışında Mi'de (dördüncü aralık) de koma bemolü
//   var; bütün Mi'ler E5b1 yazıldı (Ö2, Ö3, Ö14, Ö15, ikinci nota). Okuma kesin; yalnız E5b1 uygulamanın ney
//   perdeleri arasında yok. Fa notası parçada hiç geçmiyor.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'sol-cennetin-irmaklari-segah',
  title: 'Şol Cennetin Irmakları (Segâh)',
  makam: 'segah',
  usul: 'yuruk-semai',
  composer: 'Münir Nüreddin Selçuk',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/082_segah/sol_cennetin_irmaklari_munir_nureddin.pdf',
  notasyon: [
    'G4:8 D5:4 D5:8 C5:4',
    'D5:8 E5b1:4 D5:8 C5:4',
    'D5:8 E5b1:4 D5:8 B4b1:4',
    'C5:8 D5:4 C5:8 B4b1:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'A4:8 B4b1:4 A4:8 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'G4:16 A4:16 B4b1:4 A4:16 G4:16 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'A4:8 B4b1:4 A4:16 G4:16 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'B4b1:16 C5:16 D5:4 C5:16 B4b1:16 B4b1:4',
    'G4:8 D5:4 D5:8 C5:4',
    'D5:8 E5b1:4 D5:8 C5:4',
    'D5:8 E5b1:4 D5:8 B4b1:4',
    'C5:8 D5:4 C5:8 B4b1:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'A4:8 B4b1:4 A4:8 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'G4:16 A4:16 B4b1:4 A4:16 G4:16 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'A4:8 B4b1:4 A4:16 G4:16 G4:4',
    'B4b1:8 C5:4 B4b1:8 A4:4',
    'B4b1:16 C5:16 D5:4 C5:16 B4b1:16 B4b1:4',
  ].join(' | '),
  soz: [
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '', '', ''],
    ['Şol', 'cen', 'ne', 'tin'],
    ['ır', 'mak', 'la', 'rı'],
    ['A', 'kar', 'Al', 'lah'],
    ['de', 'yû', 'de', 'yû'],
    ['Çık', 'mış', 'is', 'lam'],
    ['bül', 'bül', 'le', 'ri'],
    ['Ö', 'ter', 'Al', 'lah'],
    ['de', '', 'yû', 'de', '', 'yû'],
    ['Çık', 'mış', 'is', 'lam'],
    ['bül', 'bül', 'le', '', 'ri'],
    ['Ö', 'ter', 'Al', 'lah'],
    ['de', '', 'yû', 'de', '', 'yû'],
  ],
  bolumler: [
    { id: 'cikmis-islam-bulbulleri', baslik: 'Çıkmış İslâm Bülbülleri', olcuAraligi: [17, 24] },
  ],
}

export default parca
