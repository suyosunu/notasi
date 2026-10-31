import type { MusicEvent } from '../../music/notation'
import { KOMA_FARKI, NEY_PERDELER } from '../ney-perdeler'
import type { NeyPerde, PerdeId } from '../ney-perdeler'
import type { Ders, DersBlok } from './types'

// Seviye 1 perde dersleri: ilk beş ses (Nevâ, Çârgâh, Segâh, Dügâh, Rast), her perdenin uzun ses alıştırmasının
// önünde bir ders. Bilgiler yalnızca araştırma notundan (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md;
// S2 9.3.1, S4 d2, S5 s.033), ney-perdeler.ts'teki doğrulanmış şemalardan ve genel nota bilgisinden gelir.
// Parmak anlatımı perdenin `tip` metniyle çelişmez; bir sonraki perde her zaman tek bir delik daha kapatır
// (dersler.test.ts bunu şemalar üzerinden denetler). Sayısal hedef (8 sn, ±20 sent) "öneri" diye anılır.
// Seviye 2 ara ses dersleri (Bûselik, Kürdî, Dik Kürdî, Nim Hicaz; S4 Ney Dersleri 5 ve 10, S2, S5 s.033) listenin sonundadır;
// onlarda bir sonraki perdenin tek delik kapatması kuralı geçerli değildir (Kürdî ve Dik Kürdî aynı parmaktır).

const S2 =
  'S2 MEB, Çalgı Eğitimi Ney Dersi Öğretim Programı (GSL 9–12, 2022): https://mufredat.meb.gov.tr/Dosyalar/2024118143640484-2022%20%C3%87ALGI%20E%C4%9E%C4%B0T%C4%B0M%C4%B0%20NEY.pdf'
export const S5 = 'S5 Mehmet Yücel, Ney Metodu: https://www.neyzen.com/ney_metodu.html'

export function perde(id: PerdeId): NeyPerde {
  const p = NEY_PERDELER.find((x) => x.id === id)
  if (!p) throw new Error(`Bilinmeyen perde: ${id}`)
  return p
}

/** Perdenin şema kaynağı (neyzenim.com Ney Dersleri <no>) künyesiyle; ders numarası adresten okunur. */
export function semaKaynagi(p: NeyPerde): string {
  const no = p.source?.match(/neydersleri_(\d+)/)?.[1] ?? '2'
  return `S4 neyzenim.com, Zeki Sözen, Ney Dersleri ${no}: ${p.source}`
}

/** Perdenin yazılı notası, birlik (♩ = 60'ta 4 sn). */
export function birlik(p: NeyPerde): MusicEvent[] {
  return [{ kind: 'note', pitch: p.written, dur: 'whole' }]
}

/** Önceki perdeden bu perdeye geçiş: iki ikilik. */
export function gecis(onceki: NeyPerde, p: NeyPerde): MusicEvent[] {
  return [
    { kind: 'note', pitch: onceki.written, dur: 'half' },
    { kind: 'note', pitch: p.written, dur: 'half' },
  ]
}

const ORTA_PARMAKLAR =
  'İki elinin orta parmağı (2. ve 5. delik) neyi tutmak için hep kapalı kalır. MEB programı bunu açık Nevâ için açıkça söyler.'

const ILIK =
  'Bu beş ses aynı nefes gücüyle çıkar: ılık, orta güçte bir nefesle. Mehmet Yücel buna ikinci devre der.'

const HAFTA = 'Mehmet Yücel her yeni sese ortalama bir hafta, hatta on gün uzun ses çalışmayı önerir.'

const HEDEF =
  "Seviye 1 için önerimiz: her perdeyi en az 8 sn, ±20 sent içinde tutmak. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Uygulama başta 5 sn'lik bir tutuşu ve ±25 sentlik bir bandı kabul eder; sen ilerledikçe süre 10 sn'ye çıkar, bant önce ±20 sente, sonra ±15 sente daralır. Öneri ±20 senttir; ±15 sent fazladan alıştırmadır."

const HEDEF_2 =
  "Seviye 2 için önerimiz: her ara sesi en az 8 sn, ±20 sent içinde tutmak; Seviye 1'deki ölçüt aynen sürer. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Uygulama süreyi ve bandı sen ilerledikçe sıkılaştırır; ±15 sent fazladan alıştırmadır."

