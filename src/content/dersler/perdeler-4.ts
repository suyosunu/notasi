import { meb, s4 } from './nota'
import { birlik, deneAdimlari, gecis, perde, semaKaynagi } from './perdeler'
import type { Ders } from './types'

// Seviye 4 perde dersleri: dördüncü kademe, yani bir alt kademedeki bir sesin parmağıyla daha da sert üflenen, bir oktav
// (53 koma) yukarıdaki sesler (Tiz Segâh, Tiz Çârgâh, Tiz Nevâ, kapalı Gerdâniye, kapalı Muhayyer, Tiz Nim Hicaz). Bilgiler
// yalnızca araştırma D'nin §1'inden (docs/superpowers/notes/2026-10-30-asama-d-arastirma.md: neyzenim _8 ve _9, MEB Ney
// Modülü ünite 1227) ve ney-perdeler.ts'teki şemalardan gelir. Sıra NEY_PERDELER'deki 4. kademe sırasıdır. Her perdenin
// "alt eşi" aynı parmakla çalınan, bir oktav aşağıdaki sestir (kapalı Gerdâniye için Rast, kapalı Muhayyer için Dügâh).
// Kapalı Gerdâniye ve kapalı Muhayyer açık olanlarla aynı yazılı notadır; kaynak bu ikisinin nefes şiddetini yazmaz, ders
// bunu açıkça söyler. Sayısal hedef (5 sn, ±20 sent) "öneri" diye anılır: Zeki Sözen uzun sesi orta ve alt perdelerde
// önerdiği için tizde süre kısa tutulur.

const MEB_TIZ = meb(1227, 'dördüncü kademe ana sesler')
const S4_TIZ = s4(8)
const S4_KAPALI = s4(9)

const HEDEF_4 =
  "Seviye 4 için önerimiz: tiz perdelerde bir sesi 5 sn, ±20 sent içinde tutmak. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Süre kısa, çünkü Zeki Sözen uzun uzun üflemeyi tizlerde değil, orta ve alt perdelerde önerir (neyzenim.com, Ders 8). Uzun ses çalışmasının ağırlığı orta ve alt perdelerde kalır; tizlerde kısa ve temiz bir tutuş yeter."

const HEDEF = '5 sn, ±20 sent'

/** Tiz sesin nefesi: neyzenim _8, "daha da sert" ve "dudak biraz büzülür". */
const TIZ_NEFES =
  'Tiz sesleri çıkarmak için nefesi daha da sert, daha şiddetli üflersin; dudağın da ister istemez biraz daha büzülür (Zeki Sözen, Ders 8). Nefesi yeterince güçlendirmezsen ses daha pes kalır.'

/** Kapalı perdelerde nefes şiddeti kaynakta yazılı değildir. `ses`: kapalı perdenin adı, ör. "kapalı Gerdâniye". */
function kapaliNefes(ses: string, ders9: string): string {
  return `Nefes şiddeti konusunda dürüst olalım. Zeki Sözen tiz sesler için daha da sert üflemeyi Ders 8'de yazar; ${ses} ise Ders 9'dadır ve orada nefes şiddeti yazılmaz, yalnız ${ders9}. Bu yüzden ne kadar sert üfleyeceğini kulağın ve akort göstergesi söyler: ses bir oktav yukarıdaki yerine oturana kadar nefesi ayarlarsın.`
}

const SEGAH = perde('segah')
const CARGAH = perde('cargah')
const NEVA = perde('neva')
const RAST = perde('rast')
const DUGAH = perde('dugah')
const NIM_HICAZ = perde('nim-hicaz')
const TIZ_SEGAH = perde('tiz-segah')
const TIZ_CARGAH = perde('tiz-cargah')
const TIZ_NEVA = perde('tiz-neva')
const KAPALI_GERDANIYE = perde('kapali-gerdaniye')
const KAPALI_MUHAYYER = perde('kapali-muhayyer')
const TIZ_NIM_HICAZ = perde('tiz-nim-hicaz')

const GUCLENDIR = 'parmaklarını değiştirmeden, nefesi daha da güçlendirip'
const AYARLA = 'parmaklarını değiştirmeden, nefesi kulağınla ayarlayıp'

