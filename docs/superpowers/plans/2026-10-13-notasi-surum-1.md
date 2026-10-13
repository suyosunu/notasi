# Notası — Sürüm 1 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kız ney öğrencisi için iPhone'da çalışan, çevrimdışı bir PWA. Sürüm 1 üç ara teslimden oluşur: 1a nota okuma, 1b neyde uzun ses ve akort, 1c uyarlanır zorluk ve tekrar.

**Architecture:** Vite + Preact + TypeScript ile tek sayfalık PWA. Saf müzik ve öğrenme mantığı `src/music` ve `src/learning` klasörlerinde tutulur ve her biri birim testlidir. Ders içerikleri `src/content` altında veri dosyası olarak durur. İlerleme verisi IndexedDB'de saklanır (`src/store`). Ses çalma Strudel (`@strudel/web`) ile, mikrofondan perde algılama `pitchy` ile yapılır. Uygulama Cloudflare Workers statik varlıkları üzerinden yayınlanır.

**Tech Stack:** Vite, Preact, TypeScript, Vitest + jsdom + @testing-library/preact + fake-indexeddb, idb, vite-plugin-pwa, @strudel/web (1.3.x), pitchy (4.1.x), wrangler.

**Spec:** `docs/superpowers/specs/2026-10-13-ney-ogrenme-design.md`

## Global Constraints

- Arayüz dili Türkçedir. Perde adları tam olarak şöyle yazılır: Rast, Dügâh, Segâh, Bûselik, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye. Solfej adları: Do, Re, Mi, Fa, Sol, La, Si.
- Birincil hedef iOS Safari ve ana ekrana eklenmiş PWA'dır. HTTPS zorunludur.
- Gündüz oturumu en fazla **600 000 ms aktif süre** sürer. Yarıda kalan oturum aynı gün kaldığı yerden devam eder.
- Ses çalan her şey isteğe bağlıdır. Gündüz oturumu ses olmadan da tamamlanabilir.
- Tüm kullanıcı verisi cihazda (IndexedDB) kalır. Uygulama yüklendikten sonra ağ isteği yapılmaz. Mikrofon sesi cihazdan çıkmaz.
- Lisans **AGPL-3.0-or-later**, depo herkese açıktır. Uygulama adında "strudel" kelimesi geçmez. Hakkında ekranında Strudel bildirimi ve kaynak kod bağlantısı bulunur.
- Doğrulanmamış (`verified: false`) parmak şeması kullanıcıya **asla gösterilmez**.
- Ders ve perde içeriği yalnızca `src/content/` altındaki veri dosyalarındadır.
- Her kalıcı kayıtta `id` (crypto.randomUUID) ve ISO zaman damgası bulunur.
- Ustalık kuralı: son **10** denemede **≥%80** doğru. Ney başlangıç değerleri: **±25 sent**, **4 sn**. Şema şüphesi eşiği: **±50 sent**.
- Perde frekansı: `hz = 440 · 2^((k − 40)/53) · 2^(tuningCents/1200)`. Burada `k` AEU koma konumudur; Do4 = 0, La4 = 40 ve oktav başına 53 koma.

## Review Focus

1. **Mikrofon izni reddedilir ya da desteklenmez** (iOS her açılışta yeniden sorabilir). Beklenen: Türkçe açıklama ve "Tekrar dene" düğmesi; uygulamanın geri kalanı çalışmaya devam eder. Test: Task 13.
2. **Dünden yarım kalmış gündüz oturumu bugün açılır.** Beklenen: dünkü oturum kapatılır (seriye sayılmaz) ve bugün için yeni oturum başlar. Test: Task 8.
3. **Ses çalınamaz** (Strudel başlatılamaz ya da ses kapalıdır). Beklenen: "Ses çalınamadı" bildirimi gösterilir, soru cevaplanabilir kalır. Test: Task 8.
4. **Bozuk ya da başka uygulamaya ait yedek dosyası içe aktarılır.** Beklenen: dosya reddedilir ve mevcut veri **silinmez**. Test: Task 3.
5. **Gürültülü giriş** (sessizlik, perde algılayıcının oktav sıçramaları). Beklenen: uzun ses yanlışlıkla geçilmiş sayılmaz, kararsız kalibrasyon sonucu kabul edilmez. Test: Task 14 ve Task 15.

---

## Aşama 1a: İskelet, yayın, ana ekran, nota okuma

### Task 1: Proje iskeleti, router ve uygulama kabuğu

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`, `index.html`, `src/main.tsx`, `src/app.tsx`, `src/router.ts`, `src/config.ts`, `src/styles.css`, `LICENSE`, `README.md`, `.gitignore`
- Test: `src/app.test.tsx`, `src/router.test.ts`

**Interfaces:**
- Produces:
  - `useRoute(): string`: `location.hash` değerini döner (`#` olmadan, boşsa `'/'`), `hashchange` olayında yeniden çizer.
  - `navigate(path: string): void`
  - `SOURCE_URL: string` (`src/config.ts`; depo açılana kadar `''`).
  - `App` bileşeni rotaları eşler: `'/'` Home, `'/gunduz'`, `'/aksam'`, `'/nota'`, `'/ney'`, `'/ayarlar'`, `'/hakkinda'`, `'/kalibrasyon'`, `'/baslangic'`, `'/yoklama'`, `'/oturum-sonu'`. Henüz yapılmamış ekranlar için geçici `<Placeholder title>` kullanılır.

- [ ] **Step 1:** `git init`. Dosyaları ekle:
  - `.gitignore` içinde `node_modules`, `dist`, `.superpowers/` ve `.wrangler` bulunsun.
  - `LICENSE` olarak AGPL-3.0 tam metni kullanılsın.
  - `README.md` Türkçe ve kısa olsun; amacı, nasıl çalıştırılacağını ve lisansı anlatsın.
- [ ] **Step 2:** `npm create vite@latest` (preact-ts) ile iskeleti kur ve gereksiz demo dosyalarını sil. Ardından şu paketleri `--save-exact` ile kur:
  - Geliştirme bağımlılıkları: vitest, jsdom, @testing-library/preact, fake-indexeddb.
  - `vitest.setup.ts` dosyası `import 'fake-indexeddb/auto'` satırını içersin.
  - `vite.config.ts` içinde `test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] }` ayarı olsun.
  - `index.html` için: `lang="tr"`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<title>Notası</title>`.
- [ ] **Step 3: Failing testleri yaz.**
  - `router.test.ts`: `location.hash = '#/nota'` sonrasında `useRoute()` `'/nota'` döner; hash boşken `'/'` döner.
  - `app.test.tsx`: `#/hakkinda` rotası render edildiğinde "Hakkında" metni görünür.
- [ ] **Step 4:** `npx vitest run` komutunu çalıştır. Beklenen: FAIL.
- [ ] **Step 5:** `router.ts`, `app.tsx` ve `config.ts` dosyalarını yaz. `styles.css` taslaktaki sıcak tonu kullansın: zemin `#fbf8f2`, vurgu `#c08a2c`, gündüz kartı `#e7eef7`, akşam kartı `#efe6f5`.
- [ ] **Step 6:** `npx vitest run` → PASS. `npm run build` → hatasız biter.
- [ ] **Step 7:** Commit: `chore: proje iskeleti, router, AGPL lisansı`

### Task 2: Perde ve ahenk hesapları

**Files:**
- Create: `src/music/pitch.ts`, `src/music/ahenk.ts`, `src/music/notation.ts`
- Test: `src/music/pitch.test.ts`, `src/music/ahenk.test.ts`, `src/music/notation.test.ts`

**Interfaces:**
- Produces (`pitch.ts`):
  ```ts
  export type Step = 'C'|'D'|'E'|'F'|'G'|'A'|'B';
  export type Accidental = 0|1|-1|4|-4|5|-5|8|-8|9|-9;   // koma cinsinden (AEU)
  export interface WrittenPitch { step: Step; octave: number; acc: Accidental }
  export const NATURAL_KOMA: Record<Step, number>; // C0 D9 E18 F22 G31 A40 B49
  export const SOLFEJ: Record<Step, string>;        // Do Re Mi Fa Sol La Si
  export function writtenKoma(p: WrittenPitch): number;   // (octave-4)*53 + NATURAL_KOMA + acc
  export function komaToHz(k: number): number;            // 440*2^((k-40)/53)
  export function centsBetween(hz: number, targetHz: number): number; // 1200*log2(hz/target)
  ```
