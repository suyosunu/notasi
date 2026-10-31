// 096_ussak-ya_rabbi_askin.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Anahtar: Si koma bemolü (bütün Si'ler B4b1). Geçici işaret, bağ, anacrusis yok; son ölçü tam. PDF 36 ölçü:
//   tek sayılı satırlar düz, çift sayılı satırlar |: ... :| ve tam ölçülük 1./2. volta. 1. voltalar (PDF Ö8, Ö17, Ö26,
//   Ö35) yazılmadı, yalnız 2. voltalar (PDF Ö9, Ö18, Ö27, Ö36) yazıldı; böylece 32 ölçü. Yazılan Ö8, Ö16, Ö24, Ö32
//   bu 2. voltalardır; Ö5–8, Ö13–16, Ö21–24, Ö29–32 PDF'te tekrarlı bölümlerdir. Ö22 (PDF Ö24): iki çarpma (D5) yazılmadı.
//   soz: notanın altındaki tek söz satırı; PDF'te 'Ya Rab bi' diye basılmış, olduğu gibi aktarıldı. Sayfa altındaki
//   ek kıtalar yazılmadı. Bölüm yok: Seviye 1 ölçüler (Ö1–2, Ö9–11 vb.) en çok 3 ölçü art arda geliyor.
// Belirsiz: Ö28 (PDF Ö31): C5–B4 sekizliklerinin altında ayrıca çift (onaltılık) kiriş var. Ölçü süresi ancak dört
//   sekizlikle (C5 B4 A4 G4) tutuyor; çift kiriş dizgi artığı sayıldı, sekizlik yazıldı.
// Belirsiz: Ö30 (PDF Ö33): ilk iki vuruş iki sesli yazılmış: aşağı saplı D5 dörtlük, C5 B4 sekizlik (Ö6/Ö14 gibi) ve
//   yukarı saplı, bayraklı D5 sekizlik, C5 dörtlük, B4 sekizlik (Ö22 gibi). Aşağı saplı okuma (D5:4 C5:8 B4b1:8) yazıldı.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'ya-rabbi-askin-ver-bana',
  title: 'Yâ Rabbi Aşkın Ver Bana',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Yakup Gören',
  lyricist: 'Nizamoğlu Seyyid Seyfullah',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/096_ussak/ya_rabbi_askin.pdf',
  notasyon: [
    'r:4 G4:8 A4:8 A4:4 A4:4',
    'A4:4 A4:8 G4:8 C5:8 B4b1:8 C5:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 C5:4.',
    'C5:16 B4b1:16 A4:4 G4:8 E5:8. D5:16 D5:4',
    'r:4 B4b1:8 C5:8 D5:8 D5:4.',
    'D5:4 C5:8 B4b1:8 C5:16 D5:16 B4b1:16 D5:16 C5:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 C5:4.',
    'C5:16 B4b1:16 A4:4 B4b1:16 C5:16 C5:16 B4b1:16 A4:16 G4:16 A4:4',
    'r:4 G4:8 A4:8 A4:4 A4:4',
    'A4:8 A4:4 G4:8 C5:8 B4b1:8 C5:4',
    'r:4 B4b1:8 C5:8 D5:4 C5:8 B4b1:8',
    'C5:8 B4b1:8 A4:8 G4:8 E5:8. D5:16 D5:4',
    'r:4 B4b1:8 C5:8 D5:8 D5:4.',
    'D5:4 C5:8 B4b1:8 C5:16 D5:16 B4b1:16 D5:16 C5:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 C5:4.',
    'C5:16 B4b1:16 A4:4 B4b1:16 C5:16 C5:16 B4b1:16 A4:16 G4:16 A4:4',
    'r:4 G4:8 A4:8 A4:4 A4:4',
    'A4:4 A4:8 G4:8 C5:16 D5:16 B4b1:16 D5:16 C5:4',
    'r:4 B4b1:8 C5:8 D5:4 C5:8 B4b1:8',
    'C5:16 B4b1:16 A4:4 G4:8 E5:8. D5:16 D5:4',
    'r:4 B4b1:8 C5:8 D5:8 D5:4.',
    'D5:8 C5:4 B4b1:8 C5:16 C5:16 C5:16 B4b1:16 C5:4',
    'r:8 C5:8. B4b1:16 A4:8 B4b1:8 C5:4.',
    'C5:16 B4b1:16 A4:4 B4b1:16 C5:16 C5:16 B4b1:16 A4:16 G4:16 A4:4',
    'r:4 G4:8 A4:8 A4:4 A4:4',
    'A4:4 A4:8 G4:8 C5:16 D5:16 B4b1:16 D5:16 C5:4',
    'r:4 B4b1:8 D5:8 D5:4 C5:8 B4b1:8',
    'C5:8 B4b1:8 A4:8 G4:8 E5:8. D5:16 D5:4',
    'r:4 B4b1:8 C5:8 D5:4 D5:4',
    'D5:4 C5:8 B4b1:8 C5:16 D5:16 B4b1:16 D5:16 C5:4',
    'C5:8. B4b1:16 A4:4 B4b1:8 D5:4.',
    'C5:16 B4b1:16 A4:4 B4b1:16 C5:16 C5:16 B4b1:16 A4:16 G4:16 A4:4',
  ].join(' | '),
  soz: [
    ['', 'Ya', 'Rab', 'bi', 'aş'],
    ['kın', 'ver', '', 'ba', '', 'na'],
    ['hu', '', 'di', 'ye', 'yim'],
    ['dö', '', 'ne', '', 'dö', '', 'ne'],
    ['', 'A', 'şık', 'o', 'la'],
    ['yım', 'ben', '', 'sa', '', '', '', 'na'],
    ['hu', '', 'di', 'ye', 'yim'],
    ['dö', '', 'ne', '', '', 'dö', '', '', '', 'ne'],
    ['', 'Ko', 'ma', 'hiç', 'ben'],
    ['li', 'ğim', '', 'ben', '', 'den'],
    ['', 'var', 'lı', 'ğım', 'yok', ''],
    ['ey', '', 'le', '', 'sen', '', 'de'],
    ['', 'Se', 'ni', 'gö', 'rüp'],
    ['her', 'me', '', 'kan', '', '', '', 'da'],
    ['hu', '', 'di', 'ye', 'yim'],
    ['dö', '', 'ne', '', '', 'dö', '', '', '', 'ne'],
    ['', 'Sen', 'den', 'gay', 'rı'],
    ['sın', 'al', '', 'ben', '', '', '', 'den'],
    ['', 'a', 'yır', 'ma', 'ben', ''],
    ['ku', '', 'lun', '', 'sen', '', 'den'],
    ['', 'Sev', 'dir', 'ba', 'na'],
    ['se', 'ni', '', 'can', '', '', '', 'dan'],
    ['', 'hu', '', 'di', 'ye', 'yim'],
    ['dö', '', 'ne', '', '', 'dö', '', '', '', 'ne'],
    ['', 'Gön', 'lüm', 'de', 'ağ'],
    ['yar', 'kal', '', 'ma', '', '', '', 'sın'],
    ['', 'sen', 'den', 'gay', 'rı', ''],
    ['yar', '', 'kal', '', 'ma', '', 'sın'],
    ['', 'Nol', 'du', 'ğun', 'kim'],
    ['se', 'bil', '', 'me', '', '', '', 'sin'],
    ['hu', '', 'di', 'ye', 'yim'],
    ['dö', '', 'ne', '', '', 'dö', '', '', '', 'ne'],
  ],
}

export default parca
