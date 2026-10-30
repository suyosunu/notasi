import { S2, s4 } from './nota'
import type { Ders } from './types'

// Seviye 2 usul dersleri: giriş, Nim Sofyan, Semâî, Sofyan (araştırma notu, Seviye 2: "Nîm sofyan → Semâî → Sofyan",
// S1 5. sınıf, S2 9.4, S4 d13, S12; kaynaklarda bu sırada tam uzlaşı var). Vuruş kalıpları ve zamanlar content/usuller.ts
// ile aynıdır (dersler.test.ts bunu denetler). Düm kalın ve güçlü, tek ince ve hafif; te ve ke tek'in hafif bölünüşüdür.
// BELİRSİZ: düm ve tek'in hangi elle vurulduğu neyzenim.com Ney Dersleri 13'te ve tr.wikipedia Usul maddesinde yazmadığı için
// derslerde hiçbir el bilgisi verilmez; "dizlerine vurarak" denir (Global Constraints, kaynakla doğrulama).
// Usul bloğunun ▶ Dinle düğmesi bir ölçüyü usulün kendi biriminde 60'ta iki kez çalar (DersView): mertebe 4'te ♩ = 60,
// mertebe 8'de ♪ = 60; her zaman 1 sn sürer.
// Seviye 4 (araştırma notu D §5): Yürük Semâî (6/8 ve 6/4 tek derste), Türk Aksağı, Devr-i Hindî. Kaynaklar neyzenim _13,
// tr.wikipedia Usul tablosu ve TDV maddeleri. TDV'nin Türk Aksağı ("bir nîm-sofyanla bir semâî") ve Devr-i Hindî ("bir
// semâiye bir sofyan") tanımları ile Yürük Semâî'de 6/8 ↔ 6/4 notu kendi cümlemizle verilir.

const S1 =
  'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü (1.–8. sınıf, 2025): https://tymm.meb.gov.tr/assets/pdf/muzik-bireysel-calgi-egitimi-ney.pdf'
const WIKI_USUL = 'tr.wikipedia.org, Usul maddesi (usul tablosu)'

const TDV_TURK_AKSAGI = 'TDV İslâm Ansiklopedisi, Türk Aksağı: https://islamansiklopedisi.org.tr/turk-aksagi'
const TDV_DEVR_I_HINDI = 'TDV İslâm Ansiklopedisi, Devr-i Hindî: https://islamansiklopedisi.org.tr/devr-i-hindi'
const TDV_YURUK_SEMAI = 'TDV İslâm Ansiklopedisi, Yürük Semâî: https://islamansiklopedisi.org.tr/yuruk-semai'