- Produces (`ahenk.ts`):
  ```ts
  export type AhenkId = 'bolahenk'|'davud'|'sah'|'mansur'|'kiz'|'yildiz'|'mustahsen'|'sipurde';
  export interface Ahenk { id: AhenkId; name: string; rastSoundsAs: string; shiftKoma: number }
  export const AHENKLER: Ahenk[];
  // shiftKoma: bolahenk -22 (D), davud -13 (E), sah -9 (F), mansur 0 (G), kiz 9 (A), yildiz 13 (B♭), mustahsen 18 (B), sipurde 22 (C)
  // name: 'Bolâhenk','Davud','Şah','Mansur','Kız','Yıldız','Müstahsen','Sipürde'
  export interface Tuning { ahenk: AhenkId; octaveOffset: number; tuningCents: number }
  export const DEFAULT_TUNING: Tuning; // { ahenk: 'kiz', octaveOffset: 0, tuningCents: 0 }
  export function soundingHz(p: WrittenPitch, t: Tuning): number;
  // komaToHz(writtenKoma(p) + shiftKoma + 53*octaveOffset) * 2^(tuningCents/1200)
  ```
- Produces (`notation.ts`):
  ```ts
  export type DurationKind = 'whole'|'half'|'quarter'|'eighth';
  export interface NoteEvent { kind: 'note'; pitch: WrittenPitch; dur: DurationKind; dotted?: boolean }
  export interface RestEvent { kind: 'rest'; dur: DurationKind; dotted?: boolean }
  export type MusicEvent = NoteEvent | RestEvent;
  export function beats(e: MusicEvent): number;        // whole 4, half 2, quarter 1, eighth 0.5; noktalı ×1.5
  export function durationName(e: MusicEvent): string;
  // 'Birlik'|'İkilik'|'Dörtlük'|'Sekizlik', noktalı ise başa 'Noktalı ', sus ise sona ' sus' (ör. 'Dörtlük sus', 'Noktalı ikilik')
  ```

- [ ] **Step 1: Failing testleri yaz** (`toBeCloseTo(x, 2)` ile):
  - `writtenKoma({step:'D',octave:5,acc:0}) === 62`, `writtenKoma({step:'C',octave:4,acc:0}) === 0`
  - `komaToHz(40) ≈ 440`, `komaToHz(0) ≈ 260.77`
  - `centsBetween(445, 440) ≈ 19.56`
  - Kız, oktav 0: Sol4 → 440.00, La4 → 494.96, Re5 → 659.97
  - Kız, oktav −1: Re5 → 329.99
  - Bolâhenk: Sol4 → 293.34; Mansur: Sol4 → 391.14
  - `durationName({kind:'rest',dur:'quarter'}) === 'Dörtlük sus'`, `durationName({kind:'note',dur:'half',dotted:true,pitch}) === 'Noktalı ikilik'`, `beats` noktalı ikilik için 3 döner
- [ ] **Step 2:** `npx vitest run src/music` → FAIL.
- [ ] **Step 3:** Üç dosyayı yukarıdaki imzalarla yaz.
- [ ] **Step 4:** `npx vitest run src/music` → PASS.
- [ ] **Step 5:** Commit: `feat(music): AEU perde, ahenk ve süre hesapları`

### Task 3: Yerel depolama ve yedek

**Files:**
- Create: `src/store/db.ts`, `src/store/backup.ts`, `src/util/date.ts`
- Test: `src/store/db.test.ts`, `src/store/backup.test.ts`

