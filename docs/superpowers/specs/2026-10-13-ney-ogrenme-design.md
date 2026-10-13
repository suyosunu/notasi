# Ney ve Nota Öğrenme Uygulaması — Tasarım

Tarih: 2026-10-13
Durum: **Onaylandı** (2026-10-13). Parça listesi de onaylandı.
Çalışma adı: **Notası** (proje klasörü `C:\Claude\Notasi`; ad değişebilir — *benim kararım*)

İşaretler: **[Kullanıcı]** kullanıcının söylediği/karar verdiği; **[Karar]** tasarımcının (Claude) kendi kararı — kullanıcı itiraz edebilir; **[Doğrula]** araştırmada kesinleşmemiş, yapım sırasında doğrulanmalı.

---

## 1. Amaç ve neden

**[Kullanıcı]** Kullanıcı ~20 yıl önce basit parçalar üflemiş, bugün kendini **sıfırdan başlayan bir ney öğrencisi** olarak görüyor. Hem nota okumayı hem de neyde uygulamayı yeniden öğrenmek istiyor. Oğlu piyano (Batı) ve kanun (Türk müziği, makamlar) çalışıyor; aile içinde müzik canlı.

**[Kullanıcı]** Varılacak yer: **ilahiler ve Türk sanat müziği parçalarını neyde çalabilmek.**

**[Kullanıcı]** Kullanım anları:
- **Gündüz, iş yerinde masa başı, ~10 dk mola, ney yok.** Kafa işleri: nota okuma, makam bilgisi, kulak.
- **Akşam, evde, 20–30 dk, ney elde.** Üfleme, parmak pozisyonları, uzun ses, parça çalışması.

**[Kullanıcı]** Uygulama **ucu açık** olmalı: ileride piyano gibi yeni bölümler eklenebilmeli.

**[Kullanıcı]** Parçalar **Strudel (strudel.cc) kütüphanesiyle** dinlenebilmeli.

## 2. Başarı ölçütü

- Kullanıcı birkaç hafta boyunca neredeyse her gün uygulamayı açıyor (gündüz ve/veya akşam).
- Bir yıl içinde başlangıç repertuvarındaki ilahileri baştan sona çalabiliyor.
- **[Kullanıcı] Anti-hedef:** Uygulama **çok kolay ya da çok zor** gelirse kullanıcı bırakır. Bu, teknik olarak çalışsa bile başarısızlıktır. Zorluk her an kullanıcının seviyesine oturmalı (bkz. §6).

## 3. Hedefler / Hedef olmayanlar

**Hedefler**
- Telefonda açılan, ana ekrana eklenebilen, internetsiz de çalışan bir uygulama.
- İki modlu günlük plan (gündüz ≤10 dk, akşam 20–30 dk).
- Seviye seviye ilerleyen müfredat: nota okuma → koma işaretleri → perde isimleri → makam/usul → parça.
- Mikrofonla neyi dinleyen akort göstergesi ve uzun ses takibi.
- Strudel ile notaları/parçaları dinletme (koma sesleri doğru perdede).
- Uyarlanır zorluk ve tekrar sistemi.

**Hedef olmayanlar (şimdilik)**
- **[Kullanıcı]** Cihazlar arası eşitleme / bilgisayardan kullanım. Sadece telefon. İleride eklenecek; mimari buna engel olmamalı.
- Hesap, giriş, sunucu tarafı veri.
- Uygulama mağazası (App Store / Play Store) yayını.
- Çok kullanıcı, sosyal özellikler, sıralamalar.
- Piyano bölümü (ileride; yeri hazır tutulacak).

## 4. Kullanıcı ve ortam kısıtları

- **[Kullanıcı] Enstrüman: Kız ney.** **[Karar]** Ahenk ayarlardan değiştirilebilir olmalı (Mansur, Şah, Bolahenk vb.).
- Arayüz dili: **Türkçe**. Perde adları Türkçe imla ile (Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye…).
- Gündüz modu sessiz ortamda olabilir: ses çalan her şey isteğe bağlı olmalı (kulaklık varsayımı yok), sessiz de tamamlanabilmeli. *[Karar]*
- Gündüz oturumu **10 dakikayı asla aşmamalı** ve yarıda bırakılınca kaldığı yerden devam etmeli. *[Karar, kullanıcının anti-hedefinden türetildi]*

## 5. Uygulamanın yapısı (ekranlar)

Görsel taslak beyin fırtınası sırasında gösterildi ve kullanıcı "eksik yok" dedi (`.superpowers/brainstorm/.../content/ekranlar.html`).

