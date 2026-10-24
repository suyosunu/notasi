# Parça araştırması: 9 istek (SymbTr + telif + temsil edilebilirlik)

Tarih: 2026-10-24. Yalnızca araştırma; depo kodu değiştirilmedi.

Yöntem:
- SymbTr dosya listesi: `https://api.github.com/repos/MTG/SymbTr/git/trees/master?recursive=1` (txt/ altında 2200 dosya). Başlık, makam ve bestekâr varyantlarıyla tarandı (`gel_gor`, `yane`, `ben_yur`, `demed`, `guzel_a`, `samanyolu`, `teoman`, `uskud`, `katib`, `uyan`, `longa`, `cecen`, `kevser` ve 44 ilahinin tamamı). SymbTr-extras alt deposunda (`https://api.github.com/repos/MTG/SymbTr-extras/git/trees/master?recursive=1`) nota dosyası yok, yalnızca araç/veri var.
- Bulunan txt'ler raw URL'den indirildi ve projenin kendi dönüştürücüsüyle (`scripts/symbtr-to-json.mjs`: `parseSymbTrTxt`, `splitDuration`, `convertSymbTr`) denendi. Usul olarak dosyanın kendi Kod 51 satırı verildi, yani uygulamada bu usulün olup olmadığına bakılmadan yalnızca süreler ve ölçüler sınandı.
- Kod anlamları SymbTr `code_explanations.xlsx` dosyasından alındı: Kod 1 küçük nota (icrada eklenen süsleme, süresi var), Kod 7 tremolo (süresi var), Kod 8 çarpma (Pay 0), Kod 10 ardçarpmalı nota (normal nota), Kod 11 sessiz çarpma (normal nota).
- Uygulama perdeleri (`src/content/ney-perdeler.ts`): G4 Rast, A4 Dügâh, B4b1 Segâh, B4b5 Kürdî, B4b4 Dik Kürdî, B4 Bûselik, C5 Çârgâh, C5#4 Nim Hicaz, D5 Nevâ, E5 Hüseynî, F5 Acem, F5#4 Eviç, G5 Gerdâniye, A5 Muhayyer.
- Uygulama usulleri (`src/content/usuller.ts`): sofyan 4/4, duyek 8/8, semai 3/4, yuruk-semai **6/8**, aksak 9/8, dolap 12/8. **Nim sofyan (2/4) ve 6/4 Yürük Semâî yok.**
- Uygulama makamları (`src/content/makamlar.ts`): yalnızca `rast | ussak | hicaz`.
- Telif (FSEK m.27): mali haklar eser sahibinin yaşamı boyunca ve ölümünden sonra 70 yıl sürer. Birden çok eser sahibi varsa süre, hayatta kalan son sahibin ölümünden işlemeye başlar. Süre ölüm yılını izleyen 1 Ocak'tan sayılır, yani koruma ölüm yılı + 70'in 31 Aralık'ında biter (https://imer.av.tr/avukat-araclari/telif-koruma-suresi-hesaplama). Yıl sonu ayrıntısı tek kaynağa dayanıyor; mevzuat metniyle doğrulanmadı. Anonim ve geleneksel eserler kamu malı sayıldı.
- Not: Eser kamu malı olsa bile SymbTr'nin dizgisi CC BY-NC-SA 4.0 lisanslıdır. Bunun için atıf, ticari olmama ve aynı lisansla paylaşma koşulları geçerlidir; mevcut `src/content/parcalar/LISANS.md` bu düzeni zaten izliyor.

## Özet tablo

