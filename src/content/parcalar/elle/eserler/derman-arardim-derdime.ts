// 043_huseyni-derman_arardim_derdime.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Sofyân 4/4, dörtlük = 92. Anahtar: Si koma bemolü (bütün Si'ler B4b1) ve Fa diyezi (Eviç, F5#4); parçada
//   Eviç hiç kullanılmıyor. Ö4'teki iki Fa natürel işaretli (ölçü sonuna kadar), F5 yazıldı; aynı ölçüde G5 var.
//   Tekrar: PDF'te Ö5 |: ... Ö8 :| (1. volta), Ö9 2. volta ('Son', D.C.). 1. volta (PDF Ö8: B4b1:8. A4:16 G4:8 B4b1:8
//   A4:4 D5:8 D5:8, söz 'han i miş hay hay') çıkarıldı; tek geçiş Ö1–7 + 2. volta. Aşağıdaki ölçü numaraları
//   çıkarmadan sonraki sıradır (2. volta = Ö8). Ö8'de La4 dörtlük bağlı (A4:4~ A4:4). Anacrusis yok, son ölçü tam.
//   soz: notanın altındaki ilk söz satırı (1. kıta). Diğer söz satırları: Sağ u solum gözler idim / Dost yüzünü
//   görsem deyü...; Öyle sanırdım ayrıyem...; Savm u salât u hac ile... ve sayfa altında ek kıtalar; yazılmadı.
//   Beste: Meçhul; Güfte: Niyâzî-i Mısrî. Nota: Yücel Müzik, 08.04.2014.
//   Bölüm: Ö5–8 'Bürhân sorardım aslıma' perdeleri yalnız G4 A4 B4b1 C5 D5, ritmi onaltılık ve noktalı sekizlik
//   (Seviye 2). Ö1–3 de Seviye 2 ama 3 ölçü ve cümle Ö4'te ('der-man imiş') bittiği için bölüm yapılmadı.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'derman-arardim-derdime',
  title: 'Derman Arardım Derdime',
  makam: 'huseyni',
  usul: 'sofyan',
  composer: 'Bilinmiyor',
  lyricist: 'Niyâzî-i Mısrî',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/043_huseyni/derman_arardim_derdime.pdf',
  notasyon: [
    'A4:4 E5:8 E5:8 E5:4 E5:4',
    'E5:8 D5:16 E5:16 D5:8 E5:8 E5:4 r:4',
    'D5:8. C5:16 D5:8 E5:8 E5:4 E5:4',
    'E5:8 D5:16 E5:16 D5:8 E5:8 F5:16 E5:16 F5:16 G5:16 E5:8 D5:8',
    'D5:4 D5:8 D5:8 D5:4 D5:4',
    'C5:4 B4b1:8 A4:8 A4:8 B4b1:16 A4:16 G4:4',
    'A4:8. G4:16 A4:8 B4b1:8 C5:8. B4b1:16 A4:8 C5:8',
    'B4b1:8. A4:16 G4:8 B4b1:8 A4:4~ A4:4',
  ].join(' | '),
  soz: [
    ['Der', 'man', 'a', 'rar', 'dım'],
    ['der', '', '', '', 'di', 'me', ''],
    ['Der', '', 'dim', 'ba', 'na', 'der'],
    ['man', '', '', '', 'i', 'miş', '', '', '', '', ''],
    ['Bur', 'han', 'so', 'rar', 'dım'],
    ['as', '', 'lı', 'ma', '', '', ''],
    ['As', '', 'lım', 'ba', 'na', '', 'bur', ''],
    ['han', '', '', 'i', 'miş', ''],
  ],
  bolumler: [
    { id: 'burhan-sorardim-aslima', baslik: 'Bürhân sorardım aslıma', olcuAraligi: [5, 8] },
  ],
}

export default parca
