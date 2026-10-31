import type { DurationKind, MusicEvent, NoteEvent } from '../../music/notation'
import { meb, n, S2, S3, s4, S6, sus } from './nota'
import type { Ders } from './types'

// Seviye 2 okuma dersleri (ve Seviye 1'in ölçü dersi). Bilgiler yalnızca araştırma notundan
// (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md; "Seviye 1", "Seviye 2"; S3 2 ve 4, S4 d3–6, d9,
// d10, d15, S6 h3) ve genel nota bilgisinden gelir. İşaret adları ACCIDENTAL_NAMES ile, perde adları PERDE_ADLARI
// ile aynı yazılır; işaretlerin şekli uygulamanın çizimiyle (notation/glyphs.tsx) aynı anlatılır.
// `nota:<konu>` dersleri gündüz kapısında konunun önüne konur; `okuma:` dersleri bir konuya bağlı değildir.

/** Nota olayına isteğe bağlı işaret ekler (üçleme, bağ, uzatma bağı, nefes). */
function ile(key: string, dur: DurationKind, ek: Pick<NoteEvent, 'uclu' | 'bag' | 'tie' | 'nefes'>): MusicEvent {
  return { ...n(key, dur), ...ek }
}

/** Üç sekizlik üçleme: bir vuruş. */
function uclu(a: string, b: string, c: string): MusicEvent[] {
  return [a, b, c].map((k) => ile(k, 'eighth', { uclu: true }))
}

const SI = 'B4'