export const PERDE_4_DERSLERI: Ders[] = [
  {
    id: 'perde:tiz-segah',
    seviye: 4,
    baslik: 'Tiz Segâh perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 4'te dördüncü kademeye, yani tiz perdelere geçiyorsun. Tiz perdeler için yeni bir parmak öğrenmezsin: bir alt kademedeki sesin parmağını aynen tutarsın, nefesi daha da sert üflersin ve ses bir oktav, yani 53 koma yukarı çıkar.",
      },
      {
        tur: 'metin',
        metin:
          "İlk tiz perde Tiz Segâh'tır. Segâh duruşunu biliyorsun: Si koma bemolü, 3. çizgi. Aynı parmakla daha da sert üflersen bir oktav yukarıdaki Tiz Segâh çıkar. Portede ilk ek çizgi La'dır (Muhayyer); Tiz Segâh onun hemen üstündeki boşlukta durur ve önünde koma bemolü vardır.",
      },
      {
        tur: 'parmak',
        perdeId: 'tiz-segah',
        aciklama:
          'Tiz Segâh: Segâh parmağı. Başparmak arkada kapalı; üstten ilk üç delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı, en alttaki delik açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(TIZ_SEGAH),
        aciklama: 'Tiz Segâh = tiz Si (koma bemolü): portenin üstünde, ilk ek çizginin hemen üstündeki boşluk. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(SEGAH, TIZ_SEGAH),
        aciklama: "Segâh'tan Tiz Segâh'a: Si koma bemolünden bir oktav yukarı. Parmak aynı kalır, nefes sertleşir.",
      },
      { tur: 'metin', metin: TIZ_NEFES },
      {
        tur: 'metin',
        metin:
          "Tiz Segâh, Segâh'ın tam oktavı olmalıdır. ▶ Dinle ile önce Segâh'ı, sonra Tiz Segâh'ı dinle; kendi sesini ikisiyle de karşılaştır.",
      },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "Tiz Segâh'ı" },
        { ad: "Segâh'ı", gecis: "Tiz Segâh'a", hareket: GUCLENDIR },
        [],
        'Daha da sert',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(TIZ_SEGAH)],
    alistirma: '/ney/tiz-segah',
  },
  {
    id: 'perde:tiz-cargah',
    seviye: 4,
    baslik: 'Tiz Çârgâh perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Tiz Çârgâh, tiz Do'dur: portenin üstündeki ikinci ek çizgi. Çârgâh duruşuyla çalınır; Çârgâh'ın bir oktav, yani 53 koma yukarısıdır. Parmak aynı kalır, nefes daha da sertleşir.",
      },
      {
        tur: 'parmak',
        perdeId: 'tiz-cargah',
        aciklama:
          'Tiz Çârgâh: Çârgâh parmağı. Başparmak arkada kapalı; üstten ilk iki delik kapalı, üçüncü ve dördüncü delik açık, alttaki elin orta parmağı kapalı, en alttaki delik açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(TIZ_CARGAH),
        aciklama: 'Tiz Çârgâh = tiz Do: portenin üstündeki ikinci ek çizgi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(CARGAH, TIZ_CARGAH),
        aciklama: "Çârgâh'tan Tiz Çârgâh'a: Do'dan bir oktav yukarıdaki Do'ya. Parmak aynı kalır.",
      },
      { tur: 'metin', metin: TIZ_NEFES },
      {
        tur: 'metin',
        metin:
          "Çârgâh, Seviye 3'te açık Gerdâniye olarak da çıkmıştı: aynı parmak, bir beşli yukarıda. Tiz Çârgâh o sesin daha da yukarısındadır. Bu parmakla nefesin sertleştikçe ses önce Gerdâniye'ye, sonra Tiz Çârgâh'a çıkar.",
      },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "Tiz Çârgâh'ı" },
        { ad: "Çârgâh'ı", gecis: "Tiz Çârgâh'a", hareket: GUCLENDIR },
        [],
        'Daha da sert',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(TIZ_CARGAH), MEB_TIZ],
    alistirma: '/ney/tiz-cargah',
  },
  {
    id: 'perde:tiz-neva',
    seviye: 4,
    baslik: 'Tiz Nevâ perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Tiz Nevâ, tiz Re'dir: portenin üstündeki ikinci ek çizginin hemen üstündeki boşluk. Açık Nevâ duruşuyla çalınır; Nevâ'nın bir oktav, yani 53 koma yukarısıdır. Bu uygulamadaki en tiz perdedir.",
      },
      {
        tur: 'parmak',
        perdeId: 'tiz-neva',
        aciklama:
          'Tiz Nevâ: Nevâ parmağı. Başparmak arkada kapalı; iki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(TIZ_NEVA),
        aciklama: 'Tiz Nevâ = tiz Re: ikinci ek çizginin hemen üstündeki boşluk. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(NEVA, TIZ_NEVA),
        aciklama: "Nevâ'dan Tiz Nevâ'ya: Re'den bir oktav yukarıdaki Re'ye. Parmak aynı kalır.",
      },
      { tur: 'metin', metin: TIZ_NEFES },
      {
        tur: 'metin',
        metin:
          "Zeki Sözen aynı Re'yi bütün delikler kapalı, yani Rast parmağıyla da çıkarır (neyzenim.com, Ders 9); orada da sert üflemek gerekir. Bu uygulamada yalnız burada gösterilen Nevâ parmağıyla çalışırsın.",
      },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "Tiz Nevâ'yı" },
        { ad: "Nevâ'yı", gecis: "Tiz Nevâ'ya", hareket: GUCLENDIR },
        [],
        'Daha da sert',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(TIZ_NEVA), S4_KAPALI, MEB_TIZ],
    alistirma: '/ney/tiz-neva',
  },
  {
    id: 'perde:kapali-gerdaniye',
    seviye: 4,
    baslik: 'Gerdâniye (kapalı)',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Gerdâniye'yi Seviye 3'te Çârgâh parmağıyla çalmıştın; buna açık Gerdâniye denir. Aynı sesi bütün delikleri kapatarak da çıkarabilirsin: kapalı Gerdâniye, Rast parmağıyla çalınır ve Rast'ın bir oktav, yani 53 koma yukarısındadır. Rast Sol'dü; kapalı Gerdâniye tiz Sol'dür.",
      },
      {
        tur: 'metin',
        metin:
          "Açık Gerdâniye ile kapalı Gerdâniye aynı yazılı notadır: ikisi de portenin üstündeki boşlukta, tiz Sol'dedir. Fark yalnız parmaktadır.",
      },
      {
        tur: 'parmak',
        perdeId: 'kapali-gerdaniye',
        aciklama: 'Kapalı Gerdâniye: Rast parmağı. Başparmak arkada kapalı; bütün ön delikler kapalı.',
      },
      {
        tur: 'porte',
        olaylar: birlik(KAPALI_GERDANIYE),
        aciklama: 'Gerdâniye = tiz Sol: portenin üstündeki boşluk. Açık da kapalı da portede aynı yerdedir. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(RAST, KAPALI_GERDANIYE),
        aciklama: "Rast'tan kapalı Gerdâniye'ye: Sol'den bir oktav yukarıdaki Sol'e. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Rast parmağıyla üç ses çıkar: Rast, kapalı Nevâ (Seviye 3) ve kapalı Gerdâniye; her biri bir öncekinden yüksektir. Zeki Sözen şöyle yazar: Sol sesini bütün perdeler kapalı olarak da çıkarabiliriz (Ders 9).",
      },
      { tur: 'metin', metin: kapaliNefes('kapalı Gerdâniye', 'bütün deliklerin kapalı olduğu söylenir') },
      {
        tur: 'metin',
        metin:
          "Bütün delikler kapalı olduğu için en küçük kaçak bile sesi bozar. Ses çıkmazsa parmaklarını tek tek kaldırıp yeniden, tam kapatarak koy.",
      },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "kapalı Gerdâniye'yi" },
        { ad: "Rast'ı", gecis: "kapalı Gerdâniye'ye", hareket: AYARLA },
        [
          "Sonra ▶ Dinle ile önce açık Gerdâniye'yi, ardından kapalı Gerdâniye'yi dinle; yazılı nota ve ses aynıdır.",
          "Açık Gerdâniye ile kapalı Gerdâniye'yi art arda çal; akort göstergesinde ikisinin de aynı yerde durduğunu gör.",
        ],
        'Kulağınla ayarladığın',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(KAPALI_GERDANIYE), S4_TIZ],
    alistirma: '/ney/kapali-gerdaniye',
  },
  {
    id: 'perde:kapali-muhayyer',
    seviye: 4,
    baslik: 'Muhayyer (kapalı)',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Muhayyer'i Seviye 3'te Nevâ parmağıyla çalmıştın; buna açık Muhayyer denir. Aynı sesi, yalnız en alttaki delik açıkken de çıkarabilirsin: kapalı Muhayyer, Dügâh parmağıyla çalınır ve Dügâh'ın bir oktav, yani 53 koma yukarısındadır. Dügâh La'ydı; kapalı Muhayyer tiz La'dır.",
      },
      {
        tur: 'metin',
        metin:
          "Açık Muhayyer ile kapalı Muhayyer aynı yazılı notadır: ikisi de portenin üstündeki ilk ek çizgide, tiz La'dadır. Fark yalnız parmaktadır.",
      },
      {
        tur: 'parmak',
        perdeId: 'kapali-muhayyer',
        aciklama: 'Kapalı Muhayyer: Dügâh parmağı. Başparmak arkada kapalı; yalnızca en alttaki delik açık, öteki beş ön delik kapalı.',
      },
      {
        tur: 'porte',
        olaylar: birlik(KAPALI_MUHAYYER),
        aciklama: 'Muhayyer = tiz La: portenin üstündeki ilk ek çizgi. Açık da kapalı da portede aynı yerdedir. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(DUGAH, KAPALI_MUHAYYER),
        aciklama: "Dügâh'tan kapalı Muhayyer'e: La'dan bir oktav yukarıdaki La'ya. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Dügâh parmağıyla üç ses çıkar: Dügâh, Hüseynî (Seviye 3) ve kapalı Muhayyer; her biri bir öncekinden yüksektir. Zeki Sözen bu sesi için bütün parmakların kapalı, yalnız sol yüzük parmağının açık olduğunu yazar (Ders 9).",
      },
      { tur: 'metin', metin: kapaliNefes('kapalı Muhayyer', 'parmak durumu verilir') },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "kapalı Muhayyer'i" },
        { ad: "Dügâh'ı", gecis: "kapalı Muhayyer'e", hareket: AYARLA },
        [
          "Sonra ▶ Dinle ile önce açık Muhayyer'i, ardından kapalı Muhayyer'i dinle; yazılı nota ve ses aynıdır.",
          "Açık Muhayyer ile kapalı Muhayyer'i art arda çal; akort göstergesinde ikisinin de aynı yerde durduğunu gör.",
        ],
        'Kulağınla ayarladığın',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(KAPALI_MUHAYYER), S4_TIZ],
    alistirma: '/ney/kapali-muhayyer',
  },
  {
    id: 'perde:tiz-nim-hicaz',
    seviye: 4,
    baslik: 'Tiz Nim Hicaz perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Tiz Nim Hicaz, tiz Do bakiye diyezidir: portenin üstündeki ikinci ek çizgide, önünde bakiye diyezi. Nim Hicaz duruşuyla çalınır; Nim Hicaz'ın bir oktav, yani 53 koma yukarısıdır. Parmak aynı kalır, nefes daha da sertleşir.",
      },
      {
        tur: 'parmak',
        perdeId: 'tiz-nim-hicaz',
        aciklama:
          'Tiz Nim Hicaz: Nim Hicaz parmağı. Başparmak arkada kapalı; yalnızca ilk delik ve alttaki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(TIZ_NIM_HICAZ),
        aciklama: 'Tiz Nim Hicaz = tiz Do bakiye diyezi: ikinci ek çizgi, önünde bakiye diyezi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(NIM_HICAZ, TIZ_NIM_HICAZ),
        aciklama: "Nim Hicaz'dan Tiz Nim Hicaz'a: Do bakiye diyezinden bir oktav yukarıdaki Do bakiye diyezine. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Bu parmakla Seviye 3'te Nim Şehnaz'ı çalmıştın: aynı parmak, bir beşli yukarıda. Tiz Nim Hicaz daha da yukarıdadır. Tiz Çârgâh ile portede aynı ek çizgide durur; farkı önündeki bakiye diyezi yapar, ses Tiz Çârgâh'tan 4 koma tizdir.",
      },
      {
        tur: 'metin',
        metin:
          "Bu ses MEB'in dördüncü kademe ana sesleri arasında yoktur (ünite 1227); yalnız Zeki Sözen'in Ders 8 sayfasında anılır.",
      },
      { tur: 'metin', metin: TIZ_NEFES },
      { tur: 'metin', metin: HEDEF_4 },
      deneAdimlari(
        { belirtme: "Tiz Nim Hicaz'ı" },
        { ad: "Nim Hicaz'ı", gecis: "Tiz Nim Hicaz'a", hareket: GUCLENDIR },
        [],
        'Daha da sert',
        undefined,
        HEDEF,
      ),
    ],
    kaynaklar: [semaKaynagi(TIZ_NIM_HICAZ)],
    alistirma: '/ney/tiz-nim-hicaz',
  },
]