const DINLE_HIZI_SEKIZLIK =
  "▶ Dinle ölçüyü iki kez çalar. Hızı ♪ = 60'tır: her zaman (bir sekizlik) 1 sn sürer. Bu hız bir öneridir; usul bölümünde değiştirebilirsin."

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
    alistirma: '/usul/vur/nim-sofyan',
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
    alistirma: '/usul/vur/semai',
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
    alistirma: '/usul/vur/sofyan',
  },
  {
    id: 'usul:yuruk-semai',
    seviye: 4,
    baslik: 'Yürük Semâî',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Yürük Semâî altı zamanlıdır. Bir ölçüde beş vuruş vardır: düm, tek, tek, düm, tek. Son tek iki zaman sürer, ötekiler birer zaman.',
      },
      {
        tur: 'usul',
        usulId: 'yuruk-semai',
        aciklama: `Yürük Semâî 6/8: düm, tek, tek, düm, tek (son tek 2 zaman). ${DINLE_HIZI_SEKIZLIK}`,
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir, iki, üç, dört, beş, altı". Düm "bir"e ve "dört"e düşer; tek\'ler "iki", "üç" ve "beş-altı"dır. İki düm ölçüyü iki gruba böler: düm-tek-tek ve düm-tek.',
      },
      {
        tur: 'metin',
        metin: 'Yürük Semâî\'nin 6/8 ve 6/4 olmak üzere iki mertebesi vardır. İkisinde de vuruş kalıbı aynıdır; yalnız zamanın değeri değişir: 6/8\'de her zaman bir sekizlik, 6/4\'te bir dörtlüktür. Vurduğun kalıp değişmez.',
      },
      {
        tur: 'usul',
        usulId: 'yuruk-semai-64',
        aciklama: 'Yürük Semâî 6/4: aynı vuruşlar. ▶ Dinle ölçüyü iki kez çalar. Hızı ♩ = 60\'tır: her zaman (bir dörtlük) 1 sn sürer. Bu hız bir öneridir; usul bölümünde değiştirebilirsin.',
      },
      {
        tur: 'metin',
        metin: 'TDV İslâm Ansiklopedisi\'ne göre "yürük semâî" adına en uygun mertebe 6/8\'dir; 6/4\'e aslında sengin semâî denir. Yine de notalarda 6/4 mertebesine de yürük semâî dendiği görülür ve bu usulün formu daha çok 6/4 olarak kullanılmıştır. Bu yüzden uygulamada iki kayıt vardır: Yürük Semâî ve Yürük Semâî (6/4). İkisini de Usul bölümünde seçip çalabilirsin.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-tek-tek-düm-tek): "bir" derken düm, "iki, üç" derken iki tek, "dört" derken düm, "beş-altı" derken son tek\'i uzun söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et; 6/8 ve 6/4 şemalarını da dinle.',
          'Sonra Vurarak çalış alıştırmasına geç. Yürük Semâî (6/4) de Usul bölümünden aynı alıştırmayla vurulur.',
        ],
      },
    ],
    kaynaklar: [s4(13), WIKI_USUL, TDV_YURUK_SEMAI],
    alistirma: '/usul/vur/yuruk-semai',
  },
  {
    id: 'usul:turk-aksagi',
    seviye: 4,
    baslik: 'Türk Aksağı',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Türk Aksağı beş zamanlı ve üç vuruşlu küçük bir usuldür; 5/8\'liktir, yani her zaman bir sekizliktir. Bir ölçüde üç vuruş vardır: düm, tek, tek. Vuruşlar eşit uzunlukta değildir: düm 2 zaman, ilk tek 2 zaman, son tek 1 zaman sürer.',
      },
      {
        tur: 'usul',
        usulId: 'turk-aksagi',
        aciklama: `Türk Aksağı 5/8: düm (2), tek (2), tek (1). ${DINLE_HIZI_SEKIZLIK}`,
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir-iki, üç-dört, beş". Düm "bir-iki"ye, ilk tek "üç-dört"e, son tek "beş"e düşer. Son vuruş kısadır; onu acele etmeden, tam bir zaman tut.',
      },
      {
        tur: 'metin',
        metin: 'TDV İslâm Ansiklopedisi usulü bir nîm-sofyanla bir semâînin birleşimi olarak anlatır: önce iki zaman, sonra üç zaman. Sen de ölçüyü böyle iki parçada düşünebilirsin: düm (2) ve tek, tek (2 + 1).',
      },
      {
        tur: 'metin',
        metin: 'Kaynaklarda 5/8 birinci mertebedir; TDV ikinci mertebesini 5/4 olarak verir. Uygulamada 5/8 kullanılır.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-tek-tek): "bir-iki" derken düm\'ü uzat, "üç-dört" derken ilk tek\'i, "beş" derken son tek\'i söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et; son tek\'in kısa olduğunu dinle.',
          'Sonra Vurarak çalış alıştırmasına geç.',
        ],
      },
    ],
    kaynaklar: [s4(13), WIKI_USUL, TDV_TURK_AKSAGI],
    alistirma: '/usul/vur/turk-aksagi',
  },
  {
    id: 'usul:devr-i-hindi',
    seviye: 4,
    baslik: 'Devr-i Hindî',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Devr-i Hindî yedi zamanlı ve beş vuruşlu küçük bir usuldür; 7/8\'liktir, yani her zaman bir sekizliktir. Vuruşları: düm (1), tek (1), tek (1), düm (2), tek (2).',
      },
      {
        tur: 'usul',
        usulId: 'devr-i-hindi',
        aciklama: `Devr-i Hindî 7/8: düm, tek, tek, düm (2), tek (2). ${DINLE_HIZI_SEKIZLIK}`,
      },
      {
        tur: 'metin',
        metin: 'Ölçüyü şöyle say: "bir, iki, üç, dört-beş, altı-yedi". Düm "bir"e ve "dört-beş"e düşer; tek\'ler "iki", "üç" ve "altı-yedi"dir.',
      },
      {
        tur: 'metin',
        metin: 'TDV İslâm Ansiklopedisi usulü bir semâîye bir sofyan eklenmesi olarak anlatır. İlk üç zaman bir semâî gibidir (düm, tek, tek), son dört zaman bir sofyan uzunluğundadır (düm 2, tek 2). Ölçüyü 3 + 4 diye düşünebilirsin.',
      },
      {
        tur: 'metin',
        metin: 'Kaynaklarda 7/8 birinci mertebedir; ikinci mertebe olarak 7/4 de geçer (ağır devr-i hindî). Uygulamada 7/8 kullanılır.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Usulü sesli say (düm-tek-tek-düm-tek): "bir" derken düm, "iki, üç" derken iki tek, "dört-beş" derken uzun düm, "altı-yedi" derken uzun tek söyle.',
          '▶ Dinle ile çalan usule dizlerine vurarak eşlik et; 3 + 4 bölünmesini dinle.',
          'Sonra Vurarak çalış alıştırmasına geç.',
        ],
      },
    ],
    kaynaklar: [s4(13), WIKI_USUL, TDV_DEVR_I_HINDI],
    alistirma: '/usul/vur/devr-i-hindi',
  },
]