| # | Parça | SymbTr dosyası | Usul | Bestekâr (ölüm) | Telif | Temsil edilebilir mi? | Aralık uygun mu? | Öneri |
|---|---|---|---|---|---|---|---|---|
| 1 | Gel Gör Beni Aşk Neyledi | YOK | – | Güfte Yunus Emre (ö. 1320/21); beste sürüme göre değişiyor (anonim türkü varyantı var) | BELİRSİZ (beste sürümü belirsiz) | – | – | **SKIP**: SymbTr'de yok |
| 2 | Ben Yürürüm Yâne Yâne | YOK (Uşşak). Yalnızca Nevâ şarkı: `neva--sarki--duyek--ben_yururum--selahaddin_pinar.txt` | Düyek 8/8 | Selahattin Pınar (ö. 6.2.1960); güfte Yunus Emre | Nevâ sürümü TELİFLİ (2030 sonuna kadar) | Hayır: 4 satır 1/32 | Neredeyse: B5b5 ×1 dışarıda | **SKIP**: Uşşak sürümü yok, Nevâ sürümü telifli |
| 3 | Demedim mi? | YOK | – | "Güzel âşık cevrimizi çekemezsin demedim mi": Uşşak sürümü Meçhûl; Nihâvend sürümü Sebilci Hüseyin Efendi; güfte Pir Sultan Abdal (bazı kayıtlarda Yunus Emre) | BELİRSİZ (Hüseynî sürümü doğrulanamadı) | – | – | **SKIP**: SymbTr'de yok |
| 4 | Samanyolu | YOK | – | Beste Metin Bükey (ö. 1997, MESAM kaydı); güfte Teoman Alpay (ö. 2005) | TELİFLİ (beste 2067, güfte 2075 sonuna kadar) | – | – | **SKIP**: telifli ve SymbTr'de yok |
| 5 | Üsküdar'a Gider İken (Kâtibim) | `nihavent--turku--nimsofyan--uskudara_gider--.txt` (Rast sürümü yok) | Nim Sofyan 2/4 | Anonim (İstanbul türküsü) | KAMU MALI | Süreler evet (1/16, 1/8, 1/4, 3/16). Ama Kod 1 ×57 ve Kod 11 ×8 atlandığı için ölçüler bozuluyor, son ölçü de eksik | Hayır: F4#4 Irak ×10, E5b5 Hisar ×42 | **SKIP (şimdilik)**: 2/4 usul, Nihâvend makamı, Kod 1/11 desteği ve Irak/Hisar perdeleri gerekiyor |
| 6 | Uyan Ey Gözlerim | `irak--ilahi--yuruksemai--uyan_ey--iii_murat.txt` | Yürük Semâî **6/4** | Sultan III. Murad (ö. 1595) | KAMU MALI | **Evet**: dönüştürücü 6/4 ile hatasız geçiyor (40 ölçü) | Kısmen: F4#4 ×4, B5b1 ×4 dışarıda | **ADD (koşullu)**: 6/4 usul ve Irak makamı eklenmeli, 8 nota aralık dışında |
| 7 | Nihâvend Longa | `nihavent--longa--nimsofyan----kevser_hanim.txt` | Nim Sofyan 2/4 | Kemani Kevser Hanım (1880'ler – 1950'ler?; bir kaynakta 1963) | BELİRSİZ (ölüm yılı belirsiz; 1955 sonrasıysa hâlâ telifli) | Süreler evet. Kod 7 (tremolo ×56) normal nota sayılırsa 72 ölçünün hepsi tutuyor | Hayır: D4 ×6, C6 ×2, E5b5 ×72, B5b5 ×10 | **SKIP**: telif belirsiz, Hisar yoğun |
| 8 | Kürdilihicazkâr Longa | En bilineni Kemani Sebuh: `kurdilihicazkar--longa--nimsofyan----kemani_sebuh.txt`. Ayrıca `...----haydar_tatliyay.txt` | Nim Sofyan 2/4 | **Kemani Sebuh (1828–1894)**; Tatlıyay (1890–1963) | Sebuh: KAMU MALI. Tatlıyay: TELİFLİ (2033 sonuna kadar) | **Hayır**: 1/12 üçleme ×222 (Sebuh), ×270 (Tatlıyay) | Hayır: çok sayıda (F4, A4b5, E5b5, C6, D6…) | **SKIP**: üçlemeler desteklenmiyor |
| 9 | Çeçen Kızı | `huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt` | Nim Sofyan 2/4 | Tanburi Cemil Bey (ö. 28.7.1916) | KAMU MALI | Neredeyse: 6 satır 1/32 (3/32+1/32 figürü, ölçü 41–47). Kod 10 ×4 normal nota sayılmalı | **Evet**: G4–A5, yalnızca B4b1 ve F5#4; hepsi uygulamada var | **ADD (koşullu)**: 2/4 usul, Hüseynî makamı ve 1/32 (ya da ölçü 41–47 için bir çözüm) gerekiyor |

