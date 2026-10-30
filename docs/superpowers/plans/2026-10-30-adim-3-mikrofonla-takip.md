# Adım 3 — Mikrofonla Takip (deneme) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Etüt ekranında "🎤 Çal, dinlesin": kullanıcı seçili bölümü eşlikle neyle çalarken mikrofon dinler; tur bitince her nota için sonuç (doğru / pes / tiz / başka perde / duyulmadı / kısa tutuldu) notanın üstünde renkle ve altta özetle gösterilir.

**Architecture:** Zamana kilitli değerlendirme: kullanıcı eşlikle çaldığı için her notanın beklenen zamanı bilinir (ses saati işareti `sonIsaret()` + `girisVurus` + tempo). Mikrofon örnekleri (`startPitchStream`, ayrı AudioContext) her karede Strudel ses saatiyle (`sesSaatiSimdi()`) damgalanır. Saf bir değerlendirici (`src/learning/takip.ts`) önce mikrofon gecikmesini kestirir (beklenen perde iziyle en iyi örtüşen kaydırma), sonra her notanın çekirdek penceresindeki örneklerin medyan sent sapmasından durum çıkarır. Sonuç `ScoreView`/`Staff`'ta nota rengi + küçük işaretle, panelde özetle gösterilir. Yalnız etütlerde (yol haritası: "önce etütlerde, sonra parçalarda"), "deneme" etiketiyle; bir tanılama satırı (gecikme, sesli kare oranı) iPhone denemesini değerlendirmek içindir.

**Tech Stack:** Preact + TypeScript (erasableSyntaxOnly), Vitest (jsdom), `pitchy` (mevcut), Strudel.

**Spec:** `docs/superpowers/specs/2026-10-30-notasi-yol-haritasi.md` §3 Adım 3 (onaylı): "Siz etüdü neyle çalarken uygulama dinler. Sonunda şunu gösterir: hangi nota pes ya da tiz kaldı, hangisi atlandı, hangisi kısa tutuldu. Önce etütlerde… Akort göstergesindeki perde algılamanın üstüne kurulur. Önce küçük bir deneme yapılır." Ayrıntı kararları bu plandadır.

## Global Constraints

- Arayüz metni Türkçe ve sade; yorumlar Türkçe JSDoc, çevredeki yoğunlukta. Yeni bağımlılık yok. TS erasableSyntaxOnly.
- iOS: dokunuş işleyicisinde ilk `await`'ten önce eşzamanlı olarak sırayla `unlockAudio()`, `setKayitSession()`, `startPitchStream(...)` çağrılır (sonuncusu kendi AudioContext'ini eşzamanlı kurar).
- Takip tek turdur: Tekrarla/Hızlan takipte yok sayılır. Seçili bölüm geçerlidir. Melodi çalınmaz (`melodi: false`), eşlik `eslik` anahtarına göre (`'usul'` ya da kapalıysa `'yok'` = yalnız giriş sayımı).
- Sabitler (`takip.ts`): `TAKIP_TOLERANS_SENT = 25`, `YANLIS_PERDE_SENT = 70`, `GECIKME_ARALIGI_MS = [-100, 400]` adım 10, `VARSAYILAN_GECIKME_MS = 120`, `ANALIZ_PENCERESI_S = FFT_SIZE / 2 / 48000` (≈ 0.021; örnek damgasından düşülür).
- 375 px'te yatay kaydırma yok. `npm run build` ve `npx vitest run` temiz.

## Review Focus

1. Mikrofon izni reddedilir / açılamaz → eşlik başlamaz ya da hemen durur, mikrofonun Türkçe hata metni gösterilir, panel kilitlenmez.
2. Takip sırasında Durdur ya da sayfadan çıkış → mikrofon izleri durur (iOS turuncu nokta söner), ses oturumu `playback`'e döner, sonuç hesaplanmaz.
3. Kullanıcı hiç çalmaz → bütün notalar "duyulmadı", gecikme varsayılana düşer, hata yok.
4. Eşlik sesi (metronom tıkı, insan sesi) mikrofona karışır → tek tük kareler medyanı bozmaz; giriş sayımı penceresi değerlendirilmez.
5. Oktav hatası (algılayıcı ya da neyin bir üst sesi) → hedefin ±1200 sent çevresi doğru sayılır.

---