const KADEME_2_NEFES =
  'Bu ses de ikinci kademedendir: Seviye 1\'deki gibi ılık, orta güçte nefesle çıkar. Daha sert üflersen ses yukarı kayar.'

/** Mehmet Yücel'in ikinci devre yedi sesi ve eser kuralı (S5); `belirtme`: dersin perdesi, belirtme durumunda. */
function yediSes(belirtme: string): string {
  return `Mehmet Yücel ${belirtme} ikinci devre sesler arasında sayar (Nevâ, Nim Hicaz, Çârgâh, Segâh, Kürdî, Dügâh, Rast) ve bu yedi sese 2–3 ay çalışmadan eser çalmamayı önerir.`
}

/**
 * Her dersin "Kendin dene" adımları: uzun ses, ▶ Dinle ile kulakla karşılaştırma, akort göstergesi.
 * `onceki.hareket` geçişte parmağın ne yaptığını söyler (öntanımlı: parmak eklenir); `ekAdimlar` ▶ Dinle'den sonra eklenir;
 * `nefes` uzun sesin nefes türüdür (öntanımlı ılık; 3. kademede daha sert); `ilkAdim` parmak yerleştirme adımının yerine
 * geçer (yarım delikli sesler: "deliklerin tam kapandığı" söylenemez); `hedef` son adımdaki öneri hedefidir (4. kademede
 * "5 sn, ±20 sent"): öntanımlıdan farklıysa uzun ses "nefesin bitene kadar" değil, hedef süre sayılarak tutulur.
 */
export function deneAdimlari(
  ad: { belirtme: string },
  onceki?: { ad: string; gecis: string; hareket?: string },
  ekAdimlar: string[] = [],
  nefes = 'Ilık',
  ilkAdim = 'Parmaklarını şemadaki gibi yerleştir; deliklerin tam kapandığını kontrol et.',
  hedef = '8 sn, ±20 sent',
): DersBlok {
  const tutus =
    hedef === '8 sn, ±20 sent'
      ? `${ad.belirtme} nefesin bitene kadar aynı güçte, dalgalanmadan tut.`
      : `${ad.belirtme} aynı güçte, dalgalanmadan tut ve süreyi say.`
  const adimlar = [
    ilkAdim,
    `▶ Dinle ile ${ad.belirtme} dinle.`,
    ...ekAdimlar,
    `${nefes} nefesle uzun ses çal: ${tutus}`,
    'Kendi sesini kulağınla dinlediğin sesle karşılaştır: aynı mı, daha pes mi, daha tiz mi?',
    'Akort göstergesine bak; ibreyi yeşil bantta tut ve saniyeleri say.',
  ]
  if (onceki) {
    const hareket = onceki.hareket ?? 'parmağını ekleyip'
    adimlar.splice(
      3 + ekAdimlar.length,
      0,
      `Önce ${onceki.ad} çal, sonra ${hareket} ${onceki.gecis} geç.`,
    )
  }
  adimlar.push(`Önerilen hedef: ${hedef}.`)
  return { tur: 'dene', adimlar }
}

const NEVA = perde('neva')
const CARGAH = perde('cargah')
const SEGAH = perde('segah')
const DUGAH = perde('dugah')
const RAST = perde('rast')
const BUSELIK = perde('buselik')
const KURDI = perde('kurdi')
const DIK_KURDI = perde('dik-kurdi')
const NIM_HICAZ = perde('nim-hicaz')

