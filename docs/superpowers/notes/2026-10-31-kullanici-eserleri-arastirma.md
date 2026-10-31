# Kullanıcının öğretmeniyle çalıştığı eserler: SymbTr taraması

Tarih: 2026-10-31. Yalnızca araştırma; depo kodu değiştirilmedi. Doğrulanamayan her şey **BELİRSİZ** diye işaretlendi. "Kendi çıkarımım" denen yerler kaynak değildir. Liste bir sohbet botu ekran görüntüsünden geldiği için makam, usul, besteci ve "kolay" iddiaları doğrulanmamış sayıldı; aşağıdaki her bilgi dosyadan ya da açılan sayfadan alındı.

## Yöntem

- **Derlem**: önceki notla aynı SymbTr kopyası (`MTG/SymbTr`, commit `246bbe362ef17cf9d200b5296e06473f29768be3`, `VERSION` 2.4.3, 2200 txt). Metaveri `mu2/` başlıklarından (50 makam, 51 usul, 57 form, 58 "beste", 59 "söz", 60 ad, 62-63 kaynak). Satır 58'in türkü/nefeslerde bestekâr mı derleyen mi olduğu depoda yazmıyor (**BELİRSİZ**).
- **Arama**: (1) dosya adı (başlık sözcükleri, çeviriyazılı: veysel, karani, salat, ummiyye, bilmem, nideyim, sol_cennet, dildade, canim_kurban, tevhid, kabe, geydim, yururum, hak_yaratti, askin_aldi, erler, destur, taleal, milisiniz, melamet, haydar, buyrug, rahman …); (2) mu2 başlık alanı (satır 60, tam ad); (3) bütün txt dosyalarındaki Soz1 hecelerinin birleştirilmiş güftesi (aksan ve boşluksuz karşılaştırma); (4) mu2 dosyalarının ham metninde grep; (5) bütün `ilahi / nefes / tesbih / salat / durak / tevsih / miraciye / sugul` formlarının dökümü; (6) bütün Rast, Uşşak, Hicaz, Hicaz-Hümâyûn, Segâh, Sultânîyegâh, Hüseynî, Nihâvent `pesrev` dosyaları. Taramanın sonucu: 22 kalemden **yalnızca 4'ü** SymbTr'de bir karşılık buluyor (bkz. §1).
- **Çözümleme betikleri** (depo dışı, `C:\Users\suyun\AppData\Local\Temp\claude\C--Claude-Notasi\6fdfc6f0-6adb-42af-8a35-1fd74aaec196\scratchpad\kullanici\`): `meta.py`/`q.py` (başlık sorgusu), `lyr.py`/`ql.py` (güfte sorgusu), `an.py` (dosya özeti: Kod 51 satırları, Kod dağılımı, 9 dışı süreli Kod satırları, süre histogramı, KomaAE histogramı, işaret satırları), `runs.py` (verilen perde ve ritim seviyesinde geçerli ölçü aralıkları), `rng.py` (aralık istatistiği), `show.py` (ölçü dökümü), `run.mjs` (dönüştürücü doğrulaması). Önceki notun `tools/scan.py` kuralları aynen kullanıldı: Kod 4/7/9/10/11/12 satırları (Pay > 0) nota/sus; ölçü = `ceil(Offset)`; "geçerli ölçü" = perdeler seçilen seviyenin KomaAE kümesinde, süreler seçilen ritim seviyesinde, süre toplamı ölçüye eşit, Offset tutarlı, ölçüde ikinci Kod 51 yok.
- **Uygulama perde seviyeleri** (`src/content/ney-perdeler.ts` + `komaAEOf` ile hesaplandı, `kullanici/perde.mjs`): Seviye 1: 296 G4, 305 A4, 313 B4b1, 318 C5, 327 D5. Seviye 2 ekler: 314 B4, 309 B4b5, 310 B4b4, 322 C5#4. Seviye 3 ekler: 336 E5, 340 F5, 349 G5, 358 A5, 344 F5#4, 353 G5#4, 331 E5b5 (kapalı Nevâ 327 ile aynı). Seviye 4 ekler: 366 B5b1, 371 C6, 380 D6, 375 C6#4. **Bunların dışındaki her koma (örn. 335 E5b1, 291 F4#4, 362 B5b5, 367, 345 F5#5, 300, 274/283/287) uygulamada çalınamaz.**
- **Ritim seviyesi**: yalnız 1/8'in tam katları → 1; 1/16, 3/16 → 2; 1/32 ve 3/32 → 4; üçleme (1/12, 1/24) → dönüştürücü reddeder ("9" = desteklenmez). 5/8, 7/8 gibi katlar bağlı notaya bölünür.
- **Önerilen seviye** = en yüksek (perde seviyesi, ritim seviyesi). Ayrı bir sütunda uygulamadaki **usul** önerilen seviyesi (`ONERILEN_SEVIYE.usul`: Nim Sofyan, Sofyan, Semâî 2; Yürük Semâî, Türk Aksağı, Devr-i Hindî 4; Düyek, Aksak 5) not edildi; önceki kararlarda parça seviyesi usul seviyesinden bağımsız verilmişti (`benim-adim-dertli-dolap` Dolap usulüyle Seviye 2), bu yüzden hükme katılmadı.
- **Dönüştürücü**: `convertSymbTr` (`scripts/symbtr-to-json.mjs`) ayrı bir betikten çağrıldı (`kullanici/run.mjs`), `src/`'ye yazılmadı. Uygulamada olmayan usuller için `{zaman, mertebe}` içeren geçici usul nesnesi verildi. Kod 1/23/24/28/32/43/44 satırlarını nota sayan bir **deneme kopyası** (`kullanici/conv-ext.mjs`, yalnızca `KOD_NOTA` değişti) ayrıca çalıştırıldı; "std" = deponun dönüştürücüsü, "ext" = bu kopya. Her başarılı dönüşümde çıktı olaylarından perde ve süre bağımsız yeniden okundu.
- **Kodlar** (SymbTr `code_explanations.xlsx`, depodan okundu): 1 küçük nota, 7 tremolo, 8 çarpma (süresiz), 9 nota/es, 10 ardçarpmalı nota, 11 sessiz çarpma, 23 mordan, 24 aşağı mordan, 28 grupetto, 32 aşağı trill, 43/44 ters mordan, 51 usul değişimi, 53 cümle sınırı. Bu dosyalarda Kod 53/54/55 (bölüm işareti) **yok**; bölüm sınırları yalnızca Soz1'deki "ARANAĞME", "SAZ", "." gibi metinlerden ve güfteden okunabiliyor.
- **Web** (açılan sayfalar): `https://islamansiklopedisi.org.tr/pinar-selahattin` (Selahattin Pınar d. 22 Ocak 1902, ö. 6 Şubat 1960, "Ben yürürem yâne yâne" nevâ şarkısı onun eserleri arasında anılır), `https://islamansiklopedisi.org.tr/yusuf-pasa-neyzen` (ö. 1884; peşrevlerinde devr-i kebîr usulünü tercih ettiği yazar, Segâh peşrevinin usulü açıkça yazılmamış), `https://islamansiklopedisi.org.tr/itri-efendi-buhurizade` (ölüm 1123/1711 ya da 1124/1712; Karadeniz'in 1143/1730-31 savı; salât-ı ümmiyyeyi Segâh'ta anar, usulü yazmaz), `https://islamansiklopedisi.org.tr/havi` (Hâvî 64 zamanlı usul, ikinci mertebe 64/4, peşrev ve I. bestelerde kullanılır), `https://en.wikipedia.org/wiki/Kul_Nes%C3%AEm%C3%AE` (17. yy şairi, ölüm yılı bilinmiyor; "Ben melâmet hırkasını" metni sayfada var ama sayfa açıkça ona atfetmiyor). Ayrıca arama özetleri (sayfa açılmadı, bu yüzden yalnız ipucu): Itrî ölümü 1711/1712; "Kul Nesîmî" atfı "kime ne" nakaratı için. Doğrudan açılamayanlar: TDV'nin `pinar-selahattin`/`itri` kısa adresleri yalnız arama sonucu verdi. FSEK md. 27 (ölüm + 70 yıl) yeniden doğrulanamadı (`mevzuat.gov.tr` PDF'i okunamadı); önceki notlardaki kural aynen kullanıldı.
- Telif ölçütü: FSEK ölüm yılı + 70. SymbTr dizgisi CC BY-NC-SA 4.0 (`src/content/parcalar/LISANS.md` düzeni).

## 1. Özet tablo

Sütunlar: kullanıcı grubu; SymbTr dosyası (`…/txt/` altında); makam/usul (Kod 50/51); ölçü; perde seviyesi (tam dosya → seçilen aralık); ritim seviyesi; önerilen seviye; telif; söz gösterilebilir mi; hüküm. "—" = SymbTr'de yok.

### 1a. Kullanıcının "Giriş / Seviye 1" grubu

| Eser | Grup | SymbTr dosyası | Makam / usul | Ölçü | Perde | Ritim | Öneri | Telif | Söz | Hüküm |
|---|---|---|---|---|---|---|---|---|---|---|
| Veysel Karani İlahisi (Uşşak) | Giriş | **yok** | | | | | | | | **SKIP** (SymbTr'de yok) |
| Salât-ı Ümmiyye (Segâh) | Giriş | `segah--salatiummiye--aksaksemaievferi--allahumme_salli--itri.txt` (Itrî; yalnızca 4 ölçü) | Segâh / Aksaksemâî Evferî 10/8 → Bektâşî Devr-i Revânî 13/8 → 10/8 (usul değişimli) | 4 | tam dosyada E5b1, E5, F5#4, G5 (Seviye 3 + uygulamada olmayan 335) | 2 (1/16, 3/16) | – | Itrî ö. 1711/1712 → **KAMU MALI** | Güfte Arapça dua metni, serbest | **SKIP** (usul değişimi, 10/8 ve 13/8 uygulamada yok, 335) |
| Bilmem Nideyim Aşkın Elinden (Yunus Emre, Uşşak) | Giriş | **yok** | | | | | | | | **SKIP** |
| Şol Cennetin Irmakları | Giriş | `segah--ilahi--yuruksemai_ii--sol_cennetin--.txt` | **Segâh** (Kod 50 "Segâh B4b1/E5b1/F5#4"; liste Hicaz/Uşşak demişti, yanlış) / Yürüksemâî II 6/8 (uygulamada `yuruk-semai` 6/8, ONERILEN usul seviyesi 4) | 32 (aralık [9,16]: 8) | tam dosya: 335 (E5b1, 8 nota) yüzünden **uygulamada çalınamaz**; [9,16] ve [25,32] Seviye 1 | 2 (1/16: 15, 3/16: 5) | **2** | Ezgi sahibi `?`; söz Yunus Emre (ö. ~1320, önceki not). Ezgi hakkı BELİRSİZ, emsal: `benim-adim-dertli-dolap` aynı `?` ile ekli | **Evet** (güfte Yunus Emre) | **ADD [9,16]** (alternatif [25,32]) |
| Ey Âşık-ı Dildâde (Rast) | Giriş | **yok** | | | | | | | | **SKIP** |

### 1b. "Seviye 2" grubu

| Eser | SymbTr dosyası | Makam / usul | Ölçü | Perde | Ritim | Öneri | Telif | Söz | Hüküm |
|---|---|---|---|---|---|---|---|---|---|
| Canım Kurban Olsun Senin Yoluna (Uşşak) | **yok** | | | | | | | | **SKIP** |
| Tevhid Edip Sual Ettim (Hicaz) | **yok** | | | | | | | | **SKIP** |
| Kabenin Yolları Bölük Bölüktür (Uşşak/Rast) | **yok** | | | | | | | | **SKIP** |
| Geydim Hırkayı (Hüseynî) | **yok** | | | | | | | | **SKIP** (yakın ad "Ben Melâmet Hırkasını", bkz. Seviye 3 grubu; aynı eser değil) |
| Ben Yürürüm Yâne Yâne (Segâh) | `neva--sarki--duyek--ben_yururum--selahaddin_pinar.txt` | **Nevâ** (Kod 50 "Nevâ B4b2/F5#3"; liste Segâh demişti) / Düyek 8/8 (uygulamada var, usul seviyesi 5) | 28 | tam dosya Seviye 3'ü aşar (362 B5b5, 1 nota, ölçü 10); [11,28] Seviye 3 (E5, F5, G5…) | **4** (1/32: 4, 3/32: 4) | **4** ([11,28]) | Selahattin Pınar ö. 6 Şubat 1960 → **TELİFLİ, 2030 sonuna kadar** | Güfte Yunus Emre (PD) ama ezgiyle birlikte gösterilemez (nota telifli) | **SKIP** (telif) |

### 1c. "Seviye 3" grubu

| Eser | SymbTr dosyası | Makam / usul | Ölçü | Perde | Ritim | Öneri | Telif | Söz | Hüküm |
|---|---|---|---|---|---|---|---|---|---|
| Hak Yarattı Âlemi / Aşkın Aldı Benden Beni (Hüseynî/Muhayyer) | **yok** | | | | | | | | **SKIP** (ad aramasında yalnız ilgisiz "Aşkı Hüznümle Yarattım…" ve "Aşkın Karanlık", Muhayyer ilahi "Düşeli Bu Aşkın" çıktı) |
| Erler Demine Destur Alalım (Hicaz) | **yok** | | | | | | | | **SKIP** |
| Tâleal Bedru Aleyna (Rast/Nihavend) | **yok** | | | | | | | | **SKIP** |
| Milisiniz Melâmet Hırkasını / Haydar Haydar | `ussak--nefes--duyek--ben_melamet--.txt` ("Ben Melâmet Hırkasını", "Haydar Haydar" nakaratı güftede var; "Milisiniz" SymbTr'de **yok**, eşleşme güfteye dayalı) | **Uşşak** (Kod 50 "Uşşak B4b2") / Düyek 8/8 (uygulamada var) | 46 (iki tur × 23); [13,23]: 11 | tam dosya 291 (F4#4, 4 nota; m8, m12) yüzünden dışarıda; [13,23] Seviye 3 (E5: 8, G5: 1) | 2 (1/16: 40) | **3** | Ezgi `?` (kaynak E/THM, yani halk müziği derlemesi → anonim sayıldı, derleyen BELİRSİZ); güfte "Kul Nesîmî" (17. yy, ölüm yılı bilinmiyor; atıf kesin değil, karma metin) → yaş bakımından PD | **Evet** (güfte eski, ezgi anonim THM; yine de derleyen BELİRSİZ) | **Koşullu ADD [13,23]** (dönüştürücüde Kod 24 desteği gerekir) |
| Buyruğun Tut Rahmanın (Uşşak/Bayâtî) | **yok** | | | | | | | | **SKIP** |

### 1d. Peşrevler

Hepsi uygulamada **olmayan** usullerde (Sakîl 48/4, Çenber 24/4, Devr-i Kebîr 28/4, Hâvî 64/4, Çiftedüyek 16/4, Fahte 20/4, Muhammes 32/4, Hafîf 32/4): ölçü = tam usul devri (6-60 zamanlık), bir ölçüde 25-60 nota. "Aralık" dosyadaki devir numaralarıdır. Peşrev besteciler: ölüm yılı yalnız Neyzen Yusuf Paşa (1884) için doğrulandı; diğerleri **BELİRSİZ** (kendi çıkarımım: 17.-19. yy bestekârları, ama kaynak açılmadı).

| Kullanıcının kalemi | SymbTr'deki karşılık | Hüküm |
|---|---|---|
| Rast peşrevi (Benli Hasan Ağa) | `rast--pesrev--sakil----benli_hasan_aga.txt`, Sakîl 48/4, 6 devir; perde: 274, 283, 291 (4. seviye dışı); geçerli aralık [3,5] (Seviye 4, 1/32 yok ama 1/16 ve 3/16), 8 çarpma (Kod 8) | **SKIP** (önceki nottaki hüküm geçerli; Sakîl yok, yalnız 3 devir) |
| Uşşak peşrevi (Aziz Dede) | **Aziz Dede yok.** Uşşak peşrevleri: `…cenber----zurnazen_ibrahim_aga` (Çenber 24/4, 11 devir), `…devrikebir----iii_selim` (28/4, 8), `…hafif----kanposoglu_mehmet_celebi` (32/4, 13) | Kullanıcının kalemi **SKIP**; yakın alternatif Zurnazen, bkz. §2.5 (kullanıcı onaylamadan ikame edilmez) |
| Hicaz peşrevi (Veli Dede, Hümâyun) | `hicaz_humayun--pesrev--cenber----veli_dede.txt` (Hicaz-Hümâyûn, Çenber 24/4, 16 devir): 283, 291, 300, 341, 367 içerir; hiçbir 4+ devirlik kesit yok. Ayrıca `hicaz--pesrev--fahte----neyzen_salim_bey.txt` (Hicaz, Fahte 20/4): 283-300, 331, 345, 367 | **SKIP** (perde dışı; çalınabilir devir yok) |
| Segâh peşrevi (Yusuf Paşa) | `segah--pesrev--devrikebir----neyzen_yusuf_pasa.txt`, Devr-i Kebîr 28/4, 16 devir; 335 (E5b1) 127 nota, 362, 388 | **SKIP** (335 her yerde; tek devir bile geçerli değil). Yusuf Paşa ö. 1884 (TDV) → kamu malı |
| Sultaniyegâh peşrevi (Cemil Bey) | **Cemil Bey yok.** Tek Sultânîyegâh peşrevi: `sultaniyegah--pesrev--muhammes----kanuni_haci_arif_bey.txt` (Hacı Ârif Bey, Muhammes 32/4): 1/12 üçleme (63 nota), 269-287 | **SKIP** (üçleme dönüştürülemez, perde dışı) |
| Hüseynî peşrevi (besteci verilmedi) | 5 dosya: Hâvî (Derviş Mustafa), Çiftedüyek (Tanburî İsak), Devr-i Kebîr (III. Selim), Devr-i Kebîr (Kul Mehmet), Muhammes (Lavtacı Andon) | Bkz. §2.5: **koşullu** (yeni usul gerekir) |
| Nihavend peşrevi (Osman Bey) | `nihavent--pesrev--devrikebir----tanburi_buyuk_osman_bey.txt`, 28/4, 16 devir: 1/12 üçleme (12 nota), 269-291, 362, 371-384; dönüştürücü 13 satırı reddetti | **SKIP** (üçleme, 274-291, 384) |

Peşrev kesit seçenekleri (hepsi koşullu: yeni usul + peşrev ekranı kararı; usul dersi gerekir):

| Peşrev | Dosya | Usul | Aralık | Perde | Ritim | Öneri |
|---|---|---|---|---|---|---|
| Hüseynî, Derviş Mustafa | `huseyni--pesrev--havi----dervis_mustafa.txt` | Hâvî 64/4 | [2,8] (7 devir, 424 nota) ya da [1,8] (8 devir, 479 nota; 366/371 içerir) | 3 / 4 | 1 (1/8, 1/4, 1/2, 3/4, 1) | **3** ([2,8]) / 4 ([1,8]) |
| Uşşak, Zurnazen İbrahim Ağa | `ussak--pesrev--cenber----zurnazen_ibrahim_aga.txt` | Çenber 24/4 | [5,11] (7 devir, 184 nota) ya da [1,3] | 3 | 1 | **3** |
| Hüseynî, Tanburî İsak | `huseyni--pesrev--cifteduyek----tanburi_isak.txt` | Çiftedüyek 16/4 | [7,14] (8 devir, 181 nota) ya da [1,5] | 3 | 2 | **3** |
| Hüseynî, III. Selim | `huseyni--pesrev--devrikebir----iii_selim.txt` | Devr-i Kebîr 28/4 | [1,8] ya da [11,16] | 4 (366) | 2 | **4** |
| Hüseynî, Kul Mehmet | `huseyni--pesrev--devrikebir----kul_mehmet.txt` | Devr-i Kebîr 28/4 | [1,4] | 3 | 2 | **3** |

## 2. Eser ayrıntıları

### 2.1 Şol Cennetin Irmakları (ADD [9,16])

- Dosya: `segah--ilahi--yuruksemai_ii--sol_cennetin--.txt`, 153 satır, 152 Kod 9 + 1 Kod 51; **Kod 53 ya da 9 dışı kod yok**. Tek Kod 51 satırı: 6/8 "Yürüksemâî II". mu2: Segâh B4b1/E5b1/F5#4, İlâhî, beste `?`, söz Yunus Emre, kaynak H/TSM (yani ezgi TSM bir yayından, sahibi yazılmamış).
- Güfte (Soz1, hecelerden): "Şol cennetin ırmakları / Akar Allah deyu deyu // Çıkmış İslâm bülbülleri / Öter Allah deyu deyu"; ikinci stroful başka sözler Soz2'de (kullanılmıyor).
- Yapı: 32 ölçü. Ölçü 1-4 "Şol cennetin ırmakları…" dizesi, 5-8 aynı dize tekrarı; 9-12 "Çıkmış İslâm bülbülleri…", 13-16 tekrar; 17-32 aynı bütünün ikinci turu (17-24, 25-32). Tam dosyada 335 (E5b1) ölçü 2, 3, 6, 7, 18, 19, 22, 23'te (8 nota); yani **dize A (m1-8, 17-24) çalınamaz**, dize B (m9-16, 25-32) beş perdede.
- Süre histogramı (tam dosya): 1/16: 34, 1/8: 54, 3/16: 14, 1/4: 50. [9,16]: 37 nota + 5 sus; 1/16: 15, 1/8: 11, 3/16: 5, 1/4: 11. Bağ yok.
- Perdeler [9,16]: B4b1 14, A4 10, C5 6, G4 6, D5 1 (hepsi Seviye 1). Ritim: 1/16 ve noktalı sekizlik (3/16) → **Seviye 2**.
- `convertSymbTr` (std ve ext): [9,16] ve [25,32] 8 ölçü, 37 nota + 5 sus, 0 bağ, 0 atlanan; [8,17] 10 ölçü (m8, "yu" bitişi) da geçer. Tam dosya hatasız dönüşür (32 ölçü) ama 335 içerir, **çalınmamalı**.
- Önerilen: `{ id: 'sol-cennetin-irmaklari', makam: 'ussak' veya yeni 'segah' (karar), usul: 'yuruk-semai', olcuAraligi: [9, 16] }`, söz açık, Seviye 2.
- Makam etiketi: `ParcaMakam`'da `segah` yok; Uşşak etiketi dosya makamıyla çelişir (açık soru 3).
- Usul: uygulamadaki `yuruk-semai` 6/8 vuruşu (düm 1, tek 1, tek 1, düm 1, tek 2) ile eşleşir; "Yürüksemâî II" adı önceki notlarda da `yuruk-semai` (6/8) sayıldı. Usul uygulamada Seviye 4'te öğretildiği için dersin usulü henüz bilinmeyen öğrenciye anlatması gerekir (kullanıcının "öğretmeden sorma" kuralı).

### 2.2 Ben Melâmet Hırkasını / "Haydar Haydar" (koşullu ADD [13,23])

- Dosya: `ussak--nefes--duyek--ben_melamet--.txt`, 459 satır; Kod dağılımı `{1: 4, 7: 56, 9: 392, 24: 6, 51: 1}`. 46 ölçü = 23 ölçülük bütünün iki turu. Düyek 8/8 (`duyek`, uygulamada var). mu2: **Uşşak B4b2**, Nefes, beste `?`, söz Kul Nesîmî, kaynak E/THM (halk müziği notasyonu).
- Güfte ("." ve "SAZ" işaretleri atılınca): "Ben melâmet hırkasını kendim giydim kime ne (×2) / Arı namus şişesini taşa çaldım kime ne ah Haydar Haydar taşa çaldım kime ne". Bölümler (yalnız Soz1 metinlerinden): m1-8 ve 24-31 "ARANAĞME", m9-16 ilk dize (×2), m17-23 ikinci dize; m8 ve m12 sonlarında F4#4.
- **Kod 1** ("ARANAĞME" yazan küçük nota, 1/4 süreli; ölçü 1, 5, 24, 28 başlarında) ve **Kod 24** (aşağı mordan, 1/4; ölçü 11, 15, 19, 34, 38, 42) süreli satırlardır ve offset'e dahildir. Deponun dönüştürücüsü bunları atlayıp "Offset … süreyle beklenen …" hatasıyla [13,23], [1,7], [36,46] aralıklarını **reddediyor** (std). `KOD_NOTA`'ya 1 ve 24 (ve 23, 28, 32, 43, 44) eklenince (ext) [13,23] geçiyor: 11 ölçü, 96 nota + 5 sus, 0 bağ, 0 atlanan.
- [13,23]: süreler 1/16: 40, 1/8: 54, 1/4: 7 (Kod 9: 78, Kod 7 tremolo: 21, Kod 24: 2); perdeler A4 27, B4b1 22, C5 20, D5 11, E5 8, G4 7, G5 1 → perde Seviye 3 (E5 ve G5 yüzünden), ritim Seviye 2 → **Seviye 3**. Bir ölçüde 12-14 olay (1/16 yoğun); "kolay" iddiası yanlış: Seviye 3 içinde dahi hızlı.
- Alternatif kesitler (ext ile): [1,7] aranağme (7 ölçü, 81 nota, E5/G5; 1/16: 62), [36,46] ikinci tur. Doğal birim [13,23]: tekrarlı ilk dize + ikinci dize = bir kıta. Ölçü 9-12 F4#4 (ölçü 12'nin sonunda) yüzünden alınamaz.
- Kod 7 (tremolo) dönüştürücüde zaten düz nota sayılıyor; tremolo/mordan gösterimi kaybolur (süsün atılması dosyanın notasını değiştirmez ama kullanıcıya söylenmeli).
- Telif: ezgi `?`/THM = anonim halk müziği sayıldı (derleyen BELİRSİZ). Güfte: Kul Nesîmî 17. yy (Wikipedia sayfası, ölüm yılı bilinmiyor), "kime ne" metninin ona atfı kesin değil (arama özeti: karma metin, modern "Haydar Haydar" şarkıları plak endüstrisiyle yaygınlaşmış; bu ezgi onların modern bestesi mi, BELİRSİZ). Söz gösterilebilir sayıldı ama **modern bir besteyle karıştırılmadığı doğrulanmadı**.
- Kullanıcının "Milisiniz Melâmet Hırkasını" adı SymbTr'de ve arama özetinde **bulunamadı**; eşleşme "Ben melâmet hırkasını … Haydar Haydar" güftesi üzerinden. Öğretmenin çaldığı sürümle aynı mı, kullanıcıya sorulmalı.

### 2.3 Ben Yürürüm Yâne Yâne (SKIP, telif)

- Dosya: `neva--sarki--duyek--ben_yururum--selahaddin_pinar.txt`, Nevâ, Düyek 8/8, 28 ölçü, Kod 8 (1 satır, E5 çarpma) + 255 Kod 9. Süre histogramı: 1/32: 4, 1/16: 128, 3/32: 4, 1/8: 86, 1/4: 31, 1/2: 2. Perdeler: 296-358 arası + 362 (B5b5, 1 nota); `[11,28]` dönüşür (18 ölçü, 169 nota, 1 atlanan Kod 8) ve Seviye 3 perdelidir, ritim 1/32 → **Seviye 4**.
- Besteci Selahattin Pınar (22 Ocak 1902 – 6 Şubat 1960, TDV). FSEK ölüm + 70 → eser **2030 sonuna kadar** telifli. Önceki notla uyumlu (orada da "Nevâ versiyonu, telifli"). Güfte Yunus Emre'ye aittir (mu2); güfte tek başına kamu malı olsa da bu ezgiyle birlikte gösterilemez.
- Not: "Ben yürürem yâne yâne" metninin başka bestelerinin (aynı Yunus Emre güftesi, anonim ezgi) varlığını arama özeti ima etti (bir çalışma dokuz adlı + dört anonim beste sayıyor); SymbTr'de bu metne ait başka dosya **yok** (güfte araması yalnız bu dosyayı verdi).

### 2.4 Salât-ı Ümmiyye (SKIP)

- `segah--salatiummiye--aksaksemaievferi--allahumme_salli--itri.txt`: 49 satır, **üç Kod 51** (10/8 "Aksaksemâî Evferi" → 13/8 "Bektâşî Devr-i Revânı" → 10/8), 4 ölçü, Kod 8 × 2 (E5, G5, süresiz). Perdeler: B4b1, C5, D5 (Seviye 1) + E5b1 (335) 3, E5 1, F5#4 2. Güfte yalnız "Allahümme salli âlâ seyyidinâ Muhammedin inne bi'l-ümmiyyi ve âlâ âlihi ve sahbihi vesellim" cümlesi. Yani SymbTr'deki kayıt bu eserin (TDV'ye göre Itrî'nin Segâh salât-ı ümmiyyesi) **kısa bir bölümü**; eserin tamamının SymbTr'de başka dosyada olup olmadığı arandı: yok. Dönüştürücü "usul 10/8 (Aksaksemâî Evferi), beklenen 9/8" hatasıyla reddeder (uygulamada Aksak 9/8 var, 10/8 yok); usul değişimleri zaten desteklenmiyor.
- Telif: Itrî ö. 1711 veya 1712 (TDV; üçüncü bir savda 1730-31) → hangisi olursa olsun **KAMU MALI**.
- Yakın ama farklı eser: `mahur--salatuselam--sofyan--allahumme--.txt` ("Allahümme salli alel Mustafa", Mahur salâtüselâm, Sofyan **4/8**, 32 ölçü, beste `?`, söz `?`). Kullanıcının Segâh salât-ı ümmiyyesi değildir; 4/8 uygulamadaki Sofyan 4/4 ile aynı değil (dönüştürücü reddeder); Seviye 3 perdeler: 314, 336, 349, 358 ve 345 (F5#5) dışarıda. Önerilmez.

### 2.5 Peşrevler

Genel: SymbTr peşrev dosyaları tek Kod 51 satırlı, ölçü başına çok uzun devirli. Peşrevlerin **hiçbirinde uygulama usulü yok**; ayrıca ölçü başına 25-60 nota, beş altı satırlık bir portede ekran düzeni test edilmeli (uygulamanın ölçü sığdırma davranışı incelenmedi, **BELİRSİZ**). Kullanıcının her peşrev kalemi aşağıdaki tabloda; bütün peşrev hükümleri "koşullu": önce yeni usul (vuruşsuz, `vurus: null`, Dolap gibi) ve ders sayfası gerekir.

- **Hüseynî Hâvî, Derviş Mustafa** (Kod 50 "Hüseynî B4b2/F5#3"): Hâvî 64/4, 9 devir; 8 tam devir + dokuzuncu eksik (64/4'ün 15/16'sı), bu yüzden `convertSymbTr` tam dosyada "son ölçü tamamlanmamış (960/64, Offset 8.9375)" hatası verir; [1,8] ve [2,8] geçer (std, geçici usul `{zaman: 64, mertebe: 4}`). Süreler 1/8: 126, 1/4: 358, 1/2: 21, 3/4: 15, 1: 16; **tüm tam-dosya perdeleri Seviye 4**, 366 ve 371 yalnız birinci devirde (m1). Hâvî TDV'ye göre 64 zamanlı, ikinci mertebe 64/4 (SymbTr ile uyumlu). Ölçü başına ~60 nota. Derviş Mustafa'nın yaşadığı çağ ve ölüm yılı **BELİRSİZ** (kaynak bulunamadı; kendi çıkarımım: eski bir peşrev, kamu malı).
- **Uşşak Zurnazen İbrahim Ağa**: Çenber 24/4, 11 devir, yalnız 1/8, 1/4, 1/2 (ritim 1). 367 (1 nota) devir 4'te; [5,11] ve [1,3] geçer. Perdeler Seviye 3 (E5 33, F5 18, F5#4 7, G5 12, A5 6). Zurnazen İbrahim Ağa'nın ölüm yılı **BELİRSİZ**. Bu, kullanıcının "Uşşak peşrevi" için ritim bakımından en uygun SymbTr kaydı; ama Aziz Dede değil.
- **Hüseynî Tanburî İsak, Çiftedüyek 16/4**: [7,14] 8 devir (181 nota, 9 sus, 1/16 var, 1 atlanan Kod 8), perde Seviye 3; [1,5] da geçer. Devir 6'da 291 (F4#4, 2 nota). Tanburî İsak ölüm yılı **BELİRSİZ**.
- **Hüseynî III. Selim, Devr-i Kebîr 28/4**: [1,8] ve [11,16] geçer; 366 içerir → Seviye 4. III. Selim (İlhâmî) ölüm yılı bu çalışmada açılmadı (**BELİRSİZ**; kendi çıkarımım: 1808).
- **Hüseynî Kul Mehmet**: [1,4] geçer (Seviye 3), 366/371/380 sonraki devirlerde.
- **Hüseynî Lavtacı Andon (Muhammes)**: 1/24 ve 1/12 üçleme (42 nota) + 291, 323, 332, 341, 389 → kullanılamaz.
- **Rast Benli Hasan Ağa (Sakîl 48/4)**: [3,5] dönüşür (3 devir, 184 nota, 4 Kod 8 atlanır) ama kapsamı 3 devir, Seviye 4 (366); önceki nottaki "SKIP" kararı korunuyor.
- **Segâh Yusuf Paşa**: 335 (127 nota) her devirde; ayrıca Kod 11 (11 satır, sessiz çarpma) dönüştürülebilir ama pitch dışı.
- **Nihavend Osman Bey** ve **Sultaniyegâh Hacı Ârif Bey**: üçleme (1/12) nedeniyle `convertSymbTr` reddeder.
- **Hicaz-Hümâyûn Veli Dede**: dönüştürücü hatasız çevirir ama 283, 291, 300, 341, 367 uygulamada çalınamaz. Veli Dede'nin hangi çağda yaşadığı **BELİRSİZ**.

### 2.6 SymbTr'de bulunmayan kalemler

Her biri için dosya adı, mu2 başlığı, güfte ve ham mu2 metni üzerinde yukarıdaki dört arama yapıldı, sonuç yok: Veysel Karani İlahisi, Bilmem Nideyim Aşkın Elinden, Ey Âşık-ı Dildâde, Canım Kurban Olsun Senin Yoluna, Tevhid Edip Sual Ettim, Kabenin Yolları Bölük Bölüktür, Geydim Hırkayı, Hak Yarattı Âlemi / Aşkın Aldı Benden Beni, Erler Demine Destur Alalım, Tâleal Bedru Aleyna, Buyruğun Tut Rahmanın. Yanlış pozitifler elendi: "Uzun İnce Bir Yoldayım" (Âşık Veysel, Uşşak türkü, bu liste dışı), "Ankara'nın …" (karan eşleşmesi), "Elâ Gözlerine Kurban Olduğum" (Sadettin Kaynak, telifli), "N'ideyim Sahn-ı Çemen Seyrini", "N'ideyim İster Darıl", "Bilmem ki …" şarkıları (hepsi başka eserler). SymbTr başka bir ad altında bu eserleri tutuyor olabilir (SymbTr'de ilahi/nefes dökümü §Yöntem (5) ile tarandı, ilgili başka ilahi/nefes yok), ama bunlar kesin olarak "yok" diye yazıldı yalnızca bu taramanın sınırları içinde.

Başka nota kaynağı: bu eserlerin kamu malı notası başka yerlerde bulunabilir, ancak bu çalışmada aranmadı ve makine okunur lisanslı veri olmadığı için kullanılamaz (BELİRSİZ). Yalnız bilgi: Tâleal Bedru (Medine karşılama kasidesi) güftesi eski ve anonim (kendi çıkarımım); ezgi sürümleri çeşitli, hangisinin öğretmenin sürümü olduğu bilinmiyor.

## 3. Gerekenler

1. **Yeni parçalar**: yalnızca 2 eser eklenebilir: Şol Cennetin Irmakları [9,16] (Seviye 2) ve Ben Melâmet Hırkasını [13,23] (Seviye 3, dönüştürücü değişikliğiyle).
2. **Dönüştürücü**: `KOD_NOTA`'ya 1 ve 24 eklenmeli (Ben Melâmet için zorunlu); 23, 28, 32, 43, 44 önceki notta da süreli nota olarak görülmüştü, birlikte eklenebilir. Süsler düz nota olarak yazılır; testlere (`symbtr-to-json.test.mjs`, incelenmedi) örnek eklenmeli. Peşrevler için: son eksik devir (Hâvî 9. ölçü) `olcuAraligi` ile dışarıda bırakılır, dönüştürücüde değişiklik gerekmez.
3. **Makam**: Şol Cennetin için `segah` (ya da Uşşak etiketi); Ben Melâmet `ussak` (var). `ParcaMakam` ve `makamlar.ts`'te `segah`, `nihavend`, `hicaz-humayun` yok; Hüseynî ve Uşşak var.
4. **Usul**: Yürük Semâî 6/8 ve Düyek var. Peşrevler için Hâvî (64/4), Çenber (24/4), Çiftedüyek (16/4), Devr-i Kebîr (28/4), Sakîl (48/4) `vurus: null` kaydıyla eklenebilir (Dolap emsali; kaynaklardaki vuruş kalıpları bu çalışmada doğrulanmadı, **BELİRSİZ**). Her usul için önce ders sayfası gerekir (kullanıcının "öğretmeden sorma" kuralı).
5. **Seviye eşlemesi** (`ONERILEN_SEVIYE.parca`): `sol-cennetin-irmaklari: 2`, `ben-melamet-hirkasini: 3`. Usul seviyeleri (Yürük Semâî 4, Düyek 5) bu parçaların seviyesinden yüksek: ders/etiket çelişkisi kullanıcıya sorulmalı.
6. **LISANS.md**: iki satır eklenmeli (dosya adı, makam/usul, "ezgi: kaynakta `?`/anonim", güfte sahibi); `[9,16]` ve `[13,23]` aralıkları, atılan süsler (Kod 7, 24) ve (varsa) 335/291'li ölçülerin alınmadığı yazılmalı.
7. **Test**: `parcalar.test.ts` bu iki aralığın uygulamanın perde ve süre kümesinde kaldığını denetlemiyor olabilir (incelenmedi); `convertSymbTr` perde/süre kuralını denetlemez (önceki not §5.8).

## 4. Açık sorular

1. **Eser kaydı**: kullanıcının listesindeki 22 kalemden 18'i SymbTr'de yok ya da kullanılamaz. Bu liste öğretmenin gerçek müfredatı mı yoksa sohbet botu çıktısı mı? Eksik eserler (ilahi/nefes/kaside) için makine okunur lisanslı başka bir kaynak aranacak mı (bu çalışmada kapsam dışıydı)?
2. **Şol Cennetin**: yalnız [9,16] (beş perdeli, ikinci dize) mi? Dize A (m1-8) 335 içerdiği için hiç alınamaz; kullanıcının öğretmeniyle çaldığı sürüm tam ilahi ise uygulama bunu gösteremez. 335 (E5b1) uygulamada hangi perdeye karşılık gelir? (Hüseynî 336 ile aynı parmak mı, ayrı mı: **BELİRSİZ**; veriyi sessizce 336'ya çevirmek SymbTr'yi değiştirmek olur.)
3. **Makam etiketi**: Şol Cennetin Segâh; `segah` eklenecek mi yoksa Uşşak etiketi mi kullanılacak? Ben Yürürüm (Nevâ, telifli) ve peşrevlerdeki Segâh/Nihavend/Hicaz-Hümâyûn aynı karara bağlı.
4. **Ben Melâmet**: "Milisiniz Melâmet Hırkasını" ile aynı eser mi? Öğretmenin ezgisi bu THM yazımı mı (modern "Haydar Haydar" şarkısıyla karıştırılmış olabilir)? 1/16 yoğunluğu Seviye 3 için uygun mu, yoksa Seviye 4 mü olmalı?
5. **Ben Yürürüm Yâne Yâne**: telifli (Pınar ö. 1960, 2030 sonu). Yunus Emre güftesinin anonim/PD bir başka ezgisi (öğretmenin çaldığı sürüm olabilir) SymbTr'de yok; bu sürüm için kullanıcıdan nota gerekir.
6. **Peşrevler**: yeni usuller, ölçü başına 60 nota ve ekran düzeni göze alınıp peşrev eklenecek mi? Eklenecekse hangisi: Zurnazen Çenber [5,11] (ritim 1, en sade) ve Hâvî [2,8] (Seviye 3) ilk adaylar. Kullanıcının Aziz Dede (Uşşak), Cemil Bey (Sultaniyegâh) ve Osman Bey (Nihavend) kalemleri SymbTr'de yok ya da kullanılamaz; yakın alternatifler kullanıcıya sorulmadan ikame edilmemeli.
7. **Telif**: peşrev bestekârlarının (Derviş Mustafa, Zurnazen, Tanburî İsak, III. Selim, Kul Mehmet, Veli Dede) ölüm yılları doğrulanmadı; bunların hepsi 17.-19. yy olduğundan kamu malı olması çok muhtemel (kendi çıkarımım), ancak kaynaksız. `Şol Cennetin` ve `Ben Melâmet` ezgilerinin derleyen/notaya alan hakları da BELİRSİZ (önceki nottaki THM/TSM derleyen sorusuyla aynı).