### Task 1: Değerlendirici (`src/learning/takip.ts`)

**Files:** Create `src/learning/takip.ts`, `src/learning/takip.test.ts`.

**Interfaces (Produces):**
```ts
export type TakipDurumu = 'dogru' | 'pes' | 'tiz' | 'yanlis' | 'yok' | 'kisa'
/** Beklenen nota: seçimin içindeki yeri ve zamanı (sn, ses saati; tur başına göre). */
export interface BeklenenNota { olcu: number; nota: number; bas: number; son: number; hz: number }
export interface TakipOrnegi { t: number; hz: number | null }   // t: ses saati (sn)
export interface NotaSonucu { olcu: number; nota: number; durum: TakipDurumu; sent: number | null; /** 'yanlis' iken en yakın perdenin adı */ calinan?: string }
export interface TakipSonucu { notalar: NotaSonucu[]; gecikmeMs: number; sesliOran: number; atlanan: number }
/**
 * Seçili ölçülerin notaları (sus yok; `tie` ile bağlanan notalar ilkinde birleşir), `bas`/`son` = t0 + (girisVurus + vuruş) × 60 / bpm.
 * `olcu` indisi tüm etütteki indistir (`ilkOlcu` + dilim içi).
 */
export function beklenenNotalar(olcu: MusicEvent[][], ilkOlcu: number, tuning: Tuning, bpm: number, t0: number, girisVurus: number): BeklenenNota[]
/** Hedefe sent; ±1200'e 100 sentten yakınsa o oktava katlanır (oktav hatası doğru sayılır). */
export function katlanmisSent(hz: number, hedefHz: number): number
/** En yakın ney perdesi (NEY_PERDELER, soundingHz ile; oktav katlanmadan). */
export function enYakinPerde(hz: number, tuning: Tuning): string
export function gecikmeBul(notalar: BeklenenNota[], ornekler: TakipOrnegi[]): number   // ms
export function degerlendir(notalar: BeklenenNota[], ornekler: TakipOrnegi[], tuning: Tuning): TakipSonucu
```

Kurallar:
- `gecikmeBul`: her aday `d` (ms, `GECIKME_ARALIGI_MS`, adım 10) için puan = `bas + d .. son + d` aralığına düşen ve `|katlanmisSent| ≤ 50` olan sesli örnek sayısı. En yüksek puan; eşitlikte `VARSAYILAN_GECIKME_MS`'e en yakın. En iyi puan sesli örneklerin %20'sinden az ya da 5'ten azsa `VARSAYILAN_GECIKME_MS`.
- Çekirdek pencere (gecikme uygulanmış): başı `bas + min(0.15, max(0.06, 0.2 × süre))`, sonu `son − 0.1 × süre`. Pencere 0.04 sn'den kısaysa nota **değerlendirmeye alınmaz**: dönen `notalar` listesinde yer almaz (hızlı geçişlerin dürüst sınırı; deneme bunu ölçecek). `TakipSonucu`'na `atlanan: number` (değerlendirilmeyen nota sayısı) alanı eklenir.
- Penceredeki örneklerin sesli oranı < 0.3 ya da sesli örnek < 2 → `yok`.
- Sesli örneklerin `katlanmisSent` medyanı `m`: `|m| ≤ TAKIP_TOLERANS_SENT` → `dogru`; `≤ YANLIS_PERDE_SENT` → `m < 0 ? 'pes' : 'tiz'`; aksi `yanlis` (+ `calinan = enYakinPerde(medyan hz)`).
- `kisa`: süre ≥ 0.75 sn ve durum `dogru|pes|tiz` iken notanın son kısmında (`son − 0.35 × süre .. son − 0.05 × süre`) sesli oran < 0.25 → `kisa` (perde doğru olsa da).
- `sesliOran` = tüm örneklerde sesli olanların oranı (tanılama).
- Medyan: `src/learning/smoothing.ts`'teki `median`.

