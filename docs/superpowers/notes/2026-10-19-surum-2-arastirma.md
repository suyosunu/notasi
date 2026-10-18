# Sürüm 2 içerik araştırması (2026-10-19)

Bu not Sürüm 2 içerik kararları için kaynaklı bir başvuru belgesidir: AEU işaretleri, Rast/Uşşak/Hicaz, usuller, 3. kademe ney perdeleri ve SymbTr eserleri.
Kural: Burada **KESİN** olarak işaretlenen her bilgiyi, okuduğum bir kaynak açıkça söylüyor. **BELİRSİZ** olanlar aday bilgidir; uygulamada kullanıcıya doğrulanmış gibi gösterilmemeli.
Koma konumları, Kaba Çârgâh (C4) = 0 alınarak verildi (Wikipedia "Turkish makam" tablosu; SymbTr'de Rast = G4, Çârgâh = C5).

## Özet tablo: Kesin / Belirsiz

| Konu | Durum | Not |
|---|---|---|
| 8 AEU işaretinin SMuFL kod noktası ve adı (U+E440–E447) | KESİN | smufl.formats.music |
| İşaret ↔ koma eşlemesi ve şekiller | KESİN | 3 kaynak uyuşuyor: SMuFL/Bravura, Wikipedia, SymbTr |
| **Düz ♭ = 5 koma (küçük mücenneb), düz ♯ = 4 koma (bakiye)**: işaretler simetrik değil | KESİN | En kolay hata yapılacak nokta |
| Rast, Uşşak, Hicaz: dizi, durak, güçlü, yeden, donanım, seyir | KESİN | TDV İslâm Ansiklopedisi (İ. H. Özkan) |
| Hicaz donanımında işaretlerin yazılış sırası | BELİRSİZ | SymbTr sırası B, F, C; kural kaynağı bulamadım |
| Sofyan, Düyek, Semâî, Yürük Semâî, Aksak vuruşları ve süreleri | KESİN | neyzenim ders 13 + tr.wikipedia "Usûl" (birbirini tutuyor) |
| Düm ve te sağ elle, tek ve ke sol elle; iki çizgili yazımda üst çizgi sağ el | KESİN | TDV "Usul" |
| "Dolap" usulü: 12/8 (12 zaman, mertebe 8) | KESİN | SymbTr usul verisi (id 76) + divanmakam arşivi |
| "Dolap" usulünün düm-tek kalıbı | **BELİRSİZ** | Hiçbir kaynakta yok; büyük olasılıkla esere göre konmuş bir etiket |
| Ney 3. kademe: Hüseynî, Acem, açık Gerdâniye, açık Muhayyer, Eviç parmakları | KESİN | neyzenim ders 6 (başparmak + 6 delik açıkça) |
| Ney: Kürdî / Dik Kürdî, Nim Hicaz, Segâh parmakları | KESİN | neyzenim ders 2, 5, 10 + tr.wikipedia |
| Ney: Hicaz (58) ile Nim Hicaz (57), Kürdî (44) ile Dik Kürdî (45) ayrımı | BELİRSİZ | Parmak aynı; fark dudak/baş açısıyla veriliyor, ölçü yok |
| Ney: Irak (F♯4, "Dağlar ile"de geçiyor) | BELİRSİZ (kısmen) | neyzenim 11: tüm delikler açık + baş/dudak; kademe belirtilmemiş |
| 4 SymbTr eserinin dosyaları ve URL'leri | KESİN | 8 URL HTTP 200 döndü (txt + MusicXML) |
| SymbTr txt sütun biçimi | KESİN | Dosya + code_explanations.xlsx + symbtrdataextractor okuyucusu |
| SymbTr lisansı: CC BY-NC-SA 4.0 | KESİN | Repo LICENSE ve README |
| Eserlerin besteci telif durumu ("Seyyah olup": Nurettin Dadaloğlu) | BELİRSİZ | Besteci bilgisi yalnızca SymbTr mu2 başlığında var |

---

## 1. AEU değiştirme işaretleri (glifler)

### Kaynaklar
- SMuFL tablosu, "Arel-Ezgi-Uzdilek (AEU) accidentals (U+E440–U+E44F)": https://smufl.formats.music/latest/tables/arel-ezgi-uzdilek-aeu-accidentals.html (eski adres w3c.github.io/smufl → w3c-cg.github.io → buraya yönleniyor). Sayfa yalnızca kod noktası, ad ve kısa açıklama veriyor ("Koma (flat)" gibi), şekil tarifi yok.
- Şekiller, SMuFL'nin referans fontu **Bravura** (v1.482) üzerinden doğrulandı: https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist/otf/Bravura.otf glifleri büyük boyutta çizdirip inceledim. Sınır kutuları (bounding box) https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist/Bravura.json dosyasından alındı. Bravura'nın lisansı SIL OFL 1.1 (https://raw.githubusercontent.com/steinbergmedia/bravura/master/LICENSE.txt).
- Wikipedia "Turkish makam", Accidentals tablosu (ham wikitext: https://en.wikipedia.org/w/index.php?title=Turkish_makam&action=raw):
  - Diyezler: `Arabic music notation half sharp.svg` = 1 koma, `Sharp.svg` = 4 koma, `ArelEzgiUzdilek kuçuk sharp.svg` = 5 koma, `ArelEzgiUzdilek büyük mücenneb sharp.svg` = 8 koma.
  - Bemoller: `ArelEzgiUzdilek büyük mücenneb flat.svg` = 8 koma, `Flat.svg` = 5 koma, `Arabic music notation half flat.svg` (çizgili bemol) = 4 koma, `Llpd-½.svg` (ters bemol) = 1 koma.
- SymbTr code_explanations.xlsx, kod 63 (nts): "TSM (Arel – Ezgi. Bu takdirde b2'ler b1'e, b3'ler b4'e vb., yani sırasıyla **ters** ve çengelli bemole vb. dönüştürülmeli)". Bu cümle 1 komalık bemolün ters bemol olduğunu doğruluyor. https://raw.githubusercontent.com/MTG/SymbTr/master/code_explanations.xlsx
- SymbTr MusicXML dosyaları da aynı eşlemeyi kullanıyor: bakiye bemolü `slash-flat`, bakiye diyezi `sharp`, koma bemolü `quarter-flat` (MusicXML'de ters bemol olarak çizilir).

Üç kaynak birbirini tutuyor → **KESİN**.

### Tablo
Ölçüler Bravura'dan, **porte aralığı (staff space, sp)** biriminde verildi. y = 0 notanın çizgisi/aralığı, yukarı pozitif.

| Kod noktası | SMuFL adı | Koma | Türkçe adı | Şekil (SVG çizimi için) | Bravura bbox (SW → NE), genişlik |
|---|---|---|---|---|---|
| U+E443 | accidentalKomaFlat | −1 | koma bemolü | **Ters (aynalanmış) bemol**: gövde sağda, göbek sola açılıyor ("d" harfine benzer). Düz bemolün yatay aynası. | (0.00, −0.70) → (0.91, 1.76); 0.92 |
| U+E442 | accidentalBakiyeFlat | −4 | bakiye bemolü | **Düz bemol + bir eğik çizgi**: kalın, kısa bir çubuk gövdeyi göbeğin üstünde keser (y ≈ +0.9…+1.3 sp). Soldan sağa hafif yükselir; gövdenin solunda kısa, sağında daha uzun uzanır. | (0.00, −0.70) → (1.14, 1.76); 1.15 |
| U+E441 | accidentalKucukMucennebFlat | −5 | küçük mücenneb bemolü | **Standart bemol ♭**. Bbox, `accidentalFlat` ile birebir aynı. | (0.00, −0.70) → (0.90, 1.76); 0.91 |
| U+E440 | accidentalBuyukMucennebFlat | −8 | büyük mücenneb bemolü | **Düz bemol + iki paralel eğik çizgi**: E442'deki çubuktan iki tane, gövdenin üst kısmında üst üste. | (0.00, −0.70) → (1.15, 1.75); 1.15 |
| U+E444 | accidentalKomaSharp | +1 | koma diyezi | **Tek dikey çizgili diyez**: bir dikey gövde ve onu kesen iki paralel, kalın, sağa yükselen çubuk (Arap notasyonundaki "half sharp" şekli). | (0.00, −1.35) → (0.92, 1.29); 0.92 |
| U+E445 | accidentalBakiyeSharp | +4 | bakiye diyezi | **Standart diyez ♯** (iki dikey, iki eğik çubuk). Bbox, `accidentalSharp` ile birebir aynı. | (0.00, −1.39) → (1.00, 1.40); 1.00 |
| U+E446 | accidentalKucukMucennebSharp | +5 | küçük mücenneb diyezi | **Tek dikey gövde + üç eğik çubuk**: üst ve alttaki çubuklar kısa (E444'teki gibi). Ortadaki çubuk daha uzun, iki yana taşar. | (0.00, −1.35) → (1.36, 1.28); 1.36 |
| U+E447 | accidentalBuyukMucennebSharp | +8 | büyük mücenneb diyezi | **Standart diyez + ortada uzun bir üçüncü eğik çubuk**: iki dikey, üç çubuk; ortadaki iki yana taşar. | (0.00, −1.40) → (1.36, 1.39); 1.37 |

Türkçe adlar: "koma bemolü", "bakiye diyezi", "bakiye bemolü" kalıpları TDV maddelerinde birebir geçiyor (Rast: "si için koma bemolü, fa için bakiye diyezi"; Hicaz: "si için bakiye bemolü"). "küçük/büyük mücenneb bemolü/diyezi" aynı kalıpla kuruldu. Wikipedia "mücenneb", bazı Türkçe kaynaklar "mücennep" yazıyor.

### Uygulama için uyarılar
- **Asimetri (KESİN):** Batı'nın düz bemolü AEU'da **5 koma** (küçük mücenneb), düz diyezi ise **4 koma** (bakiye). Bakiye bemolü düz bemol değil, çizgili bemoldür.
- Kapsamımızdaki perdelerin yazımı (Wikipedia tablosu + TDV):
  - Segâh (48) = Si koma bemolü (ters bemol). Eviç (79) = Fa bakiye diyezi (♯). Irak (26) = Fa bakiye diyezi (♯).
  - Dik Kürdî (45) = Si bakiye bemolü (çizgili bemol). Kürdî (44) = Si küçük mücenneb bemolü (düz ♭).
  - Nim Hicaz (57) = Do bakiye diyezi (♯). Hicaz (58) = Do küçük mücenneb diyezi. Dik Hicaz (61) = Do büyük mücenneb diyezi.
- SVG için en güvenli yol: Bravura glif konturlarını (OFL 1.1) doğrudan path olarak almak ya da font olarak gömmek. OFL'de değiştirilmiş sürüm "Bravura" adını taşıyamaz. Kendi çizimimizi yapacaksak yukarıdaki tarif ve oranlar yeterli.

---

## 2. Makamlar: Rast, Uşşak, Hicaz

Kaynaklar (hepsi İsmail Hakkı Özkan, TDV İslâm Ansiklopedisi):
- Rast: https://islamansiklopedisi.org.tr/rast
- Uşşak: https://islamansiklopedisi.org.tr/ussak
- Hicaz (musiki): https://islamansiklopedisi.org.tr/hicaz--musiki (`/hicaz` adresi coğrafya maddesi, yanlış sayfa)
- Koma konumları: Wikipedia "Turkish makam" nota tablosu. Kontrol: SymbTr'nin KomaAE değerleri aynı (aşağıda §5).

Aralık kısaltmaları: K = koma (1), B = bakiye (4), S = küçük mücenneb (5), K8 = büyük mücenneb (8), T = tanînî (9), A12 = artık ikili (12).

### 2.1 Rast (KESİN)
- **Dizi:** Rast beşlisi (Rast perdesinde) + Rast dörtlüsü (Nevâ perdesinde).

| Perde | Rast | Dügâh | Segâh | Çârgâh | Nevâ | Hüseynî | Eviç | Gerdâniye |
|---|---|---|---|---|---|---|---|---|
| Yazılış | G4 | A4 | B4 koma ♭ | C5 | D5 | E5 | F5 bakiye ♯ | G5 |
| Koma | 31 | 40 | 48 | 53 | 62 | 71 | 79 | 84 |
| Aralık | | T | K8 | S | T | T | K8 | S |

- İnişte Eviç yerine **Acem (F5, 75)** kullanılır. Böylece Nevâ'daki rast dörtlüsü bûselik dörtlüsüne döner ("acemli rast dizisi").
- **Durak:** Rast (G4). **Güçlü:** Nevâ (D5). **Yeden:** Irak (F4 bakiye ♯, 26).
- **Donanım:** Si için koma bemolü, Fa için bakiye diyezi.
- **Seyir:** Mutlak çıkıcı. Durak, durak civarı ya da pest bölgeden başlanır. Orta bölgede dolaşılıp Nevâ'da yarım karar yapılır, sonunda Rast'ta yedenli tam karar verilir. Dügâh'ta uşşaklı, Segâh'ta segâhlı/ferahnâklı asma kararlar sık görülür. Pest tarafta Yegâh'a bir rast dörtlüsü eklenerek genişler.

### 2.2 Uşşak (KESİN)
- **Dizi:** Uşşak dörtlüsü (Dügâh'ta) + Bûselik beşlisi (Nevâ'da). TDV perdeleri pesten tize böyle sıralıyor: dügâh, segâh, çârgâh, nevâ, hüseynî, acem, gerdâniye, muhayyer.

| Perde | Dügâh | Segâh | Çârgâh | Nevâ | Hüseynî | Acem | Gerdâniye | Muhayyer |
|---|---|---|---|---|---|---|---|---|
| Yazılış | A4 | B4 koma ♭ | C5 | D5 | E5 | F5 | G5 | A5 |
| Koma | 40 | 48 | 53 | 62 | 71 | 75 | 84 | 93 |
| Aralık | | K8 | S | T | T | B | T | T |

- **Durak:** Dügâh (A4). **Güçlü:** Nevâ (D5); yarım karar Nevâ'da bûselik çeşnisiyle yapılır. **Yeden:** Rast (G4).
- **Donanım:** Yalnızca Si için koma bemolü.
- **Seyir:** Çıkıcı. Durak civarından ya da pest genişlemiş bölgeden başlar. Önce Dügâh'taki uşşak dörtlüsünde dolaşılır, sonra Nevâ çevresinde gezinilip Nevâ'da yarım karar yapılır. Sonunda Dügâh'ta uşşak çeşnili tam karar verilir.
- **En önemli asma karar Segâh'tır** (segâh ve ferahnâk çeşnileriyle). Segâh'ta segâh çeşnisi için Hüseynî'ye koma bemolü gerekir. Pest tarafta Yegâh'a kadar bir rast beşlisiyle genişler.
- Pedagojik not (TDV): Segâh inici seyirde 1–2 koma daha pest basılır. Bunun için ayrı işaret yoktur, yine koma bemolüyle yazılır. SymbTr de Uşşak eserlerinde Nota53 sütununda Segâh'ı "Si4b2" (2 koma) yazıyor, AEU sütununda "B4b1".

### 2.3 Hicaz (KESİN)
- **Dizi:** Hicaz dörtlüsü (Dügâh'ta) + Rast beşlisi (Nevâ'da).

| Perde | Dügâh | Dik Kürdî | Nim Hicaz | Nevâ | Hüseynî | Eviç | Gerdâniye | Muhayyer |
|---|---|---|---|---|---|---|---|---|
| Yazılış | A4 | B4 bakiye ♭ | C5 bakiye ♯ | D5 | E5 | F5 bakiye ♯ | G5 | A5 |
| Koma | 40 | 45 | 57 | 62 | 71 | 79 | 84 | 93 |
| Aralık | | S | A12 | S | T | K8 | S | T |

  Perde adları TDV'nin donanım cümlesinden: "si için bakiye bemolü (dik-kürdî), fa ve do için bakiye diyezi (eviç ve nîm-hicaz)". Aralıkları koma konumlarından ben hesapladım: Hicaz dörtlüsü 5+12+5 = 22.
- **Durak:** Dügâh. **Güçlü:** Nevâ; burada rast çeşnisiyle yarım karar yapılır. **Yeden:** Rast (bazı klasik formlarda istisna olarak nîm-zirgüle).
- **Donanım:** Si bakiye bemolü, Fa bakiye diyezi, Do bakiye diyezi. Yazılış sırası BELİRSİZ: SymbTr mu2/MusicXML'de sıra B♭, F♯, C♯.
- **Asma kararlar:** Rast (nikrizli), Nim Hicaz ve Dik Kürdî (çeşnisiz). Ayrıca Nevâ'da bûselikli, Hüseynî'de uşşaklı ve hicazlı asma kararlar görülür.
- **Seyir:** İnici-çıkıcı, bazen çıkıcı. Durak ya da güçlü civarından başlanır. Güçlüde yarım karar yapıldıktan sonra dizide dolaşılır, Dügâh'ta tam karar verilir.
- **Genişleme:**
  - Pest tarafta, güçlü üzerindeki rast beşlisi durağın altına aktarılır: Yegâh D4, Hüseynî-aşîrân E4, **Irak F4 bakiye ♯ (26)**, Rast G4, Dügâh A4.
  - Tiz tarafta Nevâ'da acemli rast dizisi (Acem F5 doğal) ya da sûzinak dizisi kullanılır. "Dağlar ile" eserindeki F4♯4 ve doğal F5 notaları bununla açıklanıyor (§5).

Ek kaynak (yalnızca arama özetinde görüldü, sayfa açılmadı): kureansiklopedi.com/tr/detay/hicaz-2 aynı donanım cümlesini veriyor.

---

## 3. Usuller

Kaynaklar:
- neyzenim ders 13, "Türk Müziğinde Bugüne Kadar Kullanılan Usûller": https://www.neyzenim.com/neydersleri_13.html
- tr.wikipedia "Usûl" (LilyPond gösterimleri): https://tr.wikipedia.org/w/index.php?title=Us%C3%BBl&action=raw
- TDV "Usul" (İ. H. Özkan): https://islamansiklopedisi.org.tr/usul--musiki ve TDV "Sofyan": https://islamansiklopedisi.org.tr/sofyan

Genel kurallar (TDV, KESİN):
- "Düm ve te darpları sağ elle sağ dize; tek, kâ ve ke darpları sol elle sol dize vurulur."
- Usuller iki paralel çizgi üzerinde yazılır: üst çizgi sağ eli (düm, te), alt çizgi sol eli (tek, ke) gösterir.
- Kesrin üstü zaman sayısı, altı birim değeridir ("usulün mertebesi").
- tr.wikipedia tek çizgili gösterimde sağ el darpları sapı yukarı, sol el darpları sapı aşağı yazılır. Uzatılmış heceler (düüm, teek) 2 birimlik darbı gösterir.

| Usul | Ölçü | Darp sayısı | Vuruşlar (süre birim cinsinden) | Nota değerleriyle |
|---|---|---|---|---|
| Sofyan | 4/4 (ayrıca 4/8, 4/2) | 3 | DÜM 2, TE 1, KE 1 | Düm = ikilik, te = dörtlük, ke = dörtlük. Güçlü / yarı güçlü / zayıf (TDV) |
| Düyek | 8/8 (ayrıca 8/4) | 5 | DÜM 1, TEK 2, TEK 1, DÜM 2, TEK 2 | ♪ ♩ ♪ ♩ ♩ |
| Semâî | 3/4 (ayrıca 3/8, 3/2) | 3 | DÜM 1, TEK 1, TEK 1 | ♩ ♩ ♩ |
| Yürük Semâî | 6/8 (ayrıca 6/4, 6/2) | 5 | DÜM 1, TEK 1, TEK 1, DÜM 1, TEK 2 | ♪ ♪ ♪ ♪ ♩ |
| Aksak | 9/8 (ayrıca 9/16, 9/4) | 6 | DÜM 2, TE 1, KE 1, DÜM 2, TEK 2, TEK 1 | ♩ ♪ ♪ ♩ ♩ ♪ |

İki kaynak (neyzenim ve tr.wikipedia) beş usulde de birebir aynı → **KESİN**. tr.wikipedia Sofyan'ı 4/8 mertebesinde gösteriyor (düm4 te8 ke8); oranlar aynı. TDV'ye göre en yaygın mertebe 4/4.

### "Dolap" usulü
- **KESİN:** SymbTr'nin usul verisinde (https://raw.githubusercontent.com/sertansenturk/symbtrdataextractor/master/symbtrdataextractor/makam_data/usul.json) `"dolap"` kaydı var: mu2_name "Dolap", symbtr_internal_id **76**, num_pulses **12**, mertebe **8**. Yani **12/8**.
- Bu usul tüm SymbTr'de yalnızca 2 dosyada geçiyor: `ussak--ilahi--dolap--benim_adim--` ve `gerdaniye--rumeliturkusu--dolap--kirimdan_gelirim--rumeli`.
- İkinci kaynak: divanmakam arşivi aynı Yunus Emre şiirinin bestesini ("Dolap niçin inilersin", Uşşak, İlahi, bestekârı belirsiz) **"Usûl: Dolap (12/8)"** diye listeliyor: https://divanmakam.com/forum/dolap-nicin-inilersin-belirsiz-ussak.12078/ (Arşiv No 14677). "Benim adım dertli dolap" bu şiirin bir kıtasıdır.
- **BELİRSİZ: düm-tek kalıbı.** TDV "Usul", neyzenim'in kapsamlı listesi ve tr.wikipedia'da "Dolap" adlı usul yok. Neyzenim'de 12 zamanlı olarak yalnızca Frenkçin, Nim Çember, İkiz Aksak ve Mazmuri listelenmiş.
- SymbTr mu2 dosyalarındaki öbekleme (Kod 14) iki eserde farklı: "Benim adım" `2121222`, "Kırım'dan gelirim" `11121222`. Bu yüzden öbekleme usulün değil, esere özgü kiriş (beam) gruplamasıdır.
- "Benim adım"ın her ölçüsü gerçekten 2+1+2+1+2+2+2 sekizlik ritmiyle ilerliyor (Sol-Do | Si | Do | Si | Do | Re-Do | Si).
- Değerlendirmem: "Dolap" klasik usul repertuvarında yerleşik bir usul değil. Büyük olasılıkla bu ilahi/türkü için konmuş bir 12/8 etiketi.
- Öneri: Uygulamada "12/8 (Dolap)" diye göster, düm-tek kalıbı **gösterme**. Gerekirse eserin kendi 2+1+2+1+2+2+2 ritim gruplamasını "eserin ritmi" diye göster.

---

## 4. Ney: 3. kademe ve Uşşak/Hicaz için gereken perdeler

### Delik düzeni ve kademeler
- Delik düzeni projedeki `src/content/ney-perdeler.ts` ile aynı. Neyzenim yöntemi: sağ el üstte, sağ başparmak arkadaki aşîrân deliğinde.
  - Ön delikler yukarıdan aşağı 1–6: sağ el işaret/orta/yüzük = 1–3, sol el işaret/orta/yüzük = 4–6.
  - Gösterim: başparmak | 1 2 3 4 5 6. K = kapalı, A = açık, Y = yarım.
- **Kademeler (KESİN, MEB modülü):**
  - 1. kademe = kaba sesler (yegâh, kaba çârgâh, kaba bûselik, kaba dügâh, kaba rast; NEY.5.4.x): https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1224
  - 2. kademe = açık nevâ, çârgâh, bûselik, dügâh, rast.
  - 3. kademe = **Hüseynî, Acem, açık Gerdâniye, açık Muhayyer** ("Neyde Üçüncü Kademe Ses Alanında Ana Sesler", NEY.4.1.1–4.1.2): https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1217
  - MEB parmak pozisyonunu yazılı vermiyor ("öğretmen gösterir").
- Akustik açıklama (tr.wikipedia "Ney", Sesler bölümü): "En hafif üflemede önce sesin kendisi ya da temel ses, daha şiddetli üflendiğinde onun sekizlisi, sonra bir önceki sesin beşlisi ve son olarak aynı oktavın sekizlisi…" https://tr.wikipedia.org/w/index.php?title=Ney&action=raw
  - Bu, 2. kademe = 2. doğuşkan, 3. kademe = 3. doğuşkan (aynı parmakla tam beşli yukarı, +31 koma), 4. kademe = 4. doğuşkan (2. kademenin oktavı) demek.
  - Kontrol: Dügâh 40 + 31 = 71 Hüseynî; Kürdî 44 + 31 = 75 Acem; Segâh 48 + 31 = 79 Eviç; Çârgâh 53 + 31 = 84 Gerdâniye; Nevâ 62 + 31 = 93 Muhayyer. Aşağıdaki neyzenim parmaklarıyla birebir tutuyor.
  - neyzenim ders 8 de doğuşkanları böyle listeliyor: "La: Mi ve porte üstü La", "Do: porte üstü Sol ve Do", "Re: porte üstü La ve Re".
- "Açık" ve "kapalı" ayrımı (neyzenim ders 9):
  - Açık Gerdâniye/Muhayyer = Çârgâh/Nevâ parmağıyla 3. kademe.
  - Gerdâniye ayrıca "tüm delikler kapalı", Muhayyer "yalnız sol yüzük açık" (Rast/Dügâh parmağıyla 4. kademe) çalınabilir.
  - Nevâ da "tüm perdeler kapalı" çalınabilir (Rast parmağıyla 3. kademe, "kapalı nevâ"). "Kapalı nevâ" terimi MEB sayfasında geçmiyor, neyzenim bu konumu tarif ediyor.

### Parmak tablosu

| Perde (yazılış) | Kademe | Başparmak | 1 2 3 4 5 6 | Durum | Kaynak (okuduğum cümle) |
|---|---|---|---|---|---|
| Segâh (B4 koma ♭) | 2 | K | K K K A K A | KESİN | neyzenim ders 2 "SI (Segâh)": sağ el baş, işaret, orta, yüzük; sol el orta. tr.wiki ● ● ● ○ ● ○ (aşiran x) |
| Kürdî (B4 küçük ♭) | 2 | K | K K K K A A | KESİN | neyzenim ders 5 "La diyez (Kürdi)": sağ el baş, işaret, orta, yüzük; sol el işaret. tr.wiki ● ● ● ● ○ ○ |
| Dik Kürdî (B4 bakiye ♭) | 2 | K | K K K K A A | KESİN (parmak); ince ayar BELİRSİZ | neyzenim ders 10, Hicaz bölümü "Dik Kürdi (Si bemol)": aynı parmaklar. Not: "Hicaz'da Si biraz dik basılır, sol işaret parmağı biraz aralanabilir" |
| Nim Hicaz (C5 bakiye ♯) | 2 | K | K A A A K A | KESİN | neyzenim ders 5 ve 10: sağ el baş, işaret; sol el orta. tr.wiki ● ○ ○ ○ ● ○ |
| Hicaz (C5 küçük ♯, 58) | 2 | K | K A A A K A (aday) | BELİRSİZ | Ayrı parmak bulunamadı; Nim Hicaz parmağıyla dik üfleme varsayımı |
| **Hüseynî** (E5) | 3 | K | K K K K K A | KESİN | neyzenim ders 6 "Mi (Hüseyni)": sağ el baş, işaret, orta, yüzük; sol el işaret, orta (= Dügâh parmağı, sert üfleme) |
| **Acem** (F5) | 3 | K | K K K K A A | KESİN | neyzenim ders 6 "Fa (Acem)": sağ el baş, işaret, orta, yüzük; sol el işaret (= Kürdî parmağı) |
| **Eviç** (F5 bakiye ♯) | 3 | K | K K K A K A | KESİN | neyzenim ders 6 "Fa diyez (Evic)": sağ el baş, işaret, orta, yüzük; sol el orta (= Segâh parmağı) |
| **Açık Gerdâniye** (G5) | 3 | K | K K A A K A | KESİN | neyzenim ders 6 "Porte üstü Sol (Gerdaniye)": sağ el baş, işaret, orta; sol el orta (= Çârgâh parmağı). Ders 9 da aynı |
| **Açık Muhayyer** (A5) | 3 | K | A K A A K A | KESİN | neyzenim ders 6 "Porte üstü La (Muhayyer)": sağ el baş, orta; sol el orta (= Nevâ parmağı). Ders 9 da aynı |
| Kapalı Gerdâniye (G5) | 4 | K | K K K K K K | KESİN (alternatif) | neyzenim ders 9: "tüm perdeler kapalı" |
| Kapalı Muhayyer (A5) | 4 | K | K K K K K A | KESİN (alternatif) | neyzenim ders 9: "sadece sol yüzük parmağımız açık" |
| Kapalı Nevâ (D5) | 3 | K | K K K K K K | KESİN (alternatif) | neyzenim ders 6 ve 9: "tüm parmaklarımız kapalı" |
| Şehnaz (A5 ♭, Nim Şehnaz) | 3 | K | K A A A K A | KESİN (gerekmez) | neyzenim ders 6: sağ el baş, işaret; sol el orta |
| Irak (F4 bakiye ♯) | ? | A | A A A A A A | BELİRSİZ | neyzenim ders 11: "tüm parmaklar açık"; baş sola, dudak sağa. "Neyin en zor seslerinden biri." Kademe belirtilmemiş |

Sayfalar:
- https://www.neyzenim.com/neydersleri_2.html (temel sesler, Segâh)
- https://www.neyzenim.com/neydersleri_5.html (Do diyez / Nim Hicaz, La diyez / Kürdi)
- https://www.neyzenim.com/neydersleri_6.html (orta perdeler: Hüseynî, Acem, Eviç, Gerdâniye, Şehnaz, Muhayyer)
- https://www.neyzenim.com/neydersleri_8.html (tiz: Tiz Segâh, Tiz Çârgâh, Tiz Nim Hicaz, Tiz Nevâ + doğuşkanlar)
- https://www.neyzenim.com/neydersleri_9.html (aynı sesin alternatif konumları)
- https://www.neyzenim.com/neydersleri_10.html (Bûselik yarım delik, Hicaz'da Nim Hicaz / Dik Kürdî)
- https://www.neyzenim.com/neydersleri_11.html (Irak, Acem Aşîrân, Hüseynî Aşîrân, Yegâh)

Notlar:
- Neyzenim'in "orta perdeler" dediği küme MEB'in 3. kademesiyle örtüşüyor (Nevâ–Muhayyer). Ders 6'ya göre bu sesler "daha sert, daha güçlü üfleme" ister.
- Kürdî ile Dik Kürdî ve Nim Hicaz ile Hicaz aynı delik konumuyla çalınıyor. Koma farkı baş/dudak açısı ve kısmi delik aralamayla veriliyor; nicel bir tarif yok → akort göstergesi bu perdelerde daha toleranslı olmalı (öneri).
- Eviç ve Acem'in 3. kademede aynı parmak ailesinden (Segâh ve Kürdî) gelmesi pedagojik olarak kullanışlı: "2. kademede bildiğin parmak + sert üfle".

---

## 5. SymbTr eserleri

### Dosyalar (hepsi doğrulandı, HTTP 200)
Repo: https://github.com/MTG/SymbTr (dal: master). Ağaç listesi GitHub API'den alındı.

| Eser | Makam / usul / form | Besteci / güfte (mu2 başlığından) | txt | MusicXML |
|---|---|---|---|---|
| Benim adım dertli dolap | Uşşak / Dolap 12/8 / İlâhî | Besteci "?" / Yunus Emre; Folklorik = E, notasyon THM | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--dolap--benim_adim--.txt | https://raw.githubusercontent.com/MTG/SymbTr/master/MusicXML/ussak--ilahi--dolap--benim_adim--.xml |
| Seyyah olup | Uşşak / Sofyan / İlâhî | **Nurettin Dadaloğlu** / Kul Himmet; E, THM | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--sofyan--seyyah_olup--.txt | https://raw.githubusercontent.com/MTG/SymbTr/master/MusicXML/ussak--ilahi--sofyan--seyyah_olup--.xml |
| Hak Teâlâ (mu2: "Hak Taalâ Seni Bize") | Uşşak / Sofyan / İlâhî | Ali Ufkî / "?"; H, TSM | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--sofyan--hak_taala--ali_ufki.txt | https://raw.githubusercontent.com/MTG/SymbTr/master/MusicXML/ussak--ilahi--sofyan--hak_taala--ali_ufki.xml |
| Dağlar ile taşlar ile | Hicaz / Sofyan / İlâhî | Kutbî Dede / Yunus Emre; H, TSM | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/hicaz--ilahi--sofyan--daglar_ile--kutbi_dede.txt | https://raw.githubusercontent.com/MTG/SymbTr/master/MusicXML/hicaz--ilahi--sofyan--daglar_ile--kutbi_dede.xml |

mu2 ve midi dosyaları da aynı adla `mu2/` ve `midi/` klasörlerinde var. Adlandırma: `makam--form--usul--eser_adi--besteci`; besteci yoksa son alan boş kalır.

### Eserlerin içeriği (txt'den hesapladım)

| Eser | Ölçü sayısı | Nota sayısı | Kullanılan notalar (NotaAE: adet) | Ney için gereken perdeler |
|---|---|---|---|---|
| Benim adım | 8 × 12/8 | 72 | G4 4, A4 16, B4b1 28, C5 20, D5 4 | Rast, Dügâh, Segâh, Çârgâh, Nevâ. **Hepsi 2. kademe, hepsi doğrulanmış**. İlk eser için ideal |
| Hak Teâlâ | 31 × 4/4 | 150 (+1 es) | G4 6, A4 45, B4b1 37, C5 27, D5 21, E5 7, F5 2, G5 4 | + Hüseynî, Acem, açık Gerdâniye (3. kademe) |
| Seyyah olup | 42 × 4/4 | 360 (10 es) | A4 60, B4b1 80, C5 82, D5 78, E5 40, F5 8, G5 2 | + Hüseynî, Acem, Gerdâniye. Saz bölümleri ("ARANAĞME") var |
| Dağlar ile | 40 × 4/4 | 280 (12 es) | F4#4 4, G4 12, A4 40, B4b4 32, B4 4, C5#4 56, D5 76, E5 32, F5 8, G5 4 | Dik Kürdî, Nim Hicaz, Bûselik, Hüseynî, Acem (doğal F5), Gerdâniye, **Irak (F♯4, ney'de zor, parmağı BELİRSİZ)** |

"Dağlar ile"de F4#4 dört kez geçiyor, hep "Ça-ğı-ra-yım" hecesinde Sol–**Fa♯**–Sol–La alt komşu notası olarak. Bu, Hicaz'ın pest genişlemesindeki Irak perdesi (§2.3). Donanımda F♯ olmasına rağmen F5 8 kez doğal (Acem) yazılmış: tiz taraftaki acemli rast.

### SymbTr txt sütun biçimi (KESİN)
Kaynaklar:
- Fetch edilen dosya: `ussak--ilahi--dolap--benim_adim--.txt` (74 satır). Diğer üç dosya da karşılaştırıldı.
- Kod tablosu: https://raw.githubusercontent.com/MTG/SymbTr/master/code_explanations.xlsx (Türkçe + İngilizce sayfa)
- Resmî okuyucu: https://raw.githubusercontent.com/sertansenturk/symbtrdataextractor/master/symbtrdataextractor/reader/txt.py ve offset.py

Biçim: sekmeyle ayrılmış (TSV), UTF-8, ilk satır başlık. Örnek satırlar:
```
Sira	Kod	Nota53	NotaAE	Koma53	KomaAE	Pay	Payda	Ms	LNS	Bas	Soz1	Offset
1	51			0	0	12	8	0	76	0	Dolap	0.0
2	9	Sol4	G4	296	296	1	8	500	95	96	Be	0.0833333333333
3	9	Do5	C5	318	318	1	8	500	95	96	nim_	0.166666666667
4	9	Si4b2	B4b1	312	313	1	8	500	95	96	a	0.25
```
(Hicaz dosyasından es: `25	9	Es	Es	-1	-1	1	8	455	100	0		3.125`)

| Sütun | Anlamı |
|---|---|
| **Sira** | Satır sırası, 1'den başlar. Okuyucu, ardışık olmayan sıçramayı geçersiz sayar. |
| **Kod** | Olay türü (code_explanations.xlsx): **9 = Nota/Es**, **51 = Usul/değişimi**, 50 = Makam, 52 = Tempo, 53 = Cümle sınırı, 1 = küçük nota, 8 = çarpma (grace), 7 = tremolo, 12 = trill, 23 = mordan, 35 = önceki ölçüyü tekrarla, 54/55 = geçki başı/sonu vb. Geçerli bir dosya Kod 51 satırıyla başlar. Bu 4 dosyada yalnızca 51 ve 9 var. |
| **Nota53** | Türkçe solfej adı + oktav + 53-TET işaret: `Sol4`, `Do5`, `Si4b2` (Si, 2 koma bemol), `Fa4#4`, `Do5#4`. Es için `Es`. Kod 51 satırında boş. |
| **NotaAE** | Aynı nota, AEU yazımıyla: harf + oktav + (`b` ya da `#`) + koma sayısı (1, 4, 5, 8). Örnek: `B4b1` = Si koma bemolü (Segâh), `B4b4` = Si bakiye bemolü (Dik Kürdî), `C5#4` = Do bakiye diyezi (Nim Hicaz), `F4#4` = Irak. **Bizim gösterim için doğru sütun bu.** Es için `Es`. |
| **Koma53** | Nota53'ün mutlak perdesi, Holder koması cinsinden. Bu dosyalarda 0 = C−1 alınmış gibi davranıyor: **koma = 53 × (oktav + 1) + oktav içi konum**. Örnek: C5 = 318, G4 = 296, A4 = 305. Es = −1. |
| **KomaAE** | NotaAE'nin mutlak perdesi (AEU konumu). Örnek: B4b1 = 265 + 48 = **313**, oysa Koma53 = 312 (THM'deki 2 koma pest Segâh). Kural kod 63'te: THM yazımı TSM'ye çevrilirken b2 → b1, #3 → #4 olur (diğer dolap dosyasında `Fa5#3` 343 → `F5#4` 344). Hicaz notalarında iki sütun eşit (B4b4 = 310, C5#4 = 322). Es = −1. |
| **Pay / Payda** | Süre, tam notanın kesri olarak: 1/8 = sekizlik, 1/4 = dörtlük, 3/16 = noktalı sekizlik, 1/2 = ikilik. Kod 51 satırında Pay/Payda **usulün ölçüsü** (12/8, 4/4). |
| **Ms** | Süre, milisaniye (tempoya göre hesaplanmış). Benim adım: tempo 120 (sekizlik birim) → 1/8 = 500 ms. Dağlar ile: tempo 66 (dörtlük) → 1/4 = 909 ms. Kod 51'de 0. |
| **LNS** | mu2'deki "Legato%" alanı. Notada genellikle 95 (bazı vurgulu notalarda 99), eslerde **100**. Kod 51 satırında **usul numarası** (76 = Dolap, 6 = Sofyan; usul.json'daki symbtr_internal_id). |
| **Bas** | mu2'deki "Basış" (vuruş gücü / velocity benzeri): notalarda 96, eslerde 0. |
| **Soz1** | Hece (birinci söz satırı). Kurallar aşağıda. Kod 51'de usul adı. |
| **Offset** | Olayın **bitiş** konumu, ölçü cinsinden, birikimli. Örnek: ilk 1/8 nota 12/8'de 1/12 = 0.0833'te biter. **Tam sayı offset = ölçü çizgisi.** Okuyucu bu sütunu bir satır kaydırarak başlangıç offset'ine çevirir; ölçü başları tam sayıya denk gelir. |

Diğer kurallar:
- **Es (sus):** Kod 9, Nota53 = NotaAE = `Es`, Koma53 = KomaAE = −1, LNS = 100, Bas = 0. Okuyucu bunun dışındaki es biçimlerini geçersiz sayar.
- **Ölçü sınırları:** Ayrı bir ölçü satırı yok. Offset'in tam sayıya ulaştığı nota ölçünün son notasıdır (tolerans ±0.001).
- **Söz (Soz1) kodlaması** (4 dosyadan gözlem; okuyucu "lyrics" olarak ham okuyor):
  - Hecenin sonunda **tek boşluk** = kelime sonu ("dım ").
  - **Çift boşluk** = söz satırı/dize sonu ("lap  ").
  - **`_`** = ulama, hece sonraki ünlüyle bağlanıyor ("nim_" + "a" + "dım" → "Benim adım").
  - **Boş Soz1** = önceki hecenin melizması (aynı hecede yeni nota).
  - Saz bölümleri `ARANAĞME` etiketi ve ardından `.` dolgu hecesiyle işaretleniyor ("Seyyah olup").
  - MusicXML bunları `<lyric><syllabic>` olarak taşıyor.
  - Gözleme dayalı kurallar (resmî belge yok). symbtrdataextractor bölüm çıkarımında aynı ipuçlarını kullanıyor.
- **Makam/donanım** txt'de yok. mu2 başlığında Kod 50 satırında var (`Hicaz	B4b4/F5#4/C5#4`, `Uşşak	B4b2`). Tempo Kod 52'de, öbekleme Kod 14'te, besteci 58, güfte 59, eser adı 60, folklorik 62, notasyon 63'te.
- **MusicXML uyarısı:**
  - SymbTr MusicXML'leri mikrotonları tutarsız kodluyor. `key-alter` −4/+4 gibi değerler MusicXML'de yarım ses demek, yani yanlış.
  - Bakiye bemollü notalarda `<alter>` yok, yalnızca `<accidental>slash-flat`.
  - Koma bemolü `alter −0.5` + `quarter-flat`.
  - → **Perde için tek doğru kaynak txt'nin KomaAE/NotaAE sütunları.**

### Lisans (KESİN) ve sonuçları
- LICENSE dosyası, tam metin: "This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/." (https://raw.githubusercontent.com/MTG/SymbTr/master/LICENSE). README'de de aynı rozet ve cümle var.
- README atıf istiyor: "Please cite the following publication if you use the data collection in your work: M. Kemal Karaosmanoğlu. A Turkish makam music symbolic database for music information retrieval: SymbTr. In Proceedings of 13th International Society for Music Information Retrieval Conference (ISMIR), pages 223–228, 2012."
- Bizim durumumuz için sonuçlar (hukuki danışmanlık değildir):
  1. **Ticari olmayan kullanım (NC):** Tek kişinin ticari olmayan kullanımı NC koşuluna uyuyor. Uygulama hiçbir zaman para kazandırmamalı (reklam, ücretli sürüm yok).
  2. **Atıf (BY):** Repoda ve uygulamada eser başına kaynak belirtilmeli: SymbTr, dosya adı, Karaosmanoğlu 2012, lisans bağlantısı. Değişiklik yapıldıysa (ör. JSON'a dönüştürme, kısaltma) belirtilmeli.
  3. **Aynı lisansla paylaşım (SA):** SymbTr'den türetilen veri dosyaları (dönüştürülmüş eser JSON'ları) **CC BY-NC-SA 4.0 altında kalmalı**. AGPL'ye taşınamaz, çünkü AGPL ticari kullanıma izin verir ve NC ile çelişir.
     - Pratik çözüm: türetilmiş veriyi ayrı bir klasörde tut (ör. `src/content/eserler/`), içine kendi LICENSE/NOTICE dosyasını koy; README'de "kod AGPL-3.0, `…/eserler/` verisi CC BY-NC-SA 4.0" diye ayır.
     - Kod ile veri ayrı eserler olarak aynı repoda durabilir. Ama reponun tamamı "AGPL" diye etiketlenirse, üçüncü kişiler veriyi de ticari kullanabileceğini sanabilir. Bu ayrım açıkça yazılmalı.
  4. CC lisansı yalnızca SymbTr'nin kendi katkısını (dijital kodlama) kapsar. Alttaki besteler ayrıdır:
     - Yunus Emre, Ali Ufkî ve Kul Himmet güfteleri ile Ali Ufkî'nin bestesi kamu malı.
     - Kutbî Dede'nin yaşadığı dönemi doğrulamadım (BELİRSİZ, büyük olasılıkla eski).
     - "Seyyah olup"un mu2'deki bestecisi **Nurettin Dadaloğlu** hakkında bilgi bulamadım. Çağdaş bir besteci/düzenleyiciyse beste hâlâ telifli olabilir (Türkiye'de ölümden sonra 70 yıl) → **BELİRSİZ**. Kamuya açık repoda yayınlamadan önce doğrulanmalı ya da eser başka bir kamu malı eserle değiştirilmeli.

---

## Ek: Bu araştırmada okunan diğer kaynaklar
- SymbTr README: https://raw.githubusercontent.com/MTG/SymbTr/master/README.md
- SymbTr mu2 başlıkları: `https://raw.githubusercontent.com/MTG/SymbTr/master/mu2/<dosya>.mu2` (yukarıdaki 4 eser + `gerdaniye--rumeliturkusu--dolap--kirimdan_gelirim--rumeli.mu2`)
- tr.wikipedia "Ney", Parmaklar tablosu (Kız ney): Nevâ ○●○○●○, Nim Hicaz ●○○○●○, Çârgâh ●●○○●○, Segâh ●●●○●○, Kürdî ●●●●○○, Dügâh ●●●●●○, Rast ●●●●●●; "x: Aşiran deliği kapalı".
- TDV "Ney" (Mehmet Nuri Uygun): https://islamansiklopedisi.org.tr/ney. Kademe ya da parmak tarifi yok. "Nefes kuvveti ve dudak hareketleriyle her notanın beşlisi ve üst üste gelen iki sekizlisi elde edilebilir" diyor (§4'teki doğuşkan açıklamasını destekliyor).
