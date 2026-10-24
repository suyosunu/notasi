# Notası — Ses ve Gösterim İyileştirmeleri Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Kullanıcının 2026-10-24'te sohbette onayladığı üç iyileştirmeyi yapmak: ney sesi seçeneği, kirişli (birleşik) nota gösterimi ve süreyi yansıtan oryantal usul sesleri.

**Architecture:** Mevcut ses katmanı (`src/audio/`), porte çizici (`src/notation/`) ve ayarlar (`src/store/db.ts`, `src/screens/Settings.tsx`) genişletilir. Yeni ağ bağımlılığı eklenmez. Shakuhachi sesi kullanılacaksa ses dosyaları uygulamayla birlikte paketlenir ve çevrimdışı önbelleğe alınır.

**Spec:** `docs/superpowers/specs/2026-10-13-ney-ogrenme-design.md` (§7.3 ses, §7.5 iOS) ve sohbette varılan kararlar (aşağıda Global Constraints).

## Global Constraints

- Önceki planların Global Constraints bölümleri geçerlidir: Sürüm 1, Nota Paketi A ve Sürüm 2. Özellikle şunlar korunur:
  - Çevrimdışı çalışma
  - Koma doğruluğu: `soundingHz` / `freq`
  - iOS dokunuş kuralı
  - Tek-ses kuralı
  - Sayfadan çıkınca sesin durması
- **Ney sesi seçenekleri** (Ayarlar → "Ney sesi"): `mevcut` (bugünkü üçgen dalga + vibrato), `nefesli`, `shakuhachi`. Varsayılan `mevcut` olur; kullanıcı kulakla seçer. Seçenek adları arayüzde şöyle yazılır: "Mevcut", "Nefesli", "Shakuhachi".
- Seçilen ney sesi uygulamadaki **bütün** melodi çalımlarında kullanılır: nota "Dinle", makam dizisi, akort "Doğru sesi dinle" ve parça çalma. Usul sesleri bundan etkilenmez.
- Shakuhachi kaydının lisansı açık lisans olmalıdır ve kaynağı Hakkında ekranında belirtilir. Lisans uygun değilse ya da kayıt koma seslerini doğru çalamıyorsa bu seçenek **eklenmez**, durum rapora yazılır.
- **Kirişler:**
  - Bir vuruş içindeki sekizlik ve onaltılıklar kirişle bağlanır. Sekizlik tek, onaltılık çift kirişle bağlanır; noktalı sekizlik + onaltılık gibi karışık gruplarda kısa ikinci kiriş kullanılır.
  - Gruplama: 4/4'te her dörtlük vuruş bir grup, 12/8'de (mertebe 8) her üç sekizlik bir grup.
  - Sus işaretleri ve ölçü çizgileri grubu böler. Tek kalan nota bayraklı yazılır.
  - Bir grubun sapları tek yöne bakar. Kiriş eğimi sınırlıdır.
- **Usul sesleri:**
  - Her vuruş kendi süresi boyunca tınlar: 2 zamanlık vuruş uzun duyulur. Ses bir sonraki vuruştan hemen önce söner.
  - Tını oryantal (kudüm/darbuka karakteri): düm derin ve perdesi hafif aşağı kayan, tek tiz ve kuru, te/ke tekin daha hafif hali.
  - Sesler yalnızca sentezle üretilir; örnek ses dosyası kullanılmaz.
  - Çalarken vuruş şemasındaki kutular sırayla vurgulanır.

---

### Task 28: Ney sesi seçeneği

**Files:** `src/audio/pattern.ts`, `src/audio/player.ts`, `src/audio/piece.ts` (melodi zinciri), `src/store/db.ts` (Settings.neySesi), `src/screens/Settings.tsx`, `src/main.tsx` (ses seçimini yükleme), `src/screens/About.tsx` (shakuhachi kaynağı varsa). Tests alongside.

**Interfaces:**
- `export type NeySesi = 'mevcut' | 'nefesli' | 'shakuhachi'`. `Settings.neySesi` varsayılan olarak `'mevcut'` olur.
- `setNeySesi(v: NeySesi): void` ve `getNeySesi(): NeySesi` player modülünde (modül düzeyinde) tutulur. Uygulama açılışında ayarlardan yüklenir; Ayarlar'da değişince hemen uygulanır.
- `melodyChain(v: NeySesi): string` yalnızca ses zincirini döner. `buildPatternCode` ve `buildPieceCode` bu zinciri kullanır.
  - `nefesli`: yumuşak girişli, alçak geçiren filtreli bir ana ton ile aynı ritimde, düşük seviyeli bir nefes gürültüsü katmanı `stack` içinde çalar. Kod içinde adlandırılmış sabitler kullanılır.
  - `shakuhachi`: Strudel'in GM shakuhachi sesi kullanılır.
- **Shakuhachi araştırması (implementer):** `@strudel/soundfonts` paketinin `gm_shakuhachi` için hangi dosyayı nereden yüklediği, dosyanın lisansı, boyutu, `freq` ile koma doğruluğunda çalıp çalmadığı ve dosyanın `public/` altında barındırılıp precache edilebilirliği incelenir. Herhangi biri olumsuzsa seçenek eklenmez; Global Constraints'teki kural geçerlidir.
- Ayarlar ekranında "Ney sesi" başlığı altında üç seçenek ve her birinin yanında "▶ Dene" düğmesi bulunur. Düğme kısa bir dizi çalar: Kız ahenginde Dügâh, Segâh, Çârgâh, Nevâ.