**Interfaces:**
- Consumes: `Tuning`, `DEFAULT_TUNING` (Task 2).
- Produces (`util/date.ts`): `todayLocal(now?: Date): string` (`YYYY-MM-DD`, yerel saat).
- Produces (`db.ts`; `idb` paketi, `DB_NAME = 'notasi'`, `DB_VERSION = 1`, store'lar: `attempts`, `cards`, `sessions`, `longTones`, `fingeringFlags`, `topics`, `settings`):
  ```ts
  export interface AttemptRec { id: string; topicId: string; cardId: string; correct: boolean; at: string }
  export interface CardRec { id: string; box: 1|2|3|4|5; lastReviewedAt: string }
  export interface SessionRec { id: string; kind: 'gunduz'|'aksam'; date: string; startedAt: string;
    endedAt?: string; completed: boolean; elapsedMs: number; state: unknown; feedback?: 'kolay'|'tam'|'zor' }
  export interface LongToneRec { id: string; perdeId: string; durationMs: number; passed: boolean; toleranceCents: number; at: string }
  export interface FingeringFlagRec { id: string; perdeId: string; medianCents: number; at: string }
  export interface TopicRec { id: string; placedOut: boolean; updatedAt: string }
  export interface Settings { tuning: Tuning; calibrated: boolean; soundOn: boolean; dailyQuestionCount: number;
    onboarded: boolean; placementDone: boolean; lastBackupAt: string | null }
  export const DEFAULT_SETTINGS: Settings; // tuning DEFAULT_TUNING, calibrated false, soundOn true, dailyQuestionCount 12, onboarded false, placementDone false, lastBackupAt null
  export function getSettings(): Promise<Settings>;
  export function saveSettings(patch: Partial<Settings>): Promise<Settings>;
  export function addAttempt(a: Pick<AttemptRec,'topicId'|'cardId'|'correct'>): Promise<AttemptRec>;
  export function listAttempts(topicId?: string): Promise<AttemptRec[]>;   // at'e göre artan sırada
  export function getCard(id: string): Promise<CardRec | undefined>;
  export function putCard(c: CardRec): Promise<void>;
  export function listCards(): Promise<CardRec[]>;
  export function getOpenSession(kind: SessionRec['kind']): Promise<SessionRec | undefined>; // endedAt'i olmayan en son oturum
  export function saveSession(s: SessionRec): Promise<void>;
  export function listSessions(): Promise<SessionRec[]>;
  export function addLongTone(r: Omit<LongToneRec,'id'|'at'>): Promise<LongToneRec>;
  export function listLongTones(perdeId?: string): Promise<LongToneRec[]>;
  export function addFingeringFlag(r: Omit<FingeringFlagRec,'id'|'at'>): Promise<FingeringFlagRec>;
  export function listTopics(): Promise<TopicRec[]>;
  export function setPlacedOut(topicId: string): Promise<void>;
  export function resetDbForTests(): Promise<void>;
  ```
- Produces (`backup.ts`):
  ```ts
  export interface BackupFile { app: 'notasi'; version: 1; exportedAt: string; data: Record<string, unknown[]> }
  export class BackupError extends Error {}
  export function exportBackup(): Promise<BackupFile>;
  export function importBackup(json: unknown): Promise<void>;
  export function shareOrDownloadBackup(): Promise<void>;
  export function needsBackupReminder(lastBackupAt: string | null, hasCompletedSession: boolean, now: Date): boolean;
  ```

`importBackup` önce dosyayı **tamamen doğrular**: `app`, `version` ve tüm store adları kontrol edilir. Ancak doğrulama geçerse tek bir readwrite transaction içinde store'lar temizlenip doldurulur.

`shareOrDownloadBackup` şöyle çalışır:
- Dosya adı `notasi-yedek-YYYY-MM-DD.json` olur.
- `navigator.canShare({files})` varsa `navigator.share` ile paylaşılır; yoksa `<a download>` ile indirilir.
- Başarılı olunca `lastBackupAt` güncellenir.

`needsBackupReminder` şu koşullarda `true` döner:
- `lastBackupAt === null` ve `hasCompletedSession`, ya da
- son yedekten bu yana 7 günden fazla geçmişse.

- [ ] **Step 1: Failing testleri yaz:**
  - `getSettings()` ilk çağrıda `DEFAULT_SETTINGS` döner; `saveSettings({soundOn:false})` sonrası kalıcıdır.
  - `addAttempt` dönen kayıtta `id` ve `at` dolu; `listAttempts('nota-1')` sadece o konuyu sıralı döner.
  - `getOpenSession('gunduz')` kapalı oturumları döndürmez.
  - Yedek gidiş-dönüş: veri ekle → `exportBackup` → `resetDbForTests` → `importBackup` → aynı kayıtlar geri gelir.
  - **Review Focus 4:** `importBackup({app:'baska',version:1,data:{}})` `BackupError` fırlatır ve önceden eklenen attempt hâlâ durur. Aynı şekilde `version: 2` ve eksik store da reddedilir.
  - `needsBackupReminder(null,false,now) === false`, `needsBackupReminder(null,true,now) === true`, 8 gün önce → true, 3 gün önce → false.
- [ ] **Step 2:** `npx vitest run src/store` → FAIL.
- [ ] **Step 3:** `npm i -E idb` ve dosyaları yaz.
- [ ] **Step 4:** `npx vitest run src/store` → PASS.
- [ ] **Step 5:** Commit: `feat(store): IndexedDB kayıtları ve yedekle/geri yükle`

### Task 4: SVG nota çizici

**Files:**
- Create: `src/notation/geometry.ts`, `src/notation/Staff.tsx`, `src/notation/glyphs.tsx`
- Test: `src/notation/geometry.test.ts`, `src/notation/Staff.test.tsx`

**Interfaces:**
- Consumes: `WrittenPitch`, `MusicEvent` (Task 2).
- Produces:
  ```ts
  export const LINE_GAP = 10; export const STAFF_TOP = 30;    // alt çizgi y = STAFF_TOP + 4*LINE_GAP = 70
  export function staffIndex(p: WrittenPitch): number;         // Mi4 (alt çizgi) = 0, Fa4 = 1, … Fa5 (üst çizgi) = 8; Do4 = -2; La5 = 10
  export function noteY(p: WrittenPitch): number;              // 70 - staffIndex*5
  export function ledgerLineYs(p: WrittenPitch): number[];      // Do4 → [80]; La5 → [20]; Sol4 → []
  export function Staff(props: { events: MusicEvent[]; width?: number; highlightIndex?: number }): JSX.Element;
  export function AccidentalGlyph(props: { acc: Accidental; x: number; y: number }): JSX.Element | null;
  ```

Çizim kuralları:
- `Staff` şunları çizer: 5 çizgi, sol anahtarı (`𝄞` metni), nota başları, saplar, sekizlik bayrağı, nokta, sus işaretleri ve ek çizgiler.
- Nota başı: birlik ve ikilik içi boş, dörtlük ve sekizlik dolu.
- Sap yönü: `staffIndex >= 4` ise aşağı, değilse yukarı.
- Sus işaretleri için `𝄻 𝄼 𝄽 𝄾` glifleri metin olarak kullanılır.
- `AccidentalGlyph` Sürüm 1'de yalnızca altyapıdır: `acc === 0` ise `null`, değilse `♯`/`♭` ve yanında küçük koma sayısı (ör. ♭ ve üstünde "1"). Gerçek AEU glifleri Sürüm 2'de eklenecek.
- Her nota başında test için `data-testid="notehead"` ve `data-index` bulunur.

- [ ] **Step 1: Failing testleri yaz:**
  - `staffIndex`: Mi4 = 0, Fa5 = 8, Do4 = −2, La5 = 10.
  - `noteY(Mi4) === 70`.
  - `ledgerLineYs`: Do4 → `[80]`, La5 → `[20]`, Sol4 → `[]`.
  - Render: üç notalık `Staff` içinde 3 `notehead` bulunur; birlik nota başında `fill="none"` olur.
- [ ] **Step 2:** `npx vitest run src/notation` → FAIL.
- [ ] **Step 3:** Yaz.
- [ ] **Step 4:** `npx vitest run src/notation` → PASS.
- [ ] **Step 5:** Commit: `feat(notation): SVG porte çizici`

### Task 5: Strudel ile ses çalma

**Files:**
- Create: `src/audio/pattern.ts`, `src/audio/player.ts`, `src/audio/ios.ts`
- Test: `src/audio/pattern.test.ts`, `src/audio/player.test.ts`

**Interfaces:**
- Consumes: `soundingHz`, `Tuning`, `MusicEvent`, `beats` (Task 2).
- Produces:
  ```ts
  export interface ToneEvent { hz: number | null; beats: number }   // null = sus
  export const SOUND_CHAIN = '.s("triangle").vib(5).vibmod(0.1)';   // kulakla ayarlanabilir
  export function buildPatternCode(events: ToneEvent[], bpm: number): { code: string; durationMs: number };
  export function toToneEvents(events: MusicEvent[], t: Tuning): ToneEvent[];
  // player.ts
  export function unlockAudio(): Promise<void>;
  export function playTones(events: ToneEvent[], bpm?: number): Promise<void>;   // varsayılan bpm 60
  export function playWritten(events: MusicEvent[], t: Tuning, bpm?: number): Promise<void>;
  export function stopAudio(): void;
  // ios.ts
  export function setPlaybackSession(): void;   // navigator.audioSession varsa type = 'playback'
  export function isStandalone(): boolean;      // display-mode: standalone || navigator.standalone === true
  ```

`buildPatternCode` şu biçimde kod üretir:
- `freq("<hz.toFixed(2)>@<beats> … ")` + `SOUND_CHAIN` + `.cpm(<bpm/toplamVuruş>)`. Sus için `~@<beats>` yazılır.
- Böylece bir döngü tüm diziyi bir kez çalar. `durationMs = toplamVuruş * 60000 / bpm`.

`player.ts` şöyle çalışır:
- `@strudel/web` paketinden `initStrudel` (bir kez, prebake olmadan), `evaluate` ve `hush` kullanılır.
- `playTones` önce önceki sesi durdurur, ardından `evaluate(code)` çağırır. `durationMs + 150` sonra `hush()` çağırıp resolve olur.
- `unlockAudio` önce `setPlaybackSession()`, sonra `initStrudel()` çağırır. Bu fonksiyon yalnızca dokunuş işleyicilerinden çağrılır.
- Hata durumunda Promise reject olur. UI bunu yakalar.

- [ ] **Step 1: Failing testleri yaz:**
  - `buildPatternCode([{hz:440,beats:2},{hz:null,beats:1},{hz:494.957,beats:1}], 60)`: `code` `'freq("440.00@2 ~@1 494.96@1")'` ile başlar, `'.cpm(15)'` içerir ve `durationMs === 4000` olur.
  - `toToneEvents` Kız + La4 dörtlük → `[{hz≈494.96, beats:1}]`.
  - `player.test.ts`: `vi.mock('@strudel/web')`. `playTones` `evaluate`'i üretilen kodla çağırır. Sahte zamanlayıcılarla 4150 ms sonra `hush` çağrılır. `evaluate` hata fırlatırsa `playTones` reject olur.
- [ ] **Step 2:** `npx vitest run src/audio` → FAIL.
- [ ] **Step 3:** `npm i -E @strudel/web` ve dosyaları yaz.
- [ ] **Step 4:** `npx vitest run src/audio` → PASS.
- [ ] **Step 5: Elle doğrula.** `npm run dev` çalıştır ve geçici bir düğmeyle Kız La4'ü çal. Sesin geldiğini ve ağ sekmesinde Strudel'in dış kaynak istemediğini doğrula. Dış istek varsa `initStrudel` seçeneklerini ayarla. Geçici düğmeyi sil.
- [ ] **Step 6:** Commit: `feat(audio): Strudel ile mikrotonal çalma`

### Task 6: Nota müfredatı ve soru üretici

**Files:**
- Create: `src/content/nota-topics.ts`, `src/learning/cards.ts`, `src/learning/questions.ts`, `src/util/rng.ts`
- Test: `src/learning/cards.test.ts`, `src/learning/questions.test.ts`

**Interfaces:**
- Consumes: `MusicEvent`, `SOLFEJ`, `durationName` (Task 2).
- Produces:
  ```ts
  export interface Topic { id: string; section: 'nota'; title: string; kind: 'note-name'|'duration'; cards: string[] }
  export const NOTA_TOPICS: Topic[];   // sırası = açılma sırası
  export function cardToEvent(cardId: string): MusicEvent;
  // 'note:D5' → Re5 dörtlük; 'dur:half' → Si4 ikilik; 'dur:quarter.dotted'; 'rest:eighth'
  export function topicOfCard(cardId: string): Topic;
  export interface Question { id: string; cardId: string; topicId: string; prompt: string;
    events: MusicEvent[]; options: string[]; answer: string; hint: string }
  export function makeQuestion(cardId: string, rng: () => number): Question;
  export function seededRng(seed: number): () => number;   // mulberry32
  ```

`NOTA_TOPICS` içeriği. Sıra MEB ney sırasıyla hizalıdır, böylece gündüz okunan perde akşam çalınır:

| id | title | cards |
|---|---|---|
| `nota-1` | `Re, Do, Si` | `note:D5`, `note:C5`, `note:B4` |
| `sure-1` | `Birlik, ikilik, dörtlük` | `dur:whole`, `dur:half`, `dur:quarter` |
| `nota-2` | `La ve Sol` | `note:A4`, `note:G4` |
| `sure-2` | `Sekizlik ve noktalı süreler` | `dur:eighth`, `dur:half.dotted`, `dur:quarter.dotted` |
| `nota-3` | `Mi, Fa, Sol (üst)` | `note:E5`, `note:F5`, `note:G5` |
| `sure-3` | `Sus işaretleri` | `rest:whole`, `rest:half`, `rest:quarter`, `rest:eighth` |
| `nota-4` | `Alt notalar: Do, Re, Mi, Fa` | `note:C4`, `note:D4`, `note:E4`, `note:F4` |
| `nota-5` | `La (üst ek çizgi)` | `note:A5` |

Soru kuralları:
- **note-name** sorusu:
  - Soru metni: `'Bu notanın adı ne?'`
  - Seçenekler: cevapla birlikte 4 farklı solfej adı.
  - İpucu notanın yerine göre seçilir:
    - Çizgi üstündeyse: `'Çizgiler alttan: Mi, Sol, Si, Re, Fa'`
    - Aralıktaysa: `'Aralıklar alttan: Fa, La, Do, Mi'`
    - Porte altındaysa: `'Portenin altındaki ilk ek çizgi Do'dur'`
    - Porte üstündeyse: `'Portenin üstündeki ilk ek çizgi La'dır'`
- **duration** sorusu:
  - Soru metni: `'Bu hangi süre?'`
  - Seçenekler: bu konunun ve önceki süre konularının adlarından 4 tane; yetmezse tüm süre adlarından tamamlanır.
  - İpucu: `'Birlik 4, ikilik 2, dörtlük 1, sekizlik ½ vuruş; nokta yarısı kadar ekler'`.

- [ ] **Step 1: Failing testleri yaz:**
  - `cardToEvent('note:B4')` Si4 dörtlük döner; `cardToEvent('rest:eighth')` sekizlik sus döner.
  - Bir topic'in her kartı için `makeQuestion`: `options` 4 farklı öğe içerir, `answer` bunların arasındadır, aynı seed ile aynı soru üretilir.
  - `note:C4` ipucu `'Portenin altındaki ilk ek çizgi Do'dur'` olur.
  - `dur:quarter.dotted` cevabı `'Noktalı dörtlük'` olur.
- [ ] **Step 2:** `npx vitest run src/learning` → FAIL.
- [ ] **Step 3:** Yaz.
- [ ] **Step 4:** `npx vitest run src/learning` → PASS.
- [ ] **Step 5:** Commit: `feat(learning): nota müfredatı ve soru üretici`

### Task 7: Ustalık, günlük soru planı ve seri

**Files:**
- Create: `src/learning/mastery.ts`, `src/learning/day-plan.ts`, `src/learning/streak.ts`
- Test: `src/learning/mastery.test.ts`, `src/learning/day-plan.test.ts`, `src/learning/streak.test.ts`

**Interfaces:**
- Consumes: `AttemptRec` (Task 3), `Topic`, `NOTA_TOPICS`, `makeQuestion`, `Question` (Task 6).
- Produces:
  ```ts
  export const MASTERY_WINDOW = 10; export const MASTERY_THRESHOLD = 0.8;
  export type TopicStatus = 'kilitli'|'acik'|'ogrenildi';
  export function isMastered(attempts: AttemptRec[], placedOut: boolean): boolean;
  export function topicStatuses(topics: Topic[], attempts: AttemptRec[], placedOut: Set<string>): Record<string, TopicStatus>;
  export function currentTopic(topics: Topic[], statuses: Record<string, TopicStatus>): Topic | null;
  export interface DayPlanInput { topics: Topic[]; statuses: Record<string, TopicStatus>; count: number; rng: () => number;
    dueCards?: string[]; reviewTopic?: Topic | null }      // son iki alan Task 16'da doldurulur
  export function buildDayQuestions(input: DayPlanInput): Question[];
  export function streakDays(completedDates: string[], today: string): number;
  ```

Kurallar:
- Bir konu **ustalaşılmış** sayılır: `placedOut` ise ya da en az 10 deneme varsa ve son 10 denemenin ≥8'i doğruysa.
- Konu durumları: ilk konu her zaman `acik`. Sonraki konu, önceki `ogrenildi` olunca `acik` olur.
- `currentTopic`: ilk `acik` olan konu; hepsi öğrenildiyse `null`.
- `buildDayQuestions` (1a kuralı):
  - `round(count*0.7)` soru güncel konudan, kalanı öğrenilmiş konulardan rastgele seçilir.
  - Öğrenilmiş konu yoksa tüm sorular güncel konudan gelir.
  - Kartlar konu içinde sırayla döner. Sonuç karıştırılır.
  - Güncel konu yoksa tüm sorular öğrenilmiş konulardan gelir.
- `streakDays`: bugünden geriye kesintisiz gün sayısı. Bugün henüz çalışılmadıysa dünden başlayarak sayılır.

- [ ] **Step 1: Failing testleri yaz:**
  - 10 denemeden 8'i doğru → ustalık var; 7'si doğru → yok; 9 deneme (hepsi doğru) → yok; `placedOut` → var.
  - `nota-1` öğrenilmişse `sure-1` `acik`, `nota-2` `kilitli` olur.
  - `count: 12` ve öğrenilmiş konu varken 8 soru güncel konudan gelir; öğrenilmiş konu yokken 12 sorunun hepsi güncel konudan gelir.
  - Seri: `['2026-10-11','2026-10-12','2026-10-13']` ve bugün `2026-10-13` → 3; aynı dizi, bugün `2026-10-14` → 3; bugün `2026-10-15` → 0.
- [ ] **Step 2:** `npx vitest run src/learning` → FAIL.
- [ ] **Step 3:** Yaz.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit: `feat(learning): ustalık kuralı, günlük soru planı, seri`

### Task 8: Gündüz alıştırma ekranı

**Files:**
- Create: `src/screens/DayPractice.tsx`, `src/learning/day-session.ts`
- Test: `src/learning/day-session.test.ts`, `src/screens/DayPractice.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`getOpenSession`, `saveSession`, `addAttempt`, `getSettings`, `listAttempts`, `listTopics`), Task 4 (`Staff`), Task 5 (`playWritten`, `unlockAudio`), Task 6 (`Question`), Task 7 (`buildDayQuestions`, `topicStatuses`).
- Produces:
  ```ts
  export const DAY_CAP_MS = 600_000;
  export interface DayState { questions: Question[]; index: number; answers: { cardId: string; correct: boolean }[] }
  export function loadOrStartDaySession(now: Date): Promise<SessionRec>;
  export function answerQuestion(s: SessionRec, choice: string): Promise<{ session: SessionRec; correct: boolean }>;
  export function tick(s: SessionRec, deltaMs: number): Promise<SessionRec>;   // elapsedMs += delta; ≥ DAY_CAP_MS ise kapatır
  export function finishSession(s: SessionRec, completed: boolean): Promise<SessionRec>;
  export function DayPractice(props: { topicId?: string }): JSX.Element;
  // topicId verilirse serbest tur: o konudan 8 soru, oturum kaydı yok, attempt yazılır (Task 9 kullanır)
  ```

`loadOrStartDaySession` şöyle çalışır:
- Açık gündüz oturumu **bugüne aitse** onu döner.
- Açık oturum **önceki bir güne aitse** `finishSession(s, false)` ile kapatır, ardından yenisini başlatır.
- Yeni oturum, ayarlardaki `dailyQuestionCount` ile `buildDayQuestions` sonucundan kurulur.

Diğer kurallar:
- `completed`, tüm sorular cevaplanınca ya da süre dolunca `true` olur.
- Ekran: üstte "☀️ Nota okuma · i/n" ve ilerleme çubuğu, ortada `Staff`, altta 4 seçenek, 🔊 Dinle ve 💡 İpucu düğmeleri.
- Cevap verildiğinde doğru/yanlış renkle gösterilir. Yanlışsa doğru cevap da gösterilir. "Devam" ile sonraki soruya geçilir.
- Ekran görünürken her saniye `tick` çağrılır (`document.visibilityState === 'visible'` iken).
- Bitişte `#/oturum-sonu` rotasına gidilir.
- 🔊 Dinle: önce `unlockAudio`, sonra `playWritten` çağrılır. Hata olursa ya da `soundOn` kapalıysa küçük bir uyarı çıkar: "Ses çalınamadı. Telefonun sessiz düğmesini kontrol edin." Soru cevaplanabilir kalır.

- [ ] **Step 1: Failing testleri yaz** (`day-session.test.ts`, fake-indexeddb):
  - İlk çağrıda 12 sorulu, `elapsedMs: 0` oturum açılır. Aynı gün ikinci çağrı **aynı** oturumu döner.
  - **Review Focus 2:** Dünün tarihiyle açılmış oturum varken bugünkü çağrı onu `endedAt` dolu ve `completed:false` yapar, yeni oturum açar.
  - `answerQuestion` bir `AttemptRec` yazar ve `index`'i ilerletir.
  - `tick(s, 600_000)` oturumu `completed:true` olarak kapatır.
- [ ] **Step 2: Failing testleri yaz** (`DayPractice.test.tsx`):
  - Doğru seçenek tıklanınca "Doğru" metni görünür.
  - **Review Focus 3:** `playWritten` reject edecek şekilde mock'lanır; 🔊 Dinle'ye basınca "Ses çalınamadı" görünür ve seçenekler hâlâ tıklanabilir.
- [ ] **Step 3:** `npx vitest run src/learning/day-session.test.ts src/screens` → FAIL.
- [ ] **Step 4:** Yaz.
- [ ] **Step 5:** PASS.
- [ ] **Step 6:** Commit: `feat: gündüz alıştırma oturumu (10 dk sınırı, devam etme)`

### Task 9: Ana ekran, bölümler ve Nota bölüm sayfası

**Files:**
- Create: `src/sections/registry.ts`, `src/screens/Home.tsx`, `src/screens/NotaSection.tsx`, `src/screens/SessionEnd.tsx`
- Test: `src/screens/Home.test.tsx`, `src/screens/NotaSection.test.tsx`

**Interfaces:**
- Consumes: Task 3, Task 7 (`streakDays`, `topicStatuses`, `currentTopic`), `needsBackupReminder` (Task 3).
- Produces:
  ```ts
  export interface SectionDef { id: 'nota'|'ney'|'makam'|'usul'|'parcalar'|'piyano'; title: string; icon: string;
    status: 'aktif'|'yakinda'|'ileride'; route?: string }
  export const SECTIONS: SectionDef[];
  // Nota 🎼 aktif '/nota'; Ney 🪈 aktif '/ney'; Makam 🧭, Usul 🥁, Parçalar 🎧 'yakinda'; Piyano 🎹 'ileride'
  ```

Ana ekran (taslaktaki gibi):
- Üstte "Günaydın/İyi akşamlar" ve "N gün seri" yazısı. Seri, `completed` oturumların tarihlerinden hesaplanır.
- **☀️ Masa başı · 10 dk** kartı: güncel konunun başlığı ve bugünkü ilerleme gösterilir. Dokununca `/gunduz` açılır.
- **🌙 Akşam neyle** kartı: Aşama 1a'da "Yakında: neyle uzun ses" yazar ve devre dışıdır. Task 15 kartı etkinleştirir.
- Bölüm çipleri: "yakında" olanlar soluk, "ileride" olan kesik çizgili gösterilir.
- `needsBackupReminder` doğruysa sarı bant çıkar: "Yedeğinizi alın, telefon verileri silinirse ilerlemeniz kaybolmasın" ve "Yedekle" düğmesi.
- Henüz onboard olunmamışsa `/baslangic` rotasına yönlendirilir.

Nota bölüm sayfası:
- Konular listelenir. Her konuda durum ikonu bulunur: 🔒 kilitli, ▶ açık, ✓ öğrenildi.
- Açık ya da öğrenilmiş bir konuya dokununca o konudan 8 soruluk serbest tur başlar. Serbest tur `DayPractice` bileşenini `topicId` prop'uyla kullanır, oturum kaydı açmaz, ama attempt yazar.

Oturum sonu ekranı (1a): "Bugünlük bu kadar 👏" ve doğru sayısı gösterilir. Geri bildirim sorusu Task 17'de eklenecek.

- [ ] **Step 1: Failing testleri yaz:**
  - Home'da "Masa başı" kartı ve 6 bölüm çipi görünür; "Piyano" `data-status="ileride"` taşır.
  - Seri 2 gün olan veriyle "2 gün seri" yazar.
  - `lastBackupAt` boşken ve tamamlanmış bir oturum varken yedek bandı görünür.
  - NotaSection: `nota-1` öğrenilmişken `sure-1` ▶, `nota-2` 🔒 gösterilir.
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** PASS.
- [ ] **Step 5:** Commit: `feat: ana ekran, bölüm kayıtları, Nota bölümü`

### Task 10: Başlangıç, Ayarlar ve Hakkında ekranları

**Files:**
- Create: `src/screens/Onboarding.tsx`, `src/screens/Settings.tsx`, `src/screens/About.tsx`
- Test: `src/screens/Onboarding.test.tsx`, `src/screens/Settings.test.tsx`

**Interfaces:**
- Consumes: `unlockAudio`, `isStandalone` (Task 5), `AHENKLER` (Task 2), Task 3 (`saveSettings`, `shareOrDownloadBackup`, `importBackup`, `BackupError`), `SOURCE_URL` (Task 1).

Başlangıç ekranı (`/baslangic`):
1. "Hoş geldiniz" metni ve **Başla** düğmesi. Düğme `unlockAudio()` çağırır; hata yutulur.
2. `!isStandalone()` ise "Ana ekrana ekleyin" rehberi gösterilir: "Safari'de alttaki Paylaş ⬆︎ düğmesine, sonra 'Ana Ekrana Ekle'ye dokunun. Böylece uygulama tam ekran açılır ve verileriniz korunur." Ardından "Devam" düğmesi.
3. Son olarak `onboarded: true` kaydedilir ve `/` rotasına gidilir. Task 17 bu adımı `/yoklama` olarak değiştirecek.

Ayarlar ekranı:
- Ney ahengi seçimi (`AHENKLER`). Ahenk değişince `calibrated: false` olur ve "Yeniden kalibre edin" notu çıkar.
- "Sesler açık" anahtarı.
- **Yedeği kaydet** (`shareOrDownloadBackup`).
- **Yedeği geri yükle**: `<input type=file accept=application/json>` kullanılır. Önce onay sorulur: "Mevcut ilerlemenin yerine yedek yüklenecek. Emin misiniz?" `BackupError` olursa "Bu dosya geçerli bir Notası yedeği değil." gösterilir.
- Hakkında bağlantısı.

Hakkında ekranındaki metin tam olarak şöyle:
- "Notası, ney ve nota öğrenmek için kişisel bir uygulamadır."
- "Ses motoru: Strudel (strudel.cc), © Strudel katkıcıları, AGPL-3.0-or-later lisansıyla."
- "Bu uygulamanın kaynak kodu AGPL-3.0-or-later lisansıyla açıktır: {SOURCE_URL}"

- [ ] **Step 1: Failing testleri yaz:**
  - Onboarding: Başla → (jsdom'da standalone değil) rehber görünür → Devam → `getSettings().onboarded === true`.
  - Settings: ahengi Mansur yapınca `tuning.ahenk === 'mansur'` ve `calibrated === false` olur.
  - Geçersiz yedek dosyası seçilince hata metni görünür.
  - About'ta "AGPL-3.0-or-later" ve "Strudel" geçer.
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** PASS.
- [ ] **Step 5:** Commit: `feat: başlangıç, ayarlar, yedek arayüzü, hakkında`

### Task 11: PWA, yayın ve 1a teslimi

**Files:**
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/apple-touch-icon.png`, `public/icons/icon.svg`, `wrangler.jsonc`
- Modify: `vite.config.ts`, `index.html`, `package.json`, `src/config.ts`

**Interfaces:** —

- [ ] **Step 1:** Simgeyi hazırla: sıcak zeminde stilize bir ney. Önce SVG olarak çiz, ardından bir betikle (sharp ya da benzeri) 192, 512 ve 180 px PNG'ye dönüştür.
- [ ] **Step 2:** `npm i -E -D vite-plugin-pwa` ve `VitePWA` ayarı:
  - `registerType: 'autoUpdate'`
  - manifest: `{ name: 'Notası — Ney ve Nota', short_name: 'Notası', lang: 'tr', display: 'standalone', background_color: '#fbf8f2', theme_color: '#c08a2c', icons: [...] }`
  - workbox: `globPatterns: ['**/*.{js,css,html,svg,png,woff2}']`, `maximumFileSizeToCacheInBytes: 8*1024*1024`
  - `index.html` içine `apple-touch-icon` bağlantısı, `<meta name="apple-mobile-web-app-capable" content="yes">` ve `<meta name="apple-mobile-web-app-title" content="Notası">` eklenir.
- [ ] **Step 3:** `wrangler.jsonc` oluştur:
  - `{ "name": "notasi", "compatibility_date": "2026-10-01", "assets": { "directory": "./dist", "not_found_handling": "single-page-application" } }`
  - `package.json` betikleri: `"deploy": "vite build && wrangler deploy"`.
- [ ] **Step 4: Çevrimdışı çalışmayı doğrula.** `npm run build && npx vite preview` çalıştır ve tarayıcı panelinde aç. Önce bir kez yükle, sonra ağı kapatıp yenile. Beklenen: uygulama açılır, bir gündüz sorusu cevaplanır ve 🔊 Dinle ses çalar.
- [ ] **Step 5: Depoyu oluştur (kullanıcı onayıyla).** Kullanıcıya sor: "GitHub'da herkese açık `notasi` deposunu oluşturup kodu göndereyim mi?" Onay gelirse:
  - `gh repo create notasi --public --source . --push` çalıştır.
  - Depo adresini `SOURCE_URL` değişkenine yaz ve commit et.
- [ ] **Step 6: Cloudflare yayını (kullanıcı adımı, rehberli).** Kullanıcıya Cloudflare panelinde yapacaklarını adım adım yaz: Workers & Pages → Create → Import a repository → `notasi` → Build command `npm run build`, Deploy command `npx wrangler deploy`. Kullanıcı yayın adresini iletince adresi tarayıcı panelinde açıp ana ekranın geldiğini doğrula.
- [ ] **Step 7: iPhone kontrolü (kullanıcıyla).** Kullanıcıya bu kontrol listesini ver ve sonuçları al:
  - (a) Safari'de açılıyor.
  - (b) Ana ekrana eklenebiliyor ve tam ekran açılıyor.
  - (c) Dinle düğmesi ses çalıyor; sessiz düğmesi açıkken de çalıyor ya da uyarı çıkıyor.
  - (d) Uçak modunda uygulama açılıyor.
  - (e) Yedek, Dosyalar'a kaydediliyor.

  Sorun çıkarsa systematic-debugging ile çöz.
- [ ] **Step 8:** Commit: `feat: PWA, Cloudflare yayını — Aşama 1a teslim`

---

## Aşama 1b: Kalibrasyon, akort göstergesi, uzun ses

### Task 12: Ney perdeleri ve parmak şeması

**Files:**
- Create: `src/content/ney-perdeler.ts`, `src/ney/Fingering.tsx`
- Test: `src/content/ney-perdeler.test.ts`, `src/ney/Fingering.test.tsx`

**Interfaces:**
- Consumes: `WrittenPitch` (Task 2), `NOTA_TOPICS` (Task 6).
- Produces:
  ```ts
  export type Hole = 'kapali'|'acik'|'yarim';
  export interface Fingering { thumb: Hole; front: [Hole, Hole, Hole, Hole, Hole, Hole] }   // ön delikler yukarıdan aşağı
  export type PerdeId = 'neva'|'cargah'|'buselik'|'dugah'|'rast';
  export interface NeyPerde { id: PerdeId; name: string; written: WrittenPitch; fingering: Fingering | null;
    verified: boolean; source: string | null; tip: string; notaTopicId: string }
  export const NEY_PERDELER: NeyPerde[];   // MEB sırası: Nevâ, Çârgâh, Bûselik, Dügâh, Rast
  export function visibleFingering(p: NeyPerde): Fingering | null;   // verified değilse null
  export const ILK_SES_REHBER: string[];   // MEB nefes/ses çıkarma ünitelerinden 3–5 kısa madde, Türkçe
  export function Fingering(props: { fingering: Fingering }): JSX.Element;
  ```

Perdelerin yazılışı ve bağlı nota konuları:

| Perde | Yazılış | notaTopicId |
|---|---|---|
| Nevâ | Re5 | `nota-1` |
| Çârgâh | Do5 | `nota-1` |
| Bûselik | Si4 (acc 0) | `nota-1` |
| Dügâh | La4 | `nota-2` |
| Rast | Sol4 | `nota-2` |

- [ ] **Step 1: Araştır ve kaynağı kaydet.** Beş perdenin 2. kademe parmak pozisyonlarını MEB "Bireysel Çalgı Eğitimi – Ney" modülünden doğrula (tymm.meb.gov.tr, ünite 1216; gerekirse 1217). Her perde için `source` olarak ünite adresini ve sayfayı yaz, `tip` metnini Türkçe kısa tarif olarak doldur.
  - Kaynak bir perdeyi kesin göstermiyorsa o perdede `verified: false` kalır.
  - Böyle bir perde varsa **dur ve kullanıcıya sor.** Kullanıcıya bulduğun şemayı göster ve kendi neyiyle denemesini iste.
- [ ] **Step 2: Failing testleri yaz:**
  - `NEY_PERDELER` sırası `['neva','cargah','buselik','dugah','rast']` olur.
  - Her `verified: true` perdenin `source` alanı dolu olur.
  - `visibleFingering({...p, verified:false}) === null`.
  - `Fingering` render edildiğinde 7 delik çizilir; `kapali` delikler dolu, başparmak deliği en üstte "arka" etiketiyle durur.
- [ ] **Step 3:** FAIL → **Step 4:** yaz → **Step 5:** PASS.
- [ ] **Step 6:** Commit: `feat(ney): doğrulanmış 2. kademe parmak şemaları`

### Task 13: Mikrofon ve perde algılama

**Files:**
- Create: `src/audio/mic.ts`, `src/learning/smoothing.ts`, `src/ney/MicGate.tsx`
- Test: `src/audio/mic.test.ts`, `src/learning/smoothing.test.ts`, `src/ney/MicGate.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface PitchSample { t: number; hz: number | null; clarity: number }
  export const MIN_CLARITY = 0.9; export const MIN_HZ = 100; export const MAX_HZ = 2000; export const FFT_SIZE = 2048;
  export function toSample(t: number, hz: number, clarity: number): PitchSample;   // eşik dışıysa hz = null
  export class MicError extends Error { constructor(public reason: 'izin-yok'|'desteklenmiyor') }
  export function startPitchStream(onSample: (s: PitchSample) => void): Promise<() => void>;
  export function median(xs: number[]): number;
  export class Smoother { constructor(size?: number /* 5 */); push(hz: number | null): number | null }
  export function MicGate(props: { children: (start: () => Promise<void>) => JSX.Element }): JSX.Element;
  ```

`startPitchStream` şöyle çalışır:
- `getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })` ile mikrofonu açar.
- Kendi `AudioContext`'ini kullanır. `AnalyserNode` `fftSize` değeri `FFT_SIZE` olur.
- pitchy `PitchDetector.forFloat32Array(FFT_SIZE)` ile `requestAnimationFrame` döngüsünde ölçer.
- Dönen fonksiyon akışı, döngüyü ve bağlamı kapatır.
- İzin reddedilirse `MicError('izin-yok')`, `mediaDevices` yoksa `MicError('desteklenmiyor')` fırlatır.

`Smoother` son N geçerli değerin medyanını döner. `null` gelirse tamponu temizler ve `null` döner.

`MicGate` hata durumunda şu metni ve "Tekrar dene" düğmesini gösterir:
- `izin-yok`: "Mikrofon izni verilmedi. Akort göstergesi için Ayarlar › Safari › Mikrofon'dan izin verin."
- `desteklenmiyor`: "Bu tarayıcı mikrofonu desteklemiyor."

- [ ] **Step 1: Failing testleri yaz:**
  - `toSample(0, 440, 0.95).hz === 440`; `toSample(0, 440, 0.5).hz === null`; `toSample(0, 50, 0.99).hz === null`.
  - `median([3,1,2]) === 2`.
  - `Smoother`: 440, 880, 441, 439, 442 sırasıyla push edilince son değer 441 olur (oktav sıçraması bastırılır). `null` push edilince `null` döner.
  - **Review Focus 1:** `navigator.mediaDevices.getUserMedia` `NotAllowedError` ile reject edecek şekilde mock'lanır. `MicGate` "Mikrofon izni verilmedi" ve "Tekrar dene" gösterir.
- [ ] **Step 2:** FAIL → **Step 3:** `npm i -E pitchy` ve yaz → **Step 4:** PASS.
- [ ] **Step 5:** Commit: `feat(audio): mikrofon perde akışı ve yumuşatma`

### Task 14: Kalibrasyon

**Files:**
- Create: `src/learning/calibration.ts`, `src/screens/Calibration.tsx`
- Test: `src/learning/calibration.test.ts`

**Interfaces:**
- Consumes: `AHENKLER`, `AhenkId`, `Tuning` (Task 2), `writtenKoma` (Task 2), `startPitchStream`, `MicGate` (Task 13), `NEY_PERDELER` (Task 12), `saveSettings` (Task 3).
- Produces:
  ```ts
  export const CALIBRATION_REF: WrittenPitch;   // Nevâ: { step: 'D', octave: 5, acc: 0 }
  export type CalibrationResult =
    | { ok: true; tuning: Tuning; matchesSelected: boolean }
    | { ok: false; reason: 'az-veri'|'kararsiz'|'tanimsiz' };
  export function calibrate(samplesHz: number[], selected: AhenkId): CalibrationResult;
  ```

**Plan kararı:** Spec kalibrasyonu Rast ile tarif ediyor. Ancak MEB sırasında ilk öğrenilen perde Nevâ olduğu için kalibrasyon Nevâ ile yapılır. Hesap aynıdır, yalnızca referans perde değişir.

`calibrate` algoritması:
1. 20'den az örnek varsa `az-veri` döner.
2. `m = median`. Örneklerin %80'inden azı `m`'nin ±30 sent içindeyse `kararsiz` döner.
3. `d = 40 + 53*log2(m/440) − writtenKoma(CALIBRATION_REF)` hesaplanır.
4. Her ahenk ve her `o ∈ {−2,−1,0,1}` için `err = d − (shiftKoma + 53*o)` hesaplanır ve `|err|` en küçük olan seçilir. Eşitlikte `selected` tercih edilir.
5. `tuningCents = err*1200/53` hesaplanır. `|tuningCents| > 50` ise `tanimsiz` döner.

Kalibrasyon ekranı:
- Metin: "Nevâ perdesini (şemadaki gibi) rahatça 3 saniye üfleyin."
- 3 saniyelik örnek toplanır ve sonuç gösterilir: "Neyiniz Kız ahenginde, ayarı tam / 12 sent tiz".
- `matchesSelected` false ise şu soru sorulur: "Neyiniz X ahengi gibi görünüyor. Ayarı X yapayım mı?"
- Onaylanınca `saveSettings({ tuning, calibrated: true })`.
- Hata durumunda şu metinler ve "Tekrar dene" gösterilir:
  - `az-veri`/`kararsiz`: "Ses kararlı gelmedi, biraz daha uzun ve sabit üfleyin."
  - `tanimsiz`: "Neyinizin ahengini tanıyamadım, tekrar deneyelim."

- [ ] **Step 1: Failing testleri yaz** (her biri 30 örnek, ±2 sent rastgele saçılma):
  - 659.97 Hz, seçili `kiz` → `{ok:true, tuning:{ahenk:'kiz', octaveOffset:0, tuningCents≈0}, matchesSelected:true}`.
  - 330.0 Hz → `kiz`, `octaveOffset: -1`.
  - 664.0 Hz → `kiz`, `tuningCents ≈ 10.5` (±1).
  - 586.69 Hz, seçili `kiz` → `mansur`, `matchesSelected:false`.
  - 10 örnek → `az-veri`.
  - **Review Focus 5:** 15 örnek 660 Hz ve 15 örnek 330 Hz → `kararsiz`.
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** PASS.
- [ ] **Step 5:** Commit: `feat(ney): Nevâ ile ahenk ve oktav kalibrasyonu`

### Task 15: Uzun ses, akşam pratiği ve Ney bölümü

**Files:**
- Create: `src/learning/long-tone.ts`, `src/learning/evening-plan.ts`, `src/screens/EveningPractice.tsx`, `src/screens/NeySection.tsx`, `src/ney/TunerGauge.tsx`
- Modify: `src/screens/Home.tsx` (akşam kartını etkinleştir)
- Test: `src/learning/long-tone.test.ts`, `src/learning/evening-plan.test.ts`, `src/screens/EveningPractice.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`addLongTone`, `listLongTones`, `addFingeringFlag`, `saveSession`, `getSettings`), Task 5 (`playWritten`), Task 12, Task 13, Task 14 (kalibrasyon yoksa `/kalibrasyon`), `soundingHz`, `centsBetween` (Task 2), `topicStatuses` (Task 7).
- Produces:
  ```ts
  export interface LongToneConfig { toleranceCents: number; requiredMs: number; graceMs: number }
  export interface LongToneState { holdStartAt: number | null; lastGoodAt: number | null; holdingMs: number; bestMs: number; passed: boolean }
  export function initialLongTone(): LongToneState;
  export function stepLongTone(s: LongToneState, sample: { t: number; cents: number | null }, cfg: LongToneConfig): LongToneState;
  export function neyLevelConfig(passCount: number): LongToneConfig;
  // tolerans max(10, 25 − 5k), süre min(10000, 4000 + 1000k), grace 250
  export const ILK_SES_CONFIG: LongToneConfig;   // { toleranceCents: 50, requiredMs: 3000, graceMs: 250 }
  export function fingeringCheck(centsSamples: number[]): { suspicious: boolean; medianCents: number };
  // ≥10 örnek ve |medyan| > 50 ise şüpheli
  export type PerdeStatus = 'kilitli'|'acik'|'gecildi';
  export interface EveningStep { kind: 'ilk-ses'|'kalibrasyon'|'uzun-ses'; perdeId?: PerdeId; label: string; tries: number }
  export function perdeStatuses(longTones: LongToneRec[], notaStatuses: Record<string, TopicStatus>): Record<PerdeId, PerdeStatus>;
  export function buildEveningPlan(input: { ilkSesPassed: boolean; calibrated: boolean; perdeStatus: Record<PerdeId, PerdeStatus> }): EveningStep[];
  ```