export const NOTA_2_DERSLERI: Ders[] = [
  {
    id: 'nota:koma-1',
    seviye: 2,
    baslik: 'Koma işaretleri: bemoller',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Notanın önüne konan küçük işaretler sesi biraz değiştirir. Diyez sesi tizleştirir, yani inceltir. Bemol sesi pesleştirir, yani kalınlaştırır. İşaret, notanın hemen solunda, notayla aynı çizgide ya da aralıkta durur.',
      },
      {
        tur: 'metin',
        metin: 'Batı müziğinde bir tam ses iki yarım sese bölünür. Türk müziğinde tam ses daha ince bölünür: bir tam ses 9 komadır. Koma, bu bölmedeki en küçük parçadır. Her işaret, sesi kaç koma değiştirdiğini söyler.',
      },
      {
        tur: 'metin',
        metin: 'Bu derste dört bemolü göreceksin. Hepsi Si üzerinde; işaretlerin şekline dikkatle bak.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Si koma bemolü: 1 koma pes. Şekli ters dönmüş bir bemoldür; göbeği sola bakar. Segâh perdesinden tanıyorsun.',
          'Si bakiye bemolü: 4 koma pes. Bemolün gövdesini bir eğik çizgi keser.',
          'Si küçük mücenneb bemolü: 5 koma pes. Şekli düz bemoldür, küçük bir b harfine benzer.',
          'Si büyük mücenneb bemolü: 8 koma pes, neredeyse bir tam ses. Bemolün gövdesini iki eğik çizgi keser.',
        ],
      },
      { tur: 'porte', olaylar: [n('B4b1')], aciklama: 'Si koma bemolü: 1 koma. Segâh.' },
      { tur: 'porte', olaylar: [n('B4b4')], aciklama: 'Si bakiye bemolü: 4 koma. Gövdede bir eğik çizgi.' },
      { tur: 'porte', olaylar: [n('B4b5')], aciklama: 'Si küçük mücenneb bemolü: 5 koma. Düz bemol.' },
      { tur: 'porte', olaylar: [n('B4b8')], aciklama: 'Si büyük mücenneb bemolü: 8 koma. Gövdede iki eğik çizgi.' },
      {
        tur: 'porte',
        olaylar: [n(SI), n('B4b1'), n('B4b4'), n('B4b5'), n('B4b8')],
        aciklama: "İşaretsiz Si'den başlayıp her adımda daha pes: 1, 4, 5 ve 8 koma.",
      },
      {
        tur: 'metin',
        metin: 'Uygulamada en sık 1, 4 ve 5 komalık işaretler kullanılır. Bakiye ve küçük mücenneb bemollerini yeni perdelerde göreceksin: Si bakiye bemolü Dik Kürdî, Si küçük mücenneb bemolü Kürdî perdesidir.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Tek notalı dört portede işaretin adını sesli söyle; sonra açıklamaya bakıp kontrol et.',
          'Şekilleri ayır: ters bemol koma, düz bemol küçük mücenneb, bir eğik çizgi bakiye, iki eğik çizgi büyük mücenneb.',
          "Son portede ▶ Dinle ile dinle; Si'nin her adımda biraz daha kalınlaştığını duy.",
        ],
      },
    ],
    kaynaklar: [S3, s4(5), s4(6), S6],
    alistirma: '/nota/koma-1',
  },
  {
    id: 'nota:koma-2',
    seviye: 2,
    baslik: 'Koma işaretleri: diyezler',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Diyezler de bemoller gibi koma sayısıyla adlandırılır: 1, 4, 5 ve 8 koma. Bu kez ses tizleşir. Bu derste dört diyezi Do üzerinde göreceksin.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Do koma diyezi: 1 koma tiz. Tek gövde, iki çubuk.',
          'Do bakiye diyezi: 4 koma tiz. Bildiğin diyez işareti: iki gövde, iki çubuk.',
          'Do küçük mücenneb diyezi: 5 koma tiz. Tek gövde, üç çubuk; ortadaki çubuk uzun.',
          'Do büyük mücenneb diyezi: 8 koma tiz. İki gövde, üç çubuk; ortadaki çubuk uzun.',
        ],
      },
      { tur: 'porte', olaylar: [n('C5#1')], aciklama: 'Do koma diyezi: 1 koma. Tek gövde, iki çubuk.' },
      { tur: 'porte', olaylar: [n('C5#4')], aciklama: 'Do bakiye diyezi: 4 koma. İki gövde, iki çubuk.' },
      { tur: 'porte', olaylar: [n('C5#5')], aciklama: 'Do küçük mücenneb diyezi: 5 koma. Tek gövde, üç çubuk.' },
      { tur: 'porte', olaylar: [n('C5#8')], aciklama: 'Do büyük mücenneb diyezi: 8 koma. İki gövde, üç çubuk.' },
      {
        tur: 'porte',
        olaylar: [n('C5'), n('C5#1'), n('C5#4'), n('C5#5'), n('C5#8')],
        aciklama: "İşaretsiz Do'dan başlayıp her adımda daha tiz: 1, 4, 5 ve 8 koma.",
      },
      {
        tur: 'metin',
        metin: 'Ayırmanın kolay yolu: iki çubuk varsa koma ya da bakiye, üç çubuk varsa mücenneb diyezidir. Tek gövde azını gösterir: koma (1) ya da küçük mücenneb (5). İki gövde çoğunu gösterir: bakiye (4) ya da büyük mücenneb (8).',
      },
      {
        tur: 'metin',
        metin: 'Natürel işareti, notadaki diyezi ya da bemolü kaldırır. Natürel işaretli nota işaretsiz okunur: Do natürel, düz Do demektir.',
      },
      {
        tur: 'metin',
        metin: 'Kaynaklarda iki büyük aralık daha anılır: 9 komalık tanini, yani bir tam ses, ve 12–13 komalık artık ikili. Bu ikisini şimdilik yalnız adıyla bil; sorularda çıkmaz.',
      },
      {
        tur: 'metin',
        metin: 'Do bakiye diyezi Nim Hicaz, Do küçük mücenneb diyezi Hicaz perdesidir. Bunları perde adları konusunda göreceksin.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Tek notalı dört portede işaretin adını sesli söyle; önce çubukları, sonra gövdeleri say.',
          'Bir önceki dersin bemolleriyle karşılaştır: bemol pesleştirir, diyez tizleştirir.',
          "Son portede ▶ Dinle ile dinle; Do'nun her adımda biraz daha inceldiğini duy.",
        ],
      },
    ],
    kaynaklar: [S3, s4(5), S6],
    alistirma: '/nota/koma-2',
  },
  {
    id: 'nota:perde-3',
    seviye: 2,
    baslik: 'Perdeler: Bûselik, Kürdî, Dik Kürdî',
    bloklar: [
      {
        tur: 'metin',
        metin: "Segâh'ı biliyorsun: Si koma bemolü. Si'nin çevresinde başka perdeler de vardır. Hepsi portede aynı yerde, 3. çizgidedir; yalnız önlerindeki işaret farklıdır. Bu derste üçünü öğreneceksin.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Bûselik = işaretsiz Si.',
          'Kürdî = Si küçük mücenneb bemolü (5 koma pes).',
          'Dik Kürdî = Si bakiye bemolü (4 koma pes).',
        ],
      },
      { tur: 'porte', olaylar: [n('B4')], aciklama: 'Bûselik: işaretsiz Si.' },
      { tur: 'porte', olaylar: [n('B4b5')], aciklama: 'Kürdî: Si küçük mücenneb bemolü (düz bemol).' },
      { tur: 'porte', olaylar: [n('B4b4')], aciklama: 'Dik Kürdî: Si bakiye bemolü (bir eğik çizgi).' },
      {
        tur: 'metin',
        metin: "Bu dört perde tizden pese şöyle sıralanır: Bûselik, Segâh (1 koma pes), Dik Kürdî (4 koma pes), Kürdî (5 koma pes). Dik Kürdî, Kürdî'den 1 koma tizdir; adındaki \"dik\" bunu anlatır.",
      },
      {
        tur: 'porte',
        olaylar: [n('B4'), n('B4b1'), n('B4b4'), n('B4b5')],
        aciklama: 'Soldan sağa: Bûselik, Segâh, Dik Kürdî, Kürdî. Her biri bir öncekinden biraz pes.',
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b5'), n('C5'), n('B4b5'), n('A4', 'half')],
        aciklama: 'Kısa bir ezgi: Dügâh, Kürdî, Çârgâh, Kürdî, Dügâh.',
      },
      {
        tur: 'metin',
        metin: 'Sorularda bazen nota verilir, perde adını seçersin; bazen perde adı verilir, notayı seçersin. Hepsi Si olduğu için işarete bakman yeter.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Dört perdeli portede her notanın perde adını sesli söyle.',
          '▶ Dinle ile dinle; Bûselik ile Kürdî arasındaki farkı, Dik Kürdî ile Kürdî arasındaki küçük farkı duy.',
          'Gözünü porteden ayır ve ezberden say: Bûselik işaretsiz Si, Dik Kürdî bakiye bemolü, Kürdî küçük mücenneb bemolü.',
        ],
      },
    ],
    kaynaklar: [s4(9), s4(10), s4(5), S2],
    alistirma: '/nota/perde-3',
  },
  {
    id: 'nota:perde-4',
    seviye: 2,
    baslik: 'Perdeler: Nim Hicaz, Hicaz, Eviç, Hüseynî',
    bloklar: [
      {
        tur: 'metin',
        metin: "Çârgâh işaretsiz Do'dur. Do'nun biraz tizinde iki perde vardır: Nim Hicaz ve Hicaz. Bu derste bunları, Fa üzerindeki Eviç'i ve işaretsiz Mi olan Hüseynî'yi öğreneceksin.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Nim Hicaz = Do bakiye diyezi (4 koma tiz).',
          'Hicaz = Do küçük mücenneb diyezi (5 koma tiz).',
          'Eviç = Fa bakiye diyezi (5. çizgi, 4 koma tiz).',
          'Hüseynî = işaretsiz Mi (4. aralık, 4. ile 5. çizgi arası).',
        ],
      },
      { tur: 'porte', olaylar: [n('C5#4')], aciklama: 'Nim Hicaz: Do bakiye diyezi (iki gövde, iki çubuk).' },
      { tur: 'porte', olaylar: [n('C5#5')], aciklama: 'Hicaz: Do küçük mücenneb diyezi (tek gövde, üç çubuk).' },
      { tur: 'porte', olaylar: [n('F5#4')], aciklama: 'Eviç: Fa bakiye diyezi, portenin en üst çizgisinde.' },
      { tur: 'porte', olaylar: [n('E5')], aciklama: 'Hüseynî: işaretsiz Mi, 4. aralık. Önünde işaret yoktur.' },
      {
        tur: 'porte',
        olaylar: [n('C5'), n('C5#4'), n('C5#5')],
        aciklama: 'Soldan sağa: Çârgâh, Nim Hicaz, Hicaz. Her biri bir öncekinden biraz tiz.',
      },
      {
        tur: 'metin',
        metin: "Nim Hicaz ile Hicaz arasında yalnız 1 koma vardır. \"Nim\" yarım demektir; Nim Hicaz, Hicaz'dan biraz pestir.",
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b4'), n('C5#4'), n('D5', 'half')],
        aciklama: 'Dügâh, Dik Kürdî, Nim Hicaz, Nevâ: Hicaz dörtlüsü. Adı Hicaz olsa da Do yerinde Nim Hicaz çalınır.',
      },
      {
        tur: 'metin',
        metin:
          "Nim Hicaz'ı ve Hüseynî'yi bu seviyede neyle de çalacaksın. Hüseynî, Nevâ'nın (Re) hemen üstündeki Mi'dir; işaret taşımadığı için karışmaz. Eviç'i Seviye 3'te çalacaksın; şimdilik okumayı öğrenmen yeter.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Üç notalı portede her notanın perde adını sesli söyle.',
          '▶ Dinle ile dinle; Nim Hicaz ile Hicaz arasındaki küçük farkı duy.',
          "Eviç'in portedeki yerini göster: hangi çizgide, önünde hangi işaret var? Hüseynî'nin önünde işaret var mı?",
        ],
      },
    ],
    kaynaklar: [s4(5), s4(6), s4(10), S2],
    alistirma: '/nota/perde-4',
  },
  {
    id: 'nota:sure-4',
    seviye: 2,
    baslik: 'Onaltılık ve üçleme',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Onaltılık, dörtlüğün dörtte biridir: ¼ vuruş sürer. Sekizliğin de yarısıdır. İçi dolu başı ve sapı vardır; sapın ucunda iki bayrak taşır. Yan yana onaltılıklarda bayrakların yerine iki kalın kiriş kullanılır.',
      },
      { tur: 'porte', olaylar: [n(SI, 'sixteenth')], aciklama: 'Onaltılık: ¼ vuruş, iki bayrak.' },
      {
        tur: 'porte',
        olaylar: [n(SI), n(SI, 'eighth'), n(SI, 'eighth'), n(SI, 'sixteenth'), n(SI, 'sixteenth'), n(SI, 'sixteenth'), n(SI, 'sixteenth')],
        aciklama: "Aynı Si'de bir dörtlük, iki sekizlik, dört onaltılık: üç grup da 1 vuruş sürer.",
      },
      {
        tur: 'metin',
        metin: 'Onaltılık susun da bir karşılığı vardır: sekizlik susa benzer, ama tepesinde iki küçük top vardır. O da ¼ vuruş sürer.',
      },
      {
        tur: 'porte',
        olaylar: [n(SI, 'sixteenth'), sus('sixteenth'), n(SI, 'eighth'), sus('sixteenth'), n(SI, 'sixteenth'), n(SI, 'eighth')],
        aciklama: 'Onaltılık suslu iki vuruş: nota, sus, sekizlik; sus, nota, sekizlik.',
      },
      {
        tur: 'metin',
        metin: 'Bir vuruşa normalde iki sekizlik sığar. Üçlemede aynı vuruşa üç eşit sekizlik sığar. Üç nota bir kirişle bağlanır ve üstüne küçük bir "3" yazılır.',
      },
      {
        tur: 'porte',
        olaylar: [n(SI, 'eighth'), n(SI, 'eighth'), ...uclu(SI, SI, SI), n(SI, 'eighth'), n(SI, 'eighth')],
        aciklama: 'İki sekizlik, bir üçleme, iki sekizlik: her grup 1 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: [n('G4', 'sixteenth'), n('A4', 'sixteenth'), n('B4b1', 'sixteenth'), n('C5', 'sixteenth'), n('D5', 'half', true)],
        bpm: 65,
        aciklama: 'Rast, Dügâh, Segâh, Çârgâh dört onaltılıkla; sonra noktalı ikilik Nevâ.',
      },
      {
        tur: 'porte',
        olaylar: [...uclu('G4', 'A4', 'B4b1'), n('C5'), ...uclu('D5', 'C5', 'B4b1'), n('A4')],
        aciklama: 'Üçleme, dörtlük, üçleme, dörtlük: Rast, Dügâh, Segâh, Çârgâh; Nevâ, Çârgâh, Segâh, Dügâh.',
      },
      {
        tur: 'metin',
        metin: "Metronom önerisi (Zeki Sözen'in derslerinden): onaltılık alıştırmalarında ♩ = 65–70, üçlemede ♩ = 50–75. Yavaş başla; vuruş oturunca hızlan.",
      },
      {
        tur: 'dene',
        adimlar: [
          'İkinci portede vuruşu elinle tut: her vuruşta dörtlükte bir, sekizliklerde iki, onaltılıklarda dört eşit ses duyarsın.',
          'Üçleme portesini ▶ Dinle ile dinle; üçlemede üç notanın bir vuruşa eşit sığdığını duy.',
          'Üçlemeyi "üç-le-me" diye heceleyerek söyle; her hece bir nota.',
        ],
      },
    ],
    kaynaklar: [s4(3), s4(4), S6],
    alistirma: '/nota/sure-4',
  },
  {
    id: 'okuma:olcu',
    seviye: 1,
    baslik: 'Ölçü, ölçü çizgisi ve nefes işareti',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Müzik eşit uzunlukta parçalara bölünür. Her parçaya ölçü denir. Bir ölçüde hep aynı sayıda vuruş vardır.',
      },
      {
        tur: 'metin',
        metin: 'Ölçüleri dikine ince bir çizgi ayırır: ölçü çizgisi. Basılı notalarda parçanın sonunda iki çizgi yan yana durur, sağdaki kalındır: bitiş çizgisi. Uygulamadaki portelerde bitiş çizgisi tek çizgi görünür.',
      },
      {
        tur: 'metin',
        metin: 'Basılı notalarda ölçü sayısı, portenin başında anahtardan sonra kesir gibi yazılır. Üstteki sayı bir ölçüde kaç vuruş olduğunu, alttaki 4 de vuruşun dörtlük olduğunu söyler. Uygulamadaki portelerde ölçü sayısı yazılmaz; bu dersteki portelerde altlarındaki açıklamada verilir.',
      },
      {
        tur: 'liste',
        maddeler: [
          '2/4: her ölçüde iki dörtlük.',
          '3/4: her ölçüde üç dörtlük.',
          '4/4: her ölçüde dört dörtlük.',
        ],
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4b1'), n('C5'), n('D5', 'half')],
        olcuCizgileri: [1, 3],
        aciklama: '2/4: Rast, Dügâh | Segâh, Çârgâh | Nevâ (ikilik). Her ölçü 2 vuruş.',
      },
      {
        tur: 'porte',
        olaylar: [n('D5', 'half'), n('C5'), n('B4b1', 'half'), n('A4'), n('G4', 'half', true)],
        olcuCizgileri: [1, 3],
        aciklama: '3/4: her ölçü 3 vuruş. Son ölçüde tek bir noktalı ikilik.',
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b1'), n('C5'), n('D5'), n('C5', 'whole')],
        olcuCizgileri: [3],
        aciklama: '4/4: her ölçü 4 vuruş. İkinci ölçüde tek bir birlik.',
      },
      {
        tur: 'metin',
        metin: 'Türk müziğinde her usulün kendi ölçü sayısı vardır. Usulleri Seviye 2\'de öğreneceksin; ölçüyü bilmek orada işine yarayacak.',
      },
      {
        tur: 'metin',
        metin: 'Nefes işareti, notanın sağında, portenin üst kısmında duran virgüle benzer küçük bir işarettir. Nefesi orada al demektir. Nefesi, işaretten önceki notayı biraz kısaltarak alırsın; vuruşu kaçırmazsın.',
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4b1'), ile('C5', 'quarter', { nefes: true }), n('D5', 'half'), n('C5', 'half')],
        olcuCizgileri: [3],
        aciklama: 'Çârgâh\'tan sonra nefes işareti: birinci ölçünün sonunda nefes al.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Her portede ölçüleri say; her ölçüde kaç vuruş olduğunu söyle.',
          '▶ Dinle ile dinle ve her ölçünün ilk vuruşunda elinle dizine biraz daha güçlü vur.',
          'Son portede nefes işaretini göster; ezgiyi "ta" diye seslendir ve nefesi yalnız orada al.',
        ],
      },
    ],
    kaynaklar: [s4(3), s4(15), S3],
  },
  {
    id: 'okuma:ropriz',
    seviye: 2,
    baslik: 'Röpriz ve bağ',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Röpriz, bir bölümün iki kez çalınacağını gösterir. Bölümün başında kalın-ince çizgi ve iki nokta, sonunda iki nokta ve ince-kalın çizgi vardır. Sona gelince başa döner, bölümü bir kez daha çalarsın.',
      },
      {
        tur: 'metin',
        metin: 'Başta işaret yoksa parçanın en başına dönersin.',
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4b1'), n('C5'), n('D5', 'half'), n('C5', 'half')],
        olcuCizgileri: [3],
        ropriz: true,
        aciklama: 'Röprizli iki ölçü. ▶ Dinle bölümü iki kez çalar.',
      },
      {
        tur: 'metin',
        metin: 'Bağ, farklı perdelerdeki notaları birleştiren eğri bir çizgidir. Bağsız notalarda her nota dille ayrı başlar, "tu" der gibi. Bağlı notalar arasında dil vurulmaz: nefes kesilmeden akar, yalnız parmakların değişir.',
      },
      {
        tur: 'porte',
        olaylar: [ile('A4', 'quarter', { bag: true }), n('B4b1'), ile('C5', 'quarter', { bag: true }), n('D5'), n('C5', 'whole')],
        olcuCizgileri: [3],
        aciklama: 'Dügâh–Segâh ve Çârgâh–Nevâ bağlı: her çiftte ikinci notaya dil vurma.',
      },
      {
        tur: 'metin',
        metin: '▶ Dinle bağlı ve bağsız notaları aynı çalar; farkı neyde sen yaparsın.',
      },
      {
        tur: 'metin',
        metin: 'Uzatma bağı da eğri bir çizgidir, ama aynı perdedeki iki notayı birleştirir. İkinci nota yeniden çalınmaz; süresi birinciye eklenir. Ölçü çizgisini aşan uzun sesler böyle yazılır.',
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b1'), ile('C5', 'half', { tie: true }), n('C5'), n('B4b1'), n('A4', 'half')],
        olcuCizgileri: [2],
        aciklama: 'Çârgâh ikilik, uzatma bağıyla bir dörtlük daha: tek ses, 3 vuruş.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Röprizli örneği ▶ Dinle ile dinle; bölümün iki kez çaldığını say.',
          'Bağlı örneği "tu" ile seslendir: bağın başında "tu" de, bağlı notada dil vurmadan sesi sürdür.',
          'Uzatma bağlı örnekte Çârgâh\'ın kaç vuruş sürdüğünü say: bir, iki, üç.',
        ],
      },
    ],
    kaynaklar: [s4(3), s4(15)],
  },
]

