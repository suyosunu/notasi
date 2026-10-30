# Aşama D (Seviye 4) araştırması: tiz perdeler, dil teknikleri, Bayâtî / Hüseynî / Muhayyer / Kürdî, çeşni ve üçlüler, usuller, eserler

Tarih: 2026-10-30. Yalnızca araştırma; depo kodu değiştirilmedi. Kaynağı açılamayan ya da doğrulanamayan her şey **BELİRSİZ** diye işaretlendi. Kısa alıntılar 15 sözcüğü geçmez. "Kendi çıkarımım / önerim" denen yerler kaynak değildir.

## Yöntem

- **Sayfalar** `curl` ile indirilip düz metne çevrilerek okundu (yalnızca araştırma geçici klasöründe; depoya yazılmadı). Açılan sayfalar:
  - neyzenim: `https://www.neyzenim.com/neydersleri_8.html` (tiz sesler), `_9` (aynı sesleri farklı pozisyondan çıkartma), `_10` (makamlar: Bûselik, Bayâtî, Uşşak, Hüseynî, Muhayyer, Hicaz …), `_13` (usuller), `_15` (nüans, bağ, legato); ayrıca `_1`–`_7`, `_11`, `_12`, `_14` dil tekniği için tarandı (ilgili metin yalnız `_15`te var). Fotoğraflar (GIF) açılmadı; metindeki parmak listeleri esas alındı.
  - MEB Ney Modülü (`https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/<no>`): 1216–1236 hepsi indirildi; kullanılanlar 1227 (4. kademe ana sesler), 1229 (dil teknikleri), 1228 (Uşşak), 1231 (Hüseynî, Hicaz).
  - MEB Türk Müziği Teori ve Uygulaması (`https://tymm.meb.gov.tr/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi/unite/<no>`): 1108–1120 indirildi; kullanılanlar 1113 (üçlüler), 1115 (çeşni).
  - TDV İslâm Ansiklopedisi: `https://islamansiklopedisi.org.tr/` + `bayati--musiki`, `huseyni`, `muhayyer`, `kurdi`, `ussak`, `hicaz-2`, `makam--musiki`, `turk-aksagi`, `devr-i-hindi`, `yuruk-semai`, `aziz-dede`, `sevki-bey`, `ali-ufki-bey`, `murad-iv`, `zekai-dede`, `sengel-ali-riza`, `rauf-yekta-bey`.
  - Vikipedi: `https://tr.wikipedia.org/wiki/Usul` (usul tablosu; notalar LilyPond kaynak metni olarak sayfa kodunda duruyor, ham HTML'den okundu), `https://tr.wikipedia.org/wiki/Staccato`, `https://en.wikipedia.org/wiki/Articulation_(music)`, `https://en.wikipedia.org/wiki/%C3%87e%C5%9Fni`, `https://en.wikipedia.org/wiki/Tanburi_Cemil_Bey`.
  - Bağlama okulu sitesi (Arel'e dayanan özet, **zayıf kaynak**): `https://turkumuzikmerkezi.net/makamlar.php` (üçlü koma değerleri için tek açık sayfa, bkz. §4).
- **Açılamayan / bulunamayan**: tr.wikipedia `Usul_(müzik)`, `Türk_aksağı`, `Devr-i_Hindi` (404); TDV'de "çeşni", "üçlü", "Tâb'î Mustafa Efendi", "Lavtacı Andon", "Kaptanzade Ali Rıza" maddeleri (adresler arama sayfasına düştü); `acikbilim.yok.gov.tr` (bağlantı koptu); TDV "Tanbûrî Cemil Bey" ve "Tanbûrî Ali Efendi" sayfaları yalnız kısaltılmış metin verdi. Arama özetinde geçip **açmadığım** sayfalar: musopen (Kaptanzade 1881–1934), istiklal.com.tr, istanbulansiklopedisi.org (Andon), erturgutsanatmerkezi.com. Bunlara dayanan her bilgi BELİRSİZ diye geçer.
- **SymbTr**: dosya listesi `https://api.github.com/repos/MTG/SymbTr/git/trees/master?recursive=1` (2200 txt, `truncated: false`). `beyati--` (62), `huseyni--` (92), `kurdi--` (14), `muhayyer--` (67), `ussak--` (118) önekli **353** dosya ve `turkaksagi`/`devrihindi` usullü **122** dosya `https://raw.githubusercontent.com/MTG/SymbTr/master/txt/<dosya>` adresinden iki ayrı, boş klasöre indirilip bir Python betiğiyle çözümlendi (Kod, Pay/Payda, ölçü, süre histogramı, KomaAE'ye göre perde, Soz1 işaretleri, ölçü ölçü temiz aralıklar). Dönüştürücü `scripts/symbtr-to-json.mjs` `export`u ayrı bir betikten çağrıldı (`convertSymbTr`, `olcuAraligi`); `src/` altına hiçbir şey yazılmadı. **Dikkat: SymbTr "bayatî" için `beyati` yazıyor** (Bayâtî adaylarını `bayati--` ile aramak boş döner).
- **Yeni bulgu (dönüştürücü)**: Kod 9 dışında süreli nota satırı olarak yalnız Kod 1, 7, 10, 11 değil, **Kod 4 ve Kod 12 de** geçiyor (353 dosyada Kod 4 ×45, Kod 12 ×433 süreli satır; Kod 1 ×690, 7 ×489, 10 ×1066, 11 ×573). Dönüştürücünün `KOD_NOTA = [9,10,11]`'i bunlar için yetmez (Gülyüzlülerin'de "SAZ" yazılı satırlar Kod 4/12). Deneylerimde "Kod 1/4/7/10/11/12 → 9" bellekte yapıldı.
- Ölçü numarası `ceil(Offset)`; Offset usul değişse de kesintisiz ölçü sayar (Aziz Dede dosyasında doğrulandı). "Aralık dışı" **KomaAE**'ye göre sayıldı; uygulama perdeleri: G4 296, A4 305, B4b5 309, B4b4 310, B4b1 313, B4 314, C5 318, C5#4 322, D5 327, E5b5 331, E5 336, F5 340, F5#4 344, G5 349, G5#4 353, A5 358; **eklenecek tizler**: B5b1 366, C6 371, C6#4 375, D6 380.
- Parmak modeli Aşama C notundakiyle aynı (`thumb` aşîrân; sağ el işaret/orta/yüzük = ön delik 1/2/3, sol el = 4/5/6).
- Telif ölçütü: FSEK ölüm yılı + 70 (mevzuat metni yeniden doğrulanmadı; önceki notlarla aynı). SymbTr verisi CC BY-NC-SA 4.0 (mevcut `src/content/parcalar/LISANS.md` düzeni).

## 1. Tiz perdeler (4. kademe)

Kaynak: neyzenim `_8` (Tiz Sesler) ve `_9`. Parmak listeleri metinde açıkça yazılı; hepsi uygulamadaki alt oktav karşılıklarıyla birebir tutuyor (kod `src/content/ney-perdeler.ts` ile karşılaştırıldı).

| Perde | Yazılı perde + acc | KomaAE | thumb / front (yukarıdan aşağı) | Üfleme | Kaynak + alıntı | verified? |
|---|---|---|---|---|---|---|
| **Tiz Segâh** | **B5 acc −1** (porte üstü Si, koma bemolü) | 366 | `thumb k`; `[k, k, k, a, k, a]` (sağ baş+işaret+orta+yüzük, sol orta). **Segâh (B4b1) parmağı ile aynı** | Çok sert (sayfanın genel uyarısı) | https://www.neyzenim.com/neydersleri_8.html : "SAĞ EL : Baş, İşaret, Orta ve Yüzük Parmağımız. SOL EL : Orta Parmağımız." Ad: "Klasik Türk Müziğinde bu perdenin ismi TİZ SEGAH perdesidir." | **Evet** |
| **Tiz Çârgâh** | **C6 acc 0** | 371 | `thumb k`; `[k, k, a, a, k, a]` (sağ baş+işaret+orta, sol orta). **Çârgâh (C5) parmağı** | Çok sert | `_8`: "SAĞ EL : Baş, İşaret ve Orta Parmağımız. SOL EL : Orta Parmağımız." | **Evet** |
| **Tiz Nim Hicaz** | **C6 acc +4** (Do, bakiye diyezi) | 375 | `thumb k`; `[k, a, a, a, k, a]` (sağ baş+işaret, sol orta). **Nim Hicaz (C5#4) = Nim Şehnaz parmağı** | Çok sert | `_8`: "SAĞ EL : Baş ve İşaret Parmağımız. SOL EL : Orta Parmağımız." | **Evet** |
| **Tiz Nevâ** | **D6 acc 0** | 380 | `thumb k`; `[a, k, a, a, k, a]` (sağ baş+orta, sol orta). **Nevâ (açık D5) parmağı** | Çok sert | `_8`: "SAĞ EL : Baş ve Orta Parmağımız. SOL EL : Orta Parmağımız." | **Evet** |
| Tiz Nevâ, alternatif | D6 | 380 | `thumb k`; `[k, k, k, k, k, k]` (Rast parmağı) | Sert | `_9`: "tüm parmaklarımız kapalı olarak çıkan sesdir" ve "Tabi bu sesi çıkartmak için sert bir şekilde üflemeliyiz." | **Evet** (parmak) |
| **Gerdâniye (kapalı)** | **G5 acc 0**, açık Gerdâniye ile **aynı yazılı perde** | 349 | `thumb k`; `[k, k, k, k, k, k]` (**Rast parmağı**, bir oktav üstte) | Üfleme şiddeti sayfada **yazılı değil** (BELİRSİZ); doğal olarak açık Gerdâniye'den de sert | `_9`: "Sol sesini, tüm perdeler kapalı olarak da çıkartabiliriz" | Parmak: **evet**. Üfleme: BELİRSİZ |
| **Muhayyer (kapalı)** | **A5 acc 0**, açık Muhayyer ile **aynı yazılı perde** | 358 | `thumb k`; `[k, k, k, k, k, a]` (**Dügâh parmağı**, bir oktav üstte; "sadece sol yüzük açık") | BELİRSİZ (yazılı değil) | `_9`: "tüm parmaklarımız kapalı ve sadece sol yüzük parmağımız açık" (aşîrân dahil) | Parmak: **evet**. Üfleme: BELİRSİZ |

Üfleme: `_8` "Bu sesleri çıkartmamız için daha da sert daha şiddetli üflemeliyiz." ve "dudağımız ister istemez biraz daha büzülecektir". Aynı sayfa: "orta ve alt perdeleri uzun uzun üflemenizi öneriyorum" (tizler için uzun ses çalışması yerine; müfredattaki "tizler kolay çıkar, uzun ses ağırlığı orta/alt perdelerde" ilkesini destekler).

**"Aynı parmak → bir oktav / bir beşli yukarı" ilişkisi (KomaAE farklarıyla doğrulandı):**

| Parmak | Düşük | 3. kademe (+31 koma, beşli) | 4. kademe / kapalı (+53 koma, oktav) |
|---|---|---|---|
| Rast `[k×6]` | Rast G4 296 | kapalı Nevâ D5 327 | **kapalı Gerdâniye G5 349**; Tiz Nevâ alt. D6 380 (oktav + beşli) |
| Dügâh `[k,k,k,k,k,a]` | Dügâh A4 305 | Hüseynî E5 336 | **kapalı Muhayyer A5 358** |
| Segâh | Segâh B4b1 313 | Eviç F5#4 344 | **Tiz Segâh B5b1 366** |
| Çârgâh | Çârgâh C5 318 | açık Gerdâniye G5 349 | **Tiz Çârgâh C6 371** |
| Nim Hicaz | C5#4 322 | Nim Şehnaz G5#4 353 | **Tiz Nim Hicaz C6#4 375** |
| Nevâ (açık) | Nevâ D5 327 | açık Muhayyer A5 358 | **Tiz Nevâ D6 380** |

Her satırda 3. kademe farkı 31, 4. kademe farkı 53 koma (bir oktav). Yani **4. kademe tiz perdeler yeni bir parmak şeması öğretmez; ilgili ana sesin parmağıyla oktav yukarıda çıkar.** MEB aynı ilişkiyi kuruyor: ünite 1227 "Köprü Kurma": "parmak pozisyonları ile bağ kurması sağlanabilir" (https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1227).

**Adlandırma farkı (MEB ↔ neyzenim):** MEB 4. kademe ana sesler için "tiz buselik, tiz çargâh ve tiz neva" diyor (ünite 1227, 6. sınıf); neyzenim aynı porte üstü Si için "TİZ SEGAH", ilk beş seste de Segâh kullanıyor. Uygulama ilk beş seste Segâh'ı seçtiği için **Tiz Segâh = B5b1** tutarlı. "Tiz Bûselik" (B5 doğal, 367) neyzenim'de ayrı bir tiz perde olarak yok; MEB'in o ifadeyle hangi fingering'i kastettiği yazılı değil (**BELİRSİZ**). **Tiz Nim Hicaz** MEB'de geçmiyor (arandı); yalnız neyzenim. MEB kademesi: tiz buselik/çargâh/neva = 4. kademe ana ses; kapalı Gerdâniye/Muhayyer MEB'de geçmiyor ("açık" Gerdâniye/Muhayyer diye geçer).

`verified: true` için: Tiz Segâh, Tiz Çârgâh, Tiz Nim Hicaz, Tiz Nevâ, kapalı Gerdâniye ve kapalı Muhayyer şemalarının hepsi **kaynakta başparmak dahil metinle açıkça yazılı** ve uygulamadaki verified alt oktav şemalarıyla aynı; **hepsi `verified: true` yazılabilir**. Üfleme cümlesi yalnız tiz ve Tiz Nevâ için kaynaklı; kapalı Gerdâniye/Muhayyer ipucunda "açık olanla aynı yazılı perde, aynı parmakla ama bir oktav yukarıda; nefes daha sert" demek kendi çıkarımım olur, kaynakta yok.

**Uygulama notları (kod okundu, değiştirilmedi):**
- `NeyPerde.kademe: 2 | 3` → 4 gerekir; `PerdeId`'ye tiz-segah, tiz-cargah, tiz-nim-hicaz, tiz-neva, kapali-gerdaniye, kapali-muhayyer.
- Aşama C'deki sorun burada da var: kapalı Gerdâniye = açık Gerdâniye (`G5 acc 0`), kapalı Muhayyer = açık Muhayyer (`A5 acc 0`). `NEY_PERDELER.find(samePitch)` ilkini bulur; ayrım gerekiyorsa id ile.
- Porte: `ledgerLineYs` genel (ek çizgi sayısı yükseldikçe çizer). `STAFF_TOP = 30`, `LINE_GAP = 10` iken D6 notası `y = 70 − 13×5 = 5`; viewBox üstü 0'dan başlıyor, yani **D6 kafası sınırda** (E6 sığmaz). C6#4'ün diyez işareti ve ek çizgiler için görsel test yapılmalı (`Staff.tsx` üst taşma payı yalnız nüans/durum işaretinde var).
- `perde-adlari.ts` yalnız A5'e kadar adlandırıyor ("tiz Sol", "tiz La"); B5b1, C6, C6#4, D6 için "tiz Si (koma bemolü)", "tiz Do" … adları eklenmeli (kaynaktaki ad: Tiz Segâh, Tiz Çârgâh, Tiz Nim Hicaz, Tiz Nevâ).
- Müfredat geçme ölçütü "Tiz Nevâ'ya kadar dizi": Uşşak/Bayâtî dizisi A4 → D6 için B5b1, C6, D6 gerekir (E6 gerekmez).

## 2. Dil teknikleri (non legato, legato, staccato)

**Kaynaklar ve ne söylüyorlar:**
- **MEB 7. sınıf 1. tema (NEY.7.1.1–3)**, ünite 1229, 18 ders saati: https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1229 . Çıktılar: "Farklı nota sürelerinde yazılmış etütleri non legato çalabilme" / "legato" / "staccato"; temanın özeti: "bağsız (non legato), bağlı (legato) kısa-kesik (staccato)". Yani Türkçe karşılıklar: **non legato = bağsız, legato = bağlı, staccato = kısa-kesik**. Yöntem: öğretmen etüdü bona/solfejle ve ilgili teknikle çalar, öğrenci çözümler, kendi cümleleriyle yorumlar, önce bona sonra solfej yapar, ayna karşısında duruş ve parmak kontrol eder. **MEB teknikleri tanımlamıyor ve notasyonu anlatmıyor.** Zenginleştirme: etütler metronomla hızlandırılabilir.
- **neyzenim `_15`** (https://www.neyzenim.com/neydersleri_15.html): **Bağ işareti**: "İki ya da daha fazla notayı aralarında nefes almadan birleştirme işaretidir", ardından "dilimizle çarpma da yapmıyoruz" ve örnekte "ilk ölçüdeki notalarda dil ile çarpma yapılırken" ikinci ölçüde bağlı notalar "çarpmasız". **Legato**: "Seslerin aralarında hiç bir kesinti olmadan birbirini izlemelerini gerektiren işarettir." (sayfa legato'yu notanın üstüne "–" ile gösteriyor). **Staccato bu sayfada yok.** Not: aynı sayfada "çarpma" ayrıca bir süs (pest/tiz sesin esas sese çarptırılması); "dil ile çarpma" ile karıştırılmamalı.
- **Tanım için genel kaynak**: tr.wikipedia Staccato: "bir notanın süresini kısaltma anlamında kullanılır", ardından "ayrılmış bir sessizlik gelebilir" (https://tr.wikipedia.org/wiki/Staccato). en.wikipedia Articulation: staccato "shortened duration or detached"; legato "smoothly and connected"; **tenuto** "full length"; staccato noktası ile bağ birleşirse **portato** (https://en.wikipedia.org/wiki/Articulation_(music)). Bu genel batı müziği bilgisidir; **Türk müziği notasında staccato noktasının kullanımı kaynaklarda yok → BELİRSİZ**.
- Ney'de dilin nasıl kullanıldığı (hece, "tu" ya da başka) **neyzenim ve MEB'de yazılı değil.** Aşama B'deki "Dil: tu ve bağ" dersi ("tu" der gibi dilinin ucuyla) bu kaynaklardan **doğrulanmış değil** (neyzenim yalnız "dil ile çarpma"dan söz ediyor). Arama özetlerinden birinde "ney 'hû' sesiyle üflenir, tu tipi dil vuruşu klarnet ve kaval gibi kullanılmıyor" diye bir iddia çıktı; sayfayı açmadım, güvenilir saymıyorum (**BELİRSİZ**). Bir ney hocasına sorulmalı.

**Bir başlangıç için anlamı (önerim; tanımlar yukarıdaki kaynaklardan):**

| Teknik | Çalış | Yazım |
|---|---|---|
| Non legato (bağsız) | Her notaya ayrı dil vuruşu; notalar süresini doldurur, aralarında kısa bir ayrılık kalır. Nefes akışı kesilmez, ses her notada yeniden başlar. | Özel işaret yok: yazılı nota öntanımlı budur |
| Legato (bağlı) | Bağ altındaki notalarda dil vurulmaz, yalnız parmak değişir; ses akar. | Eğri çizgi (bağ) |
| Staccato (kısa-kesik) | Notanın yalnız bir bölümü sesle çalınır, kalanı sessizlik; ses kısa ve kesik. | Nota başına nokta (Batı gösterimi; TM'de kullanımı BELİRSİZ) |

**Uygulamada ne var (kod okundu):**
- `NoteEvent.bag?: boolean` var (legato; `Staff.tsx` bağ yayı çiziyor; `pattern.ts` `ToneEvent.legato` ile sonraki sesi dil vurmadan başlatıyor). `nefes?: boolean` var. **Staccato alanı yok** (kodda `staccato` ya da benzeri geçmiyor).
- Çalımda bağsız→bağsız geçişte zaten bir "dil vuruşu" etkisi var (Ayarlar → "Dil belirginliği": önceki ses `TU_BOSLUK_S` kadar erken susuyor, `clip`); yani **non legato = öntanımlı, legato = `bag`**. Staccato için `NoteEvent`'e bir alan (`stak`), `ToneEvent`'e karşılığı ve `Staff`'a nokta glifi gerekir; `zarflar` zaten `clip` taşıyor.
- **Kod gerektirmeyen yol**: staccato'yu "yarı değer nota + yarı değer sus" olarak yazmak (ör. dörtlük yerine sekizlik + sekizlik sus). Temsil edilebilir; ama bu gerçek staccato gösterimi değil, öğretim aracıdır.

**Etüt fikirleri (önerim, kaynağı yok; uzun sesten yeni artikülasyona geçiş MEB'in "farklı nota sürelerinde" kalıbına uyar):**
1. **Aynı ezgi, üç yazım**: mevcut `dil-1` ezgisini (`D5 C5 B4b1 C5 | D5 C5 D5 | …`) üç kez çal: bağsız (düz yazım), bağlı (ikişerli bağ), kısa-kesik (her nota yarı süre + sus). Geçme ölçütü (b) "üç artikülasyonla ayırt edilebilir" doğrudan bu.
2. **Tek perdede tekrar**: Nevâ ya da Çârgâh üzerinde dört sekizlik ♩ = 60–80; sırayla bağsız, sonra kısa-kesik (dil vuruşunun netliğini dinlemek için; bağda ise tek uzun ses). Metronomla yavaştan hızlıya (MEB zenginleştirme).
3. **Dizi + artikülasyon karışımı**: Uşşak dizisi çıkışı bağsız, inişi bağlı (A4 … A5 … A4, ikişerli bağ iniş); ardından Tiz Nevâ'ya kadar uzatılmış sürüm. Tiz perdeler yeni geldiği için kısa-kesik tizlerde dil vuruşunun sertliğiyle nefes şiddetini ayırt etmeyi öğretir.
4. **Dinle ve ayırt et**: uygulama aynı iki ölçüyü üç artikülasyonla çalar, kullanıcı hangisi olduğunu seçer (çalma ayarı mevcut; "dil belirginliği"nin sınırı denenmeli).

## 3. Makamlar

TDV'de Hüseynî ve Muhayyer maddelerinin "Müellif" satırı İsmail Hakkı Özkan; diğerlerinin yazarı sayfa metninden çıkarılamadı (Bayâtî maddesi 1992 baskısı, çok kısa). Koma değerleri Aşama C'deki Wikipedia / SymbTr KomaAE tablosundan (A4 305, B4b1 313, B4b5 309, C5 318, D5 327, E5 336, F5 340, F5#4 344, G5 349, A5 358). Yazılı anahtar: uygulama anahtarı (`B4b1`, `F5#4` …).

### 3.0 Dizi birleşimi (TDV dörtlü/beşli tanımlarından, kendi koma hesabım)

- Uşşak dörtlüsü 8+5+9 · Hüseynî beşlisi 8+5+9+9 · Bûselik beşlisi 9+4+9+9 · Kürdî dörtlüsü 4+9+9 · Rast beşlisi 9+8+5+9 (Aşama C §3).
- Uşşak: Dügâh'ta Uşşak dörtlüsü A4→D5, **Nevâ'da Bûselik beşlisi** D5 E5 **F5 (Acem)** G5 A5.
- Hüseynî/Muhayyer: Dügâh'ta **Hüseynî beşlisi** A4→E5, **Hüseynî'de Uşşak dörtlüsü** E5 **F5#4 (Eviç)** G5 A5 (336 + 8 = 344 …).
- Kürdî: Dügâh'ta Kürdî dörtlüsü A4 **B4b5** C5 D5, Nevâ'da Bûselik beşlisi.

### 3.1 Uşşak (uygulamada var, TDV ile kontrol)

| Alan | TDV değeri | Uygulama (`makamlar.ts`) | Sonuç |
|---|---|---|---|
| Dizi | "dügâh, segâh, çârgâh, nevâ, hüseynî, acem, gerdâniye ve muhayyer" | A4 B4b1 C5 D5 E5 F5 G5 A5 | **Uyuşuyor** |
| Durak / güçlü / yeden | Dügâh / Nevâ / Rast | Dügâh / Nevâ / Rast | Uyuşuyor |
| Donanım | "Donanımında sadece si için koma bemolü yer alır" | `[B4b1]` | Uyuşuyor |
| Yapı | Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi | `yapi` alanı yok | Eklenebilir (Rast ve Nevâ'da var) |
| Seyir | Çıkıcı; durak üstünde uşşak dörtlüsünde dolaşılır, güçlü Nevâ'da Bûselik çeşnili yarım karar, Dügâh'ta uşşak çeşnili tam karar; en önemli asma karar Segâh | Aynı içerik | Uyuşuyor. Eksik ayrıntı: TDV, Segâh'ın **inici seyirde 1–2 koma daha pest basıldığını** söylüyor (yazı yine koma bemolü); neyzenim `_10` de "2-3 koma kadar pest olmalıdır" diyor (https://www.neyzenim.com/neydersleri_10.html). Ders metnine konabilir |

Kaynak: https://islamansiklopedisi.org.tr/ussak . Tiz genişleme: TDV "Uşşak" tiz durak Muhayyer'in aşılabileceğini ama kalınmadığını, genişlemenin Bayâtî'ye ait olduğunu yazıyor; pest genişleme Yegâh'ta Rast beşlisi (Yegâh uygulamada yok).

### 3.2 Hicaz (uygulamada var, TDV ile kontrol)

| Alan | TDV değeri | Uygulama | Sonuç |
|---|---|---|---|
| Dizi | "yerinde hicaz dörtlüsüne nevâda rast beşlisinin eklenmesinden" | A4 B4b4 C5#4 D5 E5 F5#4 G5 A5 | **Uyuşuyor** |
| Durak / güçlü / yeden | Dügâh / Nevâ / Rast (bazı klasik formlarda Nîm-zirgüle) | Dügâh / Nevâ / Rast | Uyuşuyor |
| Donanım | "si için bakiye bemolü (dik-kürdî), fa ve do için bakiye diyezi (eviç ve nîm-hicaz)" | `[B4b4, F5#4, C5#4]` | **Uyuşuyor** (sıra bile aynı) |
| Seyir | İnici-çıkıcı, bazen çıkıcı; yarım karar Nevâ'da rast çeşnisiyle; tam karar Dügâh'ta | Aynı | Uyuşuyor |
| Asma karar | "rastta nikrizli, nîm-hicaz ve dik-kürdîde çeşnisiz"; ayrıca Nevâ'da bûselikli, Hüseynî'de uşşaklı | "Rast, Nim Hicaz ve Dik Kürdî" | Uyuşuyor (özet) |

Kaynak: https://islamansiklopedisi.org.tr/hicaz-2 . neyzenim `_10` Hicaz asma kararları olarak "Neva, Nim Hicaz ve Dik Kürdü" yazıyor (Rast yok): iki kaynak küçük farkla ayrılıyor; uygulama TDV'ye uyuyor. **Uşşak ve Hicaz verilerinde düzeltilecek bir fark bulunmadı.**

### 3.3 Bayâtî (yeni)

Kaynaklar: TDV https://islamansiklopedisi.org.tr/bayati--musiki (çok kısa madde) ve neyzenim `_10` (Bayati/Beyati Makamı bölümü).

| Alan | Değer | Kaynak / alıntı |
|---|---|---|
| Dizi (pest→tiz) | **A4 B4b1 C5 D5 E5 F5 G5 A5** (Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, **Acem**, Gerdâniye, Muhayyer), **Uşşak ile aynı** | TDV: "Uşşak makamı ile aynı diziyi kullanan" ; neyzenim `_10`: "Yerinde Uşşak dörtlüsüne Neva perdesinde Buselik beşlisinin eklenmesinden" |
| Durak | Dügâh (A4) | TDV: "Güçlüsü nevâ, durağı dügâh perdesidir." |
| Güçlü | Nevâ (D5); üzerinde Bûselik çeşnili yarım karar | TDV; neyzenim |
| Yeden | Rast (G4) | neyzenim `_10` ("Yedeni : Rast perdesidir"); TDV'de yeden yazılı değil |
| Donanım | Yalnız B4b1 (Segâh) | TDV: "Donanımına segâh bemolü yazılır" ; neyzenim: Uşşak'ta olduğu gibi |
| Yapı | Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi | neyzenim |
| Seyir (özet) | **Güçlü Nevâ civarından başlar**; Acem'e karşı Karcığar geçkisi; Dügâh'ta Uşşak dörtlüsüyle karar. Seyir yönü kaynaklarda çelişiyor: neyzenim "çıkıcı-inici", turkumuzikmerkezi.net "inici", TDV yazmıyor → **BELİRSİZ** (anlatırken yön söylenmemeli) | TDV; neyzenim `_10`; https://turkumuzikmerkezi.net/makamlar.php |
| Asma karar | **Segâh** (Segâh/Ferahnâk çeşnili ya da Segâh üçlüsü; Uşşak'taki gibi daha pest basılır); ayrıca Nevâ, Acem, Hüseynî, Çârgâh | neyzenim `_10` |
| Genişleme | neyzenim: "hemen her zaman tiz taraftan genişler" ve **bu özelliğiyle Uşşak'tan ayrılır**; TDV Uşşak maddesi tiz genişlemelerin "uşşak ile çok yakın olan bayâtî makamının" olduğunu söylüyor | https://www.neyzenim.com/neydersleri_10.html ; TDV ussak |
| Eser örnekleri | Tab'î Mustafa Efendi'nin nakış yürük semâîsi "Gül yüzlülerin şevkine gel" (TDV Bayâtî maddesinde de anılıyor); neyzenim `_10` Bayâtî altında "gulyuzlulerin" notası | TDV; neyzenim |
| Uygulamada eksik perde | Dizi tam içeride. Genişleme (tiz) Muhayyer üzerinde Kürdî dörtlüsü ise A5 **B5b5** C6 D6 ister (B5b5, 362, uygulamada ve planlanan tizlerde yok); Karcığar geçkisi Hisar E5b4 (332) ister → bu seviyede anlatılmaması önerilir | Kendi çıkarımım |

### 3.4 Hüseynî (yeni)

Kaynak: https://islamansiklopedisi.org.tr/huseyni ; neyzenim `_10`.

| Alan | Değer | Kaynak / alıntı |
|---|---|---|
| Dizi (pest→tiz) | **A4 B4b1 C5 D5 E5 F5#4 G5 A5** (Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, **Eviç**, Gerdâniye, Muhayyer). **İniş dizisi ("acemli hüseynî"): Eviç yerine Acem F5** | TDV: "Dizisi, yerinde hüseynî beşlisine hüseynî perdesinde uşşak dörtlüsünün eklenmesinden meydana gelmiştir"; "bazan eviç perdesi yerine acem perdesinin kullanılması" |
| Durak | Dügâh (A4) | TDV |
| Güçlü | **Hüseynî (E5)**; üzerinde Uşşak çeşnili yarım karar (Kürdili kalışlar genellikle asma karar) | TDV: "Makamın yedeni rast, durağı dügâh, güçlüsü hüseynî perdesidir." |
| Yeden | Rast (G4) | TDV |
| Donanım | Si için koma bemolü (B4b1), Fa için bakiye diyezi (F5#4) | TDV: "donanımına si için koma bemolü (segâh), fa için bakiye diyezi (eviç)" |
| Yapı | Dügâh'ta Hüseynî beşlisi + Hüseynî'de Uşşak dörtlüsü | TDV |
| Seyir | İnici-çıkıcı. **Güçlü Hüseynî civarından başlanır**, çeşnilerde karışık gezinilir, güçlüde Uşşak çeşnili yarım karar, sonunda Dügâh'ta Hüseynî dizisiyle tam karar | TDV |
| Asma karar | **Çârgâh** (en önemli, karakteristik; acemli iniş ile Çârgâh çeşnili), ikinci olarak **Segâh** (segâh/ferahnâk çeşnili; acemli inişte "eksik" olanlar), Nevâ (rast ya da bûselik çeşnili), Rast | TDV |
| Genişleme | Tiz taraf, iki biçim: (1) Muhayyer'e Bûselik beşlisi getirilerek "hüseynîde uşşak dizisi" (en çok kullanılan); (2) karar üzerindeki Hüseynî beşlisinin tiz durak Muhayyer'e simetrik göçürülmesi | TDV |
| Uygulamada eksik perde | Ana dizi ve acemli iniş tam içeride. Genişleme (1) A5 **B5 doğal (367)** C6 D6 E6, genişleme (2) A5 **B5b1** C6 D6 **E6 (389, Tiz Hüseynî)** ister: B5 ve E6 uygulamada **yok**, E6 için neyzenim'de fingering de yok (BELİRSİZ). Seviye 4'te genişleme anlatılacaksa yalnız B5b1/C6/D6'ya kadar | Kendi çıkarımım |

### 3.5 Muhayyer (yeni)

Kaynak: https://islamansiklopedisi.org.tr/muhayyer ; neyzenim `_10`.

| Alan | Değer | Kaynak / alıntı |
|---|---|---|
| Dizi | **Hüseynî ile tıpatıp aynı**: A4 B4b1 C5 D5 E5 F5#4 G5 A5 | TDV: "hüseynî makamının inici şeklinden ibarettir"; "Dizi, tamamen hüseynî makamı dizisinin aynısı" |
| Durak | Dügâh (A4) | TDV; neyzenim |
| Güçlü | **Tiz durak Muhayyer (A5)**; yarım karar bu perdede (Uşşak ya da Hüseynî çeşnili); ikinci mertebe güçlü Hüseynî'de Uşşak çeşnili asma karar | TDV |
| Yeden | Rast (G4) ("sol (rast) perdesi") | TDV |
| Donanım | Si için koma bemolü, Fa için bakiye diyezi (Hüseynî'deki gibi) | TDV |
| Yapı | Dügâh'ta Hüseynî beşlisi + Hüseynî'de Uşşak dörtlüsü; tiz tarafta Hüseynî beşlisi Muhayyer'e göçürülerek seyir alanı sağlanır | TDV |
| Seyir | **İnici**. Tiz durak Muhayyer civarından başlanır, tizde gezinilip Muhayyer'de yarım karar; sonra orta bölgede karışık gezinilip gerekli asma kararlar (Nevâ'da rastlı, Eviç yerine Acem ile Nevâ'da bûselikli, Çârgâh'ta çârgâhlı, Segâh'ta segâh/ferahnâkli, Rast'ta rastlı) gösterilip **Dügâh'ta Hüseynî dizisiyle tam karar** | TDV; neyzenim `_10`: "Muhayyer perdesinden seyre başlayıp,Dügah perdesinde karar verir." |
| Uygulamada eksik perde | Seyrin tiz bölgesi (A5 B5b1 C6 D6 [E6]) için **B5b1, C6, D6 gerekir**: tiz perdeler (§1) bu yüzden Muhayyer'den önce gelmeli; E6 yok | Kendi çıkarımım |

### 3.6 Kürdî (yeni)

Kaynak: https://islamansiklopedisi.org.tr/kurdi .

| Alan | Değer | Kaynak / alıntı |
|---|---|---|
| Dizi | **A4 B4b5 C5 D5 E5 F5 G5 A5** (Dügâh, **Kürdî**, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer); Kürdî perdesi B4b5 (309) | TDV: "dügâh perdesindeki kürdî dörtlüsüne nevâ perdesinde bûselik beşlisinin eklenmesinden meydana gelmiştir" |
| Durak | Dügâh (A4) ("Dügâh perdesinde karar kılan") | TDV |
| Güçlü | Nevâ (D5); üzerinde bûselikli yarım karar | TDV |
| Yeden | Rast (G4); zaman zaman bakiye diyezli sol (Nîm-zirgüle, G4#4) | TDV |
| Donanım | Si için **küçük mücennep bemolü** (B4b5) yazılır | TDV: "si için küçük mücennep bemolü yazılır" |
| Yapı | Dügâh'ta Kürdî dörtlüsü + Nevâ'da Bûselik beşlisi | TDV |
| Seyir | Çıkıcı, bazen çıkıcı-inici. Durak ya da güçlü civarından başlanır, çeşnilerde gezinilir, Nevâ'da bûselikli yarım karar, sonra Kürdî dizisiyle Dügâh'ta tam karar | TDV |
| Asma karar | Çârgâh'ta çârgâhlı, Kürdî'de çeşnisiz, Rast'ta bûselikli (Rast'taki, Nihâvend'e küçük geçki) | TDV |
| Uygulamada eksik perde | **Yok**: B4b5, F5 uygulamada var. Not: TDV bu makamın "kendi tabii seyir yerinde çok az kullanıldığını" yazıyor; eser örneği seçimi için §6 | — |

### 3.7 Uşşak / Bayâtî / Hüseynî / Muhayyer farkı (kesin açıklama)

1. **Nota kümesi iki gruba ayrılır, aralarındaki fark tek notadır.** Uşşak ile Bayâtî **aynı dizi** (TDV Bayâtî: "Uşşak makamı ile aynı diziyi kullanan"): 6. derece **Acem F5 (340)**, donanım yalnız B4b1. Hüseynî ile Muhayyer **aynı dizi** (TDV Muhayyer: "Dizi, tamamen hüseynî makamı dizisinin aynısı"): 6. derece **Eviç F5#4 (344)**, donanım B4b1 + F5#4. İki grubun farkı 6. derecede 4 koma. Hüseynî seyrinde inici nağmelerde Acem de kullanıldığı için ("acemli hüseynî dizisi", TDV, "hemen bütün hüseynî eserlerde") pratikte Hüseynî eserleri Acem de içerir; yani nota kümesi tek başına makamı belirlemez.
2. **Makamı ayıran seyirdir** (TDV Bayâtî: "makam kavramının 'seyir'le oluştuğu"):
   - **Uşşak**: durak Dügâh civarından başlar, çıkıcı; Nevâ'da yarım karar; Segâh en önemli asma karar; genişleme **pest** (Yegâh'ta Rast beşlisi).
   - **Bayâtî**: **Nevâ (güçlü) civarından başlar**, Segâh asma kararlı, tiz tarafa genişler, Dügâh'ta Uşşak dörtlüsü ile biter.
   - **Hüseynî**: **Hüseynî (E5) civarından başlar**, inici-çıkıcı; Uşşak çeşnili yarım karar Hüseynî'de; Çârgâh asma kararı çok karakteristik; tiz genişleme.
   - **Muhayyer**: **Muhayyer (A5, tiz durak) civarından başlar**, inici; yarım karar A5'te; Dügâh'ta Hüseynî dizisiyle tam karar.
3. **Başlangıç perdesi ve yön** özetle: Uşşak = Dügâh'tan yukarı; Bayâtî = D5'ten; Hüseynî = E5'ten; Muhayyer = A5'ten aşağı. Hepsinde tam karar Dügâh (A4).
4. **Önemli tasarım notu**: Nevâ (Aşama C) ile Hüseynî ve Muhayyer'in uygulamadaki `dizi`, `donanim` ve `yeden` değerleri **birebir aynı olacak** (Nevâ dizisi A4 B4b1 C5 D5 E5 F5#4 G5 A5). TDV de Nevâ'yı "Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi" diye veriyor, ki bu Hüseynî beşlisi + Uşşak dörtlüsü ile aynı sekiz sesi verir (hesapla doğrulandı: 305 313 318 327 336 344 349 358). Üçü yalnız güçlü/seyirle ayrılıyor (Nevâ güçlüsü Nevâ D5, Hüseynî E5, Muhayyer A5). Ders ve soru kurgusu bunu açıkça söylemeli; dizi-sıra etüdü üç makamda aynı notaları çaldıracaktır.

## 4. Çeşni ve üçlüler

**Çeşni tanımı (kaynaklar):**
- MEB (TMT 7.2.1, ünite 1115): çeşni "ana diziden farklı; üçlü, dörtlü veya beşli dizilerle oluşturulan kısa melodik yapılar", "eseri renklendirmek için kullanılan" (https://tymm.meb.gov.tr/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi/unite/1115). Sayfada bir düzenleme artığı (taslak cümle) var; ilgili tanım cümlesi yine de okunaklı.
- en.wikipedia (TDV "Makam" maddesine atıf yapıyor): "a set of scales usually seen in tetrachord or pentachord form"; bir makamda en az iki çeşni (alt ve üst) (https://en.wikipedia.org/wiki/%C3%87e%C5%9Fni). TDV'nin "Makam" maddesi güçlüyü "çeşnisini veren dörtlü ile beşlinin birleştiği yerdeki ortak ses" diye tanımlıyor (https://islamansiklopedisi.org.tr/makam--musiki). TDV'de ayrı bir "Çeşni" maddesi açılamadı.
- turkumuzikmerkezi.net: "altı çeşit tam dörtlü ve tam beşliye çeşni denmektedir"; bunlar "kulakta Rast, Uşşak, Buselik vb. gibi izlenimler bırakırlar".
- Pratik kullanım (TDV): "güçlüde bûselik çeşnili yarım karar", "Dügâh'ta uşşak çeşnili tam karar", "Çârgâh'ta çârgâhlı asma karar". Yani **çeşni, o perdede kalış yapılan dörtlü/beşlidir**.

**Üçlüler (6 tane):** MEB 6. sınıf (TMT 6.3, ünite 1113, https://tymm.meb.gov.tr/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi/unite/1113): "6 adet (çargâh, buselik, kürdi, rast, uşşak, hicaz) üçlü". MEB sayfası koma değerlerini vermiyor; değerler turkumuzikmerkezi.net'ten, dörtlü değerleriyle (Aşama C §3) tutarlı (üçlü = dörtlünün ilk iki aralığı, alttan üste):

| Üçlü | Aralıklar (komas) | Toplam | Not | Kaynak |
|---|---|---|---|---|
| Çârgâh | 9+9 (T.T.) | 18 | "en büyük üçlü" | turkumuzikmerkezi.net: "Aralıkları çıkıcı ve inici olarak T.T. 'dir 18 komalık en büyük üçlüdür" |
| Bûselik | 9+4 (T.B.) | 13 | küçük üçlü | aynı sayfa |
| Kürdî | 4+9 (B.T.) | 13 | küçük üçlü | aynı sayfa |
| Rast | 9+8 (T.K.) | 17 | büyük üçlü | aynı sayfa |
| Uşşak | 8+5 (K.S.) | 13 | küçük üçlü | aynı sayfa |
| Hicaz | 5+12 (S.A12) | 17 | büyük | aynı sayfa |

Aynı sayfa yedinci olarak Nikriz üçlüsünü (14 koma) de sayıyor; MEB'in listesinde yok. Sayfanın yazarı üçlü çeşnileri için "şimdiye kadar üzerine eğilinmemiş" diyor, yani bu kavram ders kitabı standardı değil, MEB'in 6 üçlüsü dışında tek kaynak bu (zayıf). Bu yüzden üçlü dersi **çok kısa** tutulmalı, yalnız "dörtlünün ilk üç sesi" olarak.

**Çeşni listesi (dörtlü/beşli koma tablosu zaten Aşama C §3'te):** Çârgâh, Bûselik, Kürdî, Rast, Uşşak, Hicaz dörtlüleri 22 koma; beşlileri +9 = 31 (Hicaz 5+12+5+9; Hüseynî beşlisi 8+5+9+9; Uşşak'ın ayrı beşlisi yok, Aşama C'deki karar). Segâh, Ferahnâk, Nikriz, Karcığar çeşnileri TDV makam maddelerinde asma karar adı olarak geçiyor (örn. "segâh ve ferahnâk çeşnili"); koma yapıları kaynaklarda açık değil → **BELİRSİZ**, Seviye 4 dersine alınmamalı.

## 5. Usuller

Kaynaklar: neyzenim `_13` (https://www.neyzenim.com/neydersleri_13.html), tr.wikipedia `Usul` tablosu (https://tr.wikipedia.org/wiki/Usul; LilyPond kaynak metinleri), TDV `turk-aksagi`, `devr-i-hindi`, `yuruk-semai`. Birim = tek "zaman"; vuruş süreleri zaman cinsindendir (`usuller.ts` ile aynı biçim: toplam = `zaman`).

| Usul | Zaman | Mertebeler | Vuruş (ses süre) | Toplam | Kaynak ve alıntı | Uygulamada |
|---|---|---|---|---|---|---|
| **Türk Aksağı** | 5 | 5/8 (neyzenim: "5/8 lik mertebesi vardır"); TDV: 5/8 birinci, **5/4 ikinci** mertebe | **düm 2, tek 2, tek 1** | 5 | neyzenim: "Vuruluşu: DÜM 2, TEK 2, TEK 1 şeklindedir."; tr.wikipedia Usul (`\time 5/8`, "düüm4 teek4 tek8"); TDV: "Beş zamanlı ve üç vuruşlu bir küçük usulün adıdır." ("bir nîm-sofyanla bir semâinin" eklenmesi, önce iki sonra üç zaman) | **Yok** |
| **Devr-i Hindî** | 7 | 7/8 (birinci), **7/4 (ikinci; "ağır/sengin devr-i hindî")** | **düm 1, tek 1, tek 1, düm 2, tek 2** | 7 | neyzenim: "Düm 1, Tek 1, Tek 1 ,Düm 2, Tek 2 şeklindeki"; tr.wikipedia Usul (`\time 7/8`, "düm8 tek8 tek8 düüm4 teek4"); TDV: "yedi zamanlı ve beş vuruşlu bir küçük usulün adıdır" (bir semâiye bir sofyan eklenmesi) | **Yok** |
| **Yürük Semâî** | 6 | 6/8, **6/4**, 6/2 (neyzenim: "6/8 lik, 6/4 lük ve 6/2 lik üç mertebesi vardır") | **düm 1, tek 1, tek 1, düm 1, tek 2** | 6 | neyzenim: "Vuruluşu : DÜM 1, TEK 1, TEK 1, DÜM 1, TEK 2"; tr.wikipedia Usul tablosu aynı vuruşu **6/4** olarak yazıyor ("düm4 tek4 tek4 düm4 teek2") | **Var** (`yuruk-semai`, 6/8, aynı vuruş) |

**Yürük Semâî 6/8 ↔ 6/4 (yeniden doğrulama):** Vuruş kalıbı üç kaynakta aynı; uygulamadaki `düm1 tek1 tek1 düm1 tek2` doğru. **Mertebe**: TDV: "Yürük semâi usulünün bu isme uygun olan mertebesi 6/8'lik mertebedir", 6/4'e aslında "sengin semâi" denir ama "nota yazımında usulün 6/4'lük mertebesine de yürük semâi adı verildiği görülür"; **form** için "Daha çok 6/4 olarak kullanılmıştır." (TDV `yuruk-semai`). neyzenim 6/4'ü de bir mertebe olarak sayıyor. SymbTr'de: Gülyüzlülerin "Yürüksemâî (6/4)", Senden Bilirim "Yürüksemâî (6/4)", Gelse nesîm-i "Senginsemâî 6/4", Yine Bağlandı Dil (Aşama C) "Yürüksemâî II 6/8". Sonuç: **6/4 yaygın**; Seviye 4'ün Bayâtî/Hüseynî yürük semâîlerini eklemek için `usuller.ts`'e 6/4 mertebesi (aynı vuruş, zaman=6, mertebe=4) gerekir. Dönüştürücü Pay/Payda'yı birebir karşılaştırdığı için 6/8 usulüyle 6/4 dosya reddedilir (denendi: "usul 6/4 …, beklenen 6/8").

**Diğer ilgili usuller (SymbTr'deki adlarla):** Aksak Semâî 10/8 (neyzenim: "DÜM 2, TE 1, KÂ 2, DÜM 2, TEK 2, TEK 1"; Aziz Dede/Dede Salih saz semâîleri bunda; roadmap'te Seviye 6), Ağırdüyek 8/4, Senginsemâî 6/4. Müsemmen (8 zaman), Devr-i Turan (7), Evfer ve Çifte Sofyan (SymbTr'de 9/8) sayıca app ya da hedef usullerle (Düyek 8/8, Devr-i Hindî 7, Aksak 9/8) aynı olabilir ama **vuruş kalıpları farklıdır** (neyzenim `_13`: Evfer "DÜM 2, TE 1, KE 1, DÜM 2, TEK 1, TEK 2", Aksak sonu "TEK 2, TEK 1"). Bu adlı dosyalar Pay/Payda eşleştiği için `duyek`/`aksak`/`devr-i-hindi` ile dönüşür ama usul yanlış gösterilir; Kod 51 adına bakılmalı (taranan listede `huseyni--turku--devrituran--yagmur_yagar--` 7/8 ama Devr-i Turan'dır).

## 6. Eserler

### 6.1 Özet tablo

Taranan 353 dosyadan: usul değişimsiz, üçlemesiz ve 1/32'siz **202**; bunlardan aralık dışı perdesiz **101** (Bayâtî 7, Hüseynî 34, Kürdî 7, Muhayyer 16, Uşşak 37); bu 101'in **64'ü** ayrıca uygulamadaki yedi usulden birinde (Bayâtî 4, Hüseynî 20, Kürdî 4, Muhayyer 8, Uşşak 28). Geri kalan temiz dosyaların çoğu kısa örnek ezgiler (Rauf Yekta, Arel, Ruhi Ayangil, Erol Bingöl, bestekârı boş aranağme dosyaları) ya da anonim/derleme türkülerdir (derleme hakları BELİRSİZ). Kürdî için ciddi eser adayı **yok**.

| # | Eser | Dosya | Usul (app'te?) | Ölçü | Üçleme / 1/32 | Aralık dışı (KomaAE) | Yeni tiz perde kullanımı | Telif | Hüküm |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Aziz Dede Uşşak saz semâîsi | `ussak--sazsemaisi--aksaksemai----neyzen_aziz_dede.txt` | Aksak semâî 10/8 → Yürük semâî II 6/8 → 10/8 (**yok + usul değişimi**) | 68 | 1/24 ×6, 1/12 ×12, **1/32 ×33**, 3/32 ×33 | 9: F4#4 ×1, E5b4 ×6, B5b5 ×2 | 2 (B5b1, C6) | KAMU MALI (ö. 1905) | **SKIP** |
| 1b | Dede Salih Efendi Uşşak saz semâîsi (alternatif) | `ussak--sazsemaisi--aksaksemai----dede_salih_efendi.txt` | 10/8 → 6/4 → 10/8 | 66 | **yok** | **0** | 3 (m31) | BELİRSİZ (Dede Salih Efendi kim?) | **Koşullu**: yalnız Aksak Semâî 10/8 usulü gelirse (m1–14) |
| 2 | Gül yüzlülerin (Tab'î Mustafa, Bayâtî yürük semâî) | `beyati--yuruksemai--yuruksemai--gul_yuzlulerin--tabi_mustafa_efendi.txt` | **6/4** (yok) | 64 (son ölçü yarım) | yok | 4: F5#1 (341) ×4 | 8 (m18, 22, 50, 54) | KAMU MALI (18. yy; ölüm yılı BELİRSİZ) | **Koşullu**: m1–16/17 |
| 3 | Çeçen Kızı (Tanburi Cemil) | `huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt` | Nim Sofyan 2/4 (var) | 56 | **1/32 ×6** (3/32 ile) | 0 | 0 | KAMU MALI (ö. 1916) | **Koşullu**: m1–40 ya da 1/32 desteği |
| 4 | Lavtacı Andon Hüseynî peşrevi | `huseyni--pesrev--muhammes----lavtaci_andon.txt` | Muhammes 32/4 (yok) | 12 | 1/12 ×30, 1/24 ×12 | 30 | 31 | Ölüm yılı BELİRSİZ | **SKIP** |
| 4b | Andon Hüseynî saz semâîsi | `huseyni--sazsemaisi--aksaksemai----lavtaci_andon.txt` | 10/8 → 6/4 → 10/8 | 52 | 1/12 ×63, 1/32 ×17 | 9 | 5 | BELİRSİZ | **SKIP** |
| 5 | Tanburi Cemil Muhayyer peşrevi | `muhayyer--pesrev--devrikebir----tanburi_cemil_bey.txt` | Devr-i Kebîr 28/4 (yok) | 13 (ölçü başına 28 çeyrek, ~53 nota) | yok | 17: F5#1 ×4, A5b4 ×2, B5b5 ×5, B5b4 ×6 | 47 | KAMU MALI | **SKIP** |
| 5b | Tanburi Cemil Muhayyer saz semâîsi | `muhayyer--sazsemaisi--aksaksemai----tanburi_cemil_bey.txt` | 10/8 → 6/4 → 10/8 | 66 | 1/12 ×72 | 15 | 59 | KAMU MALI | **SKIP** |
| 6 | **Allah emrin tutalım** (Zekâî Dede, Uşşak ilahi) | `ussak--ilahi--duyek--allah_emrin--zekai_dede.txt` | Düyek 8/8 (var) | 24 | yok | 0 | 0 | KAMU MALI (ö. 1897) | **ADD** (altyapı hazır) |
| 7 | **Senden bilirim** (Tanburi Ali Efendi, Hüseynî yürük semâî) | `huseyni--sarki--yuruksemai--senden_bilirim--tanburi_ali_efendi.txt` | **6/4** (yok) | 50 | yok | 0 | 3 (B5b1, m33–37) | KAMU MALI (ö. 1890 ya da 1902) | **ADD (koşullu: 6/4)** |
| 8 | **Hicran oku** (Şevki Bey, Hüseynî, Türk aksağı) | `huseyni--sarki--turkaksagi--hicran_oku--sevki_bey.txt` | **5/8** (yok, yeni) | 112 | yok | 2: B5 (367) ×2 | 0 | KAMU MALI (ö. 1890) | **ADD (koşullu: Türk aksağı; aranağme m1–16)** |
| 9 | Rauf Yekta seyir örnekleri (Bayâtî, Hüseynî, Muhayyer) | `beyati--`/`huseyni--`/`muhayyer--seyir--semai--1--rauf_yekta.txt` | Semâî 3/4 (var) | 32 | yok | 0 | Muhayyer'de 13 | KAMU MALI (ö. 1935) | **ADD** (altyapı hazır) |
| 10 | Düşeli bu aşkın (Dede Efendi, Muhayyer ilahi) | `muhayyer--ilahi--sofyan--duseli_bu_askin--dede_efendi.txt` | Sofyan 4/4 (var) | 48 | yok | 1: E6 (m27) | 63 | KAMU MALI (ö. 1846) | **ADD (koşullu: m1–26)** |
| 11 | Ceddin deden (Hüseynî marş) | `huseyni--mars--sofyan--ceddin_deden--kaptanzade_ali_riza_bey.txt` | Sofyan 4/4 (var) | 46 | yok | 0 | 0 | KAMU MALI (atıf çelişkisi) | **ADD** (altyapı hazır; atıf notu) |
| 12 | Allah Allah (Ali Ufkî, Hüseynî ağırdüyek ilahi) | `huseyni--ilahi--agirduyek--allah_allah--ali_ufki.txt` | Ağırdüyek **8/4** (yok) | 24 | yok | 0 | 0 | KAMU MALI (ö. 1675 [?]) | **Koşullu (8/4)** |
| 13 | Gelse nesîm-i (IV. Murad?, Bayâtî sengin semâî) | `beyati--yuruksemai--senginsemai--gelse_nesim-i--iv_murad.txt` | **6/4** (yok) | 56 | yok | 0 | 0 | Atıf BELİRSİZ; her halükârda kamu malı | **Koşullu (6/4)** |
| 14 | Nûr-i fahr-i âleme (Dede Efendi, Hüseynî yürük semâî tevşîhi) | `huseyni--ilahi--yuruksemai--nur-i_fahr-i--dede_efendi.txt` | **6/4** (yok) | 58 | yok | 0 | 10 | KAMU MALI (ö. 1846) | Koşullu (6/4; sözsüz) |

### 6.2 İstenen eserler

#### Aziz Dede Uşşak saz semâîsi: SKIP
- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--sazsemaisi--aksaksemai----neyzen_aziz_dede.txt . TDV: Aziz Dede "bir peşrev ve dört saz semâisi … Bunlardan uşşak saz semâisi çok rağbet görmüştür" (https://islamansiklopedisi.org.tr/aziz-dede); ölüm: 7 Mart 1905 (TDV) → **KAMU MALI**. Başlıkta kayıtlı eser budur.
- Kod 51 satırları: Sira 1 `Aksaksemâî 10/8`, Sira 479 `Yürüksemâî II 6/8` (Offset 36), Sira 574 `Aksaksemâî 10/8` (Offset 60). Kod: Kod 9 ×677 (başka süreli kod yok).
- Ölçü 68. Bölümler (Soz1): 1. HANE (m1), TESLİM (m5, m9 …), 2. HANE (m13), 3. HANE (m25), 4. HANE (m37, 6/8), son TESLİM (m61). Hane yapısı: her haneyi 4 ölçülük teslim izliyor.
- Süre histogramı: 1/16 ×328, 1/8 ×152, 1/4 ×83, 3/16 ×26, 3/32 ×33, **1/32 ×33**, **1/12 ×12, 1/24 ×6**, 5/8 ×4 (5/8 bağlı iki parçaya bölünebilir).
- Engeller: (1) 10/8 Aksak Semâî usulü uygulamada yok (roadmap Seviye 6); (2) iki usul değişimi, dönüştürücü reddeder; ayrıca aralık alınırsa dönüştürücünün ilk satır kontrolü dosyanın ilk usulünü bekliyor (6/8'lik 4. hane için `olcuAraligi:[37,60]` denendi: "usul 10/8, beklenen 6/8"); (3) 1. hane (m1–4) ve teslimlerin çoğu 1/32, 3/32 ve 1/24 üçleme taşıyor (hata veren ölçüler: 1–4, 6, 8, 10, 12, 16, 18, 20, 22, 24, 28, 30, 32, 34, 36, 45, 57, 62, 64, 66, 68); (4) aralık dışı 9 nota: F4#4 (291) m1, E5b4 (332) ×6 m13 ve m26, B5b5 (362) ×2 m25.
- 4. hane (m37–60, 6/8) büyük ölçüde temiz (m37–44, 46–56, 58–61); yalnız m45 ve m57'de 6'lı 1/12 inici çizgisi var (F5'ten A4'e altı nota). Yani **6/8'lik 4. hane**, Yürük Semâî 6/8 ile ve "usul bu aralıkta 6/8" desteğiyle (dönüştürücüde başlangıç usulü) çalışılabilir, ama iki ölçüde üçleme ve haneyi tek başına almak eserin ruhunu bozar.
- **Hüküm: SKIP.** Aşama D'ye "Uşşak saz semâîsi" yerine ya Dede Salih Efendi'nin (aşağıda) ya da "Allah emrin tutalım" konabilir.

#### Dede Salih Efendi Uşşak saz semâîsi (alternatif, koşullu)
- `ussak--sazsemaisi--aksaksemai----dede_salih_efendi.txt`: 10/8 (m1–42), 6/4 "Yürüksemâî (6/4)" (Kod 51 Offset 42; m43–58, 4. hane), 10/8 (m59–66). 66 ölçü, 786 nota; üçleme ve 1/32 **yok**; aralık dışı **0**; yeni tiz yalnız m31'de (C6, B5b1 ×2).
- Bölümler: 1. HANE (m1), MÜLÂZİME (m7), 2. HANE (m15), MÜLÂZİME (m21), 3. HANE (m29), MÜLÂZİME (m35), 4. HANE (m43), MÜLÂZİME (m59). Süre: 1/16 ×480, 1/8 ×220, 1/4 ×63, 3/16 ×44, 3/8 ×8, 1/2 ×4.
- Dönüştürücü: `olcuAraligi [1,14]` ile 10/8 (1. hane + mülâzime) **hatasız** (`{measures:14, notes:171, rests:8}`). Yani 10/8 usulü eklenirse 1. hane + mülâzime hemen çıkar.
- Telif: besteci "Dede Salih Efendi" kimliği (Neyzen Salih Dede mi?) **BELİRSİZ**, ölüm yılı bulunamadı (TDV `salih-dede` adresi arama sayfasına düştü). Tahmin: 19. yy ya da 20. yy başı; 1955'ten sonra ölmediyse kamu malı.
- Not: 10/8 Aksak Semâî usulü (neyzenim vuruşu "DÜM 2, TE 1, KÂ 2, DÜM 2, TEK 2, TEK 1") roadmap'te Seviye 6'ya ait; çakışma için §7.

#### Gül yüzlülerin (Tab'î Mustafa Efendi): koşullu ADD, yalnız m1–16
- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/beyati--yuruksemai--yuruksemai--gul_yuzlulerin--tabi_mustafa_efendi.txt . Kod 51: tek satır `Yürüksemâî (6/4)`, Pay/Payda **6/4** (app'te `yuruk-semai` 6/8 → uyuşmaz).
- 64 ölçü; Offset 63,5 ile bitiyor (son ölçü yarım: "son ölçü tamamlanmamış"). Yapı: 32 ölçülük bölüm iki kez (m1–32, m33–64); her bölüm 4 hane parçası: m1–8 ("Gül yüzlülerin şevkine gel nûş edelim mey"), m9–16 ("Iyş eyleyelim yâr ile şimdi demidir hey"), m17–24 ("Bu kavli sürahi eğilip sağara söyler ne der"), m25–32 ("Düm de re lâ dir nâ te ne dir …"). Soz1'de "SAZ" işareti m8 (Sira 46), m16 (106), m32 (215), m40 (261), m48 (321).
- Süre histogramı (Kod 4/12 dahil, tüm dosya): 1/4 ×167, 1/8 ×112, 1/2 ×45, 2/4 ×20, 1/16 ×16, 3/16 ×8, 3/8 ×4, 3/4 ×4; üçleme/1/32 yok.
- Kod: 9 ×293, **10 ×36, 7 ×26, 11 ×12, 12 ×6, 4 ×3** süreli; Kod 8 ×52 süresiz. Ölçü 1–16 aralığında: Kod 9 ×78, Kod 10 ×8, Kod 7 ×6, **Kod 12 ×1, Kod 4 ×1** (SAZ satırları), Kod 8 ×12. **Kod 4 ve 12 için dönüştürücü değişikliği gerekir.**
- Perdeler (KomaAE): G4 296 ×2, A4 305 ×30, B4b1 313 ×44, C5 318 ×49, D5 327 ×75, E5 336 ×72, F5 340 ×24, **F5#1 341 ×4** (m19, 23, 51, 55; Kod 7, NotaAE "F5#1", Koma53 342; uygulamada **yok**), F5#4 344 ×4, G5 349 ×30, A5 358 ×30, B5b1 366 ×4, C6 371 ×4 (m18, 22, 50, 54). **m1–17 aralığı temiz ve yeni tiz perde içermiyor** (denendi: `[1,16]` ve `[1,17]` 6/4 ile hatasız, Kod→9 sayılırsa). 3. bölümün ilk iki ölçüsünden itibaren tiz ve F5#1 başlıyor.
- Sözlü (230 satırlık Soz1); güfte sahibi bulunamadı (**BELİRSİZ**); Tab'î Mustafa Efendi 18. yüzyıl (Lâle Devri) bestekârı (arama özeti, sayfa açılmadı; ölüm yılı BELİRSİZ, ama kamu malı). Eserin TDV Bayâtî maddesinde "Tab‘î Mustafa Efendi'nin … 'Gül yüzlülerin şevkine gel, nûş edelim mey' mısraı ile başlayan nakış yürük semâîsi" olarak anılması atfı destekliyor.
- **Hüküm: koşullu ADD, ölçü 1–16.** Gerekenler: 6/4 usulü, Kod 4/12'nin nota sayılması, `ParcaMakam`'a `beyati`, söz göstermeyecekse `soz:false`.

#### Çeçen Kızı (Tanburi Cemil Bey): koşullu ADD
- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt . Kod 51 `Nîmsofyan 2/4` (app'te `nim-sofyan` var). Tek usul, sözsüz, hane/teslim işareti **yok** (Soz1 boş).
- 56 ölçü, 285 nota. Kod 9 ×290, **Kod 10 ×4 (Sira 33, 39, 102, 108: D5 1/8)**, Kod 8 ×12 (süresiz çarpma). Süre histogramı: 1/16 ×210, 1/8 ×41 (4'ü Kod 10), 1/4 ×24, 3/8 ×4, 1/2 ×3, 3/32 ×6, **1/32 ×6**.
- **Önceki not doğrulandı.** 6 figür, hepsi "B4b1 3/32 + C5 1/32": Sira 225/226 (m41), 231/232 (m42), 237/238 (m43), 246/247 (m45), 252/253 (m46), 258/259 (m47). Dönüştürücü (Kod 10 → 9 sayılırsa) tam dosyada yalnız bu 6 satırda hata verir ("C5 süresi 1/32 temsil edilemiyor"); m44 temiz, m1–40 ve m48–56 temiz.
- `olcuAraligi:[1,40]` ile (Kod 10 → 9) **hatasız**: `{measures:40, notes:202, rests:9}`. Yapı: m1–12 ilk bölüm, m13–16 ilk ölçülerin tekrarı, m49 = m1 (başa dönüş benzeri). Hane işareti olmadığı için kırpma noktası bir tasarım kararı.
- Perdeler (KomaAE, tüm dosya): G4 296 ×16, A4 305 ×26, B4b1 313 ×38, C5 318 ×41, D5 327 ×57, E5 336 ×61, F5 340 ×8, F5#4 344 ×2, G5 349 ×10, A5 358 ×26. **Hepsi uygulamada var**, yeni tiz perde yok.
- Telif: Tanburi Cemil Bey ö. 28 Temmuz 1916 (https://en.wikipedia.org/wiki/Tanburi_Cemil_Bey) → **KAMU MALI**.
- **Hüküm: koşullu ADD.** Seçenek A: ölçü 1–40 (ya da 1–40 + 48–56 ayrı iki parça), değişiklik gerekmez ama figür atılır. Seçenek B: 1/32 için `DurationKind` genişletilir (kod değişikliği).

#### Lavtacı Andon Hüseynî peşrevi ve Tanburi Cemil Muhayyer peşrevi: SKIP
- Andon: `huseyni--pesrev--muhammes----lavtaci_andon.txt`, usul **Muhammes 32/4** (12 ölçü, ölçü başına 32 çeyrek), 613 Kod 9 + 14 Kod 11; 1/12 ×30, 1/24 ×12; aralık dışı 30 (F4#4 ×5, D5b4 (323) ×5, E5b4 ×5, F5#1 ×8, B5b5 ×3, B5 (367) ×3, E6 ×1); yeni tiz 31. Bölüm: 1.–4. HANE, TESLİM ×4, KARAR. Besteci ölüm yılı BELİRSİZ (İstanbul Ansiklopedisi kaydı arama özetinde; Andon Düzyan ile karıştırılmış olabileceği notu var).
- Tanburi Cemil: `muhayyer--pesrev--devrikebir----tanburi_cemil_bey.txt`, usul **Devr-i Kebîr 28/4** (13 ölçü; her ölçü ~53 nota), 691 Kod 9 + 9 Kod 11, üçleme/1/32 yok; aralık dışı 17 (F5#1 ×4, A5b4 (354) ×2, B5b5 ×5, B5b4 (363) ×6); yeni tiz 47. 1.–3. HANE + TESLİM'ler. Muhayyer peşrevinin Devr-i Kebîr olduğu en.wikipedia Tanburi Cemil eser listesiyle tutuyor.
- **Hüküm: SKIP** ikisi de: yok olan büyük usuller, ölçü başına onlarca nota (mevcut parça/porte modeli tasarlanmadı), aralık dışı perdeler.

### 6.3 Ek adaylar: sıralı öneri (Bayâtî / Hüseynî / Muhayyer / Kürdî / Uşşak, kamu malı, sade)

Sıralama ölçütü: yeni altyapı ihtiyacı az, perdeler app + yeni tizlerde, ezgi sade, besteci bilinen, telif temiz.

1. **Rauf Yekta seyir örnekleri**, üç makam: Bayâtî, Hüseynî, Muhayyer (`beyati--`, `huseyni--`, `muhayyer--seyir--semai--1--rauf_yekta.txt`).
   - Usul: Semâî 3/4 (var), tek usul, 32 ölçü, sözsüz, yalnız Kod 9. Süreler: Bayâtî 1/2 ×18, 1/4 ×53, 1/8 ×11, 3/8 ×1; Hüseynî 1/2 ×23, 1/4 ×50; Muhayyer 1/2 ×15, 1/4 ×63, 3/4 ×1. Üçleme/1/32 yok, aralık dışı 0.
   - Perdeler (KomaAE): Bayâtî A4–A5 (F5 Acem ×11); Hüseynî G4–A5 (F5#4 ×4, F5 ×5); Muhayyer A4–**D6**: B5b1 ×8, C6 ×4, D6 ×1 (yeni tiz perdeleri gösteriyor).
   - Dönüştürücü (3/4 ile) hatasız: 32 ölçü (Bayâtî 81 nota, Hüseynî 66, Muhayyer 75).
   - Telif: Rauf Yekta ö. 8 Ocak 1935 (https://islamansiklopedisi.org.tr/rauf-yekta-bey) → kamu malı; ama dosyaların gerçekten Rauf Yekta'ya ait "seyir örneği" olup olmadığını dosya adı dışında doğrulayamadım (**BELİRSİZ**: SymbTr üstverisi bu çalışmada açılmadı).
   - **ADD** (makam derslerinin eşlik eden örnek ezgileri olarak).
2. **Ceddin deden** (Hüseynî marş): `huseyni--mars--sofyan--ceddin_deden--kaptanzade_ali_riza_bey.txt`.
   - Sofyan 4/4 (var), 46 ölçü, Kod 9 ×250. Süre: 1/4 ×62, 1/8 ×18, 1/16 ×80, 3/16 ×68, 1/2 ×18, 3/8 ×4. Perdeler: G4–G5 (G4 ×8, A4 ×26, B4b1 ×28, C5 ×30, D5 ×60, E5 ×68, F5 ×16, G5 ×4); hepsi app'te.
   - Bölüm: ARANAĞME (m1–9), sözlü m10–46 (sözler: "Ceddin deden neslin baban hep kahraman Türk milleti …"). Dönüştürücü hatasız (`{measures:46, notes:240, rests:10}`).
   - Telif/atıf: SymbTr'de besteci "Kaptanzade Ali Rıza Bey"; **TDV** Ali Rıza Şengel (1879–1953) maddesinde "Şengel'in hüseynî makamında bestelediği, 'Ceddin deden neslin baban' mısraıyla başlayan eski Ordu Marşı" diyor (https://islamansiklopedisi.org.tr/sengel-ali-riza). İki ad aynı kişi mi, SymbTr atfı yanlış mı belirsiz (**BELİRSİZ**). Her iki ölüm yılı için (Şengel 1953; Kaptanzade 1934 ya da ~1939, arama özeti) +70 yıl geçmiş: kamu malı. Güfte sahibi bulunamadı (BELİRSİZ; sözlü gösterim planlanırsa risk). neyzenim `_13` bu eseri Sofyan örneği olarak veriyor ("ceddindeden.gif").
   - **ADD**, atıf metni ihtiyatlı yazılarak ("Ordu Marşı", besteci: kaynaklar ayrışıyor).
3. **Düşeli bu aşkın** (Dede Efendi, Muhayyer ilahi): `muhayyer--ilahi--sofyan--duseli_bu_askin--dede_efendi.txt`.
   - Sofyan 4/4, 48 ölçü, sözsüz (Soz1 boş), Kod 9 ×294 + 4 süresiz. Süre: 1/8 ×170, 1/4 ×54, 1/16 ×37, 3/16 ×17, 1/2 ×14, 3/8 ×2. Tek aralık dışı nota **E6 (389), m27'de**; geri kalanı app + yeni tizler: B5b1 ×29, C6 ×26, D6 ×8.
   - m1–26 ve m28–48 temiz. Yani yeni üç tiz perdeyi (Tiz Segâh, Tiz Çârgâh, Tiz Nevâ) ve Muhayyer'in tiz bölgesini gösteren, Seviye 4 için uygun bir eser; ama tiz yoğunluğu (63 nota) acemi için yorucu → **m1–26** önerilir.
   - Telif: Dede Efendi (Hammâmîzâde İsmâil) ö. 1846 (Aşama C notu) → kamu malı. Eserin gerçekten Dede Efendi'ye atfı yalnız SymbTr dosya adı (TDV Muhayyer maddesinde yok; BELİRSİZ).
   - **ADD (koşullu: m1–26).**
4. **Senden bilirim** (Tanburi Ali Efendi, Hüseynî yürük semâî): `huseyni--sarki--yuruksemai--senden_bilirim--tanburi_ali_efendi.txt`.
   - **6/4** (app'te yok), 50 ölçü, Kod 9 ×428 + Kod 8 ×20. Süre: 1/8 ×282, 1/4 ×65, 3/8 ×26, 1/2 ×21, 1/16 ×25, 3/16 ×9. Üçleme/1/32 yok. Perdeler: A4 ×34, B4b1 ×40, C5 ×52, D5 ×102, E5 ×107, F5 ×16, F5#4 ×15, G5 ×33, A5 ×19, **B5b1 ×3** (m33, 35, 37). Aralık dışı 0.
   - Bölüm: ARANAĞME m1–8 (Soz1 "ARANAĞME" iki yerde), "SAZ" m14, "KARAR" m50 (Sira 442); sözlü ilk satır m9: "Senden bilirim yok bana bir faide ey gül". `[1,8]` 6/4 ile hatasız (`notes:58`).
   - Telif: Tanburi Ali Efendi ö. 1890 ya da 1902 (Aşama C notunda da BELİRSİZ; açıkladığı gibi iki tarih için de +70 geçmiş) → kamu malı. Güfte sahibi BELİRSİZ. neyzenim `_13` bu eseri Yürük Semâî örneği olarak veriyor ("senden_bilirim.gif").
   - **ADD (koşullu: 6/4)**.
5. **Hicran oku** (Şevki Bey, Hüseynî şarkı, Türk aksağı): `huseyni--sarki--turkaksagi--hicran_oku--sevki_bey.txt`.
   - **5/8** (app'te yok), 112 ölçü, Kod 9 ×590 + Kod 10 ×6 + Kod 8 ×24. Süre: 1/8 ×324, 1/16 ×210, 1/4 ×46, 3/16 ×10, 1/2 ×6. Aralık dışı **B5 (367) ×2** (m34 ve m90); yeni tiz perdesi yok.
   - Bölüm: ARANAĞME m1–16, sözlü m17'den ("Hicran oku sînem deler"), SAZ m24, ARANAĞME m57, SAZ m80. `olcuAraligi [1,16]` 5/8 ile hatasız (`notes:92, rests:6`); m1–33, m35–89, m91–112 temiz.
   - Telif: Şevki Bey ö. 20 Temmuz 1890 (https://islamansiklopedisi.org.tr/sevki-bey); TDV "Hicran oku sînem deler"i Şevki Bey'in Hüseynî şarkıları arasında sayıyor → kamu malı. Güfte sahibi BELİRSİZ. neyzenim `_13` (Türk aksağı örneği) ve `_10` (Hüseynî örneği) kullanıyor.
   - **ADD (koşullu: Türk aksağı usulü; aranağme m1–16).**
- Alternatifler: **Allah Allah** (Ali Ufkî, Hüseynî, Ağırdüyek 8/4): 24 ölçü, yalnız 1/4 (×144) ve 1/2 (×24) süre, perdeler A4–A5, hepsi app'te, en sade eser; 8/4 mertebesi gerekir (`ö. 1675 [?]`, TDV; güfte BELİRSİZ). **Gelse nesîm-i** (Bayâtî, "Senginsemâî" 6/4, atfı IV. Murad): 56 ölçü, G4–E5, süre 1/2, 1/4, 3/4, 3/2; çok sade; 6/4 gerekir. TDV Murad IV: "yürük semâi ve ilâhiden müteşekkil on beş eserinin listesini" (Öztuna) ve altısı Hüseynî olmak üzere 13 peşrev anıyor ama bu eseri açıkça anmıyor → atıf **BELİRSİZ** (https://islamansiklopedisi.org.tr/murad-iv). **Nûr-i fahr-i âleme** (Dede Efendi, TDV Hüseynî maddesinde "tevşîhi" olarak anılıyor, 6/4, 58 ölçü, sözsüz, 10 yeni tiz nota).
- **Uşşak için**: **Allah emrin tutalım** (Zekâî Dede). Düyek 8/8 (var), 24 ölçü, 180 nota, Kod 9 ×182. Süre: 1/16 ×76, 1/8 ×62, 1/4 ×30, 3/16 ×12, 7/8 ×2 (bağlı ¾+⅛). Perdeler: G4–G5, mostly G4–D5 (G4 ×16, A4 ×46, B4b1 ×36, C5 ×32, D5 ×40, E5 ×6, F5 ×2, G5 ×2): **en rahat aralık**. 84 hece, söz: "Allah emrin tutalım / Rahmetine batalım / Bülbül gibi ötelim". Dönüştürücü hatasız (`{measures:24, notes:180, rests:2, tiedRows:2}`). Zekâî Dede ö. 24 Kasım 1897 (TDV) → kamu malı; güfte sahibi BELİRSİZ. **Uyarı**: TDV Uşşak maddesi aynı ilahiyi "nîm-sofyan usulünde" diye veriyor, SymbTr dosyası Düyek; hangisinin doğru olduğu belirsiz (**BELİRSİZ**), usul etiketi için SymbTr kullanılacaksa not düşülmeli.
- **Kürdî için eser yok**: 14 dosyanın 7'si temiz ama hepsi çok kısa örnek ezge (`kurdi--ornek_oz`, `seyir`, `aranagme`: 2–16 ölçü; bestecileri Ruhi Ayangil, Erol Bingöl, Şefik Gürmeriç ya da boş, **telif BELİRSİZ**) ya da anonim türkü (`hastane_onunde` 1/32 ×109; `dalda_cikmis` aralık dışı 24). Kürdî makamı dizi/dörtlü etüdüyle anlatılabilir; `kurdi--aranagme--nimsofyan--1--` (16 ölçü, 2/4, G… A4–E5, bestecisi boş) tek kullanışlı kısa ezge, ama kimlik/telif BELİRSİZ.

### 6.4 Dönüştürücü ve model gereksinimleri (bu aşamanın eserleri için)

| İhtiyaç | Gerekçe |
|---|---|
| `usuller.ts`: 6/4 yürük semâî (aynı vuruş), 5/8 Türk aksağı, 7/8 ya da 7/4 Devr-i Hindî, 8/4 ağırdüyek (opsiyonel) | Senden Bilirim, Gülyüzlülerin, Hicran Oku, Allah Allah |
| `scripts/symbtr-to-json.mjs`: `KOD_NOTA`'ya **4 ve 12** (ve Aşama C'de belirlenen 1, 7) | Gülyüzlülerin "SAZ" satırları |
| `ParcaMakam`: `beyati`, `huseyni`, `muhayyer`, (`kurdi`) | SymbTr "beyati" yazımı |
| Aralık başında usul okuma (kısmi aralıkta ilk Kod 51 yerine aralığın usulü) | Aziz Dede 4. hane, Dede Salih 4. hane (6/4) |
| 1/32 desteği (`DurationKind` genişletme) | Çeçen Kızı m41–47 (yoksa m1–40 ile yetinilir) |
| KomaAE yazım normalleştirmesi (`D5#4→E5b5`, `A4#4→B4b5`, `G5#4`/`A5b5` benzeri) | Aşama C'den devam; bu aşamanın adaylarında `E5b4` (332, Hisar) ve `B5b5` (362) de geçiyor, bunlar ayrı perdeler |
| Soz1 "." / "ARANAĞME" / "SAZ" / "KARAR" hece süzmesi | Senden Bilirim, Hicran Oku, Ceddin Deden |
| Porte: ek çizgi/üst sınır testi (D6, C6#4) | §1 |

## 7. Açık sorular

1. **Tiz Segâh adı**: MEB "tiz bûselik", neyzenim "TİZ SEGAH". Uygulama Segâh tabanlı; B5 doğal (367) için ayrı fingering kaynakta yok. Karar: Tiz Segâh = B5b1, Bûselik ayrıca sunulmaz.
2. **Kapalı Gerdâniye/Muhayyer üfleme şiddeti** kaynakta yazılı değil. "Açık olandan daha sert" demek kendi çıkarımım; bir ney çalan ya da hoca ile doğrulanmalı. Bu iki perde aynı yazılı perde olduğundan mikrofon takibinde ve `samePitch` aramalarında ayrım gerekir (Aşama C açık soru 4'ün devamı).
3. **"tu" hecesi** (Aşama B dersi) kaynaklarda doğrulanmadı; ney'de dil hecesi/"hû" konusu BELİRSİZ. Seviye 4 dil dersi yazılmadan önce dil anlatımının kaynağı (bir hoca) netleşmeli.
4. **Staccato gösterimi**: Türk müziği notasında nokta işareti kullanımı BELİRSİZ; uygulamaya `stak` alanı eklemek ya da "yarı nota + sus" yazımıyla yetinmek bir tasarım kararı.
5. **Yürük semâî mertebesi**: kaynaklar 6/4'ün çok kullanıldığını söylüyor (TDV: form "daha çok 6/4"); mevcut `yuruk-semai` 6/8. İkisi ayrı usul kimliği mi olsun, mertebe alanı mı eklensin? Aynı soru Devr-i Hindî (7/8 mi 7/4 mü; neyzenim "en çok kullanılan ikinci mertebe", yani 7/4) ve Ağırdüyek 8/4 için de geçerli.
6. **Roadmap çelişkisi**: Aşama D hedefi "Aziz Dede Uşşak saz semâîsi" (Aksak Semâî 10/8) iken Aksak Semâî usulü roadmap'te Seviye 6. Aziz Dede dosyası ayrıca üçleme/1/32/aralık dışı yüzünden bu hâliyle eklenemiyor. Seçenek: Dede Salih Efendi m1–14 (10/8 desteğiyle) ya da hedefi "Allah emrin tutalım"a çevirmek.
7. **Bayâtî seyir yönü** (çıkıcı-inici / inici) kaynaklarda çelişiyor; anlatımda yön söylenmemeli.
8. **Eserlerin güfte telifi**: Gülyüzlülerin, Senden Bilirim, Hicran Oku, Allah emrin tutalım, Ceddin Deden, Gelse nesîm-i için güfte sahibi bulunamadı; sözlü gösterim `soz:false` ile kapatılabilir.
9. **Atıf kayıtları**: Ceddin Deden (Kaptanzade mi, Şengel mi), Gelse nesîm-i (IV. Murad?), Rauf Yekta seyir örnekleri, Düşeli bu aşkın (Dede Efendi?), Dede Salih Efendi kimliği, Lavtacı Andon ve Tab'î Mustafa Efendi ölüm yılları: SymbTr dosya adı dışında doğrulanamadı.
10. **Uşşak ilahisi usulü**: "Allah emrin tutalım" için TDV nîm-sofyan, SymbTr Düyek.
11. **Hüseynî/Muhayyer genişlemesi** için Tiz Bûselik (B5) ve Tiz Hüseynî (E6) uygulamada yok; fingering kaynağı bulunamadı. Seviye 4 dersleri tiz bölgeyi B5b1/C6/D6'yla sınırlamalı.
12. **Kürdî eseri**: temiz, kamu malı, sade bir Kürdî eseri taranan 14 dosyada yok; Kürdî yalnız dizi/etüt olarak mı gelsin, yoksa SymbTr dışında bir kaynak mı aransın?