- [ ] **Step 1:** Testler (sentetik örnek izleri: 100 Hz'lik kare damgalarıyla — 0.016 sn aralık — hedef hz'ler `soundingHz` ile):
  - 4 dörtlük notalı bir ölçü, ♩=60, giris 4, t0 = 10: `beklenenNotalar` zamanları 14,15,16,17; `tie` ile bağlı iki dörtlük tek nota (süre 2); sus atlanır; `ilkOlcu = 3` iken `olcu` indisleri 3'ten başlar.
  - Kusursuz çalım 150 ms gecikmeyle → `gecikmeBul` 150 (±10) ve bütün notalar `dogru`.
  - Bir nota −40 sent → `pes`; +40 → `tiz`; +300 → `yanlis` ve `calinan` o hz'e en yakın perdenin adı; bir nota boyunca `hz: null` → `yok`; hiç ses yok → hepsi `yok`, `gecikmeMs` 120, `sesliOran` 0.
  - Oktav üstü (+1200 ± 10) → `dogru`.
  - 2 sn'lik nota yalnız ilk yarısı sesli → `kisa`.
  - Her 0.25 sn'de bir tek karelik 1000 Hz tık karışmış kusursuz çalım → yine hepsi `dogru`.
  - ♩=60'ta onaltılık (0.25 sn) notalar değerlendirilir; ♩=200'deki otuzikilik gibi pencere < 0.04 sn olan notalar sonuçta yer almaz.
- [ ] **Step 2:** Başarısız gör, uygula, geç; `npx tsc --noEmit`.
- [ ] **Step 3:** Commit `feat(takip): mikrofon takibinin değerlendiricisi`

### Task 2: Notada sonuç işaretleri (`Staff`, `ScoreView`)

**Files:** Modify `src/notation/Staff.tsx`, `src/notation/ScoreView.tsx`, testleri, `src/styles.css`.