// Seviye 3 okuma dersleri: üçüncü kademe perdelerinin portedeki yeri (perde-2: Acem, Gerdâniye, Muhayyer;
// perde-5: Nim Şehnaz, Nim Hisar). Bilgiler araştırma C §1'den (neyzenim _6, MEB ünite 1217, 1226, 1232), koma
// işaretleri `nota:koma-1` ve `nota:koma-2` derslerinden gelir. Perde adları PERDE_ADLARI ile aynı yazılır.
export const NOTA_3_DERSLERI: Ders[] = [
  {
    id: 'nota:perde-2',
    seviye: 3,
    baslik: 'Perde adları: Acem, Gerdâniye, Muhayyer',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Nevâ'yı (Re) ve onun üstündeki Hüseynî'yi (Mi) biliyorsun. Hüseynî'nin üstünde üç işaretsiz ana perde daha var: Fa, Sol ve La, hiçbirinin önünde işaret yok. Notaların adlarını nota derslerinden biliyorsun; bu derste onların perde adlarını öğreneceksin.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Acem = Fa (5. çizgi, portenin en üst çizgisi).',
          'Gerdâniye = Sol (5. çizginin hemen üstündeki boşluk, tiz Sol).',
          'Muhayyer = La (portenin üstündeki ilk ek çizgi, tiz La).',
        ],
      },
      { tur: 'porte', olaylar: [n('F5')], aciklama: 'Acem: Fa, 5. çizgi.' },
      { tur: 'porte', olaylar: [n('G5')], aciklama: 'Gerdâniye: tiz Sol, portenin üstündeki boşluk.' },
      { tur: 'porte', olaylar: [n('A5')], aciklama: 'Muhayyer: tiz La, üstteki ilk ek çizgi.' },
      {
        tur: 'porte',
        olaylar: [n('D5'), n('E5'), n('F5'), n('G5'), n('A5')],
        aciklama: 'Soldan sağa: Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer. Her adımda bir basamak yukarı.',
      },
      {
        tur: 'metin',
        metin:
          "Acem ile Eviç'i karıştırma: ikisi de 5. çizgidedir. Acem işaretsiz Fa'dır; Eviç, Fa'nın önünde bakiye diyezi olan sestir (Seviye 2'de öğrendin). Yani işarete bak.",
      },
      {
        tur: 'metin',
        metin:
          "Re, her zaman Nevâ'dır. Neyde Nevâ'yı iki şemayla çalabilirsin (açık ve kapalı Nevâ); portede ikisi de aynı notadır.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Her portede notanın perde adını sesli söyle: Acem, Gerdâniye, Muhayyer.',
          '▶ Dinle ile beşli porteyi dinle; her adımda sesin bir basamak yükseldiğini duy.',
          "Gözünü porteden ayır ve ezberden say: Hüseynî 4. aralıkta, Acem 5. çizgide, Gerdâniye portenin üstünde, Muhayyer ek çizgide.",
        ],
      },
    ],
    kaynaklar: [s4(6), meb(1217, 'üçüncü kademe ana sesler'), S2],
    alistirma: '/nota/perde-2',
  },
  {
    id: 'nota:perde-5',
    seviye: 3,
    baslik: 'Perdeler: Nim Şehnaz, Nim Hisar',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 3'te iki ara ses daha var: Nim Şehnaz ve Nim Hisar. İkisi de işaretli notadır; işaretleri koma derslerinden tanıyorsun.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Nim Şehnaz = Sol bakiye diyezi (4 koma tiz): portenin üstündeki boşlukta Sol, önünde bakiye diyezi.',
          'Nim Hisar = Mi küçük mücenneb bemolü (5 koma pes): 4. aralıkta Mi, önünde düz bemol.',
        ],
      },
      { tur: 'porte', olaylar: [n('G5#4')], aciklama: 'Nim Şehnaz: Sol bakiye diyezi (iki gövde, iki çubuk).' },
      { tur: 'porte', olaylar: [n('E5b5')], aciklama: 'Nim Hisar: Mi küçük mücenneb bemolü (düz bemol).' },
      {
        tur: 'porte',
        olaylar: [n('G5'), n('G5#4')],
        aciklama: 'Gerdâniye, sonra Nim Şehnaz: aynı yer, ikincisinin önünde bakiye diyezi var. Ses 4 koma yükselir.',
      },
      {
        tur: 'porte',
        olaylar: [n('E5'), n('E5b5')],
        aciklama: 'Hüseynî, sonra Nim Hisar: aynı aralık, ikincisinin önünde düz bemol var. Ses 5 koma pesleşir.',
      },
      {
        tur: 'metin',
        metin:
          "İşaretler tanıdık: Nim Şehnaz'ın işareti, Nim Hicaz'daki bakiye diyeziyle aynıdır. Nim Hisar'ın işareti, Kürdî'deki küçük mücenneb bemolüyle aynıdır. Yalnız notalar farklı: Sol ve Mi.",
      },
      {
        tur: 'dene',
        adimlar: [
          'İki tek notalı portede perde adını sesli söyle; önce notanın adını (Sol, Mi), sonra işareti söyle.',
          "İşaretlere bak: iki gövde ve iki çubuk bakiye diyezidir, düz bir b küçük mücenneb bemolüdür.",
          "▶ Dinle ile iki karşılaştırma portesini dinle; Nim Şehnaz Gerdâniye'den biraz tiz, Nim Hisar Hüseynî'den belirgin pestir.",
        ],
      },
    ],
    kaynaklar: [s4(6), meb(1226, 'üçüncü kademe ara sesler'), meb(1232, 'ikinci ve üçüncü kademe ara sesler'), S2],
    alistirma: '/nota/perde-5',
  },
]

