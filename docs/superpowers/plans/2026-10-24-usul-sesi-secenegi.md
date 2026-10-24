# Notası — Usul Sesi Seçeneği Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ney sesi seçeneğinin benzeri bir "Usul sesi" seçeneği eklemek. Seçenekler: Oryantal (mevcut sentez), Konga, Tahta ve Darbuka. Kullanıcı bu dört seçeneği 2026-10-24'te sohbette onayladı.

**Architecture:** Usul desen üretimi (`src/audio/usul.ts`) ses seçimine göre katman üretir. Kayıt tabanlı sesler, shakuhachi'de olduğu gibi yerel ve önbelleğe alınmış dosyalardan bir kez çözülür ve Strudel/superdough'a kaydedilir. Uygulama çalışırken ağ isteği yapılmaz.

**Spec / kaynak:** Kayıt kaynakları, lisanslar, dosya adresleri ve vuruş eşlemesi için `docs/superpowers/notes/2026-10-24-usul-sesleri-arastirma.md` dosyası **bağlayıcıdır**.

## Global Constraints

- Önceki planların kısıtları geçerlidir:
  - Çevrimdışı çalışma
  - iOS'ta ses ancak dokunuşla başlar
  - Aynı anda tek ses çalar
  - Sayfadan çıkınca ses durur
  - Vuruşlar birbirine taşmaz (`envelope(d)` payı)
  - Vurgulu şema
- **Seçenekler** (Ayarlar → "Usul sesi"): Oryantal, Konga, Tahta, Darbuka. Varsayılan Oryantal. Ayar `Settings.usulSesi` alanında tutulur ve değerleri `'oryantal' | 'konga' | 'tahta' | 'darbuka'` olur. Eski kayıtlar ve geçersiz değerler `'oryantal'` sayılır.
- **Kayıtlar ve lisanslar** (araştırma notundan birebir):
  - **Konga:** FluidR3 GM (WebAudioFont dönüşümü, MIT). Düm = GM 64 (Low Conga), tek = GM 63 (Open Hi Conga), te/ke = GM 62 (Mute Hi Conga).
  - **Tahta:** Aynı kaynak (MIT). Düm = GM 77 (Low Wood Block), tek/te/ke = GM 76 (Hi Wood Block).
  - **Darbuka:** VCSL, CC0. Düm = Darbuka_1, tek = Darbuka_2, te/ke = Darbuka_3. Araştırmanın önerdiği katmanlar kullanılır. Ses seviyeleri normalleştirilir.
  - Dosyalar mono, kısa ve küçük mp3 olarak `public/sounds/usul/` altına konur ve PWA önbelleğine eklenir.
  - Lisans metinleri `public/sounds/usul/LISANS.txt` dosyasında durur. Hakkında ekranında kaynak satırları gösterilir: Konga/Tahta için FluidR3 + WebAudioFont (MIT), Darbuka için VCSL (CC0).
- Kayıt tabanlı seslerde vuruş, kaydın doğal uzunluğu kadar tınlar. Kayıt bir sonraki vuruştan uzunsa, mevcut `envelope(d)` kuralıyla kesilir. Kısa bir kaydı uzatmak için döngü yapılmaz. Oryantal seçenek süreyi yansıtan sentezle aynen kalır.
- te ve ke vuruşları, tek kaydının sırasıyla 0.7× ve 0.6× seviyesinde çalınır.
- Seçilen usul sesi hem Usul bölümünde hem parça çalarken usul eşliğinde kullanılır. Dolap metronomu her seçenekte sentez tık olarak kalır. Bu bir kontrolcü kararıdır: metronom, usul vuruşu değildir.

---

### Task 31: Usul sesi seçeneği

**Files:** `scripts/usul-sesleri.mjs` (tek seferlik dönüştürme betiği; GM JS içindeki base64 mp3 ile VCSL WAV dosyalarını kısaltılmış mono mp3'e çevirir, ffmpeg kullanır), `public/sounds/usul/*.mp3` + `LISANS.txt`, `src/audio/usulSamples.ts` (yükleme ve kayıt), `src/audio/usul.ts`, `src/audio/piece.ts`, `src/audio/player.ts` (yükleme hazırlığı), `src/store/db.ts`, `src/screens/Settings.tsx`, `src/screens/About.tsx`, `vite.config.ts` (önbellek globu mp3'ü zaten kapsıyorsa değişmez), `src/main.tsx`. Testler ilgili dosyaların yanında.

**Interfaces:**
- `export type UsulSesi = 'oryantal' | 'konga' | 'tahta' | 'darbuka'`. `setUsulSesi(v)` ve `getUsulSesi()` modül düzeyinde tutulur. Ayar uygulama açılışında yüklenir ve yedekten geri yüklemede de uygulanır.
- `buildUsulPatternCode(u, bpm, ses = getUsulSesi())`:
  - `oryantal` seçiliyse bugünkü kod aynen üretilir.
  - Kayıt seçeneklerinde vuruşlara hizalı `s("<ses_dum>@2 ~@1 …")` desenleri üretilir. Bu desenlerde seviye (gain) deseni ile `envelope(d)` sınırları (`clip`/`release`) kullanılır.
- `buildPieceCode` usul katmanında seçilen sesi kullanır.
- Yükleme: kayıtlar yalnızca seçili ses kayıt tabanlıysa çalmadan önce (generation korumasıyla) bir kez çözülür ve kaydedilir. Hata olursa SOUND_WARNING gösterilir.
- Ayarlar: "Usul sesi" başlığı altında dört seçenek bulunur. Her birinin yanındaki "▶ Dene" düğmesi Sofyan usulünün bir ölçüsünü ♩ = 80'de o sesle çalar. iOS kuralı, soundOn, SOUND_WARNING ve sayfadan çıkınca durma kuralları ney sesi önizlemesindekiyle aynıdır.

- [ ] Failing testler:
  - Varsayılan ve eski kayıt `oryantal` olur.
  - Ayar kaydedilir ve uygulanır; yedekten geri yüklemede de uygulanır.
  - Her kayıt seçeneği için gerçek Strudel çekirdeğiyle sorgulama yapılır. Vuruş zamanları ve vuruş başına doğru ses adları üretilir (düm/tek/te/ke eşlemesi). te/ke seviyeleri tek'in 0.7×/0.6×'ı olur. Hiçbir vuruş sonrakine taşmaz (en yüksek tempolarda en az 5 ms pay).
  - Parça kodunda usul katmanı seçilen sesi kullanır.
  - Ses dosyaları önbellek listesinde bulunur ve çalışırken ağ isteği yapılmaz (yerel dosya yolu testi).
  - Hakkında ekranında kaynak satırları görünür.
  - Ayarlar'daki Dene, seçilen sesle Sofyan kodunu çalar.
- [ ] Dosyaları üret: betiği çalıştır, dosyaları dinlenebilir hale getir (seviye ve sessizlik kırpma), boyutları rapora yaz.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(usul): usul sesi seçeneği (Oryantal/Konga/Tahta/Darbuka)`
