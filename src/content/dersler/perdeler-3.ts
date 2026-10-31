import { KOMA_FARKI } from '../ney-perdeler'
import { S2, meb, s4 } from './nota'
import { birlik, deneAdimlari, gecis, perde, S5, semaKaynagi } from './perdeler'
import type { Ders } from './types'

// Seviye 3 perde dersleri: üçüncü kademe, yani ikinci kademedeki bir sesin parmağıyla daha sert üflenen sesler
// (Hüseynî, Acem, Gerdâniye, Muhayyer, kapalı Nevâ, Eviç, Nim Şehnaz, Nim Hisar). Bilgiler yalnızca araştırma C'nin
// §1'inden (docs/superpowers/notes/2026-10-30-asama-c-arastirma.md: neyzenim _6 ve _9, MEB Ney Modülü ünite 1216,
// 1217, 1226, 1232, beşli tablosu), 2026-10-25 araştırma notundaki S5 (s.066: üçüncü devre = soğuk nefes) ve ney-perdeler.ts'teki
// şemalardan gelir. Sıra NEY_PERDELER'deki 3. kademe sırasıdır. Her perdenin "pest eşi" aynı parmakla çalınan
// ikinci kademe sesidir ve 31 koma (bir beşli) aşağıdadır; Nim Hisar'ın pest eşi uygulamada olmadığından onun geçişi
// Hüseynî'den yapılır. Sayısal hedef (8 sn, ±20 sent) "öneri" diye anılır.
// Hüseynî üçüncü kademe sesidir ama kullanıcının hocasının pratiğine göre Seviye 2'de öğretilir (2026-10-31); dersi
// kademe kavramını anlatır, öteki üçüncü kademe dersleri Seviye 3'tedir.
// Kapalı Nevâ'nın nefes şiddeti Zeki Sözen'in sayfalarında yazılı değildir; ders bunu açıkça söyler.

const MEB_ANA = meb(1217, 'üçüncü kademe ana sesler')
const MEB_ARA = meb(1226, 'üçüncü kademe ara sesler')

const HEDEF_3 =
  "Seviye 3 için önerimiz: her perdeyi en az 8 sn, ±20 sent içinde tutmak; Seviye 1 ve 2'deki ölçüt aynen sürer. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Uygulama süreyi ve bandı sen ilerledikçe sıkılaştırır; ±15 sent fazladan alıştırmadır."

const HEDEF_HUSEYNI =
  "Seviye 2 için önerimiz: Hüseynî'yi en az 8 sn, ±20 sent içinde tutmak; Seviye 1'deki ölçüt aynen sürer. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Uygulama süreyi ve bandı sen ilerledikçe sıkılaştırır; ±15 sent fazladan alıştırmadır. Öteki üçüncü kademe seslerini Seviye 3'te çalışacaksın."

/** Üçüncü kademe sesinin nefesi; `pest`: aynı parmakla çalınan ikinci kademe sesi (ör. "Dügâh"). */
function sertNefes(pest: string): string {
  return `Parmak, ikinci kademedeki eşiyle (${pest}) aynı kalır; fark nefestedir. Bu ses üçüncü kademedendir: ikinci kademedeki gibi ılık değil, daha sert, Mehmet Yücel'in deyişiyle soğuk nefesle çıkar. Nefesi yeterince güçlendirmezsen ses ikinci kademedeki eşinde kalır.`
}

const SERT = 'Daha sert (soğuk)'

