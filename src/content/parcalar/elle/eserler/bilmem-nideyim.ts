// bilmem_nideyim_askin_elinden_ney.pdf (neyzen.com), elle yazıldı 2026-10-31. Çarpmalar ve yaylar (legato) yazılmadı.
// Notlar: Anahtarda Si koma bemolü (bütün Si'ler B4b1). Tekrar: PDF'te Ö1-3'ten sonra 1. hane (Ö4, 'hay hay' kısmı) ve
//   2. hane (Ö5) var; 1. hane bitişi (Ö4) çıkarıldı: tekrar açılmadığı için tek geçiş 1–3 + 2. bitiş. Aşağıdaki
//   ölçü numaraları çıkarmadan sonraki sıradır (2. bitiş = Ö4, sonunda çift çizgi). Ö13 |: ... Ö16 :| (salavat kısmı
//   tekrarlı). Ö16 sonunda D.C. (Fine işareti yok). Ö8'de Re5 çarpması yazılmadı. Ö12'de La4 dörtlük bağlı
//   (A4:4~ A4:4). Notanın altındaki ikinci söz satırı son kıtadır (Yunus'un sözü...). Diğer kıtalar: Meskenim dağlar /
//   Gözyaşım çağlar / Durmaz kan ağlar / Aşkın elinden; Kaddim yay oldu / Bağrım nay oldu / İşim zay oldu / Aşkın
//   elinden; Dinle zarımı / Kodum arımı / Verdim serimi / Aşkın elinden; Varım vereyim / Kedre ereyim / Üryan olayım /
//   Aşkın elinden. Tashih: Furkan Necipoğlu; nota: Yücel Müzik, 19.01.2018; Sofyân, dörtlük = 96.
// Belirsiz: Ö16 sonu D.C.: Fine (bitiş) işareti yok; D.C. sonrası nerede bitileceği PDF'te belirtilmemiş (muhtemelen
//   Ö12 'Aşkın elinden' kadansı veya salavat sonrası).
// Belirsiz: Ö8: ikinci C5'in önündeki çarpma (Re5) yazılmadı; çarpmanın altındaki küçük 'v' biçimli işaretin anlamı
//   (mordan/süsleme?) belirsiz.
// Belirsiz: Söz: notanın altındaki ikinci söz satırı (Yunus'un sözü / Köz olmuş özü / Kan ağlar gözü) son kıtadır;
//   ilk kıta yazıldı. Ö4'teki 'den' 2. dönüşün hecesidir.
import type { ElleParca } from '../tur'

const parca: ElleParca = {
  id: 'bilmem-nideyim',
  title: 'Bilmem Nideyim Aşkın Elinden',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Hâfız Mehmet Nezih Tolan',
  lyricist: 'Yunus Emre',
  kaynak: 'https://www.neyzen.com/nota_arsivi/01_ilahiler/096_ussak/bilmem_nideyim_askin_elinden_ney.pdf',
  notasyon: [
    'G4:4 C5:4 B4b1:4 G4:4',
    'A4:4 A4:8 A4:8 A4:4 B4b1:4',
    'G4:4 C5:4 B4b1:4 A4:8 G4:8',
    'A4:8 B4b1:8 C5:8 D5:8 E5:4 E5:4',
    'F5:4 F5:4 F5:4 F5:8 E5:8',
    'F5:8 E5:8 F5:8 G5:8 E5:4 D5:4',
    'D5:4 D5:4 D5:4 D5:4',
    'D5:8 C5:8 D5:8 E5:8 C5:8 C5:8 B4b1:8 A4:8',
    'F5:4 F5:4 F5:4 F5:8 E5:8',
    'F5:8 E5:8 F5:8 G5:8 E5:4 D5:4',
    'C5:4 C5:4 C5:8 B4b1:8 A4:8 G4:8',
    'A4:4~ A4:4 r:4 r:4',
    'G4:4 C5:4 B4b1:4. G4:8',
    'A4:8 A4:4 G4:8 D5:4 D5:4',
    'G4:4 C5:4 B4b1:4. G4:8',
    'A4:8 A4:4 A4:8 D5:4 A4:4',
  ].join(' | '),
  soz: [
    ['Bil', 'mem', 'ni', 'de'],
    ['yim', 'Al', 'lah', 'Al', 'lah'],
    ['Aş', 'kın', 'e', 'lin', ''],
    ['den', '', '', '', '', ''],
    ['Kan', 'de', 'gi', 'de', ''],
    ['yim', '', '', '', '', ''],
    ['Aş', 'kın', 'e', 'lin'],
    ['den', '', '', '', '', '', '', ''],
    ['Kan', 'de', 'gi', 'de', ''],
    ['yim', '', '', '', '', ''],
    ['Aş', 'kın', 'e', '', 'lin', ''],
    ['den', '', '', ''],
    ['Sal', 'lal', 'la', 'hu'],
    ['a', 'lâ', 'mu', 'ham', 'med'],
    ['Sal', 'lal', 'la', 'hu'],
    ['a', 'ley', 'ke', 'ah', 'med'],
  ],
}

export default parca
