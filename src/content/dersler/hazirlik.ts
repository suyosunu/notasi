import type { Ders } from './types'

// Seviye 0 (hazırlık) dersleri. Bilgiler yalnızca araştırma notundan
// (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md, S1–S13), ney-perdeler.ts'teki şemalardan
// ve genel nota bilgisinden gelir. Sayısal hedefler "öneri" diye anılır.
// `/hazirlik/nefes` ve `/hazirlik/baspare` rotaları Task 38'de gelir; o iki ders şimdilik alıştırmasızdır.
// `s0:durus` alıştırmasını ('/yolum') Task 40 ekler.

const S1 = 'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü (1–8): https://tymm.meb.gov.tr/assets/pdf/muzik-bireysel-calgi-egitimi-ney.pdf'
const S2 =
  'S2 MEB, Çalgı Eğitimi Ney Dersi Öğretim Programı (GSL 9–12, 2022): https://mufredat.meb.gov.tr/Dosyalar/2024118143640484-2022%20%C3%87ALGI%20E%C4%9E%C4%B0T%C4%B0M%C4%B0%20NEY.pdf'
const s4 = (n: number) => `S4 neyzenim.com, Zeki Sözen, Ney Dersleri ${n}: https://www.neyzenim.com/neydersleri_${n}.html`
const S5 = 'S5 Mehmet Yücel, Ney Metodu: https://www.neyzen.com/ney_metodu.html'
const S13 = 'S13 M. N. Uygun, "Ney", TDV İslâm Ansiklopedisi: https://islamansiklopedisi.org.tr/ney'