export const PERDE_DERSLERI: Ders[] = [
  {
    id: 'perde:neva',
    seviye: 1,
    baslik: 'Nevâ perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Seviye 1'de beş ses öğreneceksin: Nevâ, Çârgâh, Segâh, Dügâh ve Rast. MEB lise programı ve neyzenim.com bu sırayı izler. Her yeni perdede bir parmak daha eklersin ve ses bir basamak pesleşir.",
      },
      {
        tur: 'metin',
        metin: "Nevâ, ney çalmaya başlarken ilk çalınan sestir. Şimdi onu doğru yükseklikte ve uzun süre tutmayı çalışacaksın.",
      },
      {
        tur: 'parmak',
        perdeId: 'neva',
        aciklama: 'Açık Nevâ: başparmak arkada kapalı; iki elin orta parmağı kapalı, öteki ön delikler açık.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      { tur: 'porte', olaylar: birlik(NEVA), aciklama: 'Nevâ = Re: alttan 4. çizgi. Birlik, 4 vuruş.' },
      { tur: 'metin', metin: ILIK },
      {
        tur: 'metin',
        metin: 'Aynı parmakla daha sert üflersen ses yukarı kayar ve Muhayyer çıkar; onu ileride göreceksin. Şimdi ses yukarı kayarsa nefesini biraz yumuşat.',
      },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF },
      deneAdimlari({ belirtme: "Nevâ'yı" }),
    ],
    kaynaklar: [semaKaynagi(NEVA), S2, S5],
    alistirma: '/ney/neva',
  },
  {
    id: 'perde:cargah',
    seviye: 1,
    baslik: 'Çârgâh perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Çârgâh, Nevâ'dan bir basamak pes olan sestir. Nevâ duruşuna üstteki elinin işaret parmağını eklersin.",
      },
      {
        tur: 'parmak',
        perdeId: 'cargah',
        aciklama: 'Çârgâh: başparmak arkada kapalı; üstten ilk iki delik ve alttaki elin orta parmağı kapalı.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      { tur: 'porte', olaylar: birlik(CARGAH), aciklama: 'Çârgâh = Do: 3. ile 4. çizgi arasındaki aralık (3. aralık).' },
      {
        tur: 'porte',
        olaylar: gecis(NEVA, CARGAH),
        aciklama: "Nevâ'dan Çârgâh'a: Re'den bir basamak aşağı, Do'ya.",
      },
      { tur: 'metin', metin: ILIK },
      {
        tur: 'metin',
        metin: "Nevâ'daki nefesi koru. Aynı parmakla daha sert üflersen Gerdâniye çıkar; onu ileride göreceksin.",
      },
      {
        tur: 'metin',
        metin: "Mehmet Yücel'in ölçütü: yeni ses bir öncekinden yükseklik ve netlik bakımından ne kadar az zayıfsa o kadar iyi öğrenilmiştir. Çârgâh'ı Nevâ kadar net çıkarmaya çalış.",
      },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF },
      deneAdimlari({ belirtme: "Çârgâh'ı" }, { ad: "Nevâ'yı", gecis: "Çârgâh'a" }),
    ],
    kaynaklar: [semaKaynagi(CARGAH), S2, S5],
    alistirma: '/ney/cargah',
  },
  {
    id: 'perde:segah',
    seviye: 1,
    baslik: 'Segâh perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Segâh, Çârgâh'tan bir basamak pes olan sestir. Çârgâh duruşuna üstteki elinin yüzük parmağını eklersin; böylece üstteki elin üç parmağı da kapalı olur.",
      },
      {
        tur: 'parmak',
        perdeId: 'segah',
        aciklama: 'Segâh: başparmak arkada kapalı; üstten ilk üç delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      {
        tur: 'porte',
        olaylar: birlik(SEGAH),
        aciklama: "Segâh: 3. çizgideki Si, önünde koma bemolü.",
      },
      {
        tur: 'metin',
        metin: "Segâh, Si'nin biraz pestidir. Notada Si'nin önündeki koma bemolü bu küçük farkı gösterir. Akort göstergesinde ibre ortadayken Segâh'ın doğru yerindesin.",
      },
      {
        tur: 'porte',
        olaylar: gecis(CARGAH, SEGAH),
        aciklama: "Çârgâh'tan Segâh'a: Do'dan bir basamak aşağı, koma bemollü Si'ye.",
      },
      { tur: 'metin', metin: ILIK },
      {
        tur: 'metin',
        metin: 'Aynı parmakla daha sert üflersen Eviç çıkar; onu ileride göreceksin.',
      },
      {
        tur: 'metin',
        metin: "Segâh'ı Çârgâh ile karşılaştır: yükseklikte ve netlikte ondan belirgin zayıf olmamalı (Mehmet Yücel'in ölçütü).",
      },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF },
      deneAdimlari({ belirtme: "Segâh'ı" }, { ad: "Çârgâh'ı", gecis: "Segâh'a" }),
    ],
    kaynaklar: [semaKaynagi(SEGAH), S2, S5],
    alistirma: '/ney/segah',
  },
  {
    id: 'perde:dugah',
    seviye: 1,
    baslik: 'Dügâh perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Dügâh, Segâh'tan bir basamak pes olan sestir. Segâh duruşuna alttaki elinin işaret parmağını eklersin; yalnızca en alttaki delik açık kalır.",
      },
      {
        tur: 'parmak',
        perdeId: 'dugah',
        aciklama: 'Dügâh: yalnızca en alttaki delik açık; başparmak ve öteki beş ön delik kapalı.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      { tur: 'porte', olaylar: birlik(DUGAH), aciklama: 'Dügâh = La: 2. ile 3. çizgi arasındaki aralık (2. aralık).' },
      {
        tur: 'porte',
        olaylar: gecis(SEGAH, DUGAH),
        aciklama: "Segâh'tan Dügâh'a: koma bemollü Si'den bir basamak aşağı, La'ya.",
      },
      { tur: 'metin', metin: ILIK },
      {
        tur: 'metin',
        metin: "Aynı parmakla daha sert üflersen ses bir beşli yukarı çıkar ve Hüseynî olur; onu ileride göreceksin. Şimdi ılık nefesle Dügâh'ı ara.",
      },
      {
        tur: 'metin',
        metin: "Kapalı delik arttıkça küçük bir hava kaçağı bile sesi bozar. Ses çıkmazsa önce parmaklarını kontrol et.",
      },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF },
      deneAdimlari({ belirtme: "Dügâh'ı" }, { ad: "Segâh'ı", gecis: "Dügâh'a" }),
    ],
    kaynaklar: [semaKaynagi(DUGAH), S2, S5],
    alistirma: '/ney/dugah',
  },
  {
    id: 'perde:rast',
    seviye: 1,
    baslik: 'Rast perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Rast, beş sesin en pesidir. Dügâh duruşuna alttaki elinin yüzük parmağını eklersin; böylece bütün delikler kapanır.",
      },
      {
        tur: 'parmak',
        perdeId: 'rast',
        aciklama: 'Rast: bütün delikler kapalı. Hava kaçarsa ses çıkmaz.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      {
        tur: 'porte',
        olaylar: birlik(RAST),
        aciklama: 'Rast = Sol: alttan 2. çizgi, sol anahtarının başladığı çizgi.',
      },
      {
        tur: 'porte',
        olaylar: gecis(DUGAH, RAST),
        aciklama: "Dügâh'tan Rast'a: La'dan bir basamak aşağı, Sol'e.",
      },
      { tur: 'metin', metin: ILIK },
      {
        tur: 'metin',
        metin: 'Bütün delikler kapalı olduğu için en küçük kaçak bile sesi bozar. Ses çıkmazsa parmaklarını tek tek kaldırıp yeniden, tam kapatarak koy.',
      },
      {
        tur: 'metin',
        metin: "Zeki Sözen (neyzenim.com, Ders 2) şöyle der: \"Sol sesini çıkartmadan 3. derse geçmeyiniz\". Sol, Rast sesidir; Rast'ı gür ve sağlam çıkarmayı hedefle.",
      },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF },
      deneAdimlari({ belirtme: "Rast'ı" }, { ad: "Dügâh'ı", gecis: "Rast'a" }),
    ],
    kaynaklar: [semaKaynagi(RAST), S2, S5],
    alistirma: '/ney/rast',
  },
  // Seviye 2: ara sesler. Sıra nota konularının açılma sırasını izler (perde-3: Bûselik, Kürdî, Dik Kürdî; perde-4: Nim Hicaz).
  // Şema ve parmak anlatımı ney-perdeler.ts'teki `tip` metinleriyle aynıdır. Nim Hicaz'da üstteki elin orta parmağı,
  // Kürdî ve Dik Kürdî'de alttaki elin orta parmağı açıktır; bu yüzden Seviye 1'deki "orta parmaklar hep kapalı"
  // cümlesi (ORTA_PARMAKLAR) yalnız Bûselik dersinde tekrarlanır.
  {
    id: 'perde:buselik',
    seviye: 2,
    baslik: 'Bûselik perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 2'de dört ara ses öğreneceksin: Bûselik, Kürdî, Dik Kürdî ve Nim Hicaz. Seviyenin sonunda üçüncü kademenin ilk sesi Hüseynî'yi de çalacaksın. Ara sesler iki ana sesin arasında kalan seslerdir; aralarındaki farklar komayla ölçülür. Önce Bûselik gelir.",
      },
      {
        tur: 'metin',
        metin:
          "Bûselik işaretsiz Si'dir. Segâh, Si'nin 1 koma pesiydi; Bûselik tam Si'dir, yani Segâh'tan 1 koma tizdir. Segâh duruşunu biliyorsun; yalnız üçüncü deliği yarım açacaksın.",
      },
      {
        tur: 'parmak',
        perdeId: 'buselik',
        aciklama:
          'Bûselik: Segâh duruşunda üçüncü delik yarım açık (üstteki elin yüzük parmağı yarım). Başparmak arkada kapalı; ilk iki delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı.',
      },
      { tur: 'metin', metin: ORTA_PARMAKLAR },
      {
        tur: 'porte',
        olaylar: birlik(BUSELIK),
        aciklama: 'Bûselik = Si: 3. çizgi, önünde işaret yok. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(SEGAH, BUSELIK),
        aciklama: "Segâh'tan Bûselik'e: aynı çizgi, yalnız koma bemolü kalkar. Ses 1 koma yükselir.",
      },
      {
        tur: 'metin',
        metin: `Yarım deliğin ne kadar açılacağını kural değil, kulağın söyler: ▶ Dinle ile Bûselik'i dinle, kendi sesini onunla ve Segâh'la karşılaştır. Yarım delik sesi Segâh'tan 1 koma yukarı çıkarır; ince ayarda ${KOMA_FARKI}`,
      },
      { tur: 'metin', metin: KADEME_2_NEFES },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF_2 },
      deneAdimlari(
        { belirtme: "Bûselik'i" },
        { ad: "Segâh'ı", gecis: "Bûselik'e", hareket: 'üçüncü deliği yarım açıp' },
      ),
    ],
    kaynaklar: [semaKaynagi(BUSELIK), S2, S5],
    alistirma: '/ney/buselik',
  },
  {
    id: 'perde:kurdi',
    seviye: 2,
    baslik: 'Kürdî perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Kürdî, Si küçük mücenneb bemolüdür: Si'nin 5 koma pesi. Portede Bûselik ile aynı yerdedir (3. çizgi), yalnız önünde düz bemol vardır. Dügâh'tan (La) 4 koma tizdir.",
      },
      {
        tur: 'parmak',
        perdeId: 'kurdi',
        aciklama:
          'Kürdî: başparmak arkada kapalı; üstten ilk dört delik kapalı, alttaki iki delik açık. Dügâh duruşunda alttaki elin orta parmağı kalkar.',
      },
      {
        tur: 'metin',
        metin:
          "Dikkat: Seviye 1'de iki elin orta parmağı hep kapalıydı. Kürdî'de alttaki elin orta parmağı açıktır; Dügâh'tan tek farkı budur.",
      },
      {
        tur: 'porte',
        olaylar: birlik(KURDI),
        aciklama: 'Kürdî = Si küçük mücenneb bemolü: 3. çizgi, önünde düz bemol. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(DUGAH, KURDI),
        aciklama: "Dügâh'tan Kürdî'ye: La'dan Si küçük mücenneb bemolüne, 4 koma yukarı.",
      },
      {
        tur: 'metin',
        metin: `Kürdî ile Dik Kürdî aynı parmakla çalınır. Aralarında yalnız 1 koma var: Dik Kürdî, Kürdî'den 1 koma tizdir. Parmak değişmediği için bu küçük farkı kulağınla yakalarsın; ${KOMA_FARKI}`,
      },
      {
        tur: 'porte',
        olaylar: gecis(KURDI, DIK_KURDI),
        aciklama: 'Kürdî, sonra Dik Kürdî. ▶ Dinle ile art arda dinle: ikisi de aynı parmakla çalınır, fark 1 komadır.',
      },
      { tur: 'metin', metin: KADEME_2_NEFES },
      {
        tur: 'metin',
        metin: 'Aynı parmakla daha sert üflersen Acem çıkar; onu ileride göreceksin. Şimdi nefesi ılık tut.',
      },
      { tur: 'metin', metin: yediSes("Kürdî'yi") },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF_2 },
      deneAdimlari(
        { belirtme: "Kürdî'yi" },
        { ad: "Dügâh'ı", gecis: "Kürdî'ye", hareket: 'alttaki elin orta parmağını kaldırıp' },
        ["Sonra ▶ Dinle ile önce Kürdî'yi, ardından Dik Kürdî'yi dinle; 1 komalık farkı duy."],
      ),
    ],
    kaynaklar: [semaKaynagi(KURDI), S2, S5],
    alistirma: '/ney/kurdi',
  },
  {
    id: 'perde:dik-kurdi',
    seviye: 2,
    baslik: 'Dik Kürdî perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Dik Kürdî, Si bakiye bemolüdür: Si'nin 4 koma pesi. Kürdî'den 1 koma tizdir; adındaki \"dik\" bunu anlatır. Dügâh'tan (La) 5 koma tizdir.",
      },
      {
        tur: 'parmak',
        perdeId: 'dik-kurdi',
        aciklama:
          'Dik Kürdî: Kürdî ile aynı parmak. Başparmak arkada kapalı; üstten ilk dört delik kapalı, alttaki iki delik açık.',
      },
      {
        tur: 'metin',
        metin: `Kürdî ve Dik Kürdî aynı parmakla çalınır; parmağını Kürdî'ye göre hiç değiştirmezsin. Fark 1 komadır: ${KOMA_FARKI} Kulağınla ayarla.`,
      },
      {
        tur: 'porte',
        olaylar: birlik(DIK_KURDI),
        aciklama: 'Dik Kürdî = Si bakiye bemolü: 3. çizgi, önünde bakiye bemolü. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(KURDI, DIK_KURDI),
        aciklama:
          "Kürdî'den Dik Kürdî'ye: aynı çizgi, aynı parmak. Yalnız bemolün işareti değişir, ses 1 koma yükselir. ▶ Dinle ile art arda dinle.",
      },
      { tur: 'metin', metin: KADEME_2_NEFES },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF_2 },
      deneAdimlari(
        { belirtme: "Dik Kürdî'yi" },
        { ad: "Kürdî'yi", gecis: "Dik Kürdî'ye", hareket: 'parmaklarını değiştirmeden, dudak ve baş açısıyla' },
        ["Sonra ▶ Dinle ile önce Kürdî'yi, ardından Dik Kürdî'yi dinle; ikisi aynı parmakla çalınır."],
      ),
    ],
    kaynaklar: [semaKaynagi(DIK_KURDI), S2, S5],
    alistirma: '/ney/dik-kurdi',
  },
  {
    id: 'perde:nim-hicaz',
    seviye: 2,
    baslik: 'Nim Hicaz perdesi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Nim Hicaz, Do bakiye diyezidir: Çârgâh'tan 4 koma tizdir. \"Nim\" yarım demektir; Nim Hicaz, Hicaz'dan 1 koma pestir. Hicaz dörtlüsünde de çalarsın: Dügâh, Dik Kürdî, Nim Hicaz, Nevâ.",
      },
      {
        tur: 'parmak',
        perdeId: 'nim-hicaz',
        aciklama:
          'Nim Hicaz: başparmak arkada kapalı; yalnız ilk delik ve alttaki elin orta parmağı kapalı, öteki ön delikler açık. Çârgâh duruşunda üstteki elin orta parmağı kalkar.',
      },
      {
        tur: 'metin',
        metin:
          "Dikkat: Çârgâh'ta üstteki elin işaret ve orta parmağı kapalıydı. Nim Hicaz'da orta parmak kalkar, yalnız işaret parmağı kapalı kalır.",
      },
      {
        tur: 'porte',
        olaylar: birlik(NIM_HICAZ),
        aciklama:
          'Nim Hicaz = Do bakiye diyezi: Çârgâh ile aynı aralıkta (3. aralık), önünde bakiye diyezi. Birlik, 4 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: gecis(CARGAH, NIM_HICAZ),
        aciklama: "Çârgâh'tan Nim Hicaz'a: aynı aralık, önüne bakiye diyezi gelir. Ses 4 koma yükselir.",
      },
      {
        tur: 'metin',
        metin: `Parmak sesi yaklaştırır; son ayarı kulağın yapar. ▶ Dinle ile Nim Hicaz'ı dinle, kendi sesini onunla ve Çârgâh'la karşılaştır. İnce ayarda ${KOMA_FARKI}`,
      },
      { tur: 'metin', metin: KADEME_2_NEFES },
      { tur: 'metin', metin: yediSes("Nim Hicaz'ı") },
      { tur: 'metin', metin: HAFTA },
      { tur: 'metin', metin: HEDEF_2 },
      deneAdimlari(
        { belirtme: "Nim Hicaz'ı" },
        { ad: "Çârgâh'ı", gecis: "Nim Hicaz'a", hareket: 'üstteki elin orta parmağını kaldırıp' },
      ),
    ],
    kaynaklar: [semaKaynagi(NIM_HICAZ), S2, S5],
    alistirma: '/ney/nim-hicaz',
  },
]