### 5.1 Ana ekran
- Selamlama + **seri** (kaç gündür aralıksız çalışıldığı).
- **☀️ Masa başı kartı** (≈10 dk): o günün gündüz görevi ve ilerleme çubuğu.
- **🌙 Akşam kartı** (≈25 dk): o akşamın sırası (ör. uzun ses → dizi → parçanın bir satırı).
- Bölümler: **Nota · Ney · Makam · Usul · Parçalar** + kesik çizgili **Piyano (ileride)**.
- **[Karar]** Günlük görevleri uygulama seviyeye göre kendisi seçer; kullanıcı bölümlere girip serbest de gezebilir.

### 5.2 Gündüz alıştırması (ney yok)
- Kısa soru turları: porte üzerinde nota → doğru adı seç; süreyi tanı; koma işaretini tanı; (ileri seviyede) perde adı/makam sorusu.
- Her soruda isteğe bağlı **🔊 dinle** ve **💡 ipucu**.
- Yanlışlar tekrar sistemine girer (§6).

### 5.3 Akşam pratiği (ney elde)
- Neyin **parmak şeması** (6 ön delik + 1 arka/başparmak deliği; kapalı/açık), kısa tarif ("hafif üfle, dudak gevşek").
- **🎤 Akort göstergesi:** mikrofondan gelen sesin hedef perdeye göre pes/tam/tiz ibresi (sent cinsinden sapma).
- **Uzun ses süresi:** hedef perdede tutulan süre; en iyi süre ve geçmiş.
- **🔊 Doğru sesi dinle** (neyin ahengine göre aktarılmış perdede), **🥁 usul aç** (usul çalar gelince).

### 5.4 Oturum sonu
- Tek soru: **"Bugün nasıldı? Kolay / Tam kararında / Zor"** — ertesi günün yükünü ayarlar.

### 5.5 Ayarlar
- Ney ahengi (varsayılan Kız), kalibrasyon (§7.3), sesler aç/kapa, **yedeği dosyaya kaydet / geri yükle**.

## 6. Öğrenme kurgusu

### 6.1 Müfredat sırası
**[Kullanıcı]** Önce porteyi **Do-Re-Mi** olarak okumak, perde isimleri bunun üstüne ikinci katman. Onaylanan sıra:

1. **Porte okuma:** sol anahtarı, notanın yeri → Do, Re, Mi…
2. **Süreler:** birlik, ikilik, dörtlük, sekizlik; nokta; sus işaretleri.
3. **Koma işaretleri (AEU sistemi):** koma (1), bakiye (4), küçük mücenneb (5), büyük mücenneb (8) diyez/bemolleri.
4. **Perde isimleri:** Sol=Rast, La=Dügâh, Si(1 koma bemol)=Segâh, Do=Çârgâh, Re=Nevâ, Mi=Hüseynî, Fa#(1 koma bemol)=Eviç, Sol=Gerdâniye; sonra Dik Kürdî, Nim Hicaz, Hicaz, Acem…
5. **Makamlar:** dizi, durak, güçlü. Başlangıç makamları **[Karar]**: Rast, Uşşak, Hicaz (sonra Segâh, Hüseynî, Beyâtî…).
6. **Usuller:** Sofyan, Düyek, Semâî, Yürük Semâî, Aksak… (düm-tek).
7. **Parçalar** (§6.4).

Ney tarafında **[Karar]** MEB Müzik Okulları "Bireysel Çalgı Eğitimi – Ney" modülünün kademe sırası izlenir: nefes → ses çıkarma → 2. kademe (açık Nevâ, Çârgâh, Bûselik, Dügâh, Rast) → 3. kademe (Hüseynî, Acem, açık Gerdâniye, açık Muhayyer) → 1. kademe/kaba sesler daha sonra. Kaynak: tymm.meb.gov.tr ney modülü (ünite 1216, 1217, 1224). Gündüz ve akşam aynı konuyu işler: gündüz okunan perde akşam neyde çalınır.

### 6.2 Uyarlanır zorluk (anti-hedefe cevap)
- **Başlangıç yoklaması:** ilk açılışta birkaç kısa soru + tek bir uzun ses denemesi. Kullanıcı sıfırdan sayılır ama hatırladıkları tekrar zorla öğretilmez.
- **Hak edilerek ilerleme:** bir konunun son denemelerinde ≥%80 doğru olmadan sonraki konu açılmaz. **[Karar]** Eşik ve pencere (ör. son 10 deneme) yapılandırılabilir sabit olarak tutulur.
- **Akşam tarafında mikrofon karar verir:** hedef perdeyi ±X sent içinde Y saniye tutunca sonraki perde/dizi açılır. **[Karar]** Başlangıç değerleri ±25 sent, 4 sn; kademeli olarak daralır/uzar.
- **Oturum sonu geri bildirimi** ertesi günün soru sayısını/zorluk karışımını ayarlar.
- **Geri dönüş utandırmaz:** takılınca bir önceki hazırlık alıştırmasına yönlendirilir; başarısızlık gibi gösterilmez.

