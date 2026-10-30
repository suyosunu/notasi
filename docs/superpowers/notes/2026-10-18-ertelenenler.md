# Ertelenen küçük bulgular (Sürüm 1 + Nota Paketi A)

Görev incelemelerinde "şimdilik kalabilir" denen bulgular. Sürüm 2'ye başlamadan önce gözden geçirilecek. Kaynak: SDD kayıt defterleri (2026-10-18).

## Sürüm 1
- Task 1: minor (deferred): routes[route] lookup hits Object.prototype (#toString) — use Object.hasOwn/Map (src/app.tsx:77)
- Task 1: minor (deferred): trailing slash/query on hash route not normalized (src/router.ts)
- Task 1: minor (deferred): app.test covers one route only; redundant hashchange dispatch in router.test; no engines field
- Task 2: minor (deferred): soundingHz only asserted for 3 ahenks; no fractional tuningCents / unknown-ahenk test; AHENKLER.find per call
- Task 3: minor (deferred): listAttempts tie order for same-ms attempts (db.ts byAt) — Ruling: Task 8 dispatch makes nowIso() monotonic (Math.max(Date.now(), lastMs+1)) since day-session tests add attempts in tight loops — cost if wrong: flaky tests
- Task 3: minor (deferred): replaceAllStores put loop outside try → sync put throw skips abort (db.ts:850); rollback path untested; misleading "cannot be written" test
- Task 3: minor (deferred): backup validation shallow (settings id must be 'settings'); saveSettings copies undefined; URL.createObjectURL global not restored in backup.test
- Task 4: minor (deferred): AccidentalGlyph lacks fill=currentColor; koma count y-8 may overlap line; maxWidth 2x cap; clef/rest glyph vertical placement unverified visually (check at T11 preview + iPhone)
- Task 5: minor (deferred): completion promise may resolve ~0.1–0.2s before audio ends (note for T8); Strudel initAudio worklets only on mousedown (informational)
- Task 5: minor (deferred): pattern.test imports @strudel/core|mini|transpiler not in devDependencies (hoisting); tap before preload finishes → resume after await (iOS risk); lazy chunk + audible tail unchecked on device (T11 check)
- Task 6: minor (deferred): no answer-slot spread test; redundant STEPS.includes; single-digit octave regex; G5 hint per ruling; cardToEvent accepts non-curriculum ids
- Task 7: minor (deferred): no input validation (at format, empty cards → i%0); duplicate value/type imports in day-plan.ts; placed-out topic after a non-mastered one stays kilitli (sequential unlock)
- Task 8: minor (deferred): no double-click/resume/cap-while-answering component tests; answerQuestion not atomic (attempt before session save); enqueue swallows all errors (DB failure silent); no mutex in loadOrStartDaySession; screen open past midnight keeps old session; overlapping Dinle; fixed 1000ms tick
- Task 9: minor (deferred): onboarding redirect pushes history (back-button trap) — use location.replace; FreePractice needs key={topicId}; akşam card div lacks role; SessionEnd may show an abandoned (completed:false) session; streak counts aksam sessions (as briefed)
- Task 9: minor (deferred): dismissed-sheet test uses fixed 50ms sleep
- Task 10: minor (deferred): non-BackupError import failures show "geçerli … değil"; changeAhenk/changeSound unhandled rejections; Onboarding finish save failure silent; "Yeniden kalibre edin" shows on first run (calibrated default false); no success message after backup save; fixed setTimeout(30) negative waits in Settings tests
- Task 11: minor (deferred): icons not maskable; deploy script skips tsc; icon.svg duplicated in includeAssets+glob
- Task 12: minor (deferred): ILK_SES_REHBER comment overstates MEB sourcing; local `describe` fn name in Fingering.tsx; FingeringDiagram doc comment "pass only visibleFingering output"; hole-number contrast 0.6 opacity; right-hand-on-top assumption
- Task 12: minor (deferred): DELIK_YERLESIMI_KAYNAK exported, unused
- Task 13: minor (deferred): no track 'ended'/AudioContext interruption handling; NotReadableError etc. show 'desteklenmiyor'; package-lock peer churn (terser/workerd); no real-pitchy sine-wave test
- Task 14: minor (deferred): no "Vazgeç" while listening (backgrounded rAF stalls); window starts at first sample not first voiced; duplicate "Tekrar dene" when mic start fails after a result; stopRef assigned during render
- Task 15: minor (deferred): DB rejections leave trainer stuck (addLongTone/listLongTones) & unhandled addFingeringFlag; MicGate "Tekrar dene" can open mic in 'bitti' phase + duplicate button; reload after record before Devam repeats a try; empty plan → instant completed session; no ilk-ses glide UI test; LongToneTrainer imports SOUND_WARNING from screens/DayPractice; Home double DB reads
- Task 16: minor (deferred): per-card NOTA_TOPICS.find at session start; due/current duplicates possible; REVIEW_NOTE re-declared in test; DayState.reviewNote required type but old sessions lack it; note shown on every question; addAttempt+putCard not atomic
- Bugfix minor (deferred): sync ctx.resume() throw outside try; double space when message empty; fixed details skip template; no ctx.close() test
- Task 17: minor (deferred): SessionEnd save failure silent; getSettings+saveSettings not atomic; Placement re-entry when placementDone; finish() failure path untested; "Tüm konuları biliyorsunuz." fallback untested; implementer's worktree cleanup emptied node_modules (restored via npm ci)
- - Ruling: final-review minors parked (can stay): session-module extraction, updatedAt fields, calibration keep-selected-ahenk, non-atomic answer writes, MicGate retry in 'bitti' phase, track-ended handling — none blocks the learner; revisit before Sürüm 2 / sync.
- Final fix wave re-review (opus): all 9 ADDRESSED, no new Critical/Important. Residual minors parked: NeySection history test depends on wall clock > 2026-10-13; Calibration result states lack "Şimdi değil" (← Geri present); neyLevel tie order on equal `at`.

## Nota Paketi A
- Task 18: minor (deferred): CSS-by-regex test brittle; SEQ_MAX/%7 assumes STEP_LIST starts at C (comment)
- Task 19: minor (deferred): reverseOptions top-up branch unreachable/untested (could add plain La next to tiz La if ever used); cardToEvents startsWith('perde') loose but guarded; Placement renders Staff unconditionally (fixed topics, unreachable)
- Task 20: minor (deferred): "10 due → at most 6" test weaker than name; due cards excluded from weighted draw (no extra weight); disabled card div lacks role; no .catch on loadQuestions; import order; test name wording

## Sürüm 2
- Task 21: minor (deferred): ledger line passes under accidental; accNeed added for notes without accidentals; ACCIDENTAL_NAMES no separate RED
- Task 21: minor (deferred): very small baseSlot (<13px) can still crowd unmarked heads; layoutEvents exported unused
- Task 23: minor (deferred): no .catch on getSettings (Dinle stays disabled on DB error); makam-dizi hint is near answer key; distractor names overlapping makam names
- Task 24: minor (deferred): slider keyboard steps restart loop each step (debounce); re-tapping selected usul restarts; no playTones-after-playLoop hush test; setState after unmount on rejected start (harmless); sound constants untuned by ear
- Task 25: minor (deferred): no >5-perde cap test in evening plan; NeySection solfej label ambiguous for Si-family; kademe field unused in UI
- Task 26: minor (deferred): converter .ts imports fragile (Node ≥22.18, no engines); literal BOM char in regex; tie split ignores beat position (cosmetic); first row Offset unchecked; toToneEvents merges ties → tone≠event count (matters for highlighting, T27/Sürüm 3); commit title says three pieces but has two
- Task 27: minor (deferred): usulBpm dead export; ScoreView fitWidth recomputed on every slider input (memo); kabelsalat mock coupling; .score #fff hard-coded; fast()/compress() assume integer measure count
- - Ruling: final-review minor "makam questions too easy (güçlü always Nevâ)" parked to Sürüm 3.
- Sürüm 2 fix wave re-review: all 7 ADDRESSED. Residual minors: error-path wake-lock asserts lack counts; OS-released sentinel not re-acquired on page show.

## Ses ve gösterim iyileştirmeleri (2026-10-24)
- Ruling: default ney sesi = 'mevcut' until the user picks by ear — avoids surprising change — cost if wrong: user must open Settings once.
- Ruling: shakuhachi = one local MIT-licensed mp3 (FluidR3 via WebAudioFont), precached; global "no sample files" constraint narrowed to usul sounds — user asked for a closer ney sound — cost if wrong: 21 KB asset.
- Task 28: minor (deferred): voice loudness not level-matched (PEAK_GAIN 0.3); loop seam/vibrato in sample untested; single zone timbre shift at low notes; db.ts imports audio/pattern for NeySesi type; play before settings load uses mevcut
- Task 29: minor (deferred): beam may reach lyric zone in extreme synthetic groups; beams don't take highlight colour; pickup measures aligned to measure start; Aksak 9/8 grouping later
- Task 29: minor (deferred): band-top 91 and clamp 88 separate constants; brief "group never crosses a beat" now has a 12/8 exception
- Ruling: also fold Minor #2 (end level/chop: DUM_SUSTAIN ~0.08, tek tone short regardless of stroke length) and #3 (release clamp so the piece path keeps margin at max tempo) into fix round 1 — same constants, user-facing sound quality — cost if wrong: minor timbre change.
- Task 30: minor (deferred): highlight uses performance.now not audio clock (drift on long plays / suspended ctx); test type casts
- Ruling: apply the suggestion as fix round 2 — user's main complaint is audibility on iPhone; cheap constant change: DUM_MID_HZ 250 triangle, DUM_LOW_GAIN lowered (0.4), keep total peak ≤ ~1.2 — cost if wrong: slightly brighter düm.
- Ruling: usul/melody balance in piece playback decided after the user's listening feedback — cost if wrong: one gain constant later.

## Usul sesi seçeneği (2026-10-24)
- Ruling: Dolap metronome stays synthesized for every usul voice (a metronome is not an usul stroke) — cost if wrong: minor.
- Ruling: Darbuka stroke mapping from spectrum analysis (research) — user auditions by ear — cost if wrong: remap 3 files.
- Ruling: fold in Minor #1 (tek/te/ke ~9–11 dB under düm in darbuka/konga → set per-stroke gain so tek RMS sits ~4–6 dB under düm) and the Temple Blocks attribution line in LISANS.txt — user-audible, cheap — cost if wrong: retune by ear.
- Task 31: minor (deferred): trigger stop() no-op (cut groups unused); circular mapping test; -60 dB tail trim shortens darbuka tek

## Aşama A (2026-10-25)
- Ruling: iki-<a>-<b> etüt perdeler = [a, b]; tek-<p> = [p] — cost if wrong: etüt appears one step earlier/later.
- Ruling: day-session lesson gate wraps the whole DaySession (timer doesn't run during the lesson); review questions from learned topics need no lesson — cost if wrong: none / one optional lesson.
- Ruling: s0:uzun-ses → /ney/neva → perde:neva lessons can come back to back (each unit taught once) — cost if wrong: one extra screen.
- Ruling: neyLevelConfig tolerance k0 25, k1–3 20, k≥4 15 sent; required 5000+1000k ≤ 10000 ms, so the "8 sn ±20" seviye 1 goal is reachable at ±20 — cost if wrong: trainer a bit more lenient at levels 2–3.
- Ruling: Nevâ uzun-ses step gates s0:uzun-ses then perde:neva; gate lessons have an "Ana ekrana dön" exit that doesn't mark read.
- Ruling: evening warm-up = passed perde just before the current one (migrated users don't warm up on half-hole Bûselik).
- Ruling: parazvane drawn at both ends; boğumlar drawn without a count (count not in research note).
- Task 32: minor (deferred): no tests for varsayilanSesSurumu 1 / 3 (no-downgrade) branches; some usul/piece tests rely on the new default implicitly
- Task 33: minor (deferred): cryptic source comment in ney-perdeler.ts; duplicate "ilk beş" test; no test for an old user with Segâh passed late and Bûselik not
- Task 34: minor (deferred): boğum spacing not exactly even; Öğren list blank briefly while loading
- Task 36: minor (deferred): nota-2 mentions Dügâh/Rast ahead of perde-1; no UI test for a review-only day session; seq strings duplicated (guarded by a coverage test)
- Task 37: minor (deferred): no calibration→lesson path test; no render test of dotted/rest lesson figures with beams
- Task 39: minor (deferred): EtutDetail play logic duplicates ParcaDetail (shared hook later); bpm label vs audible tempo while dragging; test-input formatting noise; `.tools` flex-wrap is global; faded etüt rows use opacity .6 (contrast)
- Task 40: minor (deferred): Home's loadIlerleme re-reads rows load() already has; Yolum checkbox rollback is silent on write failure; weak regexes in dersler.test; Home test lacks the goal-less fallback
- Process note: several UI test files were written after their components (no RED run); behaviour is still asserted.
- Final fix wave: minor (deferred): stale comments DersView.tsx:25 (geri only in route mode) and evening-plan.ts:726 (order wording)

## Aşama B (2026-10-29)
- Düzeltme (kullanıcı geri bildirimi): `bag` artık çalımda duyulur. Bağlanan ses `ToneEvent.legato`; `melodyChain` seslerle hizalı zarf desenleri ekler (önceki ses `BAG_GECIS_S` = 0.03 s'de söner, bağlı ses vurgusuz girer; shakuhachi `begin: 1` ile kaydın baştaki üfleme geçişini atlar). Bağ içermeyen çalımların kodu birebir aynı. Ses kulakla iPhone'da doğrulanacak.
- Ekleme (kullanıcı isteği): Ayarlar → "Dil belirginliği" (%0–100, varsayılan %50, adım 10). Bağsız ses → bağsız ses geçişinde önceki ses `k × TU_BOSLUK_S` (0.12 s) erken susar (clip, en az 0.5), sönüşü ve sonraki sesin girişi kısalır. %0 eski çalımdır. Bağlı geçişler ve susla ayrılan sesler etkilenmez. Varsayılanın %50 olması bütün melodi çalımlarını değiştirir (kullanıcı "tu belirgin olsun" dedi).
- Ruling: T46 adds no `'usul-vurus'` GorselAdi; the `{ tur: 'usul' }` DersBlok is the only new rendering — Interfaces block is the more specific text — cost if wrong: one unused type value.
- Ruling: T43 if the app has no sixteenth rest glyph, implementer adds one in glyphs/RestShape (part of the task) — card list is plan-fixed — cost: small glyph work.
- Ruling: T42 EPS constant not added — beams.ts uses integer 1/48 units, equivalent and exact — cost if wrong: none observed.
- Task 43: minor (deferred): rest:eighth.uclu / dur:sixteenth.dotted accepted generically
- Task 43: minor (deferred): pre-existing — early duration topics fill distractors from all duration names (implementer concern)
- Task 43: minor (deferred): questions.ts long ternary line; unreachable third distractor tier
- Task 44: minor (deferred, user-facing — fix in final wave): okuma:olcu text describes double end line + time signature that the app's porte doesn't draw (nota-2.ts:539,543)
- Task 44: minor (deferred): nefes "notayı kısaltarak" general knowledge; ta/tu syllable inconsistency (nota-2.ts:577,590); duplicate SI const; types.ts id comment lacks okuma:; weak meter test
- Task 45: minor (deferred): weak "iki elinin orta parmağı" regex guard; duplicated Yücel sentence; "Hicaz'dan 1 koma pes" premature term; kademe vs devre wording
- Task 46: minor (deferred): no-hand regex \bsağ\b never matches (ğ); te/ke test vacuous; "tek'in hafif bölünüşü" vs full zaman wording; giriş "Şemadaki ▶ Dinle" ambiguous
- Ruling: T47 taps up to 150 ms before first beat count as early hit (only t < -150 dropped) — matches tolerance symmetry, fairer to beginner — cost: a count-in tap could rarely be credited
- Ruling: T47 plan-mandated greedy time-order matching (early stray tap can claim a beat) kept — fazla doesn't affect gecti, but a wrong early tap costs the beat; acceptable for a beginner trainer — cost if wrong: occasional unfair miss; revisit if user reports.
- Ruling: T48 evening plan offers Seviye 2 etüts only after all Seviye 1 etüts are played — keeps level order, Ney section stays unlocked (karar b) — cost if wrong: Seviye 2 etüts appear later in the evening plan.
- Ruling: T48 usul etüt count-in stays metronome; usul sound runs with the melody — consistent with T47 — cost: none.
- Task 48: minor (deferred): slice(0,11) index-based test; 375pt width of 3 measures/row for 2/4,3/4 to verify in browser in final check
- Task 50: minor (deferred): spy not restored in seviye.test.ts; s2-usul-etut/s2-dortlu could route to first etüt
- Final review fix wave (cfa95af) fixed: usul etüt gate (okuma:olcu + usul:giris), okuma:olcu wording, beamed triplet quiz, usul lesson → vurma route, Nim Hicaz spelling, dörtlü sign names, dil lesson source, mean deviation shown, sure-4 names out of early distractors.
- Still open (from final review): perde-2 distractor pool of 15 names — revisit in Aşama C; T47 e.timeStamp / shared latency constant; Placement beam has no dedicated test.

## Adım 2 — satır satır çalışma (2026-10-30)
- Ruling: tek kod üreticisi `calisma.ts`; parça da artık bir ölçü giriş sayımıyla çalar. Kısa ilk ölçüyle (anacrusis) başlayan seçimde giriş `2·ölçü − lead` vuruş sürer, tıklar ölçü ızgarasında kalır — cost if wrong: sayım biraz uzun gelir.
- Ruling: döngü JS'te sıralı `playCode` çağrılarıdır, her tur kendi giriş sayımıyla başlar (nefes payı) — cost if wrong: turlar arası ~0.3 sn boşluk; ileride yalnız ilk turda / tempo değişince sayım seçeneği.
- Ruling: vurgu ses saatinden (sessiz işaret sesi + `currentTime − outputLatency`); AirPods gibi gecikmesi bildirilmeyen çıkışta vurgu önde gidebilir — iPhone'da denenecek, gerekirse kullanıcı gecikme payı.
- Açık (minor): yalnız kısa SON ölçü seçilirse anacrusis gibi çalınır (melodi vuruş başında başlamaz, usul yok). Bugünkü içerikte kısa ölçü yok; anacrusisli içerik eklenirken (Adım 4) `lead` yalnız gerçek ilk ölçü (bas = 0) için hesaplanmalı.
- Açık (minor): kendi kaydırmamızdan sonraki 1 sn içinde dokunmasız kullanıcı kaydırması (klavye, kaydırma çubuğu) algılanmaz; telefonda etkisi küçük.
- Açık (minor): etüt ekranı ayarları iki kez okur (EtutCalisma + panel); çalarken kaydırıcı sürüklenirken "Tur" satırı henüz çalınmayan hızı gösterir; uzun parçada "Tümü" çalımında satır takibi yalnız otomatik kaydırmaya dayanır.

## Adım 3 — mikrofonla takip, deneme (2026-10-30)
- Ruling: takip yalnız etütte, tek tur, melodi kapalı (eşlik usul ya da yalnız giriş sayımı) — cost if wrong: parçaya açmak tek prop.
- Ruling: oktav hatası (±1200 sent, 100 sent içinde) doğru sayılır — cost if wrong: gerçekten yanlış oktavda çalınan nota doğru görünür.
- Ruling: tolerans 25 sent; ama ortanca en yakın başka bir ney perdesine düşüyor ve |sapma| ≥ 15 sent ise "X yerine Y" (bir koma farkları: Bûselik/Segâh, Kürdî/Dik Kürdî). 4–5 koma aralıklı komşularda (Çârgâh/Nim Hicaz vb.) ±45–57 sentten sonra da "yerine" yazar — cost if wrong: yalnız ifade.
- Ruling: takip sırasında ses oturumu `play-and-record`, bitince `playback` — iPhone'da eşlik sesi kısılabilir ya da ahizeye gidebilir; deneme gösterecek.
- Ruling: tur bitince mikrofon 500 ms daha açık kalır (gecikme penceresi), sonra değerlendirilir.
- Açık (minor): değerlendirilmeyen (çok kısa) ve bağın devam notaları notada işaretsiz kalır; SVG `role="img"` içindeki `<title>` ekran okuyucuya ulaşmaz (özet `role="status"` erişilebilir kanal); 48000 Hz sabit örnekleme varsayımı; >70 sent dalı `calinan`'ı katlanmamış ortancadan adlandırır; kuyruk sırasında sayfadan çıkış testi yok; takipEt/calis kurulum tekrarı.