Kısaca, eklenebilecek adaylar Uyan Ey Gözlerim (dönüştürücü değiştirilmeden geçiyor) ve Çeçen Kızı (aralık tamamen uygun). Üsküdar kamu malı ama altyapı işi gerektiriyor. Geri kalanlar telif, kaynak eksikliği veya üçleme yüzünden dışarıda kalıyor.

## Dönüştürücüyle ilgili genel bulgular

1. **Kod 9 dışındaki süreli notalar**: `convertSymbTr` Kod ≠ 9 satırlarını atlıyor. Kod 1, 7, 10 ve 11 gerçek süre taşıdığından atlandıklarında Offset zinciri ve ölçü toplamları bozuluyor (Çeçen Kızı 14, Kevser Longa 52, Üsküdar 39 hata). Bu kodlar Kod 9 gibi okununca (Pay > 0 ise) yalnızca gerçek sorunlar kalıyor. Kod 8 (Pay 0 çarpma) zaten sorunsuz atlanıyor.
2. **Usul eşleşmesi**: dönüştürücü ilk satırın Pay/Payda değerini uygulama usulüyle birebir karşılaştırıyor. Nim Sofyan (2/4) ve 6/4 Yürük Semâî uygulamada yok. Bu yüzden listedeki 6 parçanın 5'i usul eklenmeden üretilemez.
3. **Makam**: `ParcaMakam` yalnızca rast, uşşak ve hicaz. Hüseynî, Irak, Nihâvend ve Kürdilihicazkâr eklenmeli.
4. **Son ölçü eksik** (Üsküdar): parça 3/16'lık bir G4 ile ölçü ortasında bitiyor. Dönüştürücü bunu "son ölçü tamamlanmamış" diye reddediyor.

## Parça ayrıntıları

