/* Worship Piano Lab — UI wiring
 * Tabs, key/progression selectors, playback bar. Reads chord-data.js for
 * content and drives piano-engine.js for audio + keyboard rendering.
 */
(function () {
  const D = window.WPL_DATA;
  const E = window.WPL_ENGINE;

  // ---------- Config (demo vs full) ----------
  const params = new URLSearchParams(window.location.search);
  const DEMO_MODE = params.get("mode") === "demo";

  // Demo visitors get the whole tool unlocked for a trial window so they
  // actually get used to it, rather than hitting the 11-key lock wall on
  // their very first visit. First-visit timestamp is stored in the
  // browser (no backend on this static site, so no real per-person IP
  // tracking is possible) — after TRIAL_DAYS from that first visit, the
  // 11 non-C keys lock like before. Clearing browser data or switching
  // devices resets the timer; that's an accepted, minor leak for a demo
  // funnel, not a real problem.
  const TRIAL_DAYS = 7;
  const TRIAL_STORAGE_KEY = "wpl_demo_first_visit";
  let TRIAL_EXPIRED = false;
  if (DEMO_MODE) {
    try {
      let firstVisit = localStorage.getItem(TRIAL_STORAGE_KEY);
      if (!firstVisit) {
        firstVisit = String(Date.now());
        localStorage.setItem(TRIAL_STORAGE_KEY, firstVisit);
      }
      const elapsedDays = (Date.now() - parseInt(firstVisit, 10)) / (1000 * 60 * 60 * 24);
      TRIAL_EXPIRED = elapsedDays >= TRIAL_DAYS;
    } catch (e) {
      // localStorage unavailable (private browsing, storage blocked, etc.)
      // — fail open (unlocked) rather than breaking the demo entirely.
      TRIAL_EXPIRED = false;
    }
  }

  // Live-ticking dd:hh:mm:ss badge, overlaid on the card (position:absolute
  // in styles.css) so it never affects the shell's height/layout — Chris:
  // "the countdown timer need to be overlayed somewhere else that doesn't
  // effect the size". Once the trial has expired the badge just hides;
  // it does not re-lock keys mid-session on its own (TRIAL_EXPIRED is
  // computed once at page load) — a refresh after expiry is what actually
  // re-locks the 11 keys, same as before.
  let trialCountdownTimer = null;
  function startTrialCountdown() {
    if (!DEMO_MODE || TRIAL_EXPIRED) return; // once locked, the lock overlay explains it, no badge needed
    let firstVisit;
    try { firstVisit = localStorage.getItem(TRIAL_STORAGE_KEY); } catch (e) { return; }
    if (!firstVisit) return;
    const trialEndMs = parseInt(firstVisit, 10) + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const el = document.getElementById("wpl-trial-note");
    if (!el) return;
    el.style.display = "block";
    // Reserve room in the centered header so the eyebrow/title text never
    // runs under this corner badge on narrow screens (see styles.css).
    document.getElementById("wpl-wrapper").classList.add("wpl-has-trial-badge");

    function tick() {
      const remainingMs = trialEndMs - Date.now();
      if (remainingMs <= 0) {
        el.style.display = "none";
        clearInterval(trialCountdownTimer);
        return;
      }
      const totalSec = Math.floor(remainingMs / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const pad = n => String(n).padStart(2, "0");
      el.innerHTML =
        '<span class="wpl-trial-label">Free demo ends in</span>' +
        '<span class="wpl-trial-clock">' + d + 'd ' + pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's</span>';
    }
    tick();
    trialCountdownTimer = setInterval(tick, 1000);
  }

  // ---------- State ----------
  let curKeyPc = 0;
  let useFlats = false;
  let curProg = 0;
  let curStep = 0;
  let bpm = 80;
  let loopOn = false;
  let clickOn = false;
  let playingDisplayedProg = null; // which progression the step row currently shows while playing
  let activeTabId = "chords"; // Chords is now the first tab, and the default shown on load
  let curQuality = 0;
  let curPosition = 0;
  let chordsBpm = 80;
  let chordsLoopOn = false;
  let chordsClickOn = false;
  let activePracticeSub = "scales";
  let scaleOctaves = 1;
  let scaleDirection = "up";
  let scaleHands = "right";
  let scaleStepIndex = 0;
  let scalesBpm = 100;
  let scalesLoopOn = false;
  let scalesClickOn = false;

  // ---------- Tabs ----------
  const TABS = [
    { id: "chords", label: "Chords", soon: false },
    { id: "progressions", label: "Progressions", soon: false },
    { id: "practice", label: "Practice", soon: false }
  ];

  function buildTabBar() {
    const bar = document.getElementById("wpl-tabbar");
    bar.innerHTML = "";
    TABS.forEach((tab, i) => {
      const btn = document.createElement("button");
      // Active state tracks activeTabId (default "progressions"), not
      // array position — TABS is now ordered Chords-first for display,
      // but Progressions should still be the tab shown on first load.
      btn.className = "wpl-tab" + (tab.id === activeTabId ? " active" : "");
      btn.innerHTML = tab.label + (tab.soon ? ' <span class="wpl-tab-soon">Soon</span>' : "");
      btn.addEventListener("click", () => {
        document.querySelectorAll(".wpl-tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        // Panels stack in the same CSS Grid cell (.wpl-panels in styles.css)
        // and are shown/hidden with the "active" class (visibility, not
        // display:none) so the container is always sized to the tallest
        // panel automatically — never toggle display/visibility here directly.
        document.querySelectorAll(".wpl-panel").forEach(p => { p.classList.remove("active"); });
        document.getElementById("wpl-panel-" + tab.id).classList.add("active");
        E.stopPlayThrough();
        resetPlayButton();
        resetChordsPlayButton();
        resetScalesPlayButton();
        activeTabId = tab.id;
        const headingLabel = document.getElementById("wpl-step-heading-label");
        if (tab.id === "chords") {
          headingLabel.textContent = "Position";
          renderChords();
        } else if (tab.id === "progressions") {
          headingLabel.textContent = "Number";
          render();
        } else if (tab.id === "practice" && activePracticeSub === "scales") {
          // "Soon" sub-tabs (Speed Drills, Progression Drills) have nothing
          // to show yet — leave the heading/keyboard exactly as they were,
          // same as switching into any other not-yet-built tab always has.
          headingLabel.textContent = "Degree";
          renderScale();
        }
        repositionStatus();
      });
      bar.appendChild(btn);
    });
  }

  // ---------- Key tabs ----------
  function buildKeyTabs() {
    const wrap = document.getElementById("wpl-key-tabs");
    wrap.innerHTML = "";
    D.keyList.forEach((k, i) => {
      if (i === 7) {
        const divider = document.createElement("div");
        divider.style.cssText = "width:3px; height:32px; background:var(--wpl-line); border-radius:2px; margin:0 3px;";
        wrap.appendChild(divider);
      }
      const btn = document.createElement("button");
      const locked = TRIAL_EXPIRED && k.pc !== 0;
      // key-tab-wide flags the 2-letter labels (Db/Eb/F#/Ab/Bb) so mobile
      // CSS can give them a touch less font-size than the 1-letter keys —
      // the boxes are always equal width (flex:1), but at small mobile
      // sizes 2 characters filling the same box as 1 reads as visibly
      // more cramped/"skinnier" even though the box itself isn't smaller.
      btn.className = "key-tab" + (k.label.length > 1 ? " key-tab-wide" : "") + (k.pc === 0 ? " active" : "") + (locked ? " locked" : "");
      btn.textContent = k.label;
      btn.dataset.pc = k.pc;
      btn.addEventListener("click", () => {
        if (locked) {
          showLockOverlay();
          return;
        }
        hideLockOverlay();
        curKeyPc = k.pc;
        useFlats = D.preferFlats.includes(curKeyPc);
        document.querySelectorAll(".key-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (E.isPlaying()) {
          // Don't cut the beat off or restart it — the running play-through
          // picks up the new key on its next scheduled step (see startPlayThrough).
          E.updatePlayback({ keyPc: curKeyPc, useFlats });
        } else if (activeTabId === "chords") {
          renderChords();
          E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality]][curPosition], curKeyPc, useFlats);
        } else if (activeTabId === "practice") {
          // "Soon" sub-tabs (Speed Drills, Progression Drills) have nothing
          // built yet to render/play — only react to key changes on Scales.
          if (activePracticeSub === "scales") {
            renderScale(0);
            E.playChordSound(currentScaleSteps()[0], curKeyPc, useFlats);
          }
        } else {
          buildStepButtons();
          render();
          E.playChordSound(D.allProgs[curProg][curStep], curKeyPc, useFlats);
        }
      });
      wrap.appendChild(btn);
    });
  }

  function showLockOverlay() {
    document.getElementById("wpl-instrument-display").classList.add("locked");
    document.getElementById("wpl-lock-overlay").classList.add("show");
    // Let this click finish bubbling before arming the outside-click
    // listener, otherwise the very click that opened the overlay would
    // immediately close it again.
    document.removeEventListener("click", dismissLockOverlayOnOutsideClick);
    setTimeout(() => {
      document.addEventListener("click", dismissLockOverlayOnOutsideClick);
    }, 0);
  }

  function hideLockOverlay() {
    document.getElementById("wpl-instrument-display").classList.remove("locked");
    document.getElementById("wpl-lock-overlay").classList.remove("show");
    document.removeEventListener("click", dismissLockOverlayOnOutsideClick);
  }

  function dismissLockOverlayOnOutsideClick(e) {
    // Key-tab clicks manage the overlay themselves (open it again for
    // another locked key, or close it for an unlocked one) — don't fight them.
    if (e.target.closest(".key-tab")) return;
    hideLockOverlay();
  }

  // ---------- Progression tabs ----------
  function buildProgTabs() {
    const wrap = document.getElementById("wpl-prog-tabs");
    wrap.innerHTML = "";
    D.progressionNames.forEach((name, i) => {
      const b = document.createElement("button");
      b.className = "prog-tab" + (i === 0 ? " active" : "");
      b.innerHTML = `<div class="num">${i + 1}</div><div class="name">${name}</div>`;
      b.addEventListener("click", () => {
        curProg = i;
        document.querySelectorAll(".prog-tab").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        if (E.isPlaying()) {
          // Don't cut the beat off or restart it — the running play-through
          // picks up the new progression on its next scheduled step (see
          // startPlayThrough), clamping the step position if it's now shorter.
          E.updatePlayback({ progArray: D.allProgs[curProg] });
        } else {
          if (curStep >= D.allProgs[curProg].length) curStep = 0;
          buildStepButtons();
          render();
          E.playChordSound(D.allProgs[curProg][curStep], curKeyPc, useFlats);
        }
      });
      wrap.appendChild(b);
    });
  }

  // ---------- Step buttons ----------
  function buildStepButtons() {
    const stepRow = document.getElementById("wpl-step-row");
    stepRow.innerHTML = "";
    const prog = D.allProgs[curProg];
    prog.forEach((ch, i) => {
      const tName = E.transposeChordName(ch.name, curKeyPc, useFlats);
      const btn = document.createElement("div");
      btn.className = "step-btn" + (i === curStep ? " active" : "");
      btn.innerHTML = `<div class="n">${tName}</div><div class="l">${ch.bottomLabel}</div>`;
      const activate = () => {
        E.stopPlayThrough();
        resetPlayButton();
        curStep = i;
        render();
        E.playChordSound(ch, curKeyPc, useFlats);
      };
      btn.addEventListener("click", activate);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      stepRow.appendChild(btn);
    });
  }

  // ---------- Readout helper ----------
  // The Chord/Number(Position) readout is normally a short number or 1-2
  // letter symbol (e.g. "C", "1", "5/7") shown big and bold. The Chords
  // tab's position names ("Root Low", "1st Inv", "Root High"...) are full
  // words instead, and at that same size/weight they read as noticeably
  // heavier/bigger than everything else in the readout (Chris: "does the
  // black root high text look too big?"). Rather than sizing every value
  // the same, drop to a smaller size (via the "long-label" class) whenever
  // the raw value is longer than any real number/symbol ever gets.
  function setReadoutValue(el, rawText, html) {
    el.classList.toggle("long-label", rawText.length > 5);
    el.innerHTML = html;
  }

  // ---------- Render ----------
  function render(highlightStep) {
    const prog = D.allProgs[curProg];
    const stepToShow = highlightStep != null ? highlightStep : curStep;
    const ch = prog[stepToShow];
    setReadoutValue(document.getElementById("wpl-chord-name"), ch.name, E.formatLabel(E.transposeChordName(ch.name, curKeyPc, useFlats)));
    setReadoutValue(document.getElementById("wpl-step-label"), ch.topLabel, E.formatLabel(ch.topLabel));
    document.querySelectorAll("#wpl-step-row .step-btn").forEach((b, i) => {
      b.classList.toggle("active", i === stepToShow);
      b.querySelector(".n").textContent = E.transposeChordName(prog[i].name, curKeyPc, useFlats);
    });
    const { usePurple } = E.renderChord(ch, curKeyPc, useFlats, curProg, stepToShow);
    document.getElementById("wpl-either-legend").style.display = usePurple ? "" : "none";
  }

  // ---------- Chords tab ----------
  // Scale-degree numbers relative to the chord's OWN root (not the song
  // key) — e.g. Major root position is always "1-3-5" regardless of which
  // key-tab is selected. All chordVoicings shapes are written with root=C,
  // so a note's pitch class already equals its interval-from-root in
  // semitones; no transposition needed here.
  const INTERVAL_LABELS = { 0: "1", 2: "2", 3: "♭3", 4: "3", 5: "4", 7: "5", 10: "♭7", 11: "7" };
  function chordToneNumbers(rightNotes) {
    return rightNotes.map(n => {
      const pc = D.noteToPc[n.replace(/[0-9]/g, "")];
      return INTERVAL_LABELS[pc] || "?";
    });
  }

  // "3rd Inv" for Maj7/Min7 (a real 4th inversion), "Root High" for every
  // other quality (see chordPositionNamesSeventh in chord-data.js) — always
  // go through this instead of reading D.chordPositionNames directly.
  function getChordPositionNames(quality) {
    return D.seventhQualities.includes(quality) ? D.chordPositionNamesSeventh : D.chordPositionNames;
  }

  // Single-row container for all 6 quality buttons (see index.html comment
  // — both 2-row attempts were reverted 2026-08-30: one grew the shell,
  // the compact one was too small to read on Chris's phone).
  const CHORD_QUALITY_TAB_SELECTOR = "#wpl-chord-quality-tabs .prog-tab";

  function buildChordQualityTabs() {
    const wrap = document.getElementById("wpl-chord-quality-tabs");
    wrap.innerHTML = "";
    D.chordQualityNames.forEach((name, i) => {
      const b = document.createElement("button");
      b.className = "prog-tab" + (i === 0 ? " active" : "");
      b.innerHTML = `<div class="num">${name}</div><div class="name">${chordToneNumbers(D.chordVoicings[name][curPosition].right).join("-")}</div>`;
      b.addEventListener("click", () => {
        curQuality = i;
        document.querySelectorAll(CHORD_QUALITY_TAB_SELECTOR).forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        // Position row's labels/voicing depend on the quality just picked
        // (triad "Root High" vs 7th-chord "3rd Inv") — curPosition (the
        // selected index) stays the same, only what that index MEANS
        // changes, so no need to reset curPosition here.
        updateChordPositionLabels();
        if (E.isPlaying()) {
          E.updatePlayback({ progArray: D.chordVoicings[D.chordQualityNames[curQuality]] });
        } else {
          renderChords();
          E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality]][curPosition], curKeyPc, useFlats);
        }
      });
      wrap.appendChild(b);
    });
  }

  // Refreshes the small "1-3-5"-style caption on all quality buttons for
  // whichever position is currently selected — every button shows its OWN
  // quality's numbers at that position, not just the active one.
  function updateChordQualityNumbers() {
    document.querySelectorAll(CHORD_QUALITY_TAB_SELECTOR).forEach((b, i) => {
      const qName = D.chordQualityNames[i];
      const nums = chordToneNumbers(D.chordVoicings[qName][curPosition].right).join("-");
      b.querySelector(".name").textContent = nums;
    });
  }

  // Position labels are always two words ("Root Low", "1st Inversion"...)
  // and render as two stacked lines on the button per Chris 2026-08-31,
  // instead of the single-line ".n" every other row uses.
  function positionLabelHTML(label) {
    const spaceAt = label.indexOf(" ");
    const top = label.slice(0, spaceAt);
    const bottom = label.slice(spaceAt + 1);
    return `<div class="n-top">${top}</div><div class="n-bottom">${bottom}</div>`;
  }

  function buildChordPositionRow() {
    const wrap = document.getElementById("wpl-chord-position-row");
    wrap.innerHTML = "";
    getChordPositionNames(D.chordQualityNames[curQuality]).forEach((label, i) => {
      const btn = document.createElement("div");
      btn.className = "step-btn" + (i === curPosition ? " active" : "");
      btn.innerHTML = positionLabelHTML(label);
      const activate = () => {
        E.stopPlayThrough();
        resetChordsPlayButton();
        curPosition = i;
        renderChords();
        E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality]][curPosition], curKeyPc, useFlats);
      };
      btn.addEventListener("click", activate);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(btn);
    });
  }

  // Swaps the 4 position button LABELS in place (no rebuild/rewiring) when
  // the selected quality's position-name set changes — e.g. "Root High"
  // <-> "3rd Inv" when toggling into/out of Maj7 or Min7.
  function updateChordPositionLabels() {
    const names = getChordPositionNames(D.chordQualityNames[curQuality]);
    document.querySelectorAll("#wpl-chord-position-row .step-btn").forEach((btn, i) => {
      btn.innerHTML = positionLabelHTML(names[i]);
    });
  }

  function renderChords(highlightPosition) {
    const voicings = D.chordVoicings[D.chordQualityNames[curQuality]];
    const posToShow = highlightPosition != null ? highlightPosition : curPosition;
    const ch = voicings[posToShow];
    setReadoutValue(document.getElementById("wpl-chord-name"), ch.name, E.formatLabel(E.transposeChordName(ch.name, curKeyPc, useFlats)));
    const posName = getChordPositionNames(D.chordQualityNames[curQuality])[posToShow];
    setReadoutValue(document.getElementById("wpl-step-label"), posName, posName);
    updateChordQualityNumbers();
    document.querySelectorAll("#wpl-chord-position-row .step-btn").forEach((b, i) => {
      b.classList.toggle("active", i === posToShow);
    });
    E.renderChord(ch, curKeyPc, useFlats, -1, -1);
    document.getElementById("wpl-either-legend").style.display = "none";
  }

  // ---------- Practice tab ----------
  const PRACTICE_SUBS = [
    { id: "scales", label: "Scales", soon: false },
    { id: "drills", label: "Speed Drills", soon: true },
    { id: "progdrills", label: "Progression Drills", soon: true }
  ];

  function buildPracticeSubTabs() {
    const wrap = document.getElementById("wpl-practice-subtabs");
    wrap.innerHTML = "";
    PRACTICE_SUBS.forEach(sub => {
      const btn = document.createElement("button");
      btn.className = "wpl-toggle-btn" + (sub.id === activePracticeSub ? " active" : "");
      btn.innerHTML = sub.label + (sub.soon ? ' <span class="wpl-tab-soon">Soon</span>' : "");
      btn.addEventListener("click", () => {
        activePracticeSub = sub.id;
        document.querySelectorAll("#wpl-practice-subtabs .wpl-toggle-btn").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".wpl-practice-subpanel").forEach(p => p.classList.remove("active"));
        document.getElementById("wpl-practice-sub-" + sub.id).classList.add("active");
        E.stopPlayThrough();
        resetPlayButton();
        resetChordsPlayButton();
        resetScalesPlayButton();
        // "Soon" sub-tabs leave the heading/keyboard exactly as they were
        // (nothing built yet to show) instead of relabeling to something
        // that doesn't correspond to anything on screen.
        if (sub.id === "scales") {
          document.getElementById("wpl-step-heading-label").textContent = "Degree";
          renderScale();
        }
        repositionStatus();
      });
      wrap.appendChild(btn);
    });
  }

  // ---------- Scales sub-panel ----------
  // Diatonic scale-degree labels for the readout's second box — pitch-class
  // based (not step-index based) so it stays correct regardless of
  // direction/octave: e.g. G in any octave is always "5".
  const MAJOR_DEGREE_LABELS = { 0: "1", 2: "2", 4: "3", 5: "4", 7: "5", 9: "6", 11: "7" };
  function scaleDegreeLabel(noteWithOctave) {
    const name = noteWithOctave.replace(/[0-9]/g, "");
    return MAJOR_DEGREE_LABELS[D.noteToPc[name]] || "1";
  }

  function currentScaleSteps() {
    return D.buildScaleSteps(scaleOctaves, scaleDirection, scaleHands);
  }

  function renderScale(highlightStep) {
    const steps = currentScaleSteps();
    const stepToShow = highlightStep != null ? highlightStep : Math.min(scaleStepIndex, steps.length - 1);
    const st = steps[stepToShow];
    setReadoutValue(document.getElementById("wpl-chord-name"), st.name, E.formatLabel(E.transposeChordName(st.name, curKeyPc, useFlats)));
    const degree = scaleDegreeLabel(st.right[0]);
    setReadoutValue(document.getElementById("wpl-step-label"), degree, degree);
    E.renderChord(st, curKeyPc, useFlats, -1, -1);
    document.getElementById("wpl-either-legend").style.display = "none";
  }

  // Re-reads whichever setting just changed and either updates a running
  // play-through live or previews step 0, same pattern as chord quality/
  // position changes above.
  function onScaleSettingChanged() {
    scaleStepIndex = 0;
    if (E.isPlaying()) {
      E.updatePlayback({ progArray: currentScaleSteps() });
    } else {
      renderScale(0);
      E.playChordSound(currentScaleSteps()[0], curKeyPc, useFlats);
    }
  }

  // Chris, 2026-08-31: "the practice tab layout is horrible and looks
  // nothing like the other 2 tabs" — Hand and Direction were built as
  // .wpl-toggle-btn (the pill style meant for the Loop/Click playbar
  // controls), while Octaves right next to them in the SAME row was
  // .step-btn — two different button families side by side in one row,
  // which is why this row never matched the clean one-family-per-row look
  // every row on Chords/Progressions has. Both are now .step-btn, exactly
  // like Octaves, so all 8 buttons in this row share one shape/color
  // family — the same pattern as any single "choose an option" row
  // elsewhere in the app. This does NOT touch row height/width: .step-btn's
  // min-height at each breakpoint is unchanged, so the row's own footprint
  // (and therefore the shell, verified via qa/check-dimensions.js) stays
  // identical to before this edit.
  function buildScaleHandsRow() {
    const wrap = document.getElementById("wpl-scale-hands-row");
    wrap.innerHTML = "";
    [{ id: "right", label: "Right Hand" }, { id: "both", label: "Both Hands" }].forEach(opt => {
      const b = document.createElement("div");
      b.className = "step-btn" + (opt.id === scaleHands ? " active" : "");
      b.innerHTML = `<div class="n">${opt.label}</div>`;
      const activate = () => {
        scaleHands = opt.id;
        document.querySelectorAll("#wpl-scale-hands-row .step-btn").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        onScaleSettingChanged();
      };
      b.addEventListener("click", activate);
      b.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(b);
    });
  }

  function buildScaleOctavesRow() {
    const wrap = document.getElementById("wpl-scale-octaves-row");
    wrap.innerHTML = "";
    // .step-btn (single line), not .prog-tab's big-number style — this row
    // sits in the SAME flex row as Hand and Direction (see index.html),
    // and every button there needs to share one height so nothing looks
    // uneven or wraps. The .prog-tab num+name look was reverted 2026-08-31
    // for exactly that reason.
    [1, 2, 3].forEach(n => {
      const b = document.createElement("div");
      b.className = "step-btn" + (n === scaleOctaves ? " active" : "");
      b.innerHTML = `<div class="n">${n} Octave${n > 1 ? "s" : ""}</div>`;
      const activate = () => {
        scaleOctaves = n;
        document.querySelectorAll("#wpl-scale-octaves-row .step-btn").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        onScaleSettingChanged();
      };
      b.addEventListener("click", activate);
      b.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(b);
    });
  }

  function buildScaleDirectionRow() {
    const wrap = document.getElementById("wpl-scale-direction-row");
    wrap.innerHTML = "";
    [{ id: "up", label: "Up" }, { id: "down", label: "Down" }, { id: "updown", label: "Up & Down" }].forEach(opt => {
      const b = document.createElement("div");
      b.className = "step-btn" + (opt.id === scaleDirection ? " active" : "");
      b.innerHTML = `<div class="n">${opt.label}</div>`;
      const activate = () => {
        scaleDirection = opt.id;
        document.querySelectorAll("#wpl-scale-direction-row .step-btn").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        onScaleSettingChanged();
      };
      b.addEventListener("click", activate);
      b.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(b);
    });
  }

  function updateScalesBpmFill() {
    const slider = document.getElementById("wpl-scales-bpm-slider");
    const pct = ((scalesBpm - 40) / (160 - 40)) * 100;
    slider.style.setProperty("--pct", pct + "%");
  }

  function resetScalesPlayButton() {
    const btn = document.getElementById("wpl-scales-play-btn");
    if (!btn) return;
    btn.classList.remove("playing");
    document.getElementById("wpl-scales-play-label").textContent = "Play";
    btn.querySelector(".wpl-icon").innerHTML = "&#9654;";
  }

  function startScalesPlaythrough() {
    const playBtn = document.getElementById("wpl-scales-play-btn");
    playBtn.classList.add("playing");
    document.getElementById("wpl-scales-play-label").textContent = "Stop";
    playBtn.querySelector(".wpl-icon").innerHTML = "&#9632;";
    E.playThrough(currentScaleSteps(), curKeyPc, useFlats, {
      bpm: scalesBpm,
      loop: scalesLoopOn,
      click: scalesClickOn,
      beatsPerChord: 1,
      onStep: (i) => {
        scaleStepIndex = i;
        renderScale(i);
      },
      onDone: () => {
        resetScalesPlayButton();
      }
    });
  }

  function wireScalesPlaybar() {
    const slider = document.getElementById("wpl-scales-bpm-slider");
    const valueEl = document.getElementById("wpl-scales-bpm-value");
    slider.addEventListener("input", () => {
      scalesBpm = parseInt(slider.value, 10);
      valueEl.textContent = scalesBpm;
      updateScalesBpmFill();
      if (E.isPlaying()) E.updatePlayback({ bpm: scalesBpm });
    });
    updateScalesBpmFill();

    const loopBtn = document.getElementById("wpl-scales-loop-btn");
    loopBtn.addEventListener("click", () => {
      scalesLoopOn = !scalesLoopOn;
      loopBtn.classList.toggle("active", scalesLoopOn);
      if (E.isPlaying()) E.updatePlayback({ loop: scalesLoopOn });
    });

    const clickBtn = document.getElementById("wpl-scales-click-btn");
    clickBtn.addEventListener("click", () => {
      scalesClickOn = !scalesClickOn;
      clickBtn.classList.toggle("active", scalesClickOn);
      if (E.isPlaying()) E.updatePlayback({ click: scalesClickOn });
    });

    const playBtn = document.getElementById("wpl-scales-play-btn");
    playBtn.addEventListener("click", () => {
      if (E.isPlaying()) {
        E.stopPlayThrough();
        resetScalesPlayButton();
        renderScale();
        return;
      }
      startScalesPlaythrough();
    });
  }

  // ---------- Playback bar ----------
  function updateBpmFill() {
    const slider = document.getElementById("wpl-bpm-slider");
    const pct = ((bpm - 40) / (160 - 40)) * 100;
    slider.style.setProperty("--pct", pct + "%");
  }

  function resetPlayButton() {
    const btn = document.getElementById("wpl-play-btn");
    btn.classList.remove("playing");
    document.getElementById("wpl-play-label").textContent = "Play";
    btn.querySelector(".wpl-icon").innerHTML = "&#9654;";
    document.querySelectorAll("#wpl-step-row .step-btn.playing").forEach(b => b.classList.remove("playing"));
  }

  function startPlayThrough() {
    const playBtn = document.getElementById("wpl-play-btn");
    playBtn.classList.add("playing");
    document.getElementById("wpl-play-label").textContent = "Stop";
    playBtn.querySelector(".wpl-icon").innerHTML = "&#9632;";
    playingDisplayedProg = curProg;
    E.playThrough(D.allProgs[curProg], curKeyPc, useFlats, {
      bpm,
      loop: loopOn,
      click: clickOn,
      onStep: (i) => {
        curStep = i;
        // The step row's chord buttons only need rebuilding when the
        // progression itself changed (different count/labels) — a key
        // switch alone is picked up by render()'s per-tick relabeling below,
        // already in sync with the audio since both read curKeyPc live.
        if (playingDisplayedProg !== curProg) {
          playingDisplayedProg = curProg;
          buildStepButtons();
        }
        document.querySelectorAll("#wpl-step-row .step-btn").forEach((b, idx) => b.classList.toggle("playing", idx === i));
        render(i);
      },
      onDone: () => {
        resetPlayButton();
      }
    });
  }

  function wirePlaybar() {
    const slider = document.getElementById("wpl-bpm-slider");
    const valueEl = document.getElementById("wpl-bpm-value");
    slider.addEventListener("input", () => {
      bpm = parseInt(slider.value, 10);
      valueEl.textContent = bpm;
      updateBpmFill();
      // Takes effect immediately even while a play-through is running.
      if (E.isPlaying()) E.updatePlayback({ bpm });
    });
    updateBpmFill();

    const loopBtn = document.getElementById("wpl-loop-btn");
    loopBtn.addEventListener("click", () => {
      loopOn = !loopOn;
      loopBtn.classList.toggle("active", loopOn);
      if (E.isPlaying()) E.updatePlayback({ loop: loopOn });
    });

    const clickBtn = document.getElementById("wpl-click-btn");
    clickBtn.addEventListener("click", () => {
      clickOn = !clickOn;
      clickBtn.classList.toggle("active", clickOn);
      if (E.isPlaying()) E.updatePlayback({ click: clickOn });
    });

    const playBtn = document.getElementById("wpl-play-btn");
    playBtn.addEventListener("click", () => {
      if (E.isPlaying()) {
        E.stopPlayThrough();
        resetPlayButton();
        render();
        return;
      }
      startPlayThrough();
    });
  }

  // ---------- Chords playback bar ("Practice") ----------
  function updateChordsBpmFill() {
    const slider = document.getElementById("wpl-chords-bpm-slider");
    const pct = ((chordsBpm - 40) / (160 - 40)) * 100;
    slider.style.setProperty("--pct", pct + "%");
  }

  function resetChordsPlayButton() {
    const btn = document.getElementById("wpl-chords-play-btn");
    if (!btn) return;
    btn.classList.remove("playing");
    document.getElementById("wpl-chords-play-label").textContent = "Practice";
    btn.querySelector(".wpl-icon").innerHTML = "&#9654;";
    document.querySelectorAll("#wpl-chord-position-row .step-btn.playing").forEach(b => b.classList.remove("playing"));
  }

  function startChordsPractice() {
    const playBtn = document.getElementById("wpl-chords-play-btn");
    playBtn.classList.add("playing");
    document.getElementById("wpl-chords-play-label").textContent = "Stop";
    playBtn.querySelector(".wpl-icon").innerHTML = "&#9632;";
    E.playThrough(D.chordVoicings[D.chordQualityNames[curQuality]], curKeyPc, useFlats, {
      bpm: chordsBpm,
      loop: chordsLoopOn,
      click: chordsClickOn,
      beatsPerChord: 2,
      onStep: (i) => {
        curPosition = i;
        document.querySelectorAll("#wpl-chord-position-row .step-btn").forEach((b, idx) => b.classList.toggle("playing", idx === i));
        renderChords(i);
      },
      onDone: () => {
        resetChordsPlayButton();
      }
    });
  }

  function wireChordsPlaybar() {
    const slider = document.getElementById("wpl-chords-bpm-slider");
    const valueEl = document.getElementById("wpl-chords-bpm-value");
    slider.addEventListener("input", () => {
      chordsBpm = parseInt(slider.value, 10);
      valueEl.textContent = chordsBpm;
      updateChordsBpmFill();
      if (E.isPlaying()) E.updatePlayback({ bpm: chordsBpm });
    });
    updateChordsBpmFill();

    const loopBtn = document.getElementById("wpl-chords-loop-btn");
    loopBtn.addEventListener("click", () => {
      chordsLoopOn = !chordsLoopOn;
      loopBtn.classList.toggle("active", chordsLoopOn);
      if (E.isPlaying()) E.updatePlayback({ loop: chordsLoopOn });
    });

    const clickBtn = document.getElementById("wpl-chords-click-btn");
    clickBtn.addEventListener("click", () => {
      chordsClickOn = !chordsClickOn;
      clickBtn.classList.toggle("active", chordsClickOn);
      if (E.isPlaying()) E.updatePlayback({ click: chordsClickOn });
    });

    const playBtn = document.getElementById("wpl-chords-play-btn");
    playBtn.addEventListener("click", () => {
      if (E.isPlaying()) {
        E.stopPlayThrough();
        resetChordsPlayButton();
        renderChords();
        return;
      }
      startChordsPractice();
    });
  }

  // ---------- Auto-resize (for iframe embeds) ----------
  // Tells the parent page (Squarespace/ThriveCart) exactly how tall this
  // page is, so the embed script can size the iframe to fit with no dead
  // space and no manual min-height guessing on their end.
  let lastReportedHeight = null;
  function reportHeight() {
    if (window.parent === window) return; // not embedded in an iframe
    const h = Math.ceil(document.body.getBoundingClientRect().height);
    // Only post when the height actually changed — posting on every
    // sub-pixel ResizeObserver tick can make an embedding page's own
    // resize handling jitter/flicker as both sides keep re-measuring
    // each other.
    if (h === lastReportedHeight) return;
    lastReportedHeight = h;
    window.parent.postMessage({ type: "wpl-resize", source: "worship-piano-lab", height: h }, "*");
  }

  function wireAutoResize() {
    reportHeight();
    window.addEventListener("resize", reportHeight);
    // Fonts finishing their swap can change the natural height slightly
    // after the first paint.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reportHeight);
    setTimeout(reportHeight, 400);
    if (window.ResizeObserver) {
      let debounceTimer = null;
      const observer = new ResizeObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(reportHeight, 80);
      });
      observer.observe(document.getElementById("wpl-wrapper"));
    }
  }

  // ---------- Status line ----------
  // "#wpl-status" (the "Tap any chord..." hint) always stays put under the
  // piano/legend in the shared instrument block, on every tab and every
  // viewport. An earlier version relocated it into the panel between the
  // two button rows on mobile to save space, but that shrinks the shared
  // instrument block itself depending on which tab is active — which broke
  // the fixed-shell-height requirement (Progressions came out ~18px
  // shorter than Chords/Scales/Riffs on mobile once Chords stopped sharing
  // the same trick). Keeping it in one place, always, is what actually
  // guarantees the shell is identical across every tab.
  function repositionStatus() {}
  function wireMobileStatusReposition() {}

  // ---------- Init ----------
  function init() {
    buildTabBar();
    startTrialCountdown();
    buildKeyTabs();
    buildProgTabs();
    buildChordQualityTabs();
    buildChordPositionRow();
    buildPracticeSubTabs();
    buildScaleHandsRow();
    buildScaleOctavesRow();
    buildScaleDirectionRow();
    E.buildKeyboard(document.getElementById("wpl-piano"), document.getElementById("wpl-status"));
    buildStepButtons();
    wirePlaybar();
    wireChordsPlaybar();
    wireScalesPlaybar();
    if (activeTabId === "chords") {
      renderChords();
    } else if (activeTabId === "practice" && activePracticeSub === "scales") {
      renderScale();
    } else {
      render();
    }
    wireAutoResize();
    wireMobileStatusReposition();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
