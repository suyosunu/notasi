import { S2, s4 } from './nota'
import type { Ders } from './types'

// Seviye 2 usul dersleri: giriş, Nim Sofyan, Semâî, Sofyan (araştırma notu, Seviye 2: "Nîm sofyan → Semâî → Sofyan",
// S1 5. sınıf, S2 9.4, S4 d13, S12; kaynaklarda bu sırada tam uzlaşı var). Vuruş kalıpları ve zamanlar content/usuller.ts
// ile aynıdır (dersler.test.ts bunu denetler). Düm kalın ve güçlü, tek ince ve hafif; te ve ke tek'in hafif bölünüşüdür.
// BELİRSİZ: düm ve tek'in hangi elle vurulduğu neyzenim.com Ney Dersleri 13'te ve tr.wikipedia Usul maddesinde yazmadığı için
// derslerde hiçbir el bilgisi verilmez; "dizlerine vurarak" denir (Global Constraints, kaynakla doğrulama).
// Usul bloğunun ▶ Dinle düğmesi bir ölçüyü ♩ = 60'ta iki kez çalar (DersView).

const S1 =
  'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü (1.–8. sınıf, 2025): https://tymm.meb.gov.tr/assets/pdf/muzik-bireysel-calgi-egitimi-ney.pdf'
const WIKI_USUL = 'tr.wikipedia.org, Usul maddesi (usul tablosu)'

const DINLE_HIZI =
  "▶ Dinle ölçüyü iki kez çalar. Hızı ♩ = 60'tır: her zaman 1 sn sürer. Bu hız bir öneridir; usul bölümünde değiştirebilirsin."

export const USUL_DERSLERI: Ders[] = [
  {
    id: 'usul:giris',
    seviye: 2,
    baslik: 'Usul nedir?',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Usul, tekrarlanan vuruş kalıbıdır. Müziğe düzen verir: ezgi, usulün üstüne oturur. Bu yüzden usule ölçünün iskeleti denir.',
      },
      {
        tur: 'metin',
        metin: 'Usulde iki çeşit vuruş vardır. Düm kalın ve güçlü vuruştur. Tek ince ve hafif vuruştur. Aşağıdaki şemada düm koyu, tek açık renkli.',
      },
      {
        tur: 'usul',
        usulId: 'nim-sofyan',
        aciklama: 'Nim Sofyan: düm, tek. Kutuların genişliği vuruşun süresini gösterir. Bu kalıp ölçü ölçü tekrarlanır.',
      },
      {
        tur: 'metin',
        metin: 'Bazı usullerde te ve ke de vardır. Te ve ke, tek vuruşunun hafif bölünüşüdür: iki hafif vuruş art arda gelir. Şemada tek ile aynı renktedirler.',
      },
      {
        tur: 'usul',
        usulId: 'sofyan',
        aciklama: 'Sofyan: düm, te, ke. Düm iki zaman sürer; te ve ke birer zamandır.',
      },
      {
        tur: 'metin',
        metin: 'Usulü dizlerine vurarak çalışırsın. Düm\'ü güçlü, tek\'i hafif vur; ikisinin sesi farklı olsun.',
      },
      {
        tur: 'metin',
        metin: 'Bu bölümde üç usulü sırayla öğreneceksin.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Nim Sofyan: 2 zamanlı, ilk usul.',
          'Semâî: 3 zamanlı.',
          'Sofyan: 4 zamanlı.',
        ],
      },
      {
        tur: 'metin',
        metin: 'Kaynaklar bu sırada uzlaşıyor: kısadan uzuna gidilir.',
      },
      {
        tur: 'metin',
        metin: 'Usul bölümünde bir usul seçince 👏 Vurarak çalış bağlantısı çıkar. Orada ekrana dokunarak usulü kendin vurursun. Önce dinle ve say, sonra vur.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Düm ve tek\'i sesli söyle: düm, tek, düm, tek. Düm\'ü güçlü, tek\'i hafif söyle.',
          'Şemadaki ▶ Dinle ile Nim Sofyan\'ı dinle; çalarken sen de say.',
          'Dizlerine vurarak dene: düm güçlü, tek hafif.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(13), WIKI_USUL],
    alistirma: '/usul',
  },
  {
    id: 'usul:nim-sofyan',
    seviye: 2,
    baslik: 'Nim Sofyan',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Nim Sofyan, öğreneceğin ilk usuldür. İki zamanlıdır. Bir ölçüde iki vuruş vardır: düm, tek.',
      },
      {
        tur: 'usul',
        usulId: 'nim-sofyan',
        aciklama: `Nim Sofyan 2/4: düm, tek. ${DINLE_HIZI}`,
      },
      {
        tur: 'metin',
        metin: 'Nim Sofyan\'ın 2/8 ve 2/4 olmak üzere iki mertebesi vardır. Uygulamada 2/4 kullanılır: her zaman bir dörtlüktür.',
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir, iki". Düm "bir"e, tek "iki"ye düşer. Ölçü bitince başa dön; düm yine "bir" olur.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-tek): "bir, iki" derken düm\'ü güçlü, tek\'i hafif söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et.',
          'Sonra Vurarak çalış alıştırmasına geç.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(13), WIKI_USUL],
    alistirma: '/usul',
  },
  {
    id: 'usul:semai',
    seviye: 2,
    baslik: 'Semâî',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Semâî üç zamanlıdır, yani 3/4\'lüktür. Bir ölçüde üç vuruş vardır: düm, tek, tek.',
      },
      {
        tur: 'usul',
        usulId: 'semai',
        aciklama: `Semâî 3/4: düm, tek, tek. ${DINLE_HIZI}`,
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir, iki, üç". Düm "bir"e düşer; iki tek, "iki" ile "üç"tür. Ölçü bitince başa dön ve yine düm ile başla.',
      },
      {
        tur: 'metin',
        metin: 'Nim Sofyan\'dan farkı bir tek vuruş fazlasıdır. İlk vuruşun güçlü olduğunu hep hatırla: ölçü hep düm ile başlar.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-tek-tek): düm\'ü güçlü, iki tek\'i hafif söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et.',
          'Sonra Vurarak çalış alıştırmasına geç.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(13), WIKI_USUL],
    alistirma: '/usul',
  },
  {
    id: 'usul:sofyan',
    seviye: 2,
    baslik: 'Sofyan',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Sofyan dört zamanlıdır, yani 4/4\'lüktür. Vuruşları: düm (2 zaman), te, ke.',
      },
      {
        tur: 'usul',
        usulId: 'sofyan',
        aciklama: `Sofyan 4/4: düm, te, ke. ${DINLE_HIZI}`,
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir, iki, üç, dört". Düm iki zaman sürer; "bir" ile "iki"yi birlikte uzat. Te üçüncü zamana, ke dördüncü zamana düşer.',
      },
      {
        tur: 'metin',
        metin: 'Te ve ke tek vuruşunun hafif bölünüşüdür. Onları düm\'den çok daha hafif vur ve düm\'ün uzunluğunu kısaltma.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-te-ke): "bir, iki" derken düm\'ü uzat, sonra "üç, dört" ile te ve ke\'yi hafif söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et.',
          'Sonra Vurarak çalış alıştırmasına geç.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(13), WIKI_USUL],
    alistirma: '/usul',
  },
]