### 1. Gel Gör Beni Aşk Neyledi
- a) SymbTr'de **yok**. `gel_gor`, `ask_neyledi` ve `gah_eserim` aramaları boş döndü. Dügâh/Uşşak ilahileri arasında da yok; tek Dügâh ilahisi `dugah--ilahi--agircenber--gel_ey_salik--dede_efendi.txt`, farklı bir eser.
- b) Güfte Yunus Emre (ö. 1320; Vikipedi'de 1321 de geçiyor: https://en.wikipedia.org/wiki/Yunus_Emre), yani kamu malı. Beste için tek bir künye bulunamadı. Bir türkü varyantı Sivas kaynaklı ve Sırrı Sarısözen adıyla anılıyor (arama sonucu: https://www.turkudostlari.net/soz.asp?turku=180, sayfa açılamadı). Erdinç Bal'ın Kürdî ilahi listesinde beste alanı boş (https://www.erdincbal.com/kurdi-makaminda-ilahi-notalari.html, yalnızca arama sonucu). Sürüme bağlı olduğu için **BELİRSİZ**: anonim türkü varyantı kamu malı olabilir, ama derleyen ya da notaya alanın kaydı ayrıca kontrol edilmeli.
- c, d) Kaynak yok.
- Öneri: **SKIP**. SymbTr dışında güvenilir, lisansı açık bir nota kaynağı gerekir.

### 2. Ben Yürürüm Yâne Yâne
- a) Uşşak sürümü SymbTr'de **yok**. Var olan tek sürüm:
  - `neva--sarki--duyek--ben_yururum--selahaddin_pinar.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/neva--sarki--duyek--ben_yururum--selahaddin_pinar.txt (Nevâ, şarkı, Düyek, Selahattin Pınar). Hece satırları "Ben yü-rü-rüm yâ-ne yâ-ne / Aşk bo-ya-dı be-ni ka-ne" ile başlıyor; yani aynı Yunus Emre şiiri.
- b) Selahattin Pınar 22.1.1902'de doğdu, 6.2.1960'ta öldü (https://islamansiklopedisi.org.tr/pinar-selahattin; madde "Ben yürürem yâne yâne" nevâ şarkısını en sevilen eserleri arasında sayıyor). Güfte Yunus Emre, kamu malı. Bestesi **TELİFLİ, 31.12.2030'a kadar**. Başka sürümler (https://www.neyzen.com/ney_ilahiler.html): Arazbâr (Dede Efendi), Segâh (Meçhûl / Halis Efendi), Bestenigâr (Meçhûl), Hüseynî (Hafız Murad Özkan), Acem-Bûselik (Kemal Efendi). Bu listede Uşşak sürümü yok. Diyanet TV bir Segâh sürümünü "Beste: Anonim" diye veriyor (arama sonucu). Bu sürümlerin hiçbiri SymbTr'de değil.
- c) Nevâ dosyası: 28 ölçü, Düyek 8/8. **1/32 ×4** (Sira 12, 28, 133, 149; ölçü 2, 4, 16, 18; her biri 3/32 C5 + 1/32 B4b1 figürü). Bunlar dışında bütün ölçüler 8/8'e tamamlanıyor. Kod 8 ×1 (çarpma). Aralık G4 – B5b5. İşaretler: B4b5, B4b1, C5#4, F5#4, B5b5.
- d) B5b5 (Tiz Kürdî) ×1 dışarıda, gerisi uygulama perdelerinde. Makam Nevâ uygulamada yok.
- Öneri: **SKIP**. Uşşak ilahi sürümü kaynakta yok, Nevâ sürümü 2030'a kadar telifli.

### 3. Demedim mi?
- Kimlik: büyük olasılıkla "Güzel âşık cevrimizi çekemezsin demedim mi" ilahisi. neyzen.com bunu Uşşak bölümünde iki sürümle ("Demedim mi", Bestekâr: Meçhûl), Nihâvend bölümünde de Sebilci Hüseyin Efendi adıyla listeliyor (https://www.neyzen.com/ney_ilahiler.html). Muzaffer Ozak listesine göre (arama sonucu, https://muzafferozak.com/ilahiler/sebilci-ilahiler.html, sayfa açılamadı) Nihâvend sürümü Düyek usulünde, güftesi Pir Sultan Abdal'ın. Bir SoundCloud kaydı güfteyi Yunus Emre'ye veriyor (https://soundcloud.com/zafersatici/senfoni-ile-ilahiler-burak-ku-t-demedim-mi/sets, arama sonucu). Neyzen.com'da Acem Aşîrân bir "Demedim mi" daha var (Nail Kaya, d. 1943, sağ; telifli). **Hüseynî bir "Demedim mi" doğrulanamadı.** Erdinç Bal'ın Hüseynî ilahi listesinde de yok (https://www.erdincbal.com/huseyni-makaminda-ilahi-notalari.html).
- a) SymbTr'de **yok**.
- b) Uşşak/Meçhûl sürümü kamu malı olabilir; Sebilci Hüseyin Efendi'nin ölüm yılı bulunamadı. Bu yüzden **BELİRSİZ**.
- Öneri: **SKIP**. Kullanıcıya hangi sürümü kastettiği sorulmalı; SymbTr dışında kaynak gerekir.

### 4. Samanyolu
- a) SymbTr'de **yok**. Teoman Alpay'ın başka şarkıları var: `hicaz--sarki--semai--nasil_gecti--teoman_alpay.txt`, `nihavent--sarki--duyek--gokyuzunde--teoman_alpay.txt` vb.
- b) MESAM kaydına göre beste Metin Bükey (31.5.1933 – 29.1.1997), güfte Teoman Alpay (1932 – 13.2.2005). 1967, Berkant. Kaynaklar: https://www.biyografiler.com/kimdir/metin-bukey, https://www.biyografiler.com/kimdir/teoman-alpay, https://en.wikipedia.org/wiki/Samanyolu (bestecinin kim olduğu tartışmalı: https://www.haberturk.com/yazarlar/murat-bardakci/781876-samanyolunun-gercek-bestecisi, arama sonucu). Beste kimin olursa olsun **TELİFLİ**: Bükey'e göre 2067, Alpay'a göre 2075 sonuna kadar. Güfte 2075 sonuna kadar korumada.
- Öneri: **SKIP**.

### 5. Üsküdar'a Gider İken (Kâtibim)
- a) SymbTr'de bir sürüm var: `nihavent--turku--nimsofyan--uskudara_gider--.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/nihavent--turku--nimsofyan--uskudara_gider--.txt (Nihâvend, türkü, Nim Sofyan, bestekâr alanı boş). Rast sürümü yok. Benzer adlı `muhayyer--turku--raksaksagi--istanbuldan_uskudara--.txt` ("İstanbul'dan Üsküdar'a", Raksaksağı 9/8) **başka** bir türkü.
- b) Anonim İstanbul türküsü; ezginin kökenine dair pek çok iddia var, tek bir bestekâr yok (https://en.wikipedia.org/wiki/K%C3%A2tibim). **KAMU MALI**.
- c) Süreler: 1/16 ×264, 1/8 ×80, 1/4 ×16, 3/16 ×20. Hepsi tek değer, bağ gerekmiyor. Ancak:
  - Kod 1 ×57 ("SAZ" ara nağmeleri, küçük nota) ve Kod 11 ×8 (sessiz çarpmalı nota) süre taşıyor, dönüştürücü bunları atlıyor ve 39 hata veriyor. Bunlar normal nota sayılınca 79 tam ölçü 2/4'e tamamlanıyor.
  - Son satır (Sira 445, G4 3/16, Offset 79.375) ölçü ortasında bitiyor. Dönüştürücü "son ölçü tamamlanmamış" diyor.
  - Usul Nim Sofyan 2/4 uygulamada yok.
  - Aralık F4#4 (291) – F5 (340). İşaretler: F4#4, B4b5, E5b5.