**Interfaces:**
- Consumes: `TakipDurumu` (Task 1).
- Produces: `Staff` prop `durumlar?: (TakipDurumu | undefined)[]` (satırın `events` indisine göre); `ScoreView` prop `sonuclar?: { olcu: number; nota: number; durum: TakipDurumu }[] | null` → satırlara dağıtır (satır bileşeninin `shouldComponentUpdate`'i bu prop'u da karşılaştırır).
- Görünüm: nota başı ve sapı durum rengiyle (`dogru` #2f9e44, `pes`/`tiz`/`kisa` #e8590c, `yanlis`/`yok` #c92a2a); notanın porte üstünde küçük işaret: `pes` "↓", `tiz` "↑", `yanlis` "✗", `yok` "–", `kisa` "◡"; `dogru` işaretsiz. Her olay `data-durum` taşır. Vurgu (highlightIndex) varsa vurgu rengi önceliklidir. Renkler `:root`'ta token (`--takip-dogru`, `--takip-uyari`, `--takip-hata`).
- [ ] **Step 1:** Testler: bir satırda `durumlar` verilince ilgili olaylarda `data-durum` ve işaret metni; `ScoreView` `sonuclar`ı doğru satıra/olaya dağıtır (iki ölçülük satırın ikinci ölçüsü dahil); `sonuclar` değişince yalnız ilgili satırlar yeniden çizilir (mevcut kimlik testi deseni).
- [ ] **Step 2:** Uygula; geç. Commit `feat(nota): takip sonucunu notada göster`

### Task 3: Mikrofon ve ses oturumu yardımcıları

**Files:** Modify `src/audio/ios.ts`, `src/audio/mic.ts`, `src/ney/MicGate.tsx`, testleri.

**Interfaces (Produces):**
- `ios.ts`: `setKayitSession(): void` — `navigator.audioSession.type = 'play-and-record'` (destek yoksa sessiz). `setPlaybackSession` aynen kalır (takip bitince geri dönülür).
- `mic.ts`: `MIC_HATA_METINLERI: Record<'izin-yok'|'desteklenmiyor'|'acilamadi', string>` ve `micHataMetni(err: unknown): { metin: string; detay?: string }` — MicGate'teki `MESSAGES`/`toGateError` buraya taşınır; "İzin verilmedi" metni akort göstergesine özgü kalmasın: "Mikrofon izni verilmedi. Ayarlar › Safari › Mikrofon'dan izin verin." MicGate bunları kullanır (davranışı aynı, mevcut testleri geçer; metin değişikliği testlere yansıtılır).
- [ ] **Step 1:** Testler: `setKayitSession` türü `play-and-record` yapar, `audioSession` yoksa fırlatmaz; `micHataMetni` üç neden + bilinmeyen hata. MicGate testleri geçer.
- [ ] **Step 2:** Uygula; commit `refactor(mikrofon): hata metinleri ve kayıt oturumu ortak`

### Task 4: Panelde takip (yalnız etüt)

**Files:** Modify `src/screens/CalismaPaneli.tsx`, `src/screens/EtutDetail.tsx`, testleri, `src/styles.css`.

**Interfaces:**
- Consumes: Task 1 (`beklenenNotalar`, `degerlendir`, `TakipSonucu`), Task 2 (`ScoreView sonuclar`), Task 3 (`setKayitSession`, `micHataMetni`), mevcut `startPitchStream`, `ANALIZ` için `FFT_SIZE`, `sonIsaret`, `sesSaatiSimdi`, `setPlaybackSession`.
- Produces: `CalismaPaneli` prop `takip?: boolean`; `EtutCalisma` bunu `true` verir (parça vermez).

Davranış:
- Çubukta, çalmıyorken üçüncü düğme "🎤 Çal, dinlesin" (yalnız `takip`). Çubuğun altında (akışta, ipucunun yanında) kısa not: "Deneme: telefonu neyin önüne koy. Eşlik çalar, sen neyle çalarsın; sonunda her nota için sonuç çıkar."
- Dokunuş: eşzamanlı `unlockAudio()`, `setKayitSession()`, `startPitchStream(onSample, abort.signal)`; ardından ikisini de bekle (mikrofon hatasıysa `micHataMetni` uyarısı, ses durur, oturum `playback`'e döner). Mikrofon hazır olunca `buildCalismaCode(dilim, tuning, bpm, { melodi: false, eslik: eslikAcik ? 'usul' : 'yok', voice, usul })` ile tek tur `playCode`.
- `onSample(s)`: `t = sesSaatiSimdi()`; null ise atla; `{ t: t − ANALIZ_PENCERESI_S, hz: s.hz }` biriktir.
- Tur doğal bitince (güncel çalım ise): mikrofonu durdur, `setPlaybackSession()`, `t0 = sonIsaret()` (null ise "Ses başlamadı, sonuç çıkarılamadı." uyarısı), `degerlendir(beklenenNotalar(dilim, bas, tuning, bpm, t0, girisVurus), örnekler, tuning)`; sonucu `sonuclar` olarak ScoreView'a ver ve özet göster.
- Durdur / çıkış / seçim-hız-eşlik değişimi: mikrofon durur, abort, `setPlaybackSession()`, sonuç hesaplanmaz. Yeni bir çalım (Dinle vb.) ya da yeni seçim mevcut sonucu temizler.
- Özet (`role="status"`, çubuğun altında akışta): "16 notadan 12'si doğru." + varsa satırlar: "Pes: Segâh (2), Dügâh (1)", "Tiz: …", "Başka perde: Çârgâh yerine Nevâ", "Duyulmadı: 2 nota", "Kısa tutuldu: 1 nota"; perde adları beklenen notanın perdesi (yazılı perdeden `NEY_PERDELER` adıyla; bulunamazsa solfej adı). Değerlendirilmeyen (çok kısa) nota varsa: "3 nota çok kısa olduğu için değerlendirilmedi." Küçük tanılama satırı (`muted`): "Gecikme {gecikmeMs} ms · ses duyulan kare %{sesliOran×100}". "Sonucu temizle" düğmesi.
- Takip sürerken çubukta "⏹ Durdur" ve "🎤 Dinliyorum…" durumu; vurgu çalışmaya devam eder (kullanıcı nerede olduğunu görür).
- [ ] **Step 1:** Testler (sahte `startPitchStream` örnekleri anlık besler; sahte `playCode` kontrol edilen promise; `sesSaatiSimdi`/`sonIsaret` sahte): düğme yalnız `takip` iken; dokunuşta üç çağrı ilk await'ten önce ve bu sırada; mikrofon reddi → uyarı metni, `playCode` çağrılmaz, oturum `playback`; tur bitince sonuç özeti ve notada `data-durum`; Durdur → mikrofon durdurucu çağrılır, sonuç yok; çıkışta mikrofon durur; `melodi: false` ve takipte Tekrarla açık olsa da tek `playCode`; parçada düğme yok.
- [ ] **Step 2:** Uygula; tam `npx vitest run`, `npm run build`. Commit `feat(takip): etütte mikrofonla dinleyip nota nota sonuç (deneme)`
