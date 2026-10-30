# Aşama C (Seviye 3) araştırması: 3. kademe ara sesler, Nevâ makamı, çeşniler, eserler

Tarih: 2026-10-30. Yalnızca araştırma; depo kodu değiştirilmedi. Kaynağı açılamayan ya da doğrulanamayan her şey **BELİRSİZ** diye işaretlendi.

## Yöntem

- **Sayfalar** doğrudan açıldı (WebFetch özeti ile, çelişen yerde sayfanın ham metni `curl` ile indirilip düz metne çevrilerek yeniden okundu; yalnızca araştırma geçici klasöründe, depoya yazılmadı). Açılan sayfalar:
  - neyzenim: `https://www.neyzenim.com/neydersleri_6.html`, `_7`, `_8`, `_9`, `_10`. İki fotoğraf tarayıcıda görüntülendi (indirilmedi): `https://www.neyzenim.com/neydersleri_6_3.gif` (Nim Hisar) ve `neydersleri_6_4.gif` (Hüseynî).
  - TDV İslâm Ansiklopedisi: `https://islamansiklopedisi.org.tr/neva`, `/rast`, `/hicaz-2`, `/hisar--musiki`, `/sehnaz`, `/sakil`, `/hasan-aga-benli`, `/ismail-dede-efendi-hamamizade`, `/zekai-dede`.
  - Küre Ansiklopedi: `https://kureansiklopedi.com/tr/detay/neva-2`, `/zekai-dede`, `/canakkale-turkusu`.
  - Perde tablosu: `https://en.wikipedia.org/wiki/List_of_notes_in_Turkish_makam_theory` (Çârgâh'a göre koma farkı).
  - Çeşni komaları: `https://muzikteorisiveegitimi.blogspot.com/2013/01/makam.html` (amatör blog; tek koma tablosu bu, zayıf kaynak, bkz. §3), ayrıca `https://www.makamlar.net/makamlar/hicaz_makami.html` ve `https://muzik.name/yazilar/hicaz-perdesi-ve-hicaz-makamindaki-do-diyez-hakkinda/`.
  - MEB Ney Modülü (`https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/<no>`): 1216, 1217, 1218, 1220, 1222, 1223, 1224, 1225, 1226, 1227, 1228, 1231, 1232, 1233, 1234, 1235.
  - Eser/telif: `https://en.wikipedia.org/wiki/Yine_Bir_G%C3%BClnih%C3%A2l`, `https://www.salihbora.com/yine-bir-gul-nihal-aldi-bu-gonlumu-sarkisi/`, `https://divanmakam.com/forum/yine-bir-gulnihal-aldi-bu-gonlumu-dede-efendi.38627/`, `https://www.haberler.com/zekai-dede-efendi-eyupsultan-da-besteleriyle-11468472-haberi/`.
  - Açılamayanlar: tr.wikipedia "Türk müziği perdeleri" ve "Nevâ (makam)" (404), Özkan nazariyat kitabı PDF'i (404), bilgioloji.com (sertifika hatası).
- **SymbTr**: dosya listesi `https://api.github.com/repos/MTG/SymbTr/git/trees/master?recursive=1` (2200 txt; `truncated: false`). Dört dosya (aşağıda §4) `https://raw.githubusercontent.com/MTG/SymbTr/master/txt/<dosya>` adresinden ayrı, boş bir klasöre indirildi ve bir Python betiğiyle (sütun/süre/Kod/ölçü/perde istatistiği) çözümlendi. Ayrıca `rast--` (109 dosya) ve `neva--` (21 dosya) önekli bütün txt'ler taranıp (§4.5) uygulamanın dönüştürücüsüne verildi.
- **Dönüştürücü denemesi**: `scripts/symbtr-to-json.mjs` `export`lar kullanılarak (`convertSymbTr`, `parseSymbTrTxt`) ayrı bir betikten çağrıldı; `src/` altına hiçbir şey yazılmadı. `--src` bayrağı yalnızca `PIECES` listesindeki dosyaları okur, yani yeni dosya için `PIECES`e satır eklemek gerekir; ben bunun yerine `convertSymbTr`yi doğrudan çağırdım. "Kod 1/7/10/11 normal nota" denemesi bellekte yapıldı (önceki not §Genel bulgular 1'deki öneri).
- Uygulama perdeleri (yazılı anahtar): G4, A4, B4b1, B4b5, B4b4, B4, C5, C5#4, D5, E5, F5, F5#4, G5, A5. Eklenecek: Nim Hisar E5b5 (KomaAE 331), Nim Şehnaz G5#4 (KomaAE 353). "Aralık dışı" sayımı **KomaAE**'ye göre yapıldı (yazım biçimine göre değil; bkz. §4 "yazım uyuşmazlığı").
- Usuller (`src/content/usuller.ts`): nim-sofyan 2/4, semai 3/4, sofyan 4/4, yuruk-semai 6/8, duyek 8/8, aksak 9/8, dolap 12/8. Makamlar (`makamlar.ts`, `ParcaMakam`): yalnızca rast, ussak, hicaz.
- Parmak modeli doğrulaması: neyzenim'de "SAĞ EL: Baş" aşîrân deliğidir ("Aşiran Perdemiz kapalı. SAĞ EL: Baş Parmağımız ve Orta Parmağımız", `_9`). Sağ el işaret/orta/yüzük = ön delik 1/2/3, sol el işaret/orta/yüzük = ön delik 4/5/6. Bu eşleme uygulamadaki Nevâ, Çârgâh, Hüseynî, Nim Hicaz verileriyle birebir tutuyor (kontrol edildi).
- Telif ölçütü (FSEK m.27, ölüm yılı + 70) önceki notla aynıdır (`2026-10-25-parca-arastirma.md` Yöntem); mevzuat metni yeniden doğrulanmadı. SymbTr dizgisi eser kamu malı olsa da CC BY-NC-SA 4.0 lisanslıdır (mevcut `src/content/parcalar/LISANS.md` düzeni).

## 1. Perdeler

Aşağıda "front" ön delikler yukarıdan aşağıya (1..6), `k` kapalı, `a` açık, `y` yarım/kısmi. Kilit gözlem: neyzenim 3. kademe sesleri aynı parmakla, **daha sert üfleyerek** bir beşli (31 koma) yukarıda çıkarır. Bu yapı yeni üç perdede de tutuyor (aşağıdaki "beşli doğrulaması" satırı).

| Perde | Yazılı perde + acc | KomaAE | thumb / front | Kademe / üfleme | Kaynak | Alıntı (≤15 söz) | verified? |
|---|---|---|---|---|---|---|---|
| **Nim Hisar** | **E5 acc -5** (Mi, küçük mücenneb bemol). Aynı sesin eş yazımı D5 acc +4 (Re, bakiye diyez); SymbTr bir dosyada `D5#4`, diğerinde `E5b5` yazıyor | 331 | thumb `k`; front `[k, k, k, k, k, y]` önerilir: sağ el baş+işaret+orta+yüzük kapalı; sol işaret ve orta kapalı, **sol yüzük 3/4 kapalı** (1/4 aralık). Dügâh parmağının (`[k,k,k,k,k,a]`) son deliği 3/4 örtülü hâli | Sert üfle (sayfanın "orta perdeler" genel uyarısı) **ve baş hafifçe sola**: sesi pestleştirmek için. Kademe adı kaynakta yok (MEB 7. sınıf "ikinci ve üçüncü kademe ara sesler" diyor, ayrım yok: BELİRSİZ) | https://www.neyzenim.com/neydersleri_6.html | "NİM HİSAR perdesidir"; "yüzük parmağımızın 3/4 ünü kapatıyoruz"; "kafamızı hafifçe sola doğru çeviriyoruz" | **Koşullu evet.** Şema metinde var, ama bkz. aşağıdaki not (a): hangi sol parmakların 3/4 olduğu belirsiz anlatılmış; birkaç kanıt "yalnız yüzük" okumasını destekliyor. `Hole` türü kesir taşımıyor: `yarim` + ipucu metninde "3/4" yazılmalı |
| **Nim Şehnaz** | **G5 acc +4** (Sol, bakiye diyez). Eş yazım A5 acc -5 (La bemol, neyzenim "La bemol" yazıyor) | 353 | thumb `k`; front `[k, a, a, a, k, a]` (sağ el baş+işaret, sol orta). **Nim Hicaz parmağıyla aynı** | 3. kademe: Nim Hicaz parmağı, daha sert üfle. MEB: "üçüncü kademe ara sesler = eviç ve nim şehnaz" (6. sınıf) | https://www.neyzenim.com/neydersleri_6.html ; kademe: https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1226 | "ismi nim ŞEHNAZ perdesidir"; "SAĞ EL : Baş ve İşaret Parmaklarımız. SOL EL : Orta Parmağımız" | **Evet** (şema açık ve uygulamadaki Nim Hicaz verisiyle aynı) |
| **Nevâ (kapalı)** | D5 acc 0 (Re, 4. çizgi). Yazılı perde, açık Nevâ ile **aynı** | 327 | thumb `k`; front `[k, k, k, k, k, k]` (tüm delikler kapalı = Rast parmağı) | Açık Nevâ'nın alternatif pozisyonu. Üfleme şiddeti **sayfada ayrıca yazılı değil** (BELİRSİZ). Sayfa 6, Re'yi "orta perdeler" listesinde sayıp genel olarak "sert üfle" diyor, ama açık Nevâ de aynı listede ve 2. kademe; yani bu uyarı kapalı pozisyona özgü okunamaz. Rast→Nevâ 31 koma (bir beşli) | https://www.neyzenim.com/neydersleri_6.html ve `_9` | "Re sesini tüm perdeler kapalı olarak üfleyeceğiz" (_6); "Re Notası aynı zamanda tüm perdeler kapalı iken de çıkıyor" (_9) | **Evet** (parmak şeması iki sayfada açık). Üfleme: BELİRSİZ |

**Beşli doğrulaması (kendi çıkarımım, kaynaklardaki parmak listelerinden):** aynı parmakla yukarı çıkış hep 31 koma.

| 2. kademe (pest) | KomaAE | → 3. kademe (aynı parmak, sert) | KomaAE | fark |
|---|---|---|---|---|
| Rast (hepsi kapalı) | 296 | **Nevâ kapalı** (D5) | 327 | 31 |
| Dügâh | 305 | Hüseynî (E5) | 336 | 31 |
| Kürdî / Dik Kürdî | 309 / 310 | Acem (F5) | 340 | 31 (Kürdî) / 30 (Dik Kürdî); parmak aynı |
| Segâh | 313 | Eviç (F5#4) | 344 | 31 |
| Çârgâh | 318 | Gerdâniye (G5) | 349 | 31 |
| Nim Hicaz | 322 | **Nim Şehnaz** (G5#4) | 353 | 31 |
| Nevâ (açık) | 327 | Muhayyer (A5) | 358 | 31 |
| Nim Zirgüle (G4#4, `_10`'daki şema) | 300 | **Nim Hisar** (E5b5) | 331 | 31 |

(Nim Zirgüle'nin şeması `_10`'da: sağ baş+3 parmak, "SOL EL : İşaret Parmağımız,, Orta Parmağımız ve Yüzük Parmağımızın yarısından fazlası". Yani Nim Hisar'ın pest eşi, Dügâh parmağının yüzük deliği "yarıdan fazla" örtülü hâli.)

**Not (a) Nim Hisar şeması belirsizliği.** Sayfa 6'nın sol el cümlesi: "İşaret, Orta ve Yüzük Parmağımızın 3/4 ünü kapatıyoruz." Düz okumayla üç parmak da 3/4 kapalı görünür, ama:
1. Cümlenin sonundaki tamlama tekil ("Parmağımızın"); `_10` Nim Zirgüle cümlesi aynı kalıpla yazılmış ("İşaret Parmağımız, Orta Parmağımız ve Yüzük Parmağımızın yarısından fazlası") ve orada işaret/orta tam kapalıdır.
2. Fotoğraf `neydersleri_6_3.gif` ile Hüseynî fotoğrafı `neydersleri_6_4.gif` karşılaştırıldı (kendi gözlemim): iki fotoğrafta işaret ve orta parmak delikte aynı; Hüseynî'de yüzük parmağı kalkık ve delik görünür, Nim Hisar'da yüzük parmağı deliğin üstüne yaklaşmış. Fotoğraf yorumu kesin kanıt değil.
3. Akustik tutarlılık: yukarıdaki tablo, Nim Zirgüle (yüzük >1/2 kapalı) ile Nim Hisar'ın aynı parmakta 31 koma farkını gösteriyor.
Sonuç: `front = [k,k,k,k,k,y]`, yüzük 3/4 kapalı (1/4 açık). Karar kullanıcıda: kaynak cümlesi tek başına kesin değil. Başka bir kaynakta (`_10`) Hisar (E5b4, 332) için sol el: "Baş, Orta Parmağımız, yüzük parmağımızın yaklaşık olarak yarısı, tam yarısı" yazıyor; bu cümlede işaret parmağı geçmiyor (kaynak içi tutarsızlık, **BELİRSİZ**), bu yüzden Hisar'ı eklemiyoruz.

**Not (b) Perde adları ve yazım.**
- Nim Hisar: Wikipedia perde listesi, Çârgâh'tan 13 koma (Nevâ 9 + 4 = Hüseynî 18 − 5) ve "D♯ / E♭" yazımı veriyor (https://en.wikipedia.org/wiki/List_of_notes_in_Turkish_makam_theory). TDV "Hisar" maddesi Hisar'ı "nevâ perdesine bir küçük mücennep diyezi veya hüseynî perdesine bir bakiye bemolü" diye tanımlıyor (https://islamansiklopedisi.org.tr/hisar--musiki); Hisar 14 koma olduğuna göre Nim Hisar **bir koma pest = Hüseynî − 5 koma = E5 acc −5**. (Bu son adım Wikipedia tablosundaki 13/14 farkından çıkarım; TDV Nim Hisar için ayrıca sayı vermiyor: BELİRSİZ yalnızca TDV'ye dayanırsak.)
- Nim Şehnaz: TDV Şehnaz maddesi "bakiye diyezli sol (nîm-şehnaz)" diyor (https://islamansiklopedisi.org.tr/sehnaz), yani G + 4 koma; Wikipedia tablosu 35 koma ("G♯ / A♭") veriyor. Aynı madde "Bazı notalarda nîm-şehnaz perdesinin donanıma yazıldığı görülmekteyse de bu doğru değildir" diyor: donanıma işaret konmaz, parça içinde yazılır.
- Wikipedia tablosunda Nim Hisar/Nim Şehnaz için düz ♯/♭ kullanılıyor, koma işaretleri yalnızca 5 komalı satırlarda (Hicâz, Hisâr, Şehnâz) var; yani "E♭ = 5 koma" okuması tablodan değil koma sayısından çıkıyor. neyzenim de yalın "Mi bemol" ve "La bemol" yazıyor (`_6`). Uygulama için yazılı anahtarlar: `E5b5` ve `G5#4`.

**Ek: MEB kademe sınıflandırması** (tymm.meb.gov.tr, Ney Modülü):
- 3. kademe ana sesler (4. sınıf, ünite 1217): Hüseynî, Acem, açık Gerdâniye, açık Muhayyer. 2. kademe ana sesler (ünite 1216): açık Nevâ, Çârgâh, Bûselik, Dügâh, Rast.
- 3. kademe ara sesler (6. sınıf, ünite 1226): Eviç ve Nim Şehnaz. Nim Hisar, 7. sınıf ünite 1232'de "ikinci ve üçüncü kademe ara sesler: nim hisar, eviç ve nim şehnaz" diye geçiyor; hangi kademede olduğu ayrılmamış.
- "Kapalı Nevâ" ifadesi MEB sayfalarında geçmiyor (arandı: BELİRSİZ). MEB yalnızca "açık" Nevâ/Gerdâniye/Muhayyer diyor; "açık" burada "az parmak kapalı" pozisyonunu anlatıyor olmalı, ancak sayfa bunu açıklamıyor.
- Kademe adlandırması: 1. kademe = yegâh, kaba çârgâh, kaba bûselik, kaba dügâh, kaba rast (ünite 1224); 4. kademe = tiz bûselik, tiz çârgâh, tiz nevâ (1227). Yani uygulamanın en üst perdesi A5 (Muhayyer) 3. kademenin sonudur; B5b1 (Tiz Segâh) ve C6 (Tiz Çârgâh) 4. kademedir.

**Ek: `_9` alternatif pozisyonlar** (kademe etüdü için, bkz. §5): Hüseynî ayrıca "orta parmaklarımız dışındaki tüm perdeler açık" (aşîrân kapalı) ve "kafamızı sola doğru çekiyoruz"; Acem "aşiran dahil tüm parmaklarımız açık"; Gerdâniye "tüm perdeler kapalı"; Muhayyer "aşiran ve tüm parmaklar kapalı, sadece sol yüzük açık"; Tiz Nevâ "tüm parmaklarımız kapalı" ve "sert bir şekilde üflemeliyiz". Bunların uygulamaya alınması kapsam dışı; yalnızca kapalı Nevâ isteniyor.

## 2. Nevâ makamı

Kaynak: TDV İslâm Ansiklopedisi "Nevâ" maddesi, İsmail Hakkı Özkan (https://islamansiklopedisi.org.tr/neva). Küre Ansiklopedi'deki aynı yazar maddesi (https://kureansiklopedi.com/tr/detay/neva-2) aynı metni veriyor (kısa alıntı: "Nevâ makamının seyrine güçlü civarından başlanır").

| Alan | Değer | Not |
|---|---|---|
| Durak (karar) | **Dügâh** (A4) | TDV: "Dügâh perdesinde karar veren bir makam" |
| Güçlü | **Nevâ** (D5) | Uşşak dörtlüsü ile Rast beşlisinin ek yeri; burada rastlı karakteristik yarım karar |
| Yeden | **Rast** (G4, "rast (sol) perdesi") | Uygulamadaki Uşşak ile aynı |
| Donanım | Si için **koma bemolü** (B4b1), Fa için **bakiye diyezi** (F5#4) | "gerekli değişiklikler eser içerisinde gösterilir". Rast makamının donanımıyla aynı |
| Dizi (pestten tize, bir oktav) | Dügâh A4, Segâh B4b1, Çârgâh C5, Nevâ D5, Hüseynî E5, **Eviç F5#4**, Gerdâniye G5, Muhayyer A5 | KomaAE: 305, 313, 318, 327, 336, 344, 349, 358. Dizinin bu adımları TDV'nin çeşni tanımından türetildi (aşağıya bak); TDV Eviç'i açıkça anıyor |
| Birleşim | Dügâh'ta **Uşşak dörtlüsü** + Nevâ'da **Rast beşlisi** | TDV: "yerinde bir uşşak dörtlüsüne nevâ perdesinde bir rast beşlisinin eklenmesiyle" |
| Genişleme | Tiz tarafa: Nevâ üzerindeki Rast beşlisine Muhayyer'de **Bûselik dörtlüsü** → "acemli rast dizisi" (A5 B5 C6 D6 ile uzar). İkinci seçenek: Uşşak dörtlüsünü Muhayyer'e simetrik göçürmek. İnici-çıkıcı | Genişleme bölgesi (B5, C6) 4. kademedir |
| Seyir (özet) | Güçlü (Nevâ) civarından başlanır; iki yanında çeşnilerde karışık gezinilir; güçlüde rastlı (nadiren bûselik çeşnili) yarım karar yapılır; genişlemiş bölgede de dolaşıldıktan sonra ana diziyle inilip Dügâh'ta uşşak çeşnili tam karar verilir | Asma karar: Eviç'te segâh çeşnili; Nevâ'da, Eviç yerine Acem kullanılarak, bûselik çeşnili asma ya da yarım karar |
| Türevler | Yerinde bûselik beşlisi ya da dizisiyle karar → Nevâ-Bûselik; kürdî dörtlüsü ya da dizisiyle karar → Nevâ-Kürdî | |

Dizi türetmesi: Rast beşlisi 9+8+5+9 koma ve Nevâ (D5) 327'den başlar: Nevâ 327, Hüseynî 336 (+9), Eviç 344 (+8), Gerdâniye 349 (+5), Muhayyer 358 (+9). TDV "nevâ üzerinde ... rast beşlisinin üçüncü derecesi" için Eviç'i anıyor (`neva` maddesi). Nevâ ile Uşşak aynı pest dörtlüye sahip; fark seyir (Nevâ güçlü civarından başlar) ve genişlemedir. Uygulamadaki Uşşak dizisi Acem (F5) kullanıyor; Nevâ dizisi Eviç (F5#4) kullanır, bu fark kullanıcıya gösterilmeli.

**Rast makamı birleşimi** (doğrulandı): TDV "Rast" maddesi: "yerindeki bir rast beşlisine güçlü nevâ perdesi üzerinde bir rast dörtlüsünün eklenmesiyle" (https://islamansiklopedisi.org.tr/rast). neyzenim `_10`: "Yerinde bir Rast beşlisine Neva'da bir Rast dörtlüsünün eklenmesinden meydana gelmiştir". İnişte Eviç yerine Acem: "acemli rast dizisi" (TDV, mevcut `makamlar.ts` zaten böyle).

## 3. Dörtlü ve beşliler (AEU, koma)

Kaynak durumu: komaları açıkça yazan tek sayfa amatör bir blog (`muzikteorisiveegitimi.blogspot.com`); bunu ayrıca Wikipedia perde tablosundaki koma konumlarıyla (TDV'nin çeşni tanımlarıyla birleştirerek) çapraz kontrol ettim. Blog Hicaz için **8+12+8** yazıyor, ama toplam 28 eder (dörtlü 22 komadır) ve aynı sayfa "4 Koma Si Bemol ve 4 Koma Do Diyez" diyor; perde konumlarıyla 5+12+5 çıkıyor. Blogun bu satırı hatalı kabul edildi.

| Çeşni | Dörtlü aralıkları | Beşli (dörtlü + 9) | Örnek (A4 üstünde / yerinde) | Çapraz kontrol |
|---|---|---|---|---|
| **Çârgâh** | 9 + 9 + 4 = 22 | 9+9+4+9 = 31 | C5 D5 E5 F5 (+G5) | Wikipedia tablosu: Çârgâh 0, Nevâ 9, Hüseynî 18, Acem 22, Gerdâniye 31 |
| **Bûselik** | 9 + 4 + 9 = 22 | 9+4+9+9 = 31 | A4 B4 C5 D5 (+E5), Dügâh üzerinde | Dügâh 40, Bûselik 49, Çârgâh 53, Nevâ 62, Hüseynî 71 |
| **Kürdî** | 4 + 9 + 9 = 22 | 4+9+9+9 = 31 | A4 B4b5 C5 D5 (+E5), Dügâh üzerinde | Dügâh 40, Kürdî 44, Çârgâh 53, Nevâ 62 |
| **Rast** | 9 + 8 + 5 = 22 | 9+8+5+9 = 31 | G4 A4 B4b1 C5 (+D5); Nevâ'da D5 E5 F5#4 G5 (+A5) | Rast 31, Dügâh 40, Segâh 48, Çârgâh 53, Nevâ 62; Nevâ 9, Hüseynî 18, Eviç 26, Gerdâniye 31 |
| **Uşşak** | 8 + 5 + 9 = 22 | Yok. Blog: "Uşşak 4'lüsünü 5'liye çevirmek için bir Tanini aralığı eklediğimizde adı Uşşak 5'lisi değil", Hüseynî beşlisi (8+5+9+9) olur. TDV ve neyzenim de yalnız Uşşak dörtlüsünü kullanıyor | A4 B4b1 C5 D5 | Dügâh 40, Segâh 48, Çârgâh 53, Nevâ 62 |
| **Hicaz** | 5 + 12 + 5 = 22 (12 = artık ikili) | 5+12+5+9 = 31 | A4 B4b4 C5#4 D5 (+E5), Dügâh üzerinde | TDV "Hicaz": donanımda si için bakiye bemolü (dik-kürdî), do ve fa için bakiye diyezi (nîm-hicaz, eviç). Dügâh 40, Dik Kürdî 45, Nim Hicaz 57, Nevâ 62 |

Notlar:
- Blog beşlileri ayrı tabloya koymuyor, ama kuralı yazıyor: "4 Lüler ... 5'liler var onlarda 4'lülerin sonuna bir Tanini aralığı eklenmesinden meydana geliyor". Beşli sütunu bu kuralla **kendi hesabım**; Rast beşlisi için TDV ile tutarlı (Rast→Nevâ 31 koma).
- Bûselik dörtlüsü için sıra: blog 9+4+9 (tanînî, bakiye, tanînî). Bir başka arama özeti 4+9+9 diyordu; o Kürdî dörtlüsüdür. Perde konumları 9+4+9'u doğruluyor (A→B 9, B→C 4, C→D 9).
- Uşşak'ta Si "koma bemol" yazılır ama blog "2–3 koma pes basılır" diyor; yazılı perde B4b1 kalır.
- Hicaz için `makamlar.net` (Arel'den): "Bir Hicaz beşlisinin tiz tarafına bir Rast dörtlüsü eklenerek"; TDV Hicaz: "yerinde hicaz dörtlüsüne nevâda rast beşlisinin eklenmesi". İkisi birbirinden farklı tanım (beşli + dörtlü / dörtlü + beşli). Uygulama mevcut TDV tanımını kullanıyor.

## 4. Eserler

### 4.0 Özet

| # | Eser | SymbTr dosyası | Usul (app'te?) | Ölçü | Aralık dışı (KomaAE) | Dönüştürücü | Telif | Öneri |
|---|---|---|---|---|---|---|---|---|
| 1 | Yine bir gülnihâl (Dede Efendi, Rast şarkı) | `rast--sarki--semai--yine_bir_gulnihal--dede_efendi.txt` | Semâî 3/4 (**var**) | 96 | 35 nota: D4 ×10, E4 ×10, F4#4 ×12, B5b1 ×3 | **Değişmeden geçer** (96 ölçü, hata yok) | Beste KAMU MALI; güfte BELİRSİZ | **SKIP (Aşama C'de)**, koşullu sonra |
| 2 | Benli Hasan Ağa Rast peşrev | `rast--pesrev--sakil----benli_hasan_aga.txt` | Sakîl 48/4 (**yok**) | 5,5 (48/4'lük) | 16 nota: D4 ×1, E4 ×2, F4#4 ×12, B5b1 ×1 | Tek hata: son ölçü yarım | Beste KAMU MALI (kesin değil: bkz. aşağı) | **SKIP** |
| 2b | Benli Hasan Ağa Rast saz semâîsi | `rast--sazsemaisi--aksaksemai----benli_hasan_aga.txt` | Aksak semâî 10/8 + Yürük semâî 6/4 (**yok**, usul değişimi var) | 64 | 56 nota | 182 hata | KAMU MALI | **SKIP** |
| 3 | Yine bağlandı dil (Zekâî Dede, Nevâ şarkı) | `neva--sarki--yuruksemai_ii--yine_baglandi--zekai_dede.txt` | Yürüksemâî II 6/8 (**var**: `yuruk-semai`) | 120 | 12 nota: B5b1 ×8, C6 ×4 | 96 hata, Kod 10/11 normal nota sayılırsa **hatasız** (120 ölçü) | Beste KAMU MALI (ö. 1897); güfte BELİRSİZ | **ADD (koşullu)**, ama bölüm seçimi gerekir |
| 4 | Çanakkale İçinde (Nevâ türkü, ek aday) | `neva--turku--sofyan--canakkale_icinde--.txt` | Sofyan 4/4 (**var**) | 56 | **0** | Kod 10 ×8 normal nota sayılırsa hatasız | BELİRSİZ (halk türküsü; derleme/uyarlama haklarına bakılmadı) | **ADD (koşullu)**: Nim Hisar ×32 ve Nevâ makamı için en uygun aday |

Sakîl ve gülnihâl dosyalarının Kod dağılımı: yalnız Kod 9 (+ Sakîl'de Kod 8 ×9, süresiz). Dört dosyada da üçleme (1/12, 1/24) ve 1/32 **yok**.

### 4.1 Yine bir gülnihâl (Dede Efendi)

- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/rast--sarki--semai--yine_bir_gulnihal--dede_efendi.txt. Rast, şarkı, Semâî. Başlıkta Kod 51 satırı "Semâî", Pay/Payda 3/4.
- Ölçü: 96. Offset 96,0. Satır 262 (Kod 9): 239 nota + 23 sus.
- Süreler: 1/8 ×58, 1/4 ×157, 1/2 ×39, 3/4 ×8 (hepsi tek değerle yazılır; bağ gerekmiyor). Kod 1/7/10/11 yok. Kod 8 yok.
- Dönüştürücü (`semai` usulüyle, hiçbir değişiklik yapmadan): **hatasız**. `{ measures: 96, notes: 239, rests: 23, komaChecked: 239, events: 262, tiedRows: 0 }`.
- Söz: 113 satırın Soz1 değeri "." (yalnız saz bölümü) ve ilk satır "ARANAĞME". Yani **ölçü 1–32 saz (aranağme), ölçü 33–96 sözlü** (64 ölçü; Sira 117 başlangıç). Dönüştürücü bu "." ve "ARANAĞME" dizgilerini `cleanSyllable`dan geçirip hece diye yazar; yazmadan önce süzülmesi gerekir (mevcut üç parçada böyle bir değer yok).
- Perdeler (KomaAE): D4 274 ×10, E4 283 ×10, F4#4 291 ×12, G4 296 ×32, A4 305 ×23, **A4#4 309 ×5**, B4b1 313 ×44, C5 318 ×20, C5#4 322 ×7, D5 327 ×20, **D5#4 331 ×3**, E5 336 ×25, F5 340 ×2, F5#4 344 ×12, G5 349 ×10, A5 358 ×1, B5b1 366 ×3. Aralık D4–B5b1.
- **Yazım uyuşmazlığı:** `A4#4` (309) Kürdî'dir ve uygulamada `B4b5` yazılı; `D5#4` (331) Nim Hisar'dır ve uygulamada `E5b5` olacak. `samePitch` (adım, oktav, acc) karşılaştırdığı için dönüştürücünün çıkardığı `{A,4,+4}` / `{D,5,+4}` perde listesindeki Kürdî / Nim Hisar ile **eşleşmez**; koma eşitliği yeterli değil. SymbTr aynı perdeyi dosyadan dosyaya farklı yazıyor: Sakîl dosyası `B4b5`, Çanakkale dosyası `E5b5` kullanıyor. Dönüştürücü KomaAE'ye göre uygulamadaki yazıma normalleştirmeli.
- Aralık dışı: D4 (Yegâh), E4 (Hüseynî aşîrân), F4#4 (Irak) 1. kademe pest sesler (MEB ünite 1224); B5b1 4. kademe. Uygulamanın en pest perdesi G4. Toplam 35/239 not.
- Aralık dışı notaların ölçülere dağılımı: ölçü 1–3, 22–23, 30, 35, 39, 43, 55, 63, 71–72, 87, 95. Kesintisiz aralık-içi en uzun blok ölçü 4–21 (18 ölçü, hepsi saz).
- Telif: Hammâmîzâde İsmâil Dede Efendi 9 Ocak 1778'de doğdu, "10 Zilhicce 1262 (29 Kasım 1846)" tarihinde Mina'da öldü (TDV: https://islamansiklopedisi.org.tr/ismail-dede-efendi-hamamizade). 1846 + 70 = 1916: **beste KAMU MALI**. Güfte: SalihBora "Güfte şâiri: Bilinmiyor" (https://www.salihbora.com/yine-bir-gul-nihal-aldi-bu-gonlumu-sarkisi/), Divanmakam (İSAM Cüneyd Kosal arşivine atıfla) "Güfte Sâhibi: Belirsiz" (https://divanmakam.com/forum/yine-bir-gulnihal-aldi-bu-gonlumu-dede-efendi-rast.38627/). English Wikipedia lyricist'i anmıyor (https://en.wikipedia.org/wiki/Yine_Bir_G%C3%BClnih%C3%A2l). Bir arama sonucu "Halil Paşa" adı veriyordu (volbiex.com, sayfa açılmadı, başka kaynakla desteklenmedi): **BELİRSİZ**. Güfte sahibi bilinmediği için güfte telifi doğrulanamaz; uygulamada söz gösterilecekse bu bir risk. (Divanmakam bazı arşiv sürümlerinin usulü "Yürük semâî" yazdığını da söylüyor; SymbTr ve SalihBora Semâî diyor.)
- Öneri: **SKIP (Aşama C'de)**. Dönüştürücü ve usul hazır, ama 35 notanın 32'si 1. kademe pest seslerde (Yegâh, Hüseynî aşîrân, Irak). Bu seslerin parmak şeması ve araştırması ayrı bir iş. Pest perde eklenirse en temiz eser bu (değişiklik gerekmeyen tek dosya).

### 4.2 Benli Hasan Ağa Rast peşrev (Sakîl)

- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/rast--pesrev--sakil----benli_hasan_aga.txt. Başka Benli Hasan Ağa peşrevi SymbTr'de yok (`benli` araması: Rast peşrev (Sakîl) ve Rast saz semâîsi). TDV "iki rast peşrevi ve aynı makamdaki saz semâisi"ni anıyor (https://islamansiklopedisi.org.tr/hasan-aga-benli); SymbTr'deki dosyanın bunlardan hangisi olduğu kaynakta yazmıyor (**BELİRSİZ**).
- Usul satırı (Kod 51): "Sakîl", Pay/Payda **48/4**. TDV Sakîl: 48 zamanlı büyük usul; 48/8, 48/4 ve 48/2 mertebeleri kullanılır, 4+6+4+6+6+6+4+4+4+4 yapıdadır (https://islamansiklopedisi.org.tr/sakil). `usuller.ts`'te **yok**.
- Boyut: 1 ölçü = 12 tam nota (48/4). Eser toplam 66 tam nota = **5,5 ölçü** (Offset 5,5). 335 satır Kod 9 (319 nota + 16 sus) ve 9 satır Kod 8 (süresiz çarpma).
- Süreler: 1/16 ×15, 1/8 ×159, 3/16 ×13, 1/4 ×115, 3/8 ×22, 1/2 ×10, 3/4 ×1. Hepsi tek değer. Kod 1/7/10/11 yok.
- Dönüştürücü (kendi 48/4 usul nesnemle): tek hata "son ölçü tamamlanmamış (384/64, Offset 5.5)". Yani eser yarım ölçüyle bitiyor (Üsküdar'daki sorunla aynı kural).
- Hane/teslim işaretleri: **Kod 53/54/55 satırı yok**. Bölümler yalnız Soz1 sütunundaki yazıyla işaretli (ilk satır Es 1/4: "1. HANE"). Sınırlar (Sira, Offset = ölçü kesri, tam nota uzunluğu):

| İşaret | Sira | Başlangıç (ölçü kesri) | Uzunluk (tam nota) | Not sayısı |
|---|---|---|---|---|
| 1. HANE | 2–79 | 0 | 16 (= 1⅓ ölçü) | 71 + 6 sus |
| TESLİM (mülâzime) | 80–113 | 1,3333 | 6 | 29 + 1 sus |
| 2. HANEYE (2. haneye geçiş) | 114–120 | 1,8333 | 2 | 7 |
| 2. HANE | 121–239 | 2,0 | 24 (= 2 ölçü) | 108 + 7 sus |
| 3. HANE | 240–339 | 4,0 | 16 | 99 + 1 sus |
| KARAR | 340–345 | 5,3333 | 2 | 5 + 1 sus |

  Yani 1. hane ve teslim arası Sira 79/80'de; teslimin sonu (2. haneye geçiş) Sira 120'de bitiyor. Dosya teslimi yalnız bir kez yazıyor; icrada her hanenin sonunda tekrarlanıp tekrarlanmadığı dosyadan anlaşılmıyor (**BELİRSİZ**).
- Perdeler: D4 ×1, E4 ×2, F4#4 ×12, G4 296 ×43, A4 ×27, B4b5 ×1, B4b1 ×31, C5 ×33, C5#4 ×5, D5 ×50, E5 ×45, F5 ×8, F5#4 ×34, G5 ×27, A5 ×8, B5b1 ×1. Aralık D4–B5b1; aralık dışı 16 nota, Irak ×12.
- Telif: Benli Hasan Ağa 1016 (1607)'de Edirne'de doğdu, IV. Murad'ın ölümünden (1640) sonra saraydan ayrıldı, "İstanbul'da vefat etti"; ölüm yılı kaynakta **yok** (https://islamansiklopedisi.org.tr/hasan-aga-benli). Ölüm yılı **BELİRSİZ**, ama 1607 doğumlu biri için kamu malı olmama olasılığı yok (kendi çıkarımım: 1757'den sonra ölmüş olsa bile ölüm + 70 yıl 1827'yi geçmez). Beste KAMU MALI kabul edilebilir.
- Öneri: **SKIP**. Sakîl usulü, 12 tam notalık ölçü (her ölçüde ~60 olay; mevcut parça modeli ve dizgi bu uzunlukta ölçü için tasarlanmadı), yarım son ölçü kuralı ve 16 aralık dışı nota (Irak ×12) bir arada. Kolay iş değil.
- Aksak semâî (2b): usul değişimi (10/8 → 6/4 → 10/8; Kod 51 ×3), dönüştürücü "usul değişimi desteklenmiyor" der ve Offset hizası da bozulur (182 hata). Aralık dışı 56 nota (D4 ×9, E4 ×11, F4#4 ×12, B5b1 ×12, C6 ×6, D6 ×4, E6 ×2). **SKIP.**

### 4.3 Yine bağlandı dil (Zekâî Dede, Nevâ)

- Dosya: https://raw.githubusercontent.com/MTG/SymbTr/master/txt/neva--sarki--yuruksemai_ii--yine_baglandi--zekai_dede.txt. Usul satırı "Yürüksemâî II", Pay/Payda **6/8** = uygulamadaki `yuruk-semai`. TDV Nevâ maddesi: "Zekâi Dede'nin yürük semâi usulünde, 'Yine bağlandı dil bir nevnihâle' mısraıyla başlayan şarkı" (https://islamansiklopedisi.org.tr/neva); TDV Zekâî Dede maddesi de eseri nevâ şarkı olarak sayıyor (https://islamansiklopedisi.org.tr/zekai-dede). Etiket: bestekâr ve makam doğrulandı.
- Ölçü: 120 (Offset 120). Kod dağılımı: Kod 9 ×608, **Kod 10 ×44** (süreli), **Kod 11 ×22** (süreli), Kod 8 ×50 (süresiz). Süreler (süreli satırlarda): 1/16 ×112, 1/8 ×472, 3/16 ×4, 1/4 ×72, 3/8 ×14 (hepsi tek değerli; üçleme/1/32 yok).
- Dönüştürücü: olduğu gibi **96 hata** (Kod 10/11 satırları atlandığından Offset zinciri bozuluyor). Kod 10 ve 11 normal nota sayılırsa: `{ measures: 120, notes: 640, rests: 34, komaChecked: 640, events: 674, verifiedRows: 674 }`, hatasız. Önceki not da aynı düzeltmeyi (Kod 10/11 → normal nota) öneriyordu.
- Yapı (Soz1'den): ölçü 1–20 saz (ARANAĞME; Kod 10 satırlarında), 21–40 sözlü, 41–60 sözlü, **61–80 saz (aranağme tekrarı)**, 81–100 sözlü, 101–120 sözlü. Ölçü 40 ve 100'ün sonunda "SAZ" işaretli kısa köprü (Sira 242–245 ve 604–607; ilgili ölçülerin son yarım kısmı). Yani asıl şarkı 40 ölçüdür, bir kere tekrarlanıyor gibi görünüyor (bu çıkarım, dosyada "tekrar" işareti yok: iki yarı notasyonca aynı olup olmadığına bakılmadı, **BELİRSİZ**).
- Perdeler (KomaAE): G4 ×4, A4 ×24, B4b1 ×48, C5 ×104, D5 ×176, E5 ×126, F5 ×6, F5#4 ×78, G5 ×66, A5 ×46, **B5b1 366 ×8, C6 371 ×4**. Aralık G4–C6. Nim Hisar/Nim Şehnaz kullanılmıyor.
- Aralık dışı notalar yalnız **ölçü 37–38, 41–42, 97–98, 101–102**'de (her yerde B5b1 ve C6'nın aynı iki ölçülük figürü). Aralık-içi uzun bloklar: ölçü 1–36, ölçü 43–96 (54 ölçü), ölçü 103–120. Yani eserin tamamı bu hâliyle eklenemez, ama bir bölüm (ör. ölçü 43–96) eklenebilir; bunun için dönüştürücüde "ölçü aralığı al" gibi bir özellik gerekir (şu an yok) ve bu bir tasarım kararıdır (kırpma "yaklaştırma yapılmaz" ilkesini bozmaz, çünkü notalar değişmez; ama parçanın bütünlüğü bozulur).
- Telif: Zekâî Dede (TDV başlığı: "ö. 1897"): 1897 + 70 = 1967, **beste KAMU MALI**. Güfte sahibi bulunamadı (SalihBora/Divanmakam gibi bir künye sayfası açılamadı): **BELİRSİZ**. Söz gösterilecekse güfte telifi doğrulanmalı.
- Öneri: **ADD (koşullu)**. Gerekenler: (1) `ParcaMakam`'a `neva`, (2) dönüştürücüde Kod 10/11 normal nota, (3) "." / "ARANAĞME" / "SAZ" hece süzmesi, (4) KomaAE→yazım normalleştirmesi (bu dosyada gerekmedi: `B4b1`, `F5#4` zaten doğrudan), (5) aralık dışı 12 nota için bölüm seçimi ya da B5b1/C6 desteği. Dosya Nevâ'yı göstermesi açısından değerli, ama (5) olmadan eklenemez.

### 4.4 Ek bulgular: dönüştürücüde bilinmesi gerekenler

1. Kod 10/11 (ve 1/7) normal nota sayılmazsa Offset zinciri bozulur (Zekâî Dede dosyası 96, Çanakkale dosyası 16 hata). Önceki not aynı öneriyi yapmıştı.
2. Son ölçünün yarım bitmesi (Sakîl) hata sayılıyor. Peşrev ve şarkı sonlarında yaygın olabilir.
3. Usul değişimi (aksak semâî 10/8 ↔ 6/4) desteklenmiyor.
4. Yazım uyuşmazlığı: SymbTr bir koma değeri için tutarlı yazım kullanmıyor (`A4#4` ve `B4b5` her ikisi 309; `D5#4` ve `E5b5` her ikisi 331). `samePitch` yazıma bakıyor.
5. "." ve "ARANAĞME" gibi saz işaretleri hece sayılmamalı.

### 4.5 Ek adaylar (tarama: `rast--` 109 + `neva--` 21 dosya)

Dönüştürücüye uygulamadaki usulle (Pay/Payda eşleşen) verildi; "Kod→9" = Kod 1/7/10/11 bellekte 9 yapıldı. Aralık dışı = KomaAE'ye göre (Nim Hisar 331 ve Nim Şehnaz 353 aralık içi sayıldı). **Hepsinin telifi BELİRSİZ** (bestekâr alanı çoğunlukla boş; araştırılmadı), yalnız bir fikir vermek için:

| Dosya | Makam / usul | Ölçü | Aralık dışı | Dönüştürücü |
|---|---|---|---|---|
| `neva--turku--sofyan--canakkale_icinde--.txt` | Nevâ / Sofyan 4/4 | 56 | **0** (G4–G5; **E5b5 ×32**, F5#4 ×4, yazım E5b5) | Kod 10 ×8 → normal nota ile hatasız |
| `rast--cocuksarkisi--sofyan--yavru_kuslar--.txt` | Rast / Sofyan | 24 | 0 | değişmeden hatasız (24 ölçü, sözlü) |
| `rast--turku--nimsofyan--sira_sira--.txt` | Rast / Nim Sofyan | 56 | 0 | değişmeden hatasız |
| `rast--kanto--nimsofyan--darildin_mi--.txt` | Rast / Nim Sofyan | 76 | 0 | değişmeden hatasız (ölçü 1–16 ve 39–54 saz, 17–38 ve 55–76 sözlü) |
| `rast--sugul--duyek--ya_men--tanburi_ali_efendi.txt` | Rast / Düyek | 8 | 0 | değişmeden hatasız |
| `rast--turku--evfer--evrese_yollari--.txt` | Rast / "Evfer" 9/8 (sayısal olarak Aksak ile aynı, **usul adı farklı**: vuruş kalıbı Aksak'la aynı olmayabilir, BELİRSİZ) | 20 | 0 | `aksak` ile geçer ama usul yanlış olur |

Çanakkale İçinde için: Küre Ansiklopedi, türküyü anonimleşmiş bir halk müziği eseri sayıyor ve en bilinen "Kastamonu varyantı"nın 14 Temmuz 1948'de Muzaffer Sarısözen ve ekibi tarafından derlendiğini yazıyor (https://kureansiklopedi.com/tr/detay/canakkale-turkusu). SymbTr'deki ezginin bu varyant olup olmadığı ve derleyen/uyarlayanın hakları **BELİRSİZ**. Aynı türkünün Kevser Hanım longasıyla ilişkisi önceki notta anılmıştı; bu araştırmada doğrulanmadı.

Tanburi Ali Efendi'nin ölüm yılı kaynaklarda 1890 ya da 1902 diye farklı geçiyor (arama özetleri; sayfa açılmadı): **BELİRSİZ**, ikisinde de 70 yıl dolduğu için pratikte kamu malı olması beklenir (1902 + 70 = 1972).

## 5. Kademe geçiş etütleri

Kaynak durumu: neyzenim ve MEB kademe geçiş için **somut bir etüt sayfası vermiyor**. MEB'in iki ünitesi yalnız çerçeve veriyor:
- 4. sınıf 2. tema, "İkinci ve Üçüncü Kademe Ses Alanında Ana Seslerden Oluşan Etütler" (ünite 1218): ses kümesi "rast, dügâh, buselik, çargâh, açık neva, hüseyni, acem, açık gerdaniye ve açık muhayyer"; etütlerin "uzun seslerden ve basit usullerden" oluşması; "Köprü Kurma": öğrencinin önceki ana seslerin "parmak pozisyonları ve nefes şiddetlerini" hatırlayıp etütlerle ilişki kurması (https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1218).
- 7. sınıf 4. tema (ünite 1232): nim hisar, eviç ve nim şehnaz notalarından oluşan etütler; etütlerin metronomla hızlandırılabileceği (https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1232).
- neyzenim `_6` ve `_9` yalnız notayı (GIF) gösteriyor, metinde nota yok; `_9`: "tüm parmaklarımız kapalı olarak çıkan Re perdesini özellikle tiz seslerden orta seslere ineceğimiz zaman çok kullanacağız" (kapalı Nevâ'nın neden öğretildiği).

Aşağıdaki kalıplar **bizim önerimizdir**; kaynaklar yalnızca ilkeleri (aynı parmak + şiddet, uzun sesler, basit usul, kapalı Nevâ inişte) destekler.

1. **Aynı parmak, iki şiddet (ana egzersiz):** her 2. kademe sesi ile 31 koma üstündeki eşini art arda uzun seslerle çal: Dügâh→Hüseynî (A4 E5 A4 E5), Rast→kapalı Nevâ (G4 D5 G4 D5), Çârgâh→Gerdâniye (C5 G5), açık Nevâ→Muhayyer (D5 A5), Segâh→Eviç (B4b1 F5#4), Nim Hicaz→Nim Şehnaz (C5#4 G5#4). Her ikilide parmak sabit, yalnız nefes değişir. Usul: nim sofyan ya da sofyan, uzun değerler. Kaynak: parmak eşitlikleri neyzenim `_6/_8` + uygulamadaki mevcut perde verisi; "uzun sesler" MEB 1218.
2. **Kapalı Nevâ inişi (tiz→orta):** A5 G5 F5#4 E5 D5(kapalı) C5 B4b1 A4 G4: Muhayyer'den Rast'a Nevâ'yı kapalı pozisyondan indir; son yarım ölçüde D5 (kapalı) → G4 (aynı parmak, nefes azalır). Kaynak: neyzenim `_9` ("tiz seslerden orta seslere ineceğimiz zaman çok kullanacağız").
3. **Nevâ dizisi çık-in (2. ve 3. kademe sınırı Nevâ|Hüseynî):** A4 B4b1 C5 D5 | E5 F5#4 G5 A5 | A5 G5 F5 (acem) E5 D5 C5 B4b1 A4. Eviç çıkışta, Acem inişte (Rast gibi; TDV Nevâ: "eviç yerine acem perdesi kullanılarak"). Dizi TDV "Nevâ" maddesinden (bkz. §2). Bu, 2.→3. kademe geçişini makam bağlamında verir. Önce iki parmak/şiddet değişiminin yaşandığı D5→E5 adımı ayrıca çalışılabilir.
4. **Komşu geçişler, basit usul:** Nevâ(açık) D5 → Hüseynî E5 → D5 → Acem F5 → E5 ...: 2. ve 3. kademe sesleri bir tam ses arayla hızla art arda (MEB 1218 ses kümesi). Ardından bir oktav sıçraması Dügâh A4 → Muhayyer A5: parmak Dügâh (hepsi kapalı, alt delik açık) → Nevâ parmağı (üstten 2. ve alt 5. delik kapalı). Bu parmak değişimi ve şiddet değişimi aynı anda olur, dolayısıyla en zoru bu.
5. **Nim Hisar / Nim Şehnaz yeniliği:** Dügâh parmağıyla Hüseynî→Nim Hisar (yüzüğü 3/4 kapat, başı hafifçe sola), Nim Hicaz parmağıyla Nim Hicaz→Nim Şehnaz (C5#4 → G5#4). MEB 1232'nin "nim hisar, eviç ve nim şehnaz notalarından oluşan etütler" ifadesine uygun. Not (a) çözülmeden Nim Hisar için etüt yazılmamalı.

## 6. Açık sorular

1. **Nim Hisar şeması (not a):** `[k,k,k,k,k,y]` (yüzük 3/4) mi, yoksa metnin düz okumasıyla sol üç parmak 3/4 mü? Önerim ilki; tek net kaynak cümlesi belirsiz. `verified: true` yazılıp yazılmayacağı kullanıcıya bağlı.
2. **`Hole` türü kesir taşımıyor:** `yarim` hem Bûselik (sağ yüzük "yarısı") hem Nim Hisar (3/4 kapalı) için kullanılırsa kullanıcıya yanlış oran anlatılabilir. İpucu metninde oran yazılsın ya da `yarim` ikiye ayrılsın.
3. **Kapalı Nevâ üfleme şiddeti** sayfada yok. Uygulamada "Rast parmağıyla Nevâ (bir beşli üstte)" diye anlatılıp şiddet cümlesi yazılmayabilir, ya da öğretmen/deneme ile doğrulanmalı. Kullanıcının ney çalan biri varsa iPhone dışı doğrulama.
4. **Aynı yazılı perde iki fingering:** Nevâ açık ve kapalı `D5 acc 0` olacak. `NEY_PERDELER.find(samePitch)` kullanan yerler (`takip.ts`, `CalismaPaneli.tsx`) ilkini bulur; mikrofon takibinde ikisi aynı hedef perdeyi ister. Yeni `PerdeId` (`neva-kapali`) eklenirse bu yerler gözden geçirilmeli.
5. **Yazım normalleştirmesi:** dönüştürücü KomaAE'ye göre `A4#4→B4b5`, `D5#4→E5b5` yazmalı (ve olası `G4#4`, `A5b5`→`G5#4` benzerleri). SymbTr'nin bu iki yazımı hangi kuralla seçtiği bilinmiyor.
6. **Eser seçimi:** Nevâ'yı gösteren aday Çanakkale İçinde (aralık tam içinde, ama telif BELİRSİZ) mı, Zekâî Dede (telifi temiz, ama aralık dışı 12 nota ve bölüm seçimi gerekir) mi? Gülnihâl ancak 1. kademe pest sesler (Yegâh, Hüseynî aşîrân, Irak) eklenirse mümkün.
7. **Güfte telifi:** Gülnihâl ve "Yine bağlandı dil" güfte sahipleri bulunamadı. Sözlü gösterim planlanıyorsa bu belirsizlik riskli.
8. **"Uşşak beşlisi":** yok; blog ve TDV Uşşak'ı yalnız dörtlü olarak kullanıyor (8+5+9'a tanînî eklenince Hüseynî beşlisi olur). Uygulamada Uşşak yalnız dörtlü anlatılsın.
9. **Hicaz koma doğrulaması:** 5+12+5 yalnız perde konumlarından çıkarıldı; bir nazariyat kitabı (Özkan, Arel) sayfasıyla doğrulanamadı (PDF 404). Blog 8+12+8 diyor ve toplam tutmuyor.
10. **tr.wikipedia** perde ve makam sayfaları açılamadı (404); Wikipedia olarak yalnız İngilizce perde tablosu kullanıldı.