`stepLongTone` kuralları:
- Tolerans içindeki ilk örnekte tutuş başlar.
- Tolerans dışındaki ya da `null` örnekler `graceMs` süresini geçmedikçe tutuşu bozmaz; geçerse tutuş sıfırlanır.
- `holdingMs >= requiredMs` olduğunda `passed` olur. `bestMs` en uzun tutuşu saklar.

Perde durumları (`perdeStatuses`):
- Perde `i`, şu koşulların hepsi sağlanırsa `acik` olur:
  - `i === 0` ya da önceki perde `gecildi`,
  - perdenin nota konusu `kilitli` değil,
  - parmak şeması doğrulanmış.
- Perde için `passed` olan bir `LongToneRec` varsa durumu `gecildi` olur.

Akşam planı (`buildEveningPlan`):
- `!ilkSesPassed` ise `[ilk-ses ×3]`.
- `!calibrated` ise `[ilk-ses ×1, kalibrasyon]`.
- Diğer durumlarda sırayla:
  1. Isınma: son geçilen perde ×1.
  2. Güncel açık perde ×3.
  3. Geçilen diğer perdeler ×1 (en fazla 3).

Akşam pratiği ekranı (taslak 3):
- Sol tarafta `Fingering`, yanında `tip` metni.
- `TunerGauge`: pes/tam/tiz ibresi, sapma ±50 sent ile sınırlanır.
- Üzerinde "Süre: x.x sn (en iyi y.y sn)" yazar.
- "🔊 Doğru sesi dinle" düğmesi `soundingHz` ile 2 vuruşluk ses çalar.
- İlk ses adımında hedef, tutuşun başındaki yumuşatılmış perdedir. Bu adımın üstünde kısa bir nefes ve dudak rehberi bulunur. Rehberin metni Task 12'de araştırılan MEB modülünün nefes ve ses çıkarma ünitelerinden özetlenir ve `src/content/ney-perdeler.ts` içinde `ILK_SES_REHBER: string[]` olarak durur.
- Bir perde **ilk kez** çalışılıyorsa (o perdeye ait kayıt yoksa) ilk 2 saniyenin sent örnekleri `fingeringCheck`'ten geçer. Şüpheliyse `addFingeringFlag` çağrılır ve sarı not çıkar: "Ses beklenenden epey farklı. Parmak şemasını ve deliklerin tam kapandığını kontrol edin."
- Her deneme sonunda `addLongTone` yazılır.
- Plan bitince akşam oturumu `completed` olarak kaydedilir ve `/oturum-sonu` rotasına gidilir.

