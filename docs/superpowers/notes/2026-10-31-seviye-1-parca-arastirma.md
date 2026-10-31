# Seviye 1 parça araştırması: beş perdelik ney öğrencisi için SymbTr taraması

Tarih: 2026-10-31. Yalnızca araştırma; depo kodu değiştirilmedi. Doğrulanamayan her şey **BELİRSİZ** diye işaretlendi. "Kendi çıkarımım" denen yerler kaynak değildir.

## Yöntem

- **Derlem**: `git clone --depth 1 https://github.com/MTG/SymbTr` (commit `246bbe362ef17cf9d200b5296e06473f29768be3`, `VERSION` 2.4.3) boş bir klasöre alındı. `txt/` altında **2200** dosya var. Metaveri için aynı depodaki `mu2/` başlıkları da okundu (satır 57 form, 58 "beste", 59 "söz", 60 ad, 62-63 kaynak türü; ör. `THM`/`TSM`). Satır 58'in türkülerde bestekâr mı, derleyen/notaya alan mı olduğu depoda yazmıyor (**BELİRSİZ**).
- **Tarama betiği** (Python, `-I` ile; depo dışında, scratchpad `tools/scan.py`): her dosyada ilk satırın Kod 51 Pay/Payda ve usul adı, Kod 4/7/9/10/11/12 satırları (Pay > 0) nota/sus olarak okunur (dönüştürücüyle aynı kural), Kod 8 ve Pay 0 satırlar atlanır. Ölçü numarası `ceil(Offset)`. Bir ölçü şu koşullarla "geçerli" sayılır: (1) bütün notalar KomaAE ∈ {296, 305, 313, 318, 327} ya da sus (Es, KomaAE -1); (2) bütün süreler 1/8'in tam katı (1/16, 3/16, 1/32, üçleme yok; 5/8, 7/8 gibi katlar bağlı notaya bölünür); (3) süreler toplamı ölçüye eşit; (4) Offset farkları süreyle tutarlı (Kod 1/23/24… gibi dönüştürücünün atladığı süreli satır varsa Offset bozulur ve ölçü elenir); (5) ölçüde ikinci bir Kod 51 yok. Ardışık geçerli ölçülerden **en uzun / tüm maksimal aralıklar** çıkarıldı. Perdeler **KomaAE'ye** göre, yazıma göre değil.
- **Usul eşleşmesi**: Pay/Payda ve SymbTr usul adı birlikte uygulamadaki usulle eşlenir: 2/4 Nîmsofyan, 3/4 Semâî, 4/4 Sofyan, 6/8 Yürüksemâî (II), 6/4 Yürüksemâî (6/4), 5/8 Türkaksağı, 7/8 Devr-i Hindî (7/8), 8/8 Düyek, 9/8 Aksak, 12/8 Dolap. Evfer, Devr-i Turan, Raksaksağı, Müsemmen, Curcuna, Senginsemâî (6/4), Âzerî Yürüksemâî, Bulgar Darbı, Çiftesofyan vb. eşleşmez.
- **Dönüştürücü doğrulaması**: `scripts/symbtr-to-json.mjs`'in `convertSymbTr`'ı ayrı bir betikten (scratchpad `node/conv2.mjs`) çağrıldı, `src/` altına yazılmadı. Her aday için `olcuAraligi` ile dönüştürüldü; ayrıca çıktı olaylarından perdeler `komaAEOf` ile ve süreler (`dur`/`dotted`/`tie`) bağımsız olarak yeniden okunup beş perde + izinli süre kuralına karşı sınandı (örnek: Gül Ağacı 1–8 bu sınamada E5 yüzünden elendi, dönüştürücü ise hatasız geçirmişti; yani `convertSymbTr` perde/süre kuralını **denetlemez**).
- **Web**: açılan sayfalar: `https://islamansiklopedisi.org.tr/rauf-yekta-bey` (8 Ocak 1935), `https://en.wikipedia.org/wiki/Rhythm_in_Turkish_music`, `https://dergipark.org.tr/en/pub/itobiad/article/686918`, `https://islamansiklopedisi.org.tr/sadettin-kaynak` ve `.../yesari-asim-arsoy` (ikisi de yalnız arama özeti verdi, tarih yok), `https://www.neyzen.com/ney_ilahiler.html` (kesik, ilgili başlık görünmedi). Arama sonuçlarında türkü kayıtlarına (Terazi, Havuzun Başında, Yangın Olur) dair doğrudan kaynak **çıkmadı**; aşağıdaki hak/tanınırlık bilgilerinin çoğu bu yüzden BELİRSİZ.
- Telif ölçütü: FSEK ölüm yılı + 70 (önceki notlarla aynı; mevzuat metni yeniden doğrulanmadı). Anonim ve geleneksel eserler kamu malı sayıldı; **TRT/THM derlemelerinde derleyen ve notaya alanın hakları BELİRSİZ**. SymbTr dizgisi CC BY-NC-SA 4.0 (`src/content/parcalar/LISANS.md` düzeni).
- Mevcut parçalar (yeniden önerilmedi): benim-adim-dertli-dolap, yine-baglandi-dil-aranagme, hak-teala, allah-emrin-tutalim, hicran-oku-aranagme, gul-yuzlulerin, daglar-ile-taslar-ile, cecen-kizi. (Not: `benim-adim-dertli-dolap` 1/16 ve 3/16 içerir, yani aşağıdaki Seviye 1 süre kuralına kendisi uymaz.)