- d) F4#4 (Irak, Rast'ın altı) ×10 ve E5b5 (Hisar) ×42 uygulama perdelerinde yok. Nihâvend makamı da yok.
- Öneri: **SKIP (şimdilik)**. Telif açısından uygun, ama eklemek için Nim Sofyan usulü, Nihâvend makamı, Kod 1/11 desteği, eksik son ölçünün ele alınması ve Irak/Hisar perdeleri gerekiyor.

### 6. Uyan Ey Gözlerim Gafletten Uyan
- a) `irak--ilahi--yuruksemai--uyan_ey--iii_murat.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/irak--ilahi--yuruksemai--uyan_ey--iii_murat.txt (Irak, ilahi, Yürük Semâî, III. Murad). Usul satırı "Yürüksemâî (6/4)", Pay/Payda 6/4. Tek sürüm.
- b) Güfte ve beste Sultan III. Murad'a (Murâdî, 4.7.1546 – 16.1.1595) atfediliyor (https://www.neyzen.com/ney_ilahiler.html, Irak ve Kürdî sürümleri). Bazı kaynaklar IV. Murad'a veriyor, ezginin Ali Ufkî'nin Mecmûa-i Sâz ü Söz'ünde olduğunu söylüyor (https://muslimhymns.com/uyan-ey-gozlerim/). Her durumda **KAMU MALI**.
- c) Dönüştürücü {zaman 6, mertebe 4} ile **hatasız** çalışıyor: 40 ölçü, 252 nota, bağ yok, atlanan satır yok, KomaAE eşleşmesi tam. Süreler 1/16 ×8, 1/8 ×44, 1/4 ×184, 1/2 ×16. Bütün ölçüler 6/4'e tamamlanıyor. Aralık F4#4 (291) – B5b1 (366). İşaretler: F4#4, B4b1, C5#4, F5#4, B5b1. Hece satırları "U-yan ey göz-le-rim gaf-let-ten u-yan" ile başlıyor.
- d) F4#4 (Irak) ×4 ve B5b1 (Tiz Segâh) ×4 uygulama perdelerinde yok, gerisi var.
- Öneri: **ADD (koşullu)**. Bir 6/4 Yürük Semâî usulü eklenmeli (uygulamadaki `yuruk-semai` 6/8 olduğu için dönüştürücü reddeder), `ParcaMakam`'a Irak eklenmeli ve 8 aralık dışı nota için çözüm bulunmalı (perde eklemek ya da uyarı göstermek).

### 7. Nihâvend Longa (Kevser Hanım)
- a) `nihavent--longa--nimsofyan----kevser_hanim.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/nihavent--longa--nimsofyan----kevser_hanim.txt (Nihâvend, longa, Nim Sofyan). SymbTr'de başka Nihâvend longa yok. CMO'da Tanburi Cemil Bey'e ait farklı bir "nihāvend lonġa" kaydı var: https://corpus-musicae-ottomanicae.de/receive/cmo_expression_00007871.
- b) Kemani Kevser Hanım (Muallime), Darülelhan'da keman öğretmeni. 1880'lerde doğduğu, 1950'lerde öldüğü düşünülüyor (https://tr.wikipedia.org/wiki/Kemani_Kevser_Han%C4%B1m). Bir forum kaynağı 1887–1963 diyor (arama özeti, doğrulanamadı). Onur Akdoğu 1991'de eserin "kesin olarak" Kevser Hanım'ın olduğunu yazdı (https://www.simurgkitabevi.com/unlu-nihavend-longa-ve-canakkale-turkusu-kimindir-kevser-hanim-1991). Ölüm 1955 ya da öncesiyse kamu malı, 1956 ya da sonrasıysa (örneğin 1963'te öldüyse 2033 sonuna kadar) telifli. **BELİRSİZ**.
- c) Kod 7 (tremolo) ×56 süreli; dönüştürücü bunları atladığı için 52 hata veriyor. Tremolo notaları normal nota sayılınca **72 ölçünün hepsi** 2/4'e tamamlanıyor. Süreler 1/16 ×356, 1/8 ×42, 1/4 ×4; 1/32 ya da üçleme yok. Aralık D4 (274) – C6 (371). İşaretler: B4b5, C5#4, E5b5, F5#4, B5b5.
- d) D4 (Yegâh, kaba) ×6, C6 (Tiz Çârgâh) ×2, E5b5 (Hisar) ×72 ve B5b5 (Tiz Kürdî) ×10 uygulamada yok. Hisar parçanın her yerinde.
- Öneri: **SKIP**. Telif durumu belirsiz ve perde dışı nota çok.