### 6.3 Tekrar sistemi
- Her bilgi kartı (nota, süre, işaret, perde, makam bilgisi) için basit aralıklı tekrar (Leitner kutuları yeterli **[Karar]**). Yanlışlar daha sık gelir.

### 6.4 Başlangıç repertuvarı
**[Kullanıcı]** Parçaları tasarımcı seçecek ve kolaydan zora dizecek. **[Karar]** Aday liste (eski/anonim, telif sorunu olmayan melodiler; makam/usul SymbTr korpusundan; sıralama tasarımcının yargısı — **[Doğrula]** neyde çalınabilirlik ve ses aralığı):

1. Benim adım dertli dolap — Uşşak ilahi, Dolap usulü, anonim (söz: Yunus Emre)
2. Seyyah olup — Uşşak ilahi, Sofyan, anonim
3. Hak Teâlâ — Uşşak ilahi, Sofyan, Ali Ufkî
4. Dağlar ile taşlar ile — Hicaz ilahi, Sofyan, Kutbî Dede
5. Sordum sarı çiçeğe — Segâh ilahi, Sofyan, anonim
6. Gelin gidelim — Hicaz Hümâyun ilahi, Sofyan, Dede Efendi
7. Düşeli bu aşkın — Muhayyer ilahi, Sofyan, Dede Efendi
8. Kapısı yok bir hanedir — Beyâtî ilahi, Düyek, anonim
9. Yine bir gülnihal — Rast şarkı, Semâî, Dede Efendi
10. İdelim cevlân — Hüseynî ilahi, Nim Evsat, anonim
11. Uyan ey gözlerim — Irak ilahi, Yürük Semâî (pes sesleri zor olabilir)
12. Yâ Rabbi — Rast ilahi, Evsat, Ali Ufkî

Melodiler kamu malı olsa da **modern nota baskıları olmayabilir**: notalar telif açısından temiz bir kaynaktan uygulamanın kendi formatına yazılmalı (SymbTr lisansı CC BY-NC-SA olabilir **[Doğrula]**; ticari olmayan kişisel kullanım için uygundur, kaynak belirtilmeli).

## 7. Teknik yaklaşım

### 7.1 Platform **[Karar]**
- **PWA**, Vite + TypeScript. Service worker ile tam çevrimdışı; ana ekrana eklenebilir.
- UI çatısı yapımcıya bırakılmıştır (hafif bir seçim önerilir: Preact/Svelte/vanilla).
- **[Kullanıcı]** Kod **GitHub**'da, yayın **Cloudflare** üzerinde (kullanıcının canlıda iki Cloudflare projesi var). Pages ya da Workers statik varlıklar — yapımcıya bırakıldı. Her push'ta otomatik yayın.
- HTTPS zorunlu (mikrofon ve kurulum için) — Cloudflare sağlar.

### 7.2 Veri
- **[Karar]** Tüm ilerleme cihazda (IndexedDB). Hesap yok.
- **Yedekle / geri yükle** (JSON dosyası) ayarlarda.
- Veri modeli ileride eşitleme eklenebilecek şekilde: kayıtlar zaman damgalı, kimlikli.
- Müfredat ve parçalar **veri dosyaları** olarak (JSON/TS), koddan ayrı: yeni ders/parça eklemek kod değişikliği gerektirmemeli. Bölümler (Nota, Ney, Makam, Usul, Parçalar, ileride Piyano) aynı ders/alıştırma çerçevesini paylaşan modüller olarak tasarlanır — "ucu açık" ilkesi.