## 1. Ölçütler

- Perdeler: yalnız G4 (Rast, KomaAE 296), A4 (Dügâh 305), B4b1 (Segâh 313), C5 (Çârgâh 318), D5 (Nevâ 327).
- Süreler: birlik, ikilik, dörtlük, sekizlik, noktalı ikilik (3/4), noktalı dörtlük (3/8), bunların susları; bağ serbest (5/8 = ikilik + sekizlik gibi). 1/16, 3/16, üçleme, 1/32 yok.
- Usul: uygulamadaki on usulden biri; Pay/Payda ve usul adı gerçekten o usul olmalı.
- Kesit: ≥ 8 ölçü, doğal müzikal birim (aranağme, kıta, nakarat), tamamı kurala uymalı.

## 2. Tarama sonucu

| Sayı | Değer |
|---|---|
| Taranan txt | 2200 (2'si `[Serbest]` usul, Payda 0, çözümlenemedi: `muhayyer--bozlak--serbest--havayi_da…`, `saba--miraciye--serbest--pes_heman…`; 2198 çözümlendi) |
| Uygulama usulüyle eşleşen dosya | 1245 / 2198 |
| **Tam dosya geçen** (beş perde + izinli süre) | **1**: `ussak--turku--bulgardarbi--oklavayim_paziyim--.txt` (28 ölçü). Usul "Bulgar Darbı" 8/8, uygulamada yok. **Uygulama usulünde tam dosya: 0** |
| Yalnız perde kuralını geçen tam dosya | 7: Benim Adım Dertli Dolap (zaten var), Oklavayım Pazıyım, Oynayın Kız (Trabzon, Devr-i Turan), Evrese Yolları (Evfer), Eledim Eledim (Erzurum, Sofyan), Kalenin Burcu Muyam (Sofyan), Sığaramın Dumanı (Sofyan) |
| Yalnız süre kuralını geçen tam dosya | 201 (hepsinde perde dışı var) |
| Her iki kuralı geçen tam dosya | 1 (Oklavayım Pazıyım) |
| ≥ 8 ölçülük kesit (tam dosya olmayan) | 34 aralık, 17 dosya (tüm usuller); **uygulama usulünde 22 aralık, 13 dosya** (Oklavayım dahil değil) |
| ≥ 4 ölçülük aralığı olan dosya | 90 (tüm usuller), 60 (uygulama usulü) |

**Dürüst sonuç**: Seviye 1 kuralına uyan **tam parça yok** (uygulama usulünde sıfır). Kesit olarak uygulama usulünde 13 dosyada ≥ 8 ölçü çıkıyor; bunlardan telifli/belirsiz bestekârlı olanlar (Ömer Dilek, Sadettin Kaynak, Yesârî Âsım Arsoy, Münir Nurettin Selçuk) ve doğal birim olmayanlar (Gül Ağacı) çıkınca elde **dört dosyalık** bir türkü havuzu (Terazi, Yangın Olur, Havuzun Başında, A Fadimem) ile bir Rauf Yektâ seyir takımı kalıyor. Yeni ilahi adayı sıfır: kurala uyan ilahiler zaten uygulamada (Hak Teâlâ kesitleri 5–7 ölçülük parçalar, Allah Emrin, Benim Adım Dertli Dolap). Darboğaz süredir: 1/16 yaygın; ayrıca perde dışı notalar (E5, F4#4, tizler).

### Yakın seçenekler (kuralı bir adım gevşetince; Seviye 2 ya da ritim genişletmesi)

- **Ritim: 1/16 ve noktalı 1/8 (3/16) serbest, perdeler aynı beş** (`scan16.py`): tam dosya 5 (uygulama usulünde 2: Benim Adım Dertli Dolap, **Kalenin Burcu Muyam**, 4/4 Sofyan, 48 ölçü, Uşşak, anonim THM türküsü, 412 nota), ≥ 8 ölçülük kesit 98 aralık / 48 dosya. Öne çıkanlar: Adana'nın Yolları (Rast, Sofyan, ölçü 1–20 ve 29–54, anonim THM), İbrişim Örmüyorlar (Rast, Nim Sofyan, 17–28 …), Pınar Başı Burma Burma (Saba, Nim Sofyan, 16–36), Çayır İnce Biçemedim (Muhayyer, Sofyan, 24–36), Fındıklı Bizim Yolumuz (Uşşak, Aksak, 25–36). Hepsi `convertSymbTr`'dan hatasız geçti; bunlar yalnız ritim gevşetilirse (Seviye 2'de 1/16 öğretilirse) uygundur.
- **Perde: beş perde + yalnız E5 (Hüseynî, 336)** (Seviye 2 perdesi): tam dosya 5 (uygulama usulünde 2: `ussak--turku--yuruksemai_ii--cilveloy--artvin.txt` (İndim Dere Irmağa, 6/8, 25 ölçü, derleyen Muzaffer Sarısözen, BELİRSİZ hak) ve `ussak--ornek_oz--turkaksagi--1--ruhi_ayangil.txt` (8 ölçü, Rûhî Ayangil, ölüm yılı BELİRSİZ)), ≥ 8 ölçülük kesit 28 dosya: Gül Ağacı Değilem 1–21 (Rast, Semâî; **bu aralıkta E5 yalnız ölçü 1 ve 9'da**, yani giriş ölçüsü), Salına Salına (Aksak), Su Dağları (Sofyan; Fahri Kayahan, canlı/ölüm yılı BELİRSİZ), Terazi'nin 1–17/30–65 aralığı (zaten E5'siz). **Bûselik (B4, 314)**, Kürdî (309/310), Nim Hicaz (322), F5, G5, A5 tek başına eklenince tam dosya yalnız 1 olur (Oklavayım); yani **Hüseynî (E5) en verimli tek perde**. Bûselik'te yeni kesit: Dil Bestenim (Bûselik şarkı, Semâî, 8 ölçülük dört aralık; Vecdi Seyhun, hak durumu BELİRSİZ).
- **Hak Teâlâ** (zaten var) E5 eklenince 1–16 ve 22–31 aralıkları da tutuyor; yani bugün seçilen parça bu gevşetmede kesintisiz uzar.

## 3. Aday tablosu

Süreler: 8 = sekizlik, 4 = dörtlük, 2 = ikilik, 1 = birlik, noktalı olanlar `.`. "Nota" = sus hariç nota sayısı. Hepsi `convertSymbTr` ile hatasız dönüştü ve çıktıdan perde/süre bağımsız olarak denetlendi.

| # | Dosya | Makam | Usul | Ölçü / aralık | Süreler | Nota | Besteci (ölüm) | Telif | Tanınırlık | Öneri |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `segah--turku--turkaksagi--terazi--macka.txt` | Segâh | Türk Aksağı 5/8 (var) | **31–48** (18) kıta; ayrıca 1–16 aranağme, 49–64 aranağme, 78–96 (19) | 8, 4 | 66 (+6 sus); 4 farklı perde (G4 A4 B4b1 C5) | Anonim; mu2 "beste" alanı: Hüseyin Dilâver (1905–1964 arama özeti, kaynak açılamadı), söz anonim | **BELİRSİZ** (anonim türkü; Dilâver derleyen mi bestekâr mı bilinmiyor, ikincisiyse 2034 sonuna kadar telifli olabilir) | BELİRSİZ (kaynak bulunamadı) | **Koşullu ADD** (hak netleşirse; `soz` ancak anonim kesinleşirse) |
| 2 | `ussak--turku--aksak--yangin_olur--.txt` | Uşşak | Aksak 9/8 (var) | **25–36** (12) (6 ölçülük kıta × 2) | 8, 4, 4., 2 + bağ (5/8 → 2+8, 4 bağlı olay) | 72 | Anonim (mu2: (Anonim)/[Anonim]) | Kamu malı sayıldı; derleyen BELİRSİZ | BELİRSİZ | **ADD** (koşul: söz isteniyorsa derleyen kontrolü; `soz: false` güvenli) |
| 3 | `tahir--turku--aksak--havuzun_basinda--cankiri.txt` | Tâhir (uygulamada yok) | Aksak 9/8 (var) | **15–26** (12) = 6 ölçü kıta + 6 ölçü aranağme; 1–6 saf aranağme | 8, 4, 4. | 76 | Anonim; mu2 "beste": Ahmet Altuner (kim olduğu BELİRSİZ) | **BELİRSİZ** | BELİRSİZ (Çankırı türküsü; kaynak bulunamadı) | Koşullu (makam `tahir` yok: Uşşak etiketi doğru mu?) |
| 4 | `huseyni--turku--aksak--a_fadimem--.txt` | Hüseynî | Aksak 9/8 (var) | **21–28** (8) "Aylaylılam" nakaratı (aynı nakarat 49–56) | 8, 4, 2 | 44 (+4 sus) | Anonim (mu2 "(Anonim)", kaynak kodu garip: H/TSM) | Kamu malı sayıldı; BELİRSİZ | BELİRSİZ | Koşullu (yalnız nakarat; söz kısa, anonim) |
| 5 | `ussak--turku--bulgardarbi--oklavayim_paziyim--.txt` | Uşşak | "Bulgar Darbı" 8/8 (uygulamada yok; Düyek **değil**) | **tam dosya, 28 ölçü** (7 ölçü × 4 aynı kıta); [1,7] yeter | 8, 1 | 172 (+24 sus); yalnız A4 B4b1 C5 D5 | Anonim | Kamu malı sayıldı; derleyen BELİRSİZ | BELİRSİZ | **SKIP** (usul), koşullu: Bulgar Darbı eklenirse |
| 6 | `rast--seyir--semai--1--rauf_yekta.txt` | Rast | Semâî 3/4 (var) | **2–10** (9) | 4, 2 | 17 (+1 sus) | Rauf Yektâ (ö. 8 Ocak 1935, TDV) | **KAMU MALI** | Eğitsel örnek, parça değil | **ADD (koşullu)**: eğitsel seyir olarak |
| 7 | `ussak--seyir--semai--1--rauf_yekta.txt` | Uşşak | Semâî 3/4 (var) | **9–18** (10); ayrıca 1–7 (7), 22–26 (5) | 4, 2 | 21 (+2 sus) | Rauf Yektâ (ö. 1935) | **KAMU MALI** | Eğitsel örnek | **ADD (koşullu)** |
| 8 | `ussak--yuruksemai--yuruksemai--dila_cunem--diyarbakirli_mahmut_celebi.txt` | Uşşak | Yürüksemâî 6/4 (var) | 1–7 (7); 8. ölçüde tek F4#4 var, 8 ölçülük kıta bütünü bozulur | 8, 4, 4. | 56 (+7 sus) | Diyarbakırlı Mahmud Çelebi (mu2 "?", ölüm BELİRSİZ) | BELİRSİZ | BELİRSİZ | **SKIP** (7 ölçü, kıtayı yarıda keser) |
| 9 | `ussak--turku--turkaksagi--drama_koprusu--.txt` | Uşşak | Türk Aksağı 5/8 (var) | 14–20 (7) × 8 kez tekrar | 8, 4, 2 + bağ | 21 | mu2 "beste": Arif Şentürk (rolü BELİRSİZ), söz anonim | BELİRSİZ | BELİRSİZ | SKIP (7 ölçü) |
| 10 | `rast--turku--semai--gul_agaci--necip_mirkelamoglu.txt` | Rast | Semâî 3/4 (var) | 10–21 (12) ya da 2–8 (7): giriş ölçüsü E5 ve F4#4 içeriyor, **doğal birim değil** (aranağme 10–16 + kıtanın ilk dizesi + ikinci dizenin ilk notası) | 8, 4, 2, 2. | 37 | Necip Mirkelâmoğlu (mu2 hem beste hem söz; ölüm yılı BELİRSİZ) | BELİRSİZ | BELİRSİZ | **SKIP** (Seviye 2'de E5 ile 1–21 alınabilir) |
| 11 | `rast--sarki--semai--perisan_saclarin--yesari_asim_arsoy.txt` | Rast | Semâî 3/4 (var) | 7–16 (10); 99–108 | 8, 2. | 45 | Yesârî Âsım Arsoy (20. yy; ölüm yılı doğrulanamadı) | büyük olasılıkla **TELİFLİ**, BELİRSİZ | BELİRSİZ | SKIP |
| 12 | `karcigar--sarki--duyek--kirpigi_oyali--sadettin_kaynak.txt` | Kürdilihicazkâr | Düyek 8/8 (var) | 31–38 (8) | 8, 4, 1 | 26 | Sadettin Kaynak (20. yy; ölüm yılı doğrulanamadı); söz Vecdi Bingöl | büyük olasılıkla **TELİFLİ**, BELİRSİZ | BELİRSİZ | SKIP |
| 13 | `ussak--fantezi--sofyan--soyle_sevgili--munir_nurettin_selcuk.txt` | Uşşak | Sofyan 4/4 (var) | 30–42 (13), 13–23, 53–62 | 8, 4, 2, 2., 1 | 36 | Münir Nurettin Selçuk (20. yy; ölüm yılı doğrulanamadı); söz Vecdi Bingöl | büyük olasılıkla **TELİFLİ**, BELİRSİZ | BELİRSİZ | SKIP |
| 14 | `huseyni--sarki--aksak--bir_damlacik--omer_dilek.txt`, `huseyni--aranagme--aksak--1--.txt` | Hüseynî | Aksak 9/8 (var) | 8–16 (9) (aranağme dosyasında da aynı aralık) | 8, 4, 2, 1, 4. | 41 | Ömer Dilek, söz Birsen Bahadır (ölüm BELİRSİZ); aranağme dosyasında "?" | büyük olasılıkla **TELİFLİ** | BELİRSİZ | SKIP |
| 15 | `huseyni--turku--aksak--yanik_omer--sadettin_kaynak.txt` | Hüseynî | Aksak 9/8 (var) | 8–16 (9) | 8, 4, 2. | 41 | Sadettin Kaynak | büyük olasılıkla **TELİFLİ** | BELİRSİZ | SKIP |

Elenenler (uygulama usulü değil, ama beş perdeye uyan ≥ 8 ölçü): Gelse Nesîm-i (Senginsemâî 6/4; 1–8, 14–25, 32–40, 46–56; IV. Murad atfı BELİRSİZ), Gönlüme Gir (3/8 Semâî), Gemim Gidiyor (Raksaksağı; 14–24, Sadettin Kaynak), Âşık Oldur (Curcuna 10/8, Hacı Arif Bey [ölüm yılı kaynak açılmadığından BELİRSİZ], 47–54, 24–30, 56–62), Evrese Yolları (Evfer 9/8; 8–12 yalnız), Oklavayım (satır 5).

## 4. Aday ayrıntıları

### 4.1 Terazi (Maçka türküsü), Segâh, Türk Aksağı 5/8

- Dosya: `segah--turku--turkaksagi--terazi--macka.txt` (96 ölçü). mu2 başlığı "Terazi Tartayirum", form Türkü, kaynak THM. Usul satırı "Türkaksağı 5/8", ritim 2+2+1 (sekizlik, sekizlik, dörtlük, sekizlik: 1/8 1/8 1/4 1/8).
- Yapı: m1–16 aranağme (iki ölçülük motif × 8; B4b1 C5 A4 A4 / G4 C5 B4b1 sus), m17–30 ilk bölüm (G5 ve E5 benzeri tizlere çıkar, **uygun değil**), **m31–48** kıta (9 iki-ölçülük dize; Soz1 hecelerinin birleşimi dosya yazımıyla: "Ve-ru-rum pa-ra-su-ni / E o-la-sa o-la-sa / Bu sev-da-luk ol-ma-sa / Ha-çan ol-du-o-la-cak-ta / Se-ven se-ve ni al-sa / Ye-ni çı-ka-yı ye-ni-da / De-le-run or-ma-ni / Sev-da-lık-tan ke-sil-di-da / Diz-le-ri-min der-ma-ni"; hece yazımı ağız özelliği taşıyor, olduğu gibi aktarılırsa düzeltme gerekebilir), m49–64 iki aranağme, m65 ikinci bölüm tekrarı (tiz).
- Seçilebilir aralıklar: `[31, 48]` (18 ölçü, 66 nota + 6 sus, perdeler G4 A4 B4b1 C5, süreler 8 ve 4, bağ yok) ya da `[1, 16]` (aranağme). `[31, 64]` kıta + iki aranağme (34 ölçü). Tam çıkan en uzun aralık `[30, 65]` ama m30 ve m65 önceki/sonraki dizenin yarım parçası.
- Makam: dosya adı Segâh; `ParcaMakam`'da yok (`rast | neva | ussak | bayati | huseyni | hicaz`). Bu beş perdede ezgi A4/B4b1 merkezli. Makam etiketi kararı gerekir.
- Usul: Türk Aksağı uygulamada Seviye 4 öğretim sırasında (`usuller.ts` yorumu). Seviye 1'e koymak ritim konusunda öğrenciyi 5/8 ile baş başa bırakır; ritim yalnız sekizlik ve dörtlük olduğu için okuması kolay.
- Hak: mu2 "beste" = Hüseyin Dilâver. Arama özeti (açılamayan kaynak) bir "Hüseyin Dilaver (1905–1964)" kemençe ustasından söz ediyor; `https://dergipark.org.tr/en/pub/itobiad/article/686918` açıldı ve **tarih vermedi**. Aynı kişi olup olmadığı ve "Terazi"yi bestelemiş mi derlemiş mi olduğu **BELİRSİZ**. Bestekârsa 1964 + 70 = 2034 sonuna kadar telifli. Güvenli yol: hak netleşmeden `soz: false` ve ya yalnız aranağme `[1,16]` (yine de aynı bestenin parçası).

### 4.2 Yangın Olur Biz Yangına Gideriz, Uşşak, Aksak 9/8

- Dosya: `ussak--turku--aksak--yangin_olur--.txt` (36 ölçü, mu2: Türkü, THM, bestekâr/söz anonim). Kıta düzeni: 1–6 aranağme (1/16 içerir, uygun değil), 7–12 "Yangın olur biz yangına gideriz" (E5 ve F5, tiz), 13–24 (13–18 "Düz ovada keklik gibi sekeriz" kurala uyar, 12–18 geçerli bir aralık; 19–24 "Yokuşlarda şahin gibi uçarız" E5/F5/G5 içerir), **25–36** "Sandık sandıklar içinde çok şanımız var / Hazret-i Mevlâ'ya yalvarmamız var" (6 ölçülük bölüm iki kez).
- `[25, 36]`: 12 ölçü, 72 nota, süreler 8, 4, 4., 2; **A4:5/8 (5 yerde) bağlı olay olarak yazılır (ikilik + sekizlik)**, toplam 4 bağlı satır. Perdeler beşi de kullanır (G4 A4 B4b1 C5 D5). Dönüştürücü hatasız (tiedRows 4).
- Not: ilk seçilen aralık (24–36) m24'ü içerir; m24 önceki kıtanın son ölçüsü, bu yüzden 25–36 doğal birimdir.
- Hak: anonim; THM derleyeni dosyada yok → kamu malı sayıldı, derleyen BELİRSİZ. Tanınırlık BELİRSİZ.

### 4.3 Havuzun Başında İskemlem Kaldı (Çankırı), Tâhir, Aksak 9/8

- Dosya: `tahir--turku--aksak--havuzun_basinda--cankiri.txt` (40 ölçü). Yapı: 1–6 aranağme (iki kez üç ölçü, tamamı kurala uyar), 7–14 "Havuzun başında iskemlem kaldı aman" (A5, C6 gibi tiz, **uygun değil**), **15–20** "Yaman Çankırılar oğlunu aldı / Oğlunu aldı da ne yiyim kaldı" (altı ölçü), 21–26 aranağme (tekrar), 27–34 tekrar tiz, 35–40 ikinci kıta.
- `[15, 26]` = 12 ölçü (6 ölçü ezgi + 6 ölçü aranağme), 76 nota, 8, 4, 4., perdeler A4 B4b1 C5 D5 (G4 yok). `[1, 6]` saf aranağme (38 nota).
- Makam "Tâhir" (SymbTr yazımı) uygulamada yok; ezgi D5 etrafında. Etiket kararı gerekir.
- Hak: mu2 "beste": Ahmet Altuner. Kimliği/rolü aramalarla **bulunamadı**; BELİRSİZ. Söz anonim.

### 4.4 A Fadimem Hadi Senle Kaçalım, Hüseynî, Aksak 9/8

- Dosya: `huseyni--turku--aksak--a_fadimem--.txt` (56 ölçü). m1–8 aranağme (G5 F5#4 E5, tiz), m9–20 iki kıta (E5 içerir), **m21–28** "Aylay lılam" nakaratı (iki kez dört ölçü), m29–36 aranağme, 37–48 kıta, 49–56 aynı nakarat.
- `[21, 28]`: 8 ölçü, 44 nota + 4 sus, süreler 8, 4, 2, perdeler G4 A4 B4b1 C5 D5. Makam Hüseynî uygulamada var.
- Hak: mu2 "(Anonim)", ama kaynak kodları H/TSM (tutarsız: THM değil). **BELİRSİZ**. Nakarat kısa ve ezgisi tekrarlı; öğretim değeri düşük–orta.

### 4.5 Rauf Yektâ seyirleri (Rast, Uşşak; Semâî 3/4)

- Dosyalar: `rast--seyir--semai--1--rauf_yekta.txt` (32 ölçü, geçerli aralık 2–10), `ussak--seyir--semai--1--rauf_yekta.txt` (40 ölçü; 1–7, 9–18, 22–26). Form "Seyir", sözsüz, yalnız ikilik/dörtlük, ardışık derece hareketi; makamın yürüyüşünü gösteren eğitsel örnek, **tanınan bir parça değil**.
- Rauf Yektâ: doğum 26 Mart 1871, ölüm 8 Ocak 1935 (https://islamansiklopedisi.org.tr/rauf-yekta-bey). Kamu malı (1935 + 70 = 2005). Bu seyirlerin ona ait olduğu mu2 başlığında (satır 58) yazıyor; TDV maddesi "seyir" örneklerini anmıyor (**atıf BELİRSİZ**).
- `[9, 18]` Uşşak (10 ölçü, 21 nota + 2 sus) ve `[2, 10]` Rast (9 ölçü, 17 nota + 1 sus) hatasız dönüştü. Rast seyirde ilk ölçü F4#4 (Irak) ile başladığı için 1. ölçü atılır; kesit bu yüzden "seyrin ilk dizesi" değil, ikinci ölçüden başlıyor.

### 4.6 Oklavayım Pazıyım (tam dosya, ama usul uygunsuz)

- `ussak--turku--bulgardarbi--oklavayim_paziyim--.txt` 28 ölçü, yalnız A4 B4b1 C5 D5, 8 ve 1 süreleri, her ölçü 1/8 × 4, sekizlik sus, 1/8 × 3. 7 ölçülük kıta dört kez aynen tekrarlanıyor. Hecelenmiş söz: "Oklavayım pazıyım / Akgerdana razıyım …".
- Usul adı Bulgar Darbı, Pay/Payda 8/8; ancak İngilizce Vikipedi "Rhythm in Turkish music" (açıldı) Bulgar Darbı'nı **9 zamanlı** usuller arasında sayıyor (düzen verilmiyor) ve 8 zamanlıları Düyek, Ağırdüyek, Katakofti olarak veriyor. Yani dosyanın 8/8 yazımı ile usulün kaynaktaki sınıfı çelişiyor: **BELİRSİZ**. Düyek olarak çalmak, usul adı gerçekten o olmadığı için yanlış olur. Öneri **SKIP**, ancak Bulgar Darbı yazımı doğrulanıp usul eklenirse en kolay parçalardan biri olurdu (tek bir 7 ölçülük kıta, dört perde).

## 5. Açık sorular

1. **Seviye 1'de hiç tam parça yok**: Kesit politikası kabul mü? En iyi kesitler türkü; öğrenci için "tanınan parça" iddiası BELİRSİZ (hiçbirinin tanınırlığını kaynakla doğrulayamadım).
2. **Usul sırası**: Türk Aksağı 5/8 ve Aksak 9/8 uygulamada ileri seviye öğretim sırasında. İlk üç aday (Terazi, Yangın Olur, Havuzun Başında) bu usuller. Bunlar Seviye 1'e konacaksa usul dersi ve yeni sıra gerekir; aksi halde en uygun alternatif ritim gevşetmesi (aşağıda 5. madde).
3. **Makam**: Terazi Segâh, Havuzun Başında Tâhir; ikisi `ParcaMakam`'da yok. Uşşak etiketi mi, yeni makam mı?
4. **Hak**: TRT/THM türkülerinde derleyen/notaya alan kayıtları (Hüseyin Dilâver, Ahmet Altuner, Arif Şentürk, Muzaffer Sarısözen vb.) mu2'de "beste" alanında geçiyor; rolleri ve hakları BELİRSİZ. Kamu malı sayılacak mı? Karar verilene kadar `soz: false` ve atıfta "Anonim (SymbTr kaydı)" güvenli.
5. **Süre kuralını gevşetmek** (1/16 ve noktalı sekizlik) tam parça sayısını 1'den 5'e (uygulama usulünde 0'dan 2'ye) ve ≥ 8 ölçülük kesit sayısını 34'ten 98'e çıkarıyor; Kalenin Burcu Muyam, Adana'nın Yolları, İbrişim Örmüyorlar, Pınar Başı gibi anonim türküler girer. Seviye 2 için daha doğal.
6. **Perde gevşetmesi**: Yalnız E5 (Hüseynî) eklemek Gül Ağacı Değilem, Salına Salına, Su Dağları, İndim Dere Irmağa gibi parçaları açar; Seviye 2 perdeleri zaten Bûselik ve Hüseynî civarı.
7. **Gül Ağacı Değilem** (Necip Mirkelâmoğlu): giriş ölçüsünde yalnız E5 yüzünden Seviye 1'e girmiyor; ölüm yılı BELİRSİZ; Seviye 2 için kontrol edilmeli.
8. Dönüştürücü notu: `convertSymbTr` perde ve süre kuralını denetlemez; kurala uymak için kullanıcı tarafında ayrı bir denetim (ör. bir test) gerekir. Ayrıca `KOD_NOTA = [4,7,9,10,11,12]` listesinde Kod 23, 24, 28, 32, 43, 44 yok; bu kodlar süreli nota satırı olarak geçiyor (ör. Telgırafın Tellerine ölçü 1'de Kod 28 ve 23 satırları 1/8'er süreli) ve atlanınca ölçü toplamı eksik kalır; tarama bu ölçüleri eler, dönüştürücü ise o dosyaları reddeder.