- [ ] Failing testler:
  - Varsayılan değer `mevcut` olur.
  - Ayar kaydedilir ve player'a uygulanır.
  - `buildPatternCode` seçilen zinciri içerir; `nefesli` iki katman (`stack`) içerir.
  - Parça kodu da seçilen zinciri kullanır.
  - Gerçek Strudel çekirdeğiyle sorgulamada `nefesli` frekansları değişmez (koma doğruluğu).
  - Shakuhachi eklendiyse ses dosyası precache listesinde bulunur, uygulama çalışırken ağ isteği yapılmaz, Hakkında ekranında kaynak satırı görünür.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(ses): ney sesi seçeneği (Mevcut/Nefesli/Shakuhachi)`

### Task 29: Kirişli nota gösterimi

**Files:** `src/notation/Staff.tsx`, `src/notation/beams.ts` (yeni, saf gruplama), `src/notation/ScoreView.tsx`, `src/screens/ParcaDetail.tsx` (usule göre vuruş birimi). Tests alongside.

**Interfaces:**
- `beamGroups(events: MusicEvent[], beatBeats: number, barlinesAfter?: number[]): number[][]` kirişlenecek olay indeks gruplarını döner. Saf bir fonksiyondur.
  - `beatBeats` dörtlük cinsindendir: 4/4 için 1, 12/8 için 1.5.
  - Grup bir vuruşu, ölçü çizgisini ve sus işaretini aşmaz.
  - Her grupta en az 2 nota bulunur ve yalnızca sekizlik ile daha kısa süreli notalar (noktalılar dahil) yer alır.
- `Staff` bileşenine `beamBeats?: number` prop'u eklenir. Prop yoksa davranış bugünküyle aynıdır.
- Gruptaki notalarda bayrak çizilmez.
  - Ortak sap yönü, porte ortasından en uzaktaki notaya göre belirlenir.
  - Saplar kiriş çizgisine kadar uzar.
  - Kiriş eğimi ilk ve son nota yüksekliğinden hesaplanır ve en fazla ±1 porte aralığıyla sınırlanır.
  - Onaltılık için ikinci kiriş çizilir. Gruptaki tek onaltılığa kısa kiriş parçası çizilir; komşusu yönünde, nota başı genişliği kadar.
  - Bağ eğrileri, koma işaretleri ve heceler etkilenmez.
- ScoreView `beamBeats` değerini parçanın usulünden alır (mertebe 8 → 1.5, aksi halde 1) ve Staff'a geçirir.

- [ ] Failing testler:
  - `beamGroups` örnekleri:
    - 4/4'te 2+2 sekizlik → iki grup.
    - Noktalı sekizlik + onaltılık → bir grup.
    - Sus işareti grubu böler.
    - Ölçü çizgisi grubu böler.
    - 12/8'de 3+3 sekizlik → iki grup.
    - Tek sekizlik → grup yok.
  - Staff'ta gruplu notalarda bayrak yoktur ve `data-beam` çizgisi vardır. Onaltılık grubunda iki kiriş bulunur.
  - Gruptaki sapların uçları kiriş üzerindedir.
  - `beamBeats` verilmeyen Staff eski çizimi korur.
  - Üç gerçek parçada hiçbir kiriş vuruş sınırını aşmaz.
- [ ] Ekran görüntüsüyle kontrol (390 px, Dağlar ile ve Dertli Dolap). Ne görüldüğünü rapora yaz.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(nota): kirişli sekizlik ve onaltılıklar`

### Task 30: Usul sesleri ve vurgulu şema

**Files:** `src/audio/usul.ts`, `src/audio/piece.ts` (usul katmanı aynı sesleri kullanır), `src/screens/UsulSection.tsx`. Tests alongside.

**Interfaces:**
- `buildUsulPatternCode(u, bpm)` vuruş başına süre bilgisini sese yansıtır.
  - Her vuruşun sönme süresi `0.9 × vuruş süresi (saniye)` olur. Bu değer, vuruşlarla hizalı bir sönme deseniyle verilir.
  - düm: sinüs tabanlı, başlangıçta daha tiz olup kısa sürede aşağı kayan perde zarfı. Başlangıç ~110 Hz, bitiş ~65 Hz. Başında kısa bir gürültü vuruşu bulunur.
  - tek: bant geçiren filtreli kısa gürültü ve kısa, tiz bir rezonans tonu (~450 Hz civarı).
  - te ve ke: tek'in daha kısık hali.
  - Bütün değerler adlandırılmış sabitlerde tutulur. Strudel'de kullanılan fonksiyonların (perde zarfı, `bpf` vb.) kurulu pakette varlığı kaynak koddan doğrulanır. Yoksa en yakın karşılık kullanılır ve rapora yazılır.
- Metronom (Dolap) da tık süresini zaman birimine göre ayarlar.
- Parça çalarken usul eşliği aynı yeni sesleri kullanır.
- **Vurgulu şema:** UsulSection çalarken, başlangıç zamanından ve bpm'den hesaplanan konumla o anki vuruş kutusunu vurgular. Kutuya `data-active` eklenir ve `requestAnimationFrame` kullanılır. Durunca ve sayfadan çıkınca vurgu ve döngü temizlenir.

- [ ] Failing testler:
  - Gerçek Strudel çekirdeğiyle sorgulamada Aksak'ın 2 zamanlık düm'ünün sönme değeri 1 zamanlık vuruşunkinin yaklaşık 2 katıdır.
  - Hiçbir vuruşun sesi sonraki vuruşun başlangıcını aşmaz.
  - Kodda düm için perde zarfı, tek için `bpf` bulunur.
  - Vurgu, sahte zamanlayıcı ve sahte rAF ile doğru kutuya ilerler ve durunca kalkar.
  - Parça kodundaki usul katmanı yeni sesleri içerir.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(usul): süreyi yansıtan oryantal usul sesleri ve vurgulu şema`