### 8. Kürdilihicazkâr Longa
- Kimlik: en bilineni **Kemani Sebuh**'un longası; Şabanoğlu Şaban ve Süt Kardeşler'de kullanılan ezgi. Kemani (Kör) Sebuh Efendi (Simonyan) 1828'de doğdu, 8.12.1894'te öldü (https://cn.imslp.org/wiki/Category:Sebuh,_Kemani; https://imslp.org/wiki/Kürdilihicazkar_Longa_(Sebuh,_Kemani); İstanbul Ansiklopedisi'nde konu etiketi: https://istanbulansiklopedisi.org/handle/rek/17918; film kullanımı ve Beşiktaş kilise kaydı bilgisi arama özetinden). Cinuçen Tanrıkorur'un ud için ayrı bir Kürdilihicazkâr longası da var (https://dergipark.org.tr/tr/pub/ojomus/article/1914366).
- a) İki sürüm:
  - `kurdilihicazkar--longa--nimsofyan----kemani_sebuh.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/kurdilihicazkar--longa--nimsofyan----kemani_sebuh.txt
  - `kurdilihicazkar--longa--nimsofyan----haydar_tatliyay.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/kurdilihicazkar--longa--nimsofyan----haydar_tatliyay.txt
- b) Sebuh (ö. 1894): **KAMU MALI**. Haydar Tatlıyay (1890–1963; tarihler arama sonucundaki akademik özetten, https://www.researchcatalogue.net/view/306037/306042 sayfasında tarih yok): **TELİFLİ, 31.12.2033'e kadar**.
- c) Sebuh: 96 ölçü. **1/12 ×222** (sekizlik üçlemeler), 1/16 ×116, 3/16 ×44, 1/4 ×41, 1/8 ×18, 1/2 ×3. Aralık F4 – E6b5, 20 farklı perde. İşaretler: A4b5, A4b1, B4b5, B4b1, D5b4, E5b5, E5b1, A5b5, A5b4, B5b5, B5b1, E6b5. Tatlıyay: 134 ölçü, **1/12 ×270**, aralık F4 – D6. İki dosyada da ölçüler aritmetik olarak doğru, ama üçlemeler temsil edilemiyor (258 ve 309 hata).
- d) Sebuh sürümünde 13 perde uygulamada yok: F4 Acemaşiran, A4b5 Zirgüle, E5b5 Hisar, A5b5, C6, D6, E6b5 vb.
- Öneri: **SKIP**. Üçleme desteği olmadan olmaz; aralık da ney başlangıcı için fazla geniş.