Ney bölüm sayfası:
- Perdeler durum ikonlarıyla listelenir. Açık ya da geçilmiş bir perdeye dokununca o perde için uzun ses açılır.
- Altta "Yeniden kalibre et" bağlantısı bulunur.

Ana ekrandaki akşam kartı artık etkindir ve `buildEveningPlan` adımlarının etiketlerini listeler.

- [ ] **Step 1: Failing testleri yaz** (`long-tone.test.ts`, yapılandırma `neyLevelConfig(0)` = ±25 sent / 4000 ms / 250 ms):
  - 0 sent örnekleri 50 ms arayla 0'dan 4000 ms'ye kadar verilir. `passed` olur ve `holdingMs` en az 4000 olur.
  - **Review Focus 5:** Örneklerin arasında 200 ms `null` boşluğu tutuşu bozmaz; 300 ms boşluk tutuşu sıfırlar ve `passed` false kalır.
  - +40 sent örnekleri tutuş başlatmaz.
  - `neyLevelConfig(3)` → `{toleranceCents: 10, requiredMs: 7000, graceMs: 250}`; `neyLevelConfig(10).requiredMs === 10000`.
  - `fingeringCheck` 12 örnek +70 sent → şüpheli; 5 örnek +70 sent → şüpheli değil.
- [ ] **Step 2: Failing testleri yaz** (`evening-plan.test.ts`):
  - İlk ses geçilmemişse plan `[ilk-ses ×3]` olur.
  - Kalibre değilse plan `kalibrasyon` adımını içerir.
  - Nevâ geçilmiş ve `nota-1` açıkken Çârgâh `acik` olur.
  - `nota-2` kilitliyken Dügâh `kilitli` kalır.
  - Doğrulanmamış şemalı perde `kilitli` kalır.
