// 043_huseyni-ismi_subhan_huseyni.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Sofyân 4/4, ♩=112. Anahtar: Si koma bemolü + Fa diyezi (bütün Si'ler B4b1, Fa'lar F5#4). Geçici natürel Fa
//   (F5) Ö2, Ö3, Ö6, Ö7'de. Ö5–8 notaca Ö1–4'ün aynısı (açık yazılmış, tekrar işareti yok). Ö9 |: ... Ö16 :| tek
//   geçiş yazıldı; volta yok, çıkarılan ölçü yok. Anacrusis yok, son ölçü tam. Bağ yok. Ö4, Ö8, Ö16'daki staccato
//   noktaları yazılmadı. soz: notaların altındaki ilk söz satırı ('İsmi sübhan virdin mi var / Bahçelerde yurdun mu
//   var / Bencileyin derdin mi var / Garip garip ötme bülbül'); 2. ve 3. satırlar (Ötme bülbül…, Yûnus vücudun…,
//   Benim derdim…, Seher vakti…) ve alttaki ek kıtalar yazılmadı. PDF'te Beste: ?, Güfte: Yûnus Emre.
// Bölümler: Ö9–16 'Bencileyin derdin mi var / Garip garip ötme bülbül' yalnız A4 B4b1 C5 D5 E5 (E5 Ö10, Ö11) →
//   Seviye 2. Ö13–16 'Garip garip ötme bülbül' yalnız A4 B4b1 C5 D5 → Seviye 1. Ritim bütün parçada sekizlik ve üstü.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'ism-i-subhan',
  title: 'İsm-i Sübhân Virdin mi Var',
  makam: 'huseyni',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/043_huseyni/ismi_subhan_huseyni.pdf',
  notasyon: [
    'A4:4 G5:4 F5#4:4 G5:8 E5:8',
    'E5:2 E5:4 F5:8 D5:8',
    'D5:4 F5:8 E5:8 E5:4. D5:8',
    'D5:4 r:4 r:2',
    'A4:4 G5:4 F5#4:4 G5:8 E5:8',
    'E5:2 E5:4 F5:8 D5:8',
    'D5:4 F5:8 E5:8 E5:4. D5:8',
    'D5:4 r:4 r:2',
    'C5:4 D5:4 D5:4. B4b1:8',
    'D5:2 D5:4 E5:8 C5:8',
    'C5:4 E5:8 D5:8 D5:4. B4b1:8',
    'C5:2 C5:4 D5:8 B4b1:8',
    'B4b1:4 D5:4 C5:4. B4b1:8',
    'B4b1:2 B4b1:4 C5:8 A4:8',
    'A4:4 C5:8 B4b1:8 B4b1:4. A4:8',
    'A4:4 r:4 r:2',
  ].join(' | '),
  soz: [
    ['İs', 'mi', 'süb', '', ''],
    ['hân', '', '', ''],
    ['vir', 'din', '', 'mi', ''],
    ['var', '', ''],
    ['Bah', 'çe', 'ler', '', ''],
    ['de', '', '', ''],
    ['yur', 'dun', 'mu', '', ''],
    ['var', '', ''],
    ['Ben', 'ci', 'le', ''],
    ['yin', '', '', ''],
    ['der', 'din', '', 'mi', ''],
    ['var', '', '', ''],
    ['Ga', 'rip', 'ga', ''],
    ['rib', '', '', ''],
    ['öt', 'me', '', 'bül', ''],
    ['bül', '', ''],
  ],
  bolumler: [
    { id: 'bencileyin-derdin-mi-var', baslik: 'Bencileyin Derdin mi Var', olcuAraligi: [9, 16] },
    { id: 'garip-garip-otme-bulbul', baslik: 'Garip Garip Ötme Bülbül', olcuAraligi: [13, 16] },
  ],
}

export default parca