### 9. Çeçen Kızı (Tanburi Cemil Bey)
- a) `huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt`, https://raw.githubusercontent.com/MTG/SymbTr/master/txt/huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt (Hüseynî, oyun havası, Nim Sofyan). Tek sürüm, sözsüz.
- b) Tanburi Cemil Bey (1871/1873 – 28.7.1916; https://en.wikipedia.org/wiki/Tanburi_Cemil_Bey): **KAMU MALI**.
- c) 56 ölçü, 2/4. Süreler 1/16 ×210, 1/8 ×37 (+4 Kod 10), 1/4 ×24, 3/8 ×4, 1/2 ×3, 3/32 ×6, **1/32 ×6**. 3/32 noktalı onaltılık olarak temsil edilebiliyor; 1/32 edilemiyor. 1/32'ler Sira 226, 232, 238, 247, 253 ve 259'da (ölçü 41, 42, 43, 45, 46, 47), hepsi "B4b1 3/32 + C5 1/32" figürü. Kod 10 (ardçarpmalı nota) ×4 normal nota olarak okunmalı; atlanınca 8 Offset/ölçü hatası çıkıyor. Bu yapıldığında kalan tek sorun 6 adet 1/32 ve bütün ölçüler 2/4'e tamamlanıyor. Kod 8 (çarpma, Pay 0) ×12 sorunsuz atlanıyor.
- d) Aralık G4 (296) – A5 (358). İşaretler yalnızca B4b1 (Segâh) ve F5#4 (Eviç). **Bütün perdeler uygulamada var.**
- Öneri: **ADD (koşullu)**. Nim Sofyan 2/4 usulü ve Hüseynî makamı eklenmeli, Kod 10 normal nota sayılmalı, 1/32 ya desteklenmeli ya da ölçü 41–47'deki 6 figür için açıkça belgelenmiş bir karar verilmeli. Dönüştürücü yaklaştırma yapmadığı için bu bir tasarım kararı gerektirir.
