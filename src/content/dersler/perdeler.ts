import type { MusicEvent } from '../../music/notation'
import { NEY_PERDELER } from '../ney-perdeler'
import type { NeyPerde, PerdeId } from '../ney-perdeler'
import type { Ders, DersBlok } from './types'

// Seviye 1 perde dersleri: ilk beş ses (Nevâ, Çârgâh, Segâh, Dügâh, Rast), her perdenin uzun ses alıştırmasının
// önünde bir ders. Bilgiler yalnızca araştırma notundan (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md;
// S2 9.3.1, S4 d2, S5 s.033), ney-perdeler.ts'teki doğrulanmış şemalardan ve genel nota bilgisinden gelir.
// Parmak anlatımı perdenin `tip` metniyle çelişmez; bir sonraki perde her zaman tek bir delik daha kapatır
// (dersler.test.ts bunu şemalar üzerinden denetler). Sayısal hedef (8 sn, ±20 sent) "öneri" diye anılır.

const S2 =
  'S2 MEB, Çalgı Eğitimi Ney Dersi Öğretim Programı (GSL 9–12, 2022): https://mufredat.meb.gov.tr/Dosyalar/2024118143640484-2022%20%C3%87ALGI%20E%C4%9E%C4%B0T%C4%B0M%C4%B0%20NEY.pdf'
const S5 = 'S5 Mehmet Yücel, Ney Metodu: https://www.neyzen.com/ney_metodu.html'

function perde(id: PerdeId): NeyPerde {
  const p = NEY_PERDELER.find((x) => x.id === id)
  if (!p) throw new Error(`Bilinmeyen perde: ${id}`)
  return p
}

/** Perdenin şema kaynağı (neyzenim.com Ney Dersleri 2) künyesiyle. */
function semaKaynagi(p: NeyPerde): string {
  return `S4 neyzenim.com, Zeki Sözen, Ney Dersleri 2: ${p.source}`
}

/** Perdenin yazılı notası, birlik (♩ = 60'ta 4 sn). */
function birlik(p: NeyPerde): MusicEvent[] {
  return [{ kind: 'note', pitch: p.written, dur: 'whole' }]
}

/** Önceki perdeden bu perdeye geçiş: iki ikilik. */
function gecis(onceki: NeyPerde, p: NeyPerde): MusicEvent[] {
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
  "Seviye 1 için önerimiz: her perdeyi en az 8 sn, ±20 sent içinde tutmak. Bu sayı bir öneridir; kaynaklar kesin süre vermez. Uygulama başta 5 sn'lik bir tutuşu ve ±25 sentlik bir bandı kabul eder; sen ilerledikçe süre 10 sn'ye çıkar, bant ±15 sente daralır. Bunlar da önerilerdir."

/** Her dersin "Kendin dene" adımları: uzun ses, ▶ Dinle ile kulakla karşılaştırma, akort göstergesi. */
function deneAdimlari(ad: { belirtme: string }, onceki?: { ad: string; gecis: string }): DersBlok {
  const adimlar = [
    'Parmaklarını şemadaki gibi yerleştir; deliklerin tam kapandığını kontrol et.',
    `▶ Dinle ile ${ad.belirtme} dinle.`,
    `Ilık nefesle uzun ses çal: ${ad.belirtme} nefesin bitene kadar aynı güçte, dalgalanmadan tut.`,
    'Kendi sesini kulağınla dinlediğin sesle karşılaştır: aynı mı, daha pes mi, daha tiz mi?',
    'Akort göstergesine bak; ibreyi yeşil bantta tut ve saniyeleri say.',
  ]
  if (onceki) adimlar.splice(3, 0, `Önce ${onceki.ad} çal, sonra parmağını ekleyip ${onceki.gecis} geç.`)
  adimlar.push('Önerilen hedef: 8 sn, ±20 sent.')
  return { tur: 'dene', adimlar }
}

const NEVA = perde('neva')
const CARGAH = perde('cargah')
const SEGAH = perde('segah')
const DUGAH = perde('dugah')
const RAST = perde('rast')

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
        metin: "Nevâ'yı hazırlıkta ilk ses olarak çaldın. Şimdi onu doğru yükseklikte ve uzun süre tutmayı çalışacaksın.",
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
]