- [ ] **Step 3: Failing testi yaz** (`EveningPractice.test.tsx`): `startPitchStream` mock'u tolerans içinde 4,5 saniyelik örnek akıtır. Ekranda "Geçtin" görünür ve `listLongTones('neva')` `passed: true` bir kayıt içerir.
- [ ] **Step 4:** FAIL → **Step 5:** yaz → **Step 6:** PASS.
- [ ] **Step 7: Telefonda kontrol (kullanıcıyla).** Önce yayınla, sonra kullanıcıdan şunları denemesini iste:
  - (a) Mikrofon izni isteniyor.
  - (b) Nevâ ile kalibrasyon yapılıyor; sonuç ahengi ve sapmayı gösteriyor.
  - (c) İbre pes/tiz yönünü doğru gösteriyor.
  - (d) Uzun ses 4 saniyede geçiliyor.
  - (e) Gerçek neyde şema uyarısı yanlışlıkla çıkmıyor.

  Ölçülen frekansları kaydet. Sorun çıkarsa systematic-debugging ile çöz.
- [ ] **Step 8:** Commit: `feat(ney): akşam pratiği, uzun ses, akort göstergesi — Aşama 1b teslim`

---

## Aşama 1c: Uyarlanır zorluk ve tekrar

### Task 16: Leitner tekrarı ve geri dönüş

