// 075_rast-erler_demine_destur_alalim.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Sofyan 4/4, ♩=112. Anahtar: Si koma bemolü + Fa diyezi (bütün Si'ler B4b1, Fa'lar F5#4); geçici natürel Fa
//   (F5) Ö5–6, Ö17–18, Ö23–24, Ö27–28'de, geçici diyez La (A4#4) Ö14'te. PDF 34 ölçü; tek geçiş, tekrarlar açılmadı.
//   Tam ölçülük 1. bitişler yazılmadı, yalnız 2. bitişler: PDF Ö4 (1. volta, 'ib ret a la lım') çıkarıldı, PDF Ö5 =
//   Ö4; PDF Ö9 çıkarıldı, PDF Ö10 = Ö8; PDF Ö28 çıkarıldı, PDF Ö29 = Ö26; PDF Ö33 çıkarıldı, PDF Ö34 = Ö30. Sonuç 30
//   ölçü. Tekrarlar (PDF numarasıyla): Ö1–2 :|, Ö3–5 |: :| voltalı, Ö6–7 |: :|, Ö8–10 |: :| voltalı, Ö11 segno, Ö11–14
//   |: :| 'Dost dost', Ö15–16 |: :| 'Devrâna uyup', Ö24 'Son'; Ö25–34 2. kıta (Ö6–10 ve Ö3–5 ezgisi, 3 söz satırı,
//   kendi tekrar ve voltalarıyla), Ö34 sonunda segno (Ö11'e dönüş, 'Son'da bitiş). Bağ yalnız dosyadaki Ö11'de (PDF Ö13, A4~A4). Anacrusis
//   yok, son ölçü tam. Sözler: Ö23–30'da PDF'te üç söz satırı var; 'soz' alanına ilk satır (Günler geçeler… /
//   Sermâyen olan… / Bülbüllere bak… / Ey gonca açıl…) yazıldı, öteki iki satır ve 2. sayfadaki güfte yazılmadı.
//   Beste: Tahsîne Hanım (Hacı, Merhum); Güfte: M. Nusret Tura Uşşâkî.
// Belirsiz: Ö14: 'sey' hecesinin La'sında düz diyez (♯) var, 4 koma sayıldı (A4#4); uygulamada karşılığı yok.
// Ö21: son vuruşta sekizlik üçleme (B4b1 A4 B4b1, altında '3'), `:8t` ile yazıldı.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'erler-demine',
  title: 'Erler Demine Destur Alalım',
  makam: 'rast',
  usul: 'sofyan',
  composer: 'Tahsîne Hanım (Hacı)',
  lyricist: 'M. Nusret Tura Uşşâkî',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/075_rast/erler_demine_destur_alalim.pdf',
  notasyon: [
    'D5:4 D5:4 E5:8 E5:8 D5:4',
    'D5:4 D5:4 E5:8 E5:8 D5:4',
    'E5:4 C5:4 D5:8 D5:8 B4b1:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 A4:8 G4:4',
    'G5:4 G5:8 F5#4:8 A5:8 G5:8 G5:8 F5:8',
    'F5:8 E5:8 E5:8 D5:8 E5:8 D5:8 D5:4',
    'E5:4 C5:4 D5:8 D5:8 B4b1:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 A4:8 G4:4',
    'r:8 C5:2. B4b1:8',
    'r:8 B4b1:2. A4:8',
    'r:8 A4:2~ A4:8 B4b1:8. G4:16',
    'G4:2. r:4',
    'B4b1:4 B4b1:4 B4b1:8 B4b1:8 B4b1:4',
    'A4#4:8 B4b1:8 C5:8 B4b1:8 D5:8 C5:8 B4b1:4',
    'E5:8 D5:8 D5:2.',
    'E5:2 F5#4:2',
    'G5:2 A5:8 G5:8 G5:8 F5:8',
    'F5:8 E5:8 E5:8 D5:8 E5:8 D5:8 D5:4',
    'E5:8. D5:16 D5:8 D5:8 D5:8 D5:8 D5:4',
    'C5:8. C5:16 C5:8 C5:8 C5:8 C5:8 C5:4',
    'B4b1:8. B4b1:16 B4b1:8 B4b1:8 A4:8 A4:8 B4b1:8t A4:8t B4b1:8t',
    'G4:2. r:4',
    'G5:4 G5:8 F5#4:8 A5:8 G5:8 G5:8 F5:8',
    'F5:8 E5:8 E5:8 D5:8 E5:8 D5:8 D5:4',
    'E5:4 C5:4 D5:8 D5:8 B4b1:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 A4:8 G4:4',
    'G5:4 G5:8 F5#4:8 A5:8 G5:8 G5:8 F5:8',
    'F5:8 E5:8 E5:8 D5:8 E5:8 D5:8 D5:4',
    'E5:4 C5:4 D5:8 D5:8 B4b1:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 A4:8 G4:4',
  ].join(' | '),
  soz: [
    ['Er', 'ler', 'de', 'mi', 'ne'],
    ['des', 'tur', 'a', 'la', 'lım'],
    ['Per', 'va', 'ne', 'ye', 'bak'],
    ['ib', '', 'ret', 'a', 'la', 'lım'],
    ['Aşk', 'a', '', 'te', 'şi', 'ne', ''],
    ['gel', '', 'bir', '', 'ya', 'na', 'lım'],
    ['Dost', 'dost', 'di', 'ye', 'rek'],
    ['ar', '', 'şa', 'va', 'ra', 'lım'],
    ['', 'Dost', ''],
    ['', 'dost', ''],
    ['', 'dost', '', '', ''],
    ['dost', ''],
    ['Dev', 'ra', 'na', 'u', 'yup'],
    ['sey', '', 'ran', '', 'e', 'de', 'lim'],
    ['ey', '', 'vah'],
    ['', ''],
    ['', 'de', 'me', 'den', ''],
    ['Al', '', 'lah', '', 'di', 'ye', 'lim'],
    ['Lâ', 'i', 'lâ', 'he', 'il', 'lal', 'lah'],
    ['Lâ', 'i', 'lâ', 'he', 'il', 'lal', 'lah'],
    ['Lâ', 'i', 'lâ', 'he', 'il', 'lal', 'lah', '', ''],
    ['Hu', ''],
    ['Gün', 'ler', '', 'ge', 'ce', 'ler', ''],
    ['dur', '', 'maz', '', 'ge', 'çi', 'yor'],
    ['Ser', 'mâ', 'yen', 'o', 'lan'],
    ['öm', '', 'rün', 'bi', 'ti', 'yor'],
    ['Bül', 'bül', '', 'le', 're', 'bak', ''],
    ['fer', '', 'yad', '', 'e', 'di', 'yor'],
    ['Ey', 'gon', 'ca', 'a', 'çıl'],
    ['mev', '', 'sim', 'bi', 'ti', 'yor'],
  ],
  bolumler: [
    { id: 'erler-demine', baslik: 'Erler demine destur alalım', olcuAraligi: [1, 4] },
    { id: 'dost-dost', baslik: 'Dost dost diyerek', olcuAraligi: [7, 12] },
    { id: 'la-ilahe-illallah', baslik: 'Lâ ilâhe illallah', olcuAraligi: [19, 22] },
  ],
}

export default parca