### 7.3 Ses ve perde
- **Ahenk aktarımı:** Kız ahenginde yazılı Rast (Sol) **La** olarak, yazılı Dügâh (La) **Si** olarak duyulur (Bolahenk'e göre +700 sent). Oktav belirsiz: kaynaklardan biri Kız neyin rast pozisyonunun La 440 verdiğini söylüyor, diğeri bir oktav pes (A3). **[Karar]** Uygulama ilk kurulumda **kalibrasyon** yapar: kullanıcıdan Rast (tüm delikler kapalı) üflemesi istenir, mikrofon gerçek perdeyi ölçer, ahenk ve oktav buna göre sabitlenir. Ahenk tablosu (Rast'ın duyulduğu ses): Bolahenk D, Davud E, Şah F, Mansur G, Kız A, Yıldız B♭, Müstahsen B, Sipürde C.
- **Koma sesleri:** perdeler AEU 53-koma konumlarından hesaplanır (Do'dan koma: Rast 31, Dügâh 40, Segâh 48, Çârgâh 53, Nevâ 62, Hüseynî 71, Acem 75, Eviç 79, Gerdâniye 84, Dik Kürdî 45, Nim Hicaz 57, Hicaz 58). Frekans = referans × 2^(koma/53).
- **Çalma: Strudel** (`@strudel/web`). Kesirli MIDI notası (`note("74.5")`) ya da `freq()` ile mikrotonal çalabiliyor. Ses: yerleşik synth (sine/triangle + vibrato) ya da `@strudel/soundfonts` içindeki `gm_shakuhachi` / `gm_flute` (ney'e en yakın). Soundfont dosyaları **kendi sunucumuzda barındırılıp** service worker ile önbelleğe alınmalı ki çevrimdışı çalışsın. Ses yalnızca kullanıcı dokunuşundan sonra başlar.
- **Usul çalar:** Strudel desenleriyle düm/tek (iki farklı vurmalı ses).
- **Perde algılama:** `pitchy` (McLeod yöntemi, MIT). getUserMedia; echoCancellation/noiseSuppression/autoGainControl kapalı; ~2048 örneklik tampon. Ses hiçbir yere gönderilmez.
- **Nota çizimi:** hazır kütüphaneler AEU koma işaretlerini desteklemediği için **kendi SVG nota çizicimiz** (porte, sol anahtarı, nota başları, süreler, AEU işaretleri, donanım). **[Karar]**

### 7.4 Lisans
**[Kullanıcı] Strudel kabul.** Strudel **AGPL-3.0** lisanslı olduğu için:
- GitHub deposu **herkese açık** olur ve uygulama kodu **AGPL-3.0-or-later** lisansıyla yayınlanır.
- Arayüzde (Ayarlar → Hakkında) Strudel telif bildirimi ve kaynak kod bağlantısı bulunur.
- Uygulama adında "strudel" kelimesi geçmez.

SymbTr'den türetilen parça verileri kendi lisansıyla ayrı bir klasörde durur (§9.1).

### 7.5 Hedef cihaz: iPhone (Safari)
**[Kullanıcı]** Kullanıcının telefonu iPhone. Birincil hedef iOS Safari ve ana ekrana eklenmiş PWA'dır. Testler gerçek iPhone'da yapılır. **[Karar]** Alınacak önlemler:
- **Ses kilidi:** AudioContext ve Strudel yalnızca bir dokunuşla başlatılır. Uygulamaya ilk girişte bir "Başla" dokunuşu bulunur.
- **Sessiz düğmesi:** iOS'ta sessiz düğmesi Web Audio'yu susturabilir. Bunun için `navigator.audioSession.type = 'playback'` kullanılır (destekleniyorsa). Desteklenmiyorsa "Ses gelmiyorsa sessiz düğmesini kontrol et" ipucu gösterilir.
- **Mikrofon:** getUserMedia ana ekran PWA'sında da test edilir. iOS her açılışta yeniden izin isteyebilir; arayüz buna hazır olmalıdır.
- **Depolama:** Safari, ana ekrana eklenmemiş sitelerin verisini bir süre kullanılmayınca silebilir. Bu yüzden ilk açılışta "Ana ekrana ekle" rehberi gösterilir. Ayrıca haftada bir "Yedeğini al" hatırlatması yapılır; yedek iOS Paylaş menüsü ile Dosyalar'a kaydedilebilir.
- **Kalibrasyon ve akort:** iPhone mikrofonunda neyin alt sesleri test edilir.

## 8. Yol haritası (tek tek)

**[Kullanıcı]** "Tek tek yapalım, sen karar ver." **[Karar]** Sürümler:

**Sürüm 1 — Temel (ilk çalışan uygulama)**
- PWA iskeleti, Türkçe arayüz, Cloudflare yayını, çevrimdışı.
- Ana ekran, günlük plan (gündüz/akşam kartları), seri.
- Yerel kayıt + yedekle/geri yükle.
- SVG nota çizici (porte, sol anahtarı, süreler; AEU işaretleri altyapısı).
- **Nota bölümü:** porte okuma (Do-Re-Mi) + süreler.
- **Ney bölümü:** nefes/ilk ses rehberi, Kız ney parmak şemaları (2. kademe perdeleri), kalibrasyon, **akort göstergesi**, **uzun ses takibi**.
- Strudel ile "dinle" (tek nota / kısa dizi), ahenge göre aktarılmış.
- Başlangıç yoklaması, uyarlanır zorluk, oturum sonu sorusu, basit tekrar sistemi.

**Sürüm 2 — Türk müziğine geçiş**
- Koma işaretleri, perde isimleri, Makam bölümü (Rast, Uşşak, Hicaz), 3. kademe perdeleri.
- **Usul çalar** (Sofyan, Düyek, Dolap…).
- **Parçalar bölümü:** ilk 3–4 parça; notayı göster + Strudel ile dinle (tempo ayarlı) + usul eşliği.

**Sürüm 3 — Parça çalışma**
- Parçayı satır satır çalışma, yavaşlatma, mikrofonla takip ("şu notada pes kaldın").
- Repertuvarın geri kalanı.
- **Oğlunla ortak bölüm:** oğlunun kanunda çaldığı bir ilahiyi birlikte çalma hedefi.

**Sonra:** piyano bölümü, cihazlar arası eşitleme.

## 9. Yapımcıya bırakılanlar
- UI çatısı, durum yönetimi, klasör yapısı, test aracı.
- Cloudflare Pages vs Workers statik varlıklar.
- Görsel tasarım (taslaktaki sıcak/sade ton yönünde).
- Soru üretim ayrıntıları, tekrar algoritmasının ince ayarı.
- Parça notalarının dahili veri formatı (makam, usul, ahenk-bağımsız yazılı perde + süre; ileride söz eklenebilir).

### 9.1 Yapımcı sorularına verilen kararlar **[Karar]**
- **Parmak pozisyonları:** Sürüm 1'deki parmak şemaları yayından önce MEB ney modülünden (tymm.meb.gov.tr, ünite 1216/1217) doğrulanır. Ayrıca her yeni perde ilk açıldığında akort göstergesi devrede olur: kullanıcı kendi neyinde perdeyi üfler ve ölçülen ses beklenenden ±50 sentten fazla saparsa uygulama "şemayı kontrol et" uyarısı verir ve bu durumu kayda alır. Doğrulanmamış bir şema kullanıcıya gösterilmez.
- **İçerik ekleme:** Ders ve parça verisini geliştirici (Claude) depodaki veri dosyalarını düzenleyip yeniden yayınlayarak ekler. Uygulama içinde editör ya da dosya içe aktarma yoktur. "Kod değişikliği gerektirmesin" ifadesi, yeni içeriğin yalnızca veri dosyası eklemekle gelmesi anlamındadır.
- **Parça notalarının kaynağı:** SymbTr korpusu (github.com/MTG/SymbTr) kullanılır. Melodiler buradan uygulamanın formatına dönüştürülür. Parça verileri ayrı bir klasörde, kendi lisansı (SymbTr'nin lisansı) ve kaynak gösterimiyle durur. Doğrulama iki aşamalıdır: dönüştürülen parça Strudel'de çalınıp SymbTr'deki perdelerle karşılaştırılır, ardından kullanıcı (ya da kanun çalan oğlu) kulakla kontrol eder. Sürüm 2 her seferinde 3–4 parça ile sınırlıdır.
- **Sürüm 1'in büyüklüğü:** Sürüm 1, plan içinde kendi başına kullanılabilen ara teslimlere bölünür:
  - **1a:** iskelet, yayın, ana ekran, nota okuma.
  - **1b:** kalibrasyon, akort göstergesi, uzun ses.
  - **1c:** uyarlanır zorluk ve tekrar.

  Kullanıcı ilk adımdan sonra uygulamayı kullanmaya başlayabilir.
- **Oğlunla ortak bölüm (Sürüm 3):** Bu bir özellik değil, bir pratik hedefidir. Bir parça "oğlunla birlikte" diye işaretlenir. Cihazlar arası bağlantı ya da eşzamanlama yoktur. Kanunla ahenk uyumu kullanıcıya bir notla hatırlatılır: kanun Kız ahengine akort edilmelidir.

## 10. Açık sorular
- **[Doğrula] Kız ney parmak pozisyonları:** Wikipedia tablosu (Rast ●●●●●●●, Dügâh ●●●●●●○, Kürdî ●●●●●○○, Segâh ●●●●○●○, Çârgâh ●●●○○●○, Nim Hicaz ●●○○○●○, Nevâ ●○●○○●○) hangi sembolün başparmak olduğunu belirtmiyor; 3. kademe pozisyonları netleşmedi. Çözüm yolu §9.1'de.
- **[Doğrula]** Kız neyin gerçek oktavı — kalibrasyon bunu çözer.
- **[Doğrula]** Parçaların neyde çalınabilirliği ve kaynak notaların telif durumu.