**Files:**
- Create: `src/learning/leitner.ts`
- Modify: `src/learning/mastery.ts` (`needsReview` ekle), `src/learning/day-plan.ts` (`dueCards`/`reviewTopic` kuralı), `src/learning/day-session.ts` (cevapta `review` + `putCard`; oturum başında due kartları ve review konusunu hesapla)
- Test: `src/learning/leitner.test.ts`, `src/learning/day-plan.test.ts`, `src/learning/mastery.test.ts`

**Interfaces:**
- Consumes: `CardRec`, `getCard`, `putCard`, `listCards` (Task 3), `DayPlanInput` (Task 7).
- Produces:
  ```ts
  export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14];   // kutu 1..5
  export function review(card: CardRec | undefined, cardId: string, correct: boolean, now: Date): CardRec;
  // doğru → box+1 (en fazla 5); yanlış → 1; lastReviewedAt = now
  export function isDue(card: CardRec, today: string): boolean;   // lastReviewedAt günü + aralık <= today
  export function needsReview(attempts: AttemptRec[]): boolean;     // ≥6 deneme ve son 10'da doğru < 5
  ```

`buildDayQuestions` için 1c kuralı:
1. `dueCards` en fazla `floor(count/2)` soruyu doldurur.
2. `reviewTopic` varsa ondan 3 soru eklenir.
3. Kalan sorular güncel konudan gelir.