/** Beşli (31 koma) ile ikinci kademedeki eşi; Hüseynî dersinin listesi bu çiftlerden kurulur. */
const KADEME_ESLERI: { pest: string; tiz: string; parmak: string }[] = [
  { pest: 'Dügâh', tiz: 'Hüseynî', parmak: 'yalnız en alttaki delik açık' },
  { pest: 'Kürdî', tiz: 'Acem', parmak: 'alttaki iki delik açık' },
  { pest: 'Çârgâh', tiz: 'Gerdâniye', parmak: 'üstten ilk iki delik ve alttaki elin orta parmağı kapalı' },
  { pest: 'Nevâ', tiz: 'Muhayyer', parmak: 'iki elin orta parmağı kapalı, öteki ön delikler açık' },
  { pest: 'Segâh', tiz: 'Eviç', parmak: 'dördüncü ve altıncı delik açık' },
  { pest: 'Nim Hicaz', tiz: 'Nim Şehnaz', parmak: 'yalnız ilk delik ve alttaki elin orta parmağı kapalı' },
]

const DUGAH = perde('dugah')
const KURDI = perde('kurdi')
const CARGAH = perde('cargah')
const NEVA = perde('neva')
const RAST = perde('rast')
const SEGAH = perde('segah')
const NIM_HICAZ = perde('nim-hicaz')
const HUSEYNI = perde('huseyni')
const ACEM = perde('acem')
const GERDANIYE = perde('gerdaniye')
const MUHAYYER = perde('muhayyer')
const KAPALI_NEVA = perde('kapali-neva')
const EVIC = perde('evic')
const NIM_SEHNAZ = perde('nim-sehnaz')
const NIM_HISAR = perde('nim-hisar')