export const HAZIRLIK_DERSLERI: Ders[] = [
  {
    id: 's0:neyi-tani',
    seviye: 0,
    baslik: 'Neyi tanı',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Ney, kamıştan yapılan ve üflenerek çalınan bir çalgıdır. Önce neyinin bölümlerini tanı; derslerde bu adları sık duyacaksın.',
      },
      { tur: 'gorsel', ad: 'ney-bolumleri', aciklama: 'Neyin bölümleri.' },
      {
        tur: 'liste',
        maddeler: [
          'Başpâre: neyin üst ucuna takılan ağızlıktır. Dudağını buna yaslayıp üflersin.',
          'Parazvane: kamışın iki ucuna geçirilen metal halkalardır.',
          'Boğumlar: kamışın doğal eklem yerleridir; gövde boyunca sıralanırlar.',
          'Ön delikler: neyin önünde altı delik vardır. Yukarıdan aşağıya adları nevâ, nîm hicâz, çârgâh, segâh, kürdî ve dügâhtır.',
          'Aşîrân deliği: neyin arkasındaki tek deliktir. Onu üstteki elinin başparmağıyla kapatırsın.',
        ],
      },
      {
        tur: 'metin',
        metin: 'Neyler farklı boylarda yapılır ve her boy başka bir yükseklikte ses verir. Neyin ses yüksekliğine ahenk denir. Her ney boyunun bir ahengi vardır: Kız, Mansur, Şah, Davud, Bolâhenk gibi.',
      },
      {
        tur: 'metin',
        metin: 'Ney notası, ahenk ne olursa olsun aynı yazılır. Porte, notaların yazıldığı beş yatay çizgidir. Nevâ, portenin alttan 4. çizgisindeki Re notasıdır.',
      },
      {
        tur: 'metin',
        metin: 'Parmak yerleri ve okuduğun nota ahenk ne olursa olsun aynıdır; yalnız neyinden duyduğun ses değişir.',
      },
      {
        tur: 'metin',
        metin: "Notası neyinin ahengini Ayarlar'daki 'Ney ahengi' seçeneğinden bilir; başlangıçta Kız seçilidir. Neyin başka bir ahenkteyse oradan değiştir. Kalibrasyon da sesine bakıp ahengi önerir.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Neyini eline al ve başpâreyi bul.',
          'İki uçtaki parazvaneleri bul.',
          'Parmağını gövde boyunca gezdir; boğumları hisset.',
          'Ön yüzdeki altı deliği yukarıdan aşağıya say.',
          'Neyi çevir ve arkadaki aşîrân deliğini bul.',
        ],
      },
    ],
    kaynaklar: [S13, s4(11), S2, S5],
  },
  {
    id: 's0:durus',
    seviye: 0,
    baslik: 'Duruş ve tutuş',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Doğru duruş, nefesinin rahat akmasını ve parmaklarının delikleri tam kapatmasını sağlar. Mehmet Yücel, ilk üç ayda kazanılan alışkanlıkların ömür boyu sürdüğünü söyler. Bu yüzden en baştan doğru başla.',
      },
      { tur: 'metin', metin: 'Dik ve rahat otur. Sırtın dik, omuzların gevşek olsun.' },
      {
        tur: 'metin',
        metin: "Neyi sağ el üstte tut: sağ elin başpâreye yakın, sol elin aşağıda olsun. Sol el üstte tutuş da doğru kabul edilir; ama Notası'ndaki parmak şemaları sağ el üstte çizilir.",
      },
      { tur: 'gorsel', ad: 'el-yerlesimi', aciklama: 'Hangi parmak hangi deliği kapatır (sağ el üstte).' },
      {
        tur: 'metin',
        metin: 'Sağ başparmağın arkadaki aşîrân deliğini kapatır. Sağ elinin işaret, orta ve yüzük parmakları üstteki üç deliğe; sol elinin işaret, orta ve yüzük parmakları alttaki üç deliğe gelir.',
      },
      {
        tur: 'metin',
        metin: 'Delikleri parmak uçlarınla değil, parmaklarının orta bölümüyle kapat.',
      },
      { tur: 'metin', metin: 'Delik tam kapanmalı. Küçük bir aralıktan kaçan hava bile sesi bozar.' },
      { tur: 'metin', metin: 'Üflerken başını hafifçe sağa yatır.' },
      {
        tur: 'dene',
        adimlar: [
          'Aynanın karşısına otur; sırtının dik, omuzlarının gevşek olduğunu kontrol et.',
          'Neyi sağ el üstte tut ve parmaklarını şemadaki gibi yerleştir.',
          'Delikleri parmaklarının orta bölümüyle kapat; parmaklarını kaldırıp yeniden koy.',
          'Başını hafifçe sağa yatır ve aynada duruşuna bak.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(1), s4(2), S5],
  },
  {
    id: 's0:nefes',
    seviye: 0,
    baslik: 'Nefes',
    bloklar: [
      {
        tur: 'metin',
        metin: "Neyde sesin gücü nefesinden gelir. MEB'in lise ney programı en uygun nefesin diyafram nefesi olduğunu söyler.",
      },
      {
        tur: 'metin',
        metin: 'Diyafram, göğsü karından ayıran geniş kastır. Diyaframla nefes aldığında karnın öne doğru şişer, omuzların kalkmaz.',
      },
      {
        tur: 'metin',
        metin: 'Nefesini denetlemeyi 4-4-4 çalışmasıyla öğrenirsin: 4 saniye nefes al, 4 saniye tut, 4 saniye ver.',
      },
      { tur: 'gorsel', ad: 'nefes-444', aciklama: '4-4-4 nefes çalışması.' },
      {
        tur: 'metin',
        metin: "Mehmet Yücel nefesi üç devreye ayırır. Devre, nefesin gücüne göre ayrılan bölümdür: sıcak, ılık ve soğuk nefes. Bunu elinin üstüne üfleyerek hissedersin. Nevâ ve ilk öğreneceğin sesler ılık nefesle, orta güçte çıkar.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Bir elini karnına, öbürünü göğsüne koy.',
          '4 saniye nefes al: karnındaki el öne gelsin, göğsündeki el pek oynamasın.',
          '4 saniye tut, sonra 4 saniye boyunca yavaşça ver.',
          'Birkaç kez tekrarla; omuzlarının kalkmadığını kontrol et.',
          'Elinin üstüne üfle; sıcak, ılık ve soğuk nefesin farkını hisset.',
        ],
      },
    ],
    kaynaklar: [S1, S2, S5],
  },
  {
    id: 's0:ilk-ses',
    seviye: 0,
    baslik: 'Dudak ve ilk ses',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Neyde ses dudağının biçimiyle oluşur. Dudaklarını "u" der gibi ya da ıslık çalar gibi topla; ortada küçük, yuvarlak bir açıklık kalsın. Mehmet Yücel bu açıklığı aynada, yaklaşık 3 mm olacak biçimde kontrol etmeyi önerir.',
      },
      { tur: 'metin', metin: 'Dilini geride tut; havanın önüne çıkmasın.' },
      {
        tur: 'metin',
        metin: 'Neyi eline almadan önce 5–10 dakika ıslık çal. Islık, dudağına doğru biçimi öğretir.',
      },
      {
        tur: 'metin',
        metin: 'Başpâreyi dudağına yasla ve havayı neyin ağzına 30–45 derecelik bir açıyla yönelt.',
      },
      {
        tur: 'metin',
        metin: "Perde, Türk müziğinde belli bir sesin adıdır. İlk öğreneceğin perde açık Nevâ'dır; kaynakların çoğu buradan başlar. Açık Nevâ'da ön deliklerin çoğu açıktır; kapalı Nevâ'yı ileride göreceksin.",
      },
      {
        tur: 'parmak',
        perdeId: 'neva',
        aciklama: 'Açık Nevâ: arkada başparmak kapalı; iki elin orta parmağı yalnızca neyi tutmak için kapalı, öteki ön delikler açık.',
      },
      {
        tur: 'metin',
        metin: "Nevâ'yı nefesin bitene kadar aynı güçte, dalgalanmadan üfle. Buna düz ses denir.",
      },
      {
        tur: 'metin',
        metin: "Bu aşamada melodi, ilahi ya da tiz ses deneme. Tiz, ince ve yüksek ses demektir. Önce tek bir sesin oturması gerekir; Mehmet Yücel Nevâ'ya ortalama bir hafta çalışmayı önerir.",
      },
      {
        tur: 'metin',
        metin: 'İlk denemelerde ses çıkmayabilir; bu çok normaldir. Kısa aralar vererek sabırla tekrar dene.',
      },
      {
        tur: 'metin',
        metin: 'Akşam çalışmasındaki "İlk ses" adımında Notası belli bir perde aramaz. Sesin birkaç saniye kararlı kalırsa denemen geçer.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Aynaya bak, dudaklarını "u" biçimine getir ve 5–10 dakika ıslık çal.',
          'Neyi tut ve parmaklarını Nevâ şemasındaki gibi yerleştir.',
          'Başpâreyi dudağına yasla; havayı 30–45 derece açıyla, ılık bir nefesle üfle.',
          'Ses çıkınca nefesin bitene kadar aynı güçte sürdür.',
        ],
      },
    ],
    kaynaklar: [S1, s4(1), S5],
    alistirma: '/aksam',
  },
  {
    id: 's0:baspare',
    seviye: 0,
    baslik: 'Başpâreyi koy, çek',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Her çalışta başpâreyi dudağına yeniden koyarsın. Ses ancak dudağın doğru yerde ve doğru açıdaysa çıkar. Bu çalışma o yeri ezberletir.',
      },
      {
        tur: 'metin',
        metin: "Mehmet Yücel'in ölçütü şudur: başpâreyi 10–15 kez dudağından çekip yeniden koy. Nevâ her seferinde aramadan, hemen çıkıyorsa öteki perdelere geçmeye hazırsın.",
      },
      {
        tur: 'metin',
        metin: 'Aramak, sesi bulmak için dudağını ve neyin açısını oynatmaktır. Amacın, neyi koyar koymaz sesin gelmesidir.',
      },
      { tur: 'parmak', perdeId: 'neva', aciklama: 'Bu çalışmayı açık Nevâ ile yap.' },
      {
        tur: 'dene',
        adimlar: [
          "Nevâ'yı çal ve birkaç saniye tut.",
          'Neyi dudağından çek, sonra yeniden koy ve hemen üfle.',
          'Bunu 10–15 kez tekrarla.',
          'Kaç denemede sesin aramadan çıktığını say.',
        ],
      },
    ],
    kaynaklar: [S5],
  },
  {
    id: 's0:uzun-ses',
    seviye: 0,
    baslik: 'Uzun ses ve akort göstergesi',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Uzun ses, bir perdeyi aynı yükseklikte ve aynı güçte, dalgalanmadan uzun süre tutmaktır. Buna düz ses de denir. Çoğu kaynak her çalışmayı uzun sesle başlatır; Zeki Sözen başlayanlara günde 100 düz ses önerir.',
      },
      { tur: 'parmak', perdeId: 'neva', aciklama: "Uzun sesi önce Nevâ'da çalış." },
      {
        tur: 'metin',
        metin: 'Akort, sesin olması gereken yükseklikte olmasıdır. Notası mikrofonla sesini dinler ve ne kadar doğru olduğunu akort göstergesinde gösterir.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Ortada "tam" yazar: ibre buradaysa ses tam doğrudur.',
          'Sol taraf "pes"tir: ses olması gerekenden kalındır.',
          'Sağ taraf "tiz"dir: ses olması gerekenden incedir.',
          'Ortadaki yeşil bant toleranstır. Tolerans, sesin doğru sayılması için izin verilen küçük sapmadır. İbre bandın içindeyse yeşil, dışındaysa kırmızı görünür.',
        ],
      },
      {
        tur: 'metin',
        metin: 'Sapma sent ile ölçülür. Sent, çok küçük bir ses aralığı birimidir; piyanodaki bir yarım ses 100 senttir. Gösterge iki yana 50 sente kadar gösterir.',
      },
      {
        tur: 'metin',
        metin: "Seviye 0 için önerimiz: Nevâ'yı en az 5 sn, ±20 sent içinde tutmak. Bu sayı bir öneridir; kaynaklar kesin süre vermez, sesi akort aletiyle doğru yükseklikte vermeni ister. Uygulamadaki yeşil bant başta biraz daha geniştir (±25 sent) ve sen ilerledikçe daralır.",
      },
      {
        tur: 'metin',
        metin: 'Perdeler neyinin ahengine göre beklenir. Bu yüzden Notası ilk perde çalışmasından önce bir kez kalibrasyon ister. Kalibrasyon, uygulamanın senin neyinin sesine göre ayarlanmasıdır.',
      },
      {
        tur: 'dene',
        adimlar: [
          "Nevâ'yı çal ve göstergeye bak.",
          'İbre bir yana kayıyorsa nefesinin gücünü ya da başpârenin açısını çok az değiştir; ibreyi ortaya getirmeye çalış.',
          'İbre yeşil banttayken sesi tut ve saniyeleri say.',
          'Önerilen hedef: 5 sn, ±20 sent.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(2), S5],
    alistirma: '/ney/neva',
  },
]