Review konusu, güncel konudan bir önceki konudur. `needsReview` doğru olduğunda gündüz ekranının başında yumuşak bir not çıkar: "Biraz önceki konuyu tekrar edelim, sonra devam ederiz." Bu not başarısızlık dili kullanmaz.

- [ ] **Step 1: Failing testleri yaz:**
  - `review(undefined,'note:D5',true,now).box === 2`; kutu 5'te doğru cevap 5'te kalır; yanlış cevap 1'e düşürür.
  - Kutu 3, `lastReviewedAt` 2026-10-10 → `isDue(…,'2026-10-12')` false, `'2026-10-13'` true.
  - `needsReview`: 8 denemede 3 doğru → true; 4 denemede 0 doğru → false.
  - Day plan: `count 12` ve 10 due kart varken due kartlardan en fazla 6 soru gelir; `reviewTopic` verilince ondan tam 3 soru gelir.
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** PASS (Task 7 ve 8 testleri de geçmeli: `npx vitest run`).
- [ ] **Step 5:** Commit: `feat(learning): Leitner tekrarı ve önceki konuya yumuşak dönüş`

### Task 17: Başlangıç yoklaması, oturum sonu geri bildirimi, ney seviye ilerlemesi

**Files:**
- Create: `src/learning/placement.ts`, `src/learning/feedback.ts`, `src/screens/Placement.tsx`
- Modify: `src/screens/SessionEnd.tsx`, `src/screens/Onboarding.tsx` (bitişte `/yoklama`), `src/screens/EveningPractice.tsx` (`neyLevelConfig(passCount)`)
- Test: `src/learning/placement.test.ts`, `src/learning/feedback.test.ts`, `src/screens/SessionEnd.test.tsx`

**Interfaces:**
- Consumes: `makeQuestion` (Task 6), `setPlacedOut`, `saveSettings`, `saveSession`, `addLongTone` (Task 3), `neyLevelConfig`, `ILK_SES_CONFIG` (Task 15).
- Produces:
  ```ts
  export function buildPlacement(rng: () => number): Question[];   // nota-1 kartlarından 5, sure-1 kartlarından 3 soru
  export function placementResult(answers: { topicId: string; correct: boolean }[]): string[];
  // tüm soruları doğru cevaplanan konuların id'leri
  export type Feedback = 'kolay'|'tam'|'zor';
  export function adjustCount(current: number, fb: Feedback): number;   // kolay +3, tam 0, zor −3; [6, 20] aralığında sınırlanır
  ```

Yoklama ekranı (`/yoklama`) üç adımdan oluşur:
1. "Önce ne hatırladığınıza bakalım" yazısı ve 8 soru. İpucu ve dinle düğmesi yoktur. Doğru/yanlış gösterilmez, sadece sonraki soruya geçilir.
2. "Neyiniz yanınızda mı?" sorusu ve iki seçenek:
   - "Evet": `ILK_SES_CONFIG` ile tek bir ilk ses denemesi yapılır. Geçerse `addLongTone({perdeId:'ilk-ses', passed:true,…})` yazılır.
   - "Şimdi değil": bu adım atlanır.
3. Sonuçlar için `setPlacedOut` çağrılır, `placementDone: true` kaydedilir. Ekranda "Hazırız" mesajı ve hangi konudan başlanacağı gösterilir, ardından `/` rotasına gidilir.

Oturum sonu ekranında "Bugün nasıldı?" sorusu ve **Kolay / Tam kararında / Zor** seçenekleri bulunur. Seçim oturumun `feedback` alanına yazılır ve `dailyQuestionCount = adjustCount(...)` olarak güncellenir. Akşam oturumunda bu seçim sadece kaydedilir, soru sayısını değiştirmez.

Akşam pratiğinde her perdenin yapılandırması `neyLevelConfig(o perdenin passed kayıt sayısı)` ile belirlenir. Böylece tolerans her geçişte daralır, gereken süre uzar.

- [ ] **Step 1: Failing testleri yaz:**
  - `buildPlacement` 8 soru döner; 5'i `nota-1`, 3'ü `sure-1` konusundandır.
  - `placementResult`: `nota-1`'in 5 cevabı doğru ve `sure-1`'in biri yanlışsa sonuç `['nota-1']` olur.
  - `adjustCount(12,'kolay') === 15`, `adjustCount(19,'kolay') === 20`, `adjustCount(7,'zor') === 6`, `adjustCount(12,'tam') === 12`.
  - SessionEnd: gündüz oturumunda "Zor" seçilince `getSettings().dailyQuestionCount === 9` olur (12'den başlayarak).
- [ ] **Step 2:** FAIL → **Step 3:** yaz → **Step 4:** `npx vitest run` → tüm testler PASS.
- [ ] **Step 5: Uçtan uca elle kontrol.** Tarayıcı panelinde, temiz profille şu akışı dene: başlangıç → yoklama → gündüz turu → oturum sonu "Kolay" → ertesi gün (saat değişikliği simülasyonu ile) 15 soru geliyor.
- [ ] **Step 6:** Yayınla. Kullanıcıya şu kontrolleri ilet: (a) yoklama, (b) Kolay/Zor seçimi ertesi günkü soru sayısını değiştiriyor, (c) akşam toleransı geçtikçe daralıyor.
- [ ] **Step 7:** Commit: `feat: başlangıç yoklaması, geri bildirim, ney seviye ilerlemesi — Sürüm 1 tamam`
