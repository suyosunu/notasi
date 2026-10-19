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