// Seviye 4 okuma dersleri: tiz perdelerin portedeki yeri (perde-6: ek çizgilerin çevresi) ve otuzikilik (sure-5). Perde
// bilgileri araştırma D §1'den (neyzenim _8, MEB ünite 1227), "tiz" etiketleri perde-adlari.ts'ten, koma işaretleri
// `nota:koma-1` ve `nota:koma-2` derslerinden gelir. Otuzikilik genel nota bilgisidir; kaynaklarda yalnız eser notalarında
// (SymbTr) 1/32 süresi olarak geçer, bu yüzden kaynak satırı bunu açıkça söyler.
export const NOTA_4_DERSLERI: Ders[] = [
  {
    id: 'nota:perde-6',
    seviye: 4,
    baslik: 'Tiz perdeler: ek çizgilerin çevresi',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 4'te portenin üstüne çıkan dört yeni perde var: Tiz Segâh, Tiz Çârgâh, Tiz Nevâ ve Tiz Nim Hicaz. Hepsi ek çizgilerin çevresindedir. Ek çizgi, portenin dışına çizilen kısa yatay çizgidir. Muhayyer'i (tiz La) biliyorsun: o, portenin üstündeki ilk ek çizgidir. Yeni perdeler onun üstünde, ikinci ek çizgide ve çevresinde durur.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Tiz Segâh = Si koma bemolü: ilk ek çizginin (La) hemen üstündeki boşluk.',
          'Tiz Çârgâh = Do: ikinci ek çizgi.',
          'Tiz Nevâ = Re: ikinci ek çizginin hemen üstündeki boşluk.',
          'Tiz Nim Hicaz = Do bakiye diyezi: ikinci ek çizgi, önünde bakiye diyezi.',
        ],
      },
      { tur: 'porte', olaylar: [n('B5b1')], aciklama: 'Tiz Segâh: Si koma bemolü, ilk ek çizginin üstündeki boşluk.' },
      { tur: 'porte', olaylar: [n('C6')], aciklama: 'Tiz Çârgâh: Do, ikinci ek çizgi.' },
      { tur: 'porte', olaylar: [n('D6')], aciklama: 'Tiz Nevâ: Re, ikinci ek çizginin üstündeki boşluk.' },
      { tur: 'porte', olaylar: [n('C6#4')], aciklama: 'Tiz Nim Hicaz: Do bakiye diyezi, ikinci ek çizgi, önünde bakiye diyezi.' },
      {
        tur: 'porte',
        olaylar: [n('A5'), n('B5b1'), n('C6'), n('D6')],
        aciklama: 'Soldan sağa: Muhayyer, Tiz Segâh, Tiz Çârgâh, Tiz Nevâ. Her adımda bir basamak yukarı.',
      },
      {
        tur: 'metin',
        metin:
          "Tiz perde, alt eşinin tam bir oktav üstündedir. Oktav, portede yedi basamak yukarıdır ve nota adı aynı kalır: Segâh da Tiz Segâh da Si koma bemolüdür, Çârgâh da Tiz Çârgâh da Do'dur. Fark, notanın portedeki yüksekliğidir.",
      },
      {
        tur: 'porte',
        olaylar: [n('B4b1'), n('B5b1'), n('C5'), n('C6')],
        aciklama: 'Segâh ile Tiz Segâh, Çârgâh ile Tiz Çârgâh: aynı işaret, aynı ad, bir oktav arayla.',
      },
      {
        tur: 'metin',
        metin:
          'Soru kartlarında bu notalar "tiz" önekiyle yazılır, çünkü Si, Do ve Re hem porte içinde hem portenin üstünde bulunur: tiz Si (koma bemolü), tiz Do, tiz Do (bakiye diyezi), tiz Re. Sol ve La da böyledir: tiz Sol (Gerdâniye), tiz La (Muhayyer). "Tiz" yazan nota, ek çizgilerin çevresindeki nota demektir.',
      },
      {
        tur: 'metin',
        metin:
          "Tiz Nim Hicaz ile Tiz Çârgâh aynı ek çizgidedir; yalnız önündeki işaret farklıdır. Bakiye diyezi görürsen Tiz Nim Hicaz'dır; işaret yoksa Tiz Çârgâh.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Her portede notanın perde adını ve "tiz" etiketini sesli söyle; önce ek çizgiyi say, sonra işarete bak.',
          'Beşli porteyi ▶ Dinle ile dinle; her adımda sesin bir basamak yükseldiğini duy.',
          'Oktav portesinde Segâh ile Tiz Segâh\'ı karşılaştır: aynı işaret, aynı ad; yalnız yükseklik farklı.',
        ],
      },
    ],
    kaynaklar: [s4(8), meb(1227, 'dördüncü kademe ana sesler'), S2],
    alistirma: '/nota/perde-6',
  },
  {
    id: 'nota:sure-5',
    seviye: 4,
    baslik: 'Otuzikilik',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Otuzikilik, onaltılığın yarısıdır: 1/8 vuruş sürer. İçi dolu başı ve sapı vardır; sapın ucunda üç bayrak taşır. Yan yana otuzikiliklerde bayrakların yerine üç kalın kiriş kullanılır.',
      },
      { tur: 'porte', olaylar: [n(SI, 'thirtysecond')], aciklama: 'Otuzikilik: 1/8 vuruş, üç bayrak.' },
      {
        tur: 'porte',
        olaylar: [
          n(SI, 'eighth'),
          n(SI, 'sixteenth'),
          n(SI, 'sixteenth'),
          n(SI, 'thirtysecond'),
          n(SI, 'thirtysecond'),
          n(SI, 'thirtysecond'),
          n(SI, 'thirtysecond'),
        ],
        aciklama: "Aynı Si'de bir sekizlik, iki onaltılık, dört otuzikilik: üç grup da yarım vuruş sürer.",
      },
      {
        tur: 'metin',
        metin:
          'Otuzikilik susun da bir karşılığı vardır: onaltılık susa benzer, ama tepesinde iki değil üç küçük top vardır. O da 1/8 vuruş sürer.',
      },
      {
        tur: 'porte',
        olaylar: [n(SI, 'thirtysecond'), sus('thirtysecond'), n(SI, 'thirtysecond'), sus('thirtysecond'), n(SI, 'eighth')],
        aciklama: 'Otuzikilik nota, sus, nota, sus; sonra sekizlik. Toplam 1 vuruş.',
      },
      {
        tur: 'metin',
        metin:
          'Noktalı onaltılık, ¼ vuruşun yarısı kadar uzar: 3/8 vuruş sürer. Ardından gelen otuzikilik 1/8 vuruş ekler. İkisi birlikte bir sekizlik, yani yarım vuruş eder. Bu kalıp bazı eserlerde karşına çıkar.',
      },
      {
        tur: 'porte',
        olaylar: [n('B4b1', 'sixteenth', true), n('C5', 'thirtysecond'), n('B4b1', 'sixteenth', true), n('C5', 'thirtysecond')],
        aciklama: 'Noktalı onaltılık ve otuzikilik, iki kez: her çift yarım vuruş, hepsi 1 vuruş. Segâh uzun, Çârgâh kısa.',
      },
      {
        tur: 'metin',
        metin:
          'Bu kadar kısa notaları saymak zordur. Her otuzikiliği tek tek saymak yerine yarım vuruşluk gruplar olarak oku: bir sekizlik, iki onaltılık ya da dört otuzikilik aynı süreyi doldurur.',
      },
      {
        tur: 'dene',
        adimlar: [
          'İkinci portede üç grubu ▶ Dinle ile dinle; her grubun yarım vuruş sürdüğünü, dört otuzikiliğin bir sekizliğe sığdığını duy.',
          'Susla biten portede otuzikilik susu bul: tepesinde üç küçük top var; onaltılık susta iki.',
          'Noktalı onaltılık portesini dinle; uzun sesin ardından kısa sesin hemen geldiğini duy ve "uzun-kısa" diye seslendir.',
        ],
      },
    ],
    kaynaklar: [
      'Genel nota bilgisi (süre değerleri); örnek kullanım: SymbTr makam müziği notaları, 1/32 süreli notalar: https://github.com/MTG/SymbTr',
    ],
    alistirma: '/nota/sure-5',
  },
]