export const PERDE_3_DERSLERI: Ders[] = [
  {
    id: 'perde:huseyni',
    seviye: 2,
    baslik: 'Hüseynî perdesi ve kademe',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 2'nin sonunda üçüncü kademeye ilk adımı atıyorsun; kalan üçüncü kademe sesleri Seviye 3'te gelecek. Kademe, neyin ses bölgesidir: aynı parmakla nefes güçlendikçe ses bir üst kademeye çıkar. Pes sesler birinci, orta sesler ikinci, daha tiz sesler üçüncü kademedir. Şimdiye kadar çaldığın bütün sesler ikinci kademedendi ve ılık, orta güçte nefesle çıkıyordu.",
      },
      {
        tur: 'metin',
        metin:
          "Üçüncü kademe sesleri için yeni bir parmak öğrenmezsin. İkinci kademedeki bir sesin parmağını aynen tutarsın, nefesi daha sert üflersin; Mehmet Yücel buna soğuk nefes der. Ses böylece bir beşli, yani 31 koma yukarı çıkar. Rast'tan Nevâ'ya olan uzaklık da bir beşlidir.",
      },
      {
        tur: 'metin',
        metin:
          "İlk üçüncü kademe sesi Hüseynî'dir. Dügâh duruşunu biliyorsun: yalnız en alttaki delik açıktı. Aynı parmakla daha sert üflersen Hüseynî çıkar. Hüseynî, Mi'dir: 4. ile 5. çizgi arasındaki aralıkta (4. aralık).",
      },
      {
        tur: 'parmak',
        perdeId: 'huseyni',
        aciklama: 'Hüseynî: Dügâh parmağı. Başparmak arkada kapalı; yalnızca en alttaki delik açık, öteki beş ön delik kapalı.',
      },
      {
        tur: 'porte',
        olaylar: birlik(HUSEYNI),
        aciklama: 'Hüseynî = Mi: 4. aralık (4. ile 5. çizgi arası). Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(DUGAH, HUSEYNI),
        aciklama: "Dügâh'tan Hüseynî'ye: La'dan Mi'ye, bir beşli yukarı. Parmak aynı kalır, nefes sertleşir.",
      },
      { tur: 'metin', metin: sertNefes('Dügâh') },
      {
        tur: 'metin',
        metin:
          'Üçüncü kademedeki her sesin ikinci kademede aynı parmakla çalınan bir eşi vardır. Her eşte parmak aynı kalır, ses 31 koma yükselir. Bu derslerde göreceğin eşler şunlar:',
      },
      {
        tur: 'liste',
        maddeler: KADEME_ESLERI.map((e) => `${e.pest} → ${e.tiz}: ${e.parmak}.`),
      },
      {
        tur: 'metin',
        metin:
          "Listede olmayan iki ses daha var. Birincisi kapalı Nevâ: Rast parmağıyla (bütün delikler kapalı) çıkan Nevâ'dır, Rast'tan bir beşli yukarıdadır. İkincisi Nim Hisar: Hüseynî'nin biraz pesidir. İkisinin de kendi dersi var.",
      },
      { tur: 'metin', metin: HEDEF_HUSEYNI },
      deneAdimlari(
        { belirtme: "Hüseynî'yi" },
        { ad: "Dügâh'ı", gecis: "Hüseynî'ye", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(HUSEYNI), MEB_ANA, S2, S5],
    alistirma: '/ney/huseyni',
  },
  {
    id: 'perde:acem',
    seviye: 3,
    baslik: 'Acem perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Acem, Fa'dır: portenin en üst çizgisi (5. çizgi), önünde işaret yok. Kürdî duruşuyla çalınır: alttaki iki delik açıktı. Kürdî, Si küçük mücenneb bemolüdür; Acem onun bir beşli (31 koma) yukarısıdır.",
      },
      {
        tur: 'parmak',
        perdeId: 'acem',
        aciklama: 'Acem: Kürdî parmağı. Başparmak arkada kapalı; üstten ilk dört delik kapalı, alttaki iki delik açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(ACEM),
        aciklama: 'Acem = Fa: 5. çizgi, portenin en üst çizgisi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(KURDI, ACEM),
        aciklama: "Kürdî'den Acem'e: Si küçük mücenneb bemolünden Fa'ya, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Seviye 2'de Kürdî ile Dik Kürdî'nin aynı parmakla çalındığını gördün. Bu parmakla daha sert üflediğinde de Acem çıkar; kulağın Acem'i Kürdî'nin beşli üstü olarak bulur.",
      },
      {
        tur: 'metin',
        metin:
          "Acem, Fa bakiye diyezi olan Eviç ile karışmasın: ikisi de aynı çizgidedir, ama Eviç Acem'den 4 koma tizdir ve farklı parmakla çalınır. Eviç'i ileride göreceksin.",
      },
      { tur: 'metin', metin: sertNefes('Kürdî') },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Acem'i" },
        { ad: "Kürdî'yi", gecis: "Acem'e", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(ACEM), MEB_ANA, S2, S5],
    alistirma: '/ney/acem',
  },
  {
    id: 'perde:gerdaniye',
    seviye: 3,
    baslik: 'Gerdâniye perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Gerdâniye, tiz Sol'dür: portenin üstündeki boşluk, 5. çizginin hemen üstü. Çârgâh duruşuyla çalınır; Çârgâh'ın bir beşli (31 koma) yukarısıdır. Uygulamada adı \"Gerdâniye (açık)\" diye geçer; MEB programı da \"açık Gerdâniye\" der.",
      },
      {
        tur: 'parmak',
        perdeId: 'gerdaniye',
        aciklama:
          'Gerdâniye (açık): Çârgâh parmağı. Başparmak arkada kapalı; üstten ilk iki delik ve alttaki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(GERDANIYE),
        aciklama: 'Gerdâniye = tiz Sol: portenin üstündeki boşluk. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(CARGAH, GERDANIYE),
        aciklama: "Çârgâh'tan Gerdâniye'ye: Do'dan tiz Sol'e, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Zeki Sözen aynı sesi başka bir parmakla da gösterir (neyzenim.com, Ders 9). Bu uygulamada yalnız burada gösterilen açık Gerdâniye'yi çalışırsın.",
      },
      { tur: 'metin', metin: sertNefes('Çârgâh') },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Gerdâniye'yi" },
        { ad: "Çârgâh'ı", gecis: "Gerdâniye'ye", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(GERDANIYE), MEB_ANA, S2, S5],
    alistirma: '/ney/gerdaniye',
  },
  {
    id: 'perde:muhayyer',
    seviye: 3,
    baslik: 'Muhayyer perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Muhayyer, tiz La'dır: portenin üstündeki ilk ek çizgi. Açık Nevâ duruşuyla çalınır; Nevâ'nın bir beşli (31 koma) yukarısıdır. Uygulamada adı \"Muhayyer (açık)\" diye geçer. Bu uygulamadaki en tiz perdedir; MEB'e göre üçüncü kademenin sonudur.",
      },
      {
        tur: 'parmak',
        perdeId: 'muhayyer',
        aciklama:
          'Muhayyer (açık): Nevâ parmağı. Başparmak arkada kapalı; iki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(MUHAYYER),
        aciklama: 'Muhayyer = tiz La: portenin üstündeki ilk ek çizgi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(NEVA, MUHAYYER),
        aciklama: "Nevâ'dan Muhayyer'e: Re'den tiz La'ya, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Nevâ dersinde şunu görmüştün: aynı parmakla daha sert üflersen ses yukarı kayar ve Muhayyer çıkar. Şimdi bunu bilerek yaparsın. Zeki Sözen aynı sesi başka bir parmakla da gösterir (neyzenim.com, Ders 9); burada yalnız açık Muhayyer'i çalışırsın.",
      },
      { tur: 'metin', metin: sertNefes('Nevâ') },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Muhayyer'i" },
        { ad: "Nevâ'yı", gecis: "Muhayyer'e", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(MUHAYYER), MEB_ANA, S2, S5],
    alistirma: '/ney/muhayyer',
  },
  {
    id: 'perde:kapali-neva',
    seviye: 3,
    baslik: 'Kapalı Nevâ',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Nevâ'yı şimdiye kadar açık Nevâ olarak çaldın: iki elin orta parmağı kapalı, öteki ön delikler açık. Aynı sesi bütün delikleri kapatarak da çıkarabilirsin; buna kapalı Nevâ denir. Aynı yazılı notanın iki şeması vardır: açık Nevâ ve kapalı Nevâ.",
      },
      {
        tur: 'porte',
        olaylar: birlik(KAPALI_NEVA),
        aciklama: 'Nevâ = Re: alttan 4. çizgi. Açık Nevâ da kapalı Nevâ da portede aynı yerdedir. Birlik, 4 vuruş.',
      },
      {
        tur: 'parmak',
        perdeId: 'neva',
        aciklama: 'Açık Nevâ: başparmak arkada kapalı; iki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'parmak',
        perdeId: 'kapali-neva',
        aciklama: 'Kapalı Nevâ: Rast parmağı. Başparmak arkada kapalı; bütün ön delikler kapalı.',
      },
      {
        tur: 'metin',
        metin:
          "Kapalı Nevâ, Rast parmağıyla çalınır. Rast'tan bir beşli (31 koma) yukarıdadır: Rast Sol'dü, kapalı Nevâ Re'dir.",
      },
      {
        tur: 'porte',
        olaylar: gecis(RAST, KAPALI_NEVA),
        aciklama: "Rast'tan kapalı Nevâ'ya: Sol'den Re'ye, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin:
          "Nerede kullanılır: Zeki Sözen (neyzenim.com, Ders 9) Re sesinin bütün delikler kapalıyken de çıktığını yazar. Kapalı Nevâ, özellikle tizden ortaya inerken kullanılır. Bu uygulamada kapalı Nevâ, Rast–kapalı Nevâ kademe etüdünde ve Nevâ dizisi etüdünde sorulur; öteki etütlerde açık Nevâ'yı çalarsın.",
      },
      {
        tur: 'metin',
        metin:
          "Nefes şiddeti konusunda dürüst olalım: Zeki Sözen'in Ders 6 ve Ders 9 sayfalarında kapalı Nevâ için nefes şiddeti ayrıca yazılmaz. Mehmet Yücel ise kapalı Nevâ'yı üçüncü devre, yani soğuk nefesle çalınan sesler arasında sayar. Bu yüzden Rast parmağıyla Nevâ'ya çıkmak için nefesini güçlendirirsin; ne kadar güçlendireceğini kulağın ve akort göstergesi söyler.",
      },
      {
        tur: 'metin',
        metin:
          "Bütün delikler kapalı olduğu için en küçük kaçak bile sesi bozar. Ses çıkmazsa parmaklarını tek tek kaldırıp yeniden, tam kapatarak koy.",
      },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "kapalı Nevâ'yı" },
        { ad: "Rast'ı", gecis: "kapalı Nevâ'ya", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [
          "Sonra ▶ Dinle ile önce açık Nevâ'yı, ardından kapalı Nevâ'yı dinle; yazılı nota ve ses aynıdır.",
          "Açık Nevâ ile kapalı Nevâ'yı art arda çal; akort göstergesinde ikisinin de aynı yerde durduğunu gör.",
        ],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(KAPALI_NEVA), s4(9), meb(1216, 'ikinci kademe ana sesler: açık Nevâ'), S2, S5],
    alistirma: '/ney/kapali-neva',
  },
  {
    id: 'perde:evic',
    seviye: 3,
    baslik: 'Eviç perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Eviç, Fa bakiye diyezidir: Fa'dan (Acem) 4 koma tiz. Seviye 2'deki okuma dersinde portedeki yerini öğrenmiştin; şimdi çalıyorsun. Segâh duruşuyla çalınır; Segâh'ın bir beşli (31 koma) yukarısıdır.",
      },
      {
        tur: 'parmak',
        perdeId: 'evic',
        aciklama:
          'Eviç: Segâh parmağı. Başparmak arkada kapalı; üstten ilk üç delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı, en alttaki delik açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(EVIC),
        aciklama: 'Eviç = Fa bakiye diyezi: 5. çizgi, önünde bakiye diyezi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(SEGAH, EVIC),
        aciklama: "Segâh'tan Eviç'e: koma bemollü Si'den bakiye diyezli Fa'ya, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin: `Eviç, Acem'e çok yakındır ama Acem'den 4 koma tizdir; parmağı Acem'inkine değil, Segâh'ınkine benzer. Son ayarı kulağın yapar: ▶ Dinle ile Eviç'i dinle, kendi sesini onunla ve Segâh'la karşılaştır.`,
      },
      { tur: 'metin', metin: sertNefes('Segâh') },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Eviç'i" },
        { ad: "Segâh'ı", gecis: "Eviç'e", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(EVIC), MEB_ARA, S2, S5],
    alistirma: '/ney/evic',
  },
  {
    id: 'perde:nim-sehnaz',
    seviye: 3,
    baslik: 'Nim Şehnaz perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Nim Şehnaz, Sol bakiye diyezidir: tiz Sol olan Gerdâniye'den 4 koma tizdir. Nim Hicaz parmağıyla çalınır; Nim Hicaz'ın bir beşli (31 koma) yukarısıdır.",
      },
      {
        tur: 'parmak',
        perdeId: 'nim-sehnaz',
        aciklama:
          'Nim Şehnaz: Nim Hicaz parmağı. Başparmak arkada kapalı; yalnızca ilk delik ve alttaki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'porte',
        olaylar: birlik(NIM_SEHNAZ),
        aciklama: 'Nim Şehnaz = Sol bakiye diyezi: Gerdâniye ile aynı yer, portenin üstündeki boşluk, önünde bakiye diyezi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(NIM_HICAZ, NIM_SEHNAZ),
        aciklama: "Nim Hicaz'dan Nim Şehnaz'a: Do bakiye diyezinden Sol bakiye diyezine, bir beşli yukarı. Parmak aynı kalır.",
      },
      {
        tur: 'metin',
        metin: `Nim Şehnaz, Gerdâniye ile portede aynı yerdedir; aralarında 4 komalık işaret farkı vardır ve parmakları farklıdır (Gerdâniye Çârgâh parmağıyla çalınır). Son ayarı kulağın yapar: ▶ Dinle ile Nim Şehnaz'ı dinle, kendi sesini onunla ve Nim Hicaz'la karşılaştır.`,
      },
      { tur: 'metin', metin: sertNefes('Nim Hicaz') },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Nim Şehnaz'ı" },
        { ad: "Nim Hicaz'ı", gecis: "Nim Şehnaz'a", hareket: 'parmaklarını değiştirmeden, nefesi güçlendirip' },
        [],
        SERT,
      ),
    ],
    kaynaklar: [semaKaynagi(NIM_SEHNAZ), MEB_ARA, S2, S5],
    alistirma: '/ney/nim-sehnaz',
  },
  {
    id: 'perde:nim-hisar',
    seviye: 3,
    baslik: 'Nim Hisar perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Nim Hisar, Mi küçük mücenneb bemolüdür: Hüseynî'den bir koma ve bir bakiye pestir (toplam 5 koma). Nevâ'nın ise 4 koma üstündedir. Nevâ ile Hüseynî arasında, Nevâ'ya daha yakın bir sestir.",
      },
      {
        tur: 'parmak',
        perdeId: 'nim-hisar',
        aciklama:
          "Nim Hisar: Dügâh duruşu. Başparmak ve üstten ilk beş delik kapalı; alttaki elin yüzük parmağı en alttaki deliğin 3/4'ünü kapatır. Şemada bu delik yarım gösterilir; gerçekte 3/4 kapatırsın.",
      },
      {
        tur: 'metin',
        metin:
          "Parmak Hüseynî'ninkine çok benzer. Tek fark alttaki elin yüzük parmağıdır: Hüseynî'de en alttaki delik tamamen açıktı, Nim Hisar'da bu parmak deliğin 3/4'ünü kapatır. Zeki Sözen ayrıca başını hafifçe sola çevirmeni söyler; bu sesi pestleştirir.",
      },
      {
        tur: 'porte',
        olaylar: birlik(NIM_HISAR),
        aciklama: 'Nim Hisar = Mi küçük mücenneb bemolü: Hüseynî ile aynı aralık (4. aralık), önünde düz bemol. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(HUSEYNI, NIM_HISAR),
        aciklama: "Hüseynî'den Nim Hisar'a: aynı aralık, önüne düz bemol gelir. Ses 5 koma pesleşir.",
      },
      {
        tur: 'metin',
        metin: `Yarım deliğin ne kadar kapanacağını yalnız kural değil, kulağın söyler: ▶ Dinle ile Nim Hisar'ı dinle, kendi sesini onunla ve Hüseynî ile karşılaştır. İnce ayarda ${KOMA_FARKI}`,
      },
      {
        tur: 'metin',
        metin:
          "Nim Hisar da Hüseynî gibi sert nefesle çalınır.",
      },
      { tur: 'metin', metin: HEDEF_3 },
      deneAdimlari(
        { belirtme: "Nim Hisar'ı" },
        {
          ad: "Hüseynî'yi",
          gecis: "Nim Hisar'a",
          hareket: "alttaki elin yüzük parmağını deliğin 3/4'ünü kapatacak kadar yaklaştırıp, başını hafifçe sola çevirerek",
        },
        [],
        SERT,
        "Parmaklarını şemadaki gibi yerleştir: alttaki elin yüzük parmağı en alttaki deliğin 3/4'ünü örter; öteki delikler tam kapalıdır.",
      ),
    ],
    kaynaklar: [semaKaynagi(NIM_HISAR), meb(1232, 'ikinci ve üçüncü kademe ara sesler'), S2, S5],
    alistirma: '/ney/nim-hisar',
  },
]
