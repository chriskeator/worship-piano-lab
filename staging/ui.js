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
  let activeTabId = "chords2"; // Chords is the first tab, and the default shown on load
  let scaleStepIndex = 0;
  let scalesBpm = 80;
  let scalesLoopOn = false;
  let scalesClickOn = false;
  // Chords tab state (position/quality selectors, BPM, loop/click). Names
  // keep the "2" suffix from when this was built as a separate, in-progress
  // "Chords v2" next to the original Chords tab — now promoted to be the
  // only Chords tab, but renaming every id/variable here would be a much
  // larger, riskier change for no functional benefit.
  let curQuality2 = 0;
  let curPosition2 = 0;
  let chords2Bpm = 80;
  let chords2LoopOn = false;
  let chords2ClickOn = false;

  // ---------- Tabs ----------
  const TABS = [
    { id: "chords2", label: "Chords", soon: false },
    { id: "progressions", label: "Progressions", soon: false },
    { id: "scales", label: "Scales", soon: false },
    { id: "practice", label: "Practice", soon: true }
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
        resetScalesPlayButton();
        resetChords2PlayButton();
        activeTabId = tab.id;
        const headingLabel = document.getElementById("wpl-step-heading-label");
        const chordHeadingLabel = document.getElementById("wpl-chord-heading-label");
        if (tab.id === "chords2") {
          chordHeadingLabel.textContent = "Chord";
          headingLabel.textContent = "Position";
          document.getElementById("wpl-bass-legend").style.display = "";
          document.getElementById("wpl-chord-legend").style.display = "";
          renderChords2();
        } else if (tab.id === "progressions") {
          chordHeadingLabel.textContent = "Chord";
          headingLabel.textContent = "Number";
          document.getElementById("wpl-bass-legend").style.display = "";
          document.getElementById("wpl-chord-legend").style.display = "";
          render();
        } else if (tab.id === "scales") {
          chordHeadingLabel.textContent = "Scale";
          headingLabel.textContent = "View";
          renderScale();
        }
        // "practice" is a "Soon" placeholder tab — nothing to render yet,
        // leave the heading/keyboard exactly as they were.
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
        } else if (activeTabId === "chords2") {
          renderChords2();
          E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality2]][curPosition2], curKeyPc, useFlats);
        } else if (activeTabId === "scales") {
          renderScale(0);
          E.playChordSound(currentScaleSteps()[0], curKeyPc, useFlats);
        } else if (activeTabId === "practice") {
          // "Soon" placeholder — nothing built yet to render/play.
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

  // ---------- Chords tab: shared helpers ----------
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

  // ---------- Chords tab: position/quality rows ----------
  // Built from Progressions' own markup: position row is plain .prog-tab
  // (num/name), quality row is plain .step-btn (n/l). No ID-scoped color/
  // size overrides anywhere — everything here inherits its look from the
  // shared base rules, same as Progressions itself. Function/variable names
  // keep the "2" suffix from this tab's original build as a separate,
  // in-progress "Chords v2" — now promoted to be the only Chords tab (the
  // original position/quality-tab implementation was deleted 2026-09-03),
  // but a full rename would touch a lot of ids for no functional benefit.
  function buildPositionTabs2() {
    const wrap = document.getElementById("wpl-position-tabs2");
    wrap.innerHTML = "";
    getChordPositionNames(D.chordQualityNames[curQuality2]).forEach((label, i) => {
      const b = document.createElement("button");
      b.className = "prog-tab" + (i === curPosition2 ? " active" : "");
      const spaceAt = label.indexOf(" ");
      b.innerHTML = `<div class="num">${label.slice(0, spaceAt)}</div><div class="name">${label.slice(spaceAt + 1)}</div>`;
      b.addEventListener("click", () => {
        curPosition2 = i;
        document.querySelectorAll("#wpl-position-tabs2 .prog-tab").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        if (E.isPlaying()) {
          E.updatePlayback({ progArray: D.chordVoicings[D.chordQualityNames[curQuality2]] });
        } else {
          renderChords2();
          E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality2]][curPosition2], curKeyPc, useFlats);
        }
      });
      wrap.appendChild(b);
    });
  }

  function updatePositionTabs2Labels() {
    const names = getChordPositionNames(D.chordQualityNames[curQuality2]);
    document.querySelectorAll("#wpl-position-tabs2 .prog-tab").forEach((b, i) => {
      const spaceAt = names[i].indexOf(" ");
      b.querySelector(".num").textContent = names[i].slice(0, spaceAt);
      b.querySelector(".name").textContent = names[i].slice(spaceAt + 1);
    });
  }

  function buildQualityRow2() {
    const wrap = document.getElementById("wpl-quality-row2");
    wrap.innerHTML = "";
    D.chordQualityNames.forEach((name, i) => {
      const btn = document.createElement("div");
      btn.className = "step-btn" + (i === curQuality2 ? " active" : "");
      const nums = chordToneNumbers(D.chordVoicings[name][curPosition2].right).join("-");
      btn.innerHTML = `<div class="n">${name}</div><div class="l">${nums}</div>`;
      const activate = () => {
        curQuality2 = i;
        document.querySelectorAll("#wpl-quality-row2 .step-btn").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        updatePositionTabs2Labels();
        if (E.isPlaying()) {
          E.updatePlayback({ progArray: D.chordVoicings[D.chordQualityNames[curQuality2]] });
        } else {
          renderChords2();
          E.playChordSound(D.chordVoicings[D.chordQualityNames[curQuality2]][curPosition2], curKeyPc, useFlats);
        }
      };
      btn.addEventListener("click", activate);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(btn);
    });
  }

  function updateQualityRow2Numbers() {
    document.querySelectorAll("#wpl-quality-row2 .step-btn").forEach((b, i) => {
      const qName = D.chordQualityNames[i];
      const nums = chordToneNumbers(D.chordVoicings[qName][curPosition2].right).join("-");
      b.querySelector(".l").textContent = nums;
    });
  }

  function renderChords2(highlightPosition) {
    const voicings = D.chordVoicings[D.chordQualityNames[curQuality2]];
    const posToShow = highlightPosition != null ? highlightPosition : curPosition2;
    const ch = voicings[posToShow];
    setReadoutValue(document.getElementById("wpl-chord-name"), ch.name, E.formatLabel(E.transposeChordName(ch.name, curKeyPc, useFlats)));
    const posName = getChordPositionNames(D.chordQualityNames[curQuality2])[posToShow];
    setReadoutValue(document.getElementById("wpl-step-label"), posName, posName);
    updateQualityRow2Numbers();
    document.querySelectorAll("#wpl-position-tabs2 .prog-tab").forEach((b, i) => {
      b.classList.toggle("active", i === posToShow);
    });
    E.renderChord(ch, curKeyPc, useFlats, -1, -1);
    document.getElementById("wpl-either-legend").style.display = "none";
  }

  function updateChords2BpmFill() {
    const slider = document.getElementById("wpl-chords2-bpm-slider");
    const pct = ((chords2Bpm - 40) / (160 - 40)) * 100;
    slider.style.setProperty("--pct", pct + "%");
  }

  function resetChords2PlayButton() {
    const btn = document.getElementById("wpl-chords2-play-btn");
    if (!btn) return;
    btn.classList.remove("playing");
    document.getElementById("wpl-chords2-play-label").textContent = "Practice";
    btn.querySelector(".wpl-icon").innerHTML = "&#9654;";
    document.querySelectorAll("#wpl-position-tabs2 .prog-tab.playing").forEach(b => b.classList.remove("playing"));
  }

  function startChords2Practice() {
    const playBtn = document.getElementById("wpl-chords2-play-btn");
    playBtn.classList.add("playing");
    document.getElementById("wpl-chords2-play-label").textContent = "Stop";
    playBtn.querySelector(".wpl-icon").innerHTML = "&#9632;";
    E.playThrough(D.chordVoicings[D.chordQualityNames[curQuality2]], curKeyPc, useFlats, {
      bpm: chords2Bpm,
      loop: chords2LoopOn,
      click: chords2ClickOn,
      beatsPerChord: 2,
      onStep: (i) => {
        curPosition2 = i;
        document.querySelectorAll("#wpl-position-tabs2 .prog-tab").forEach((b, idx) => b.classList.toggle("playing", idx === i));
        renderChords2(i);
      },
      onDone: () => {
        resetChords2PlayButton();
      }
    });
  }

  function wireChords2Playbar() {
    const slider = document.getElementById("wpl-chords2-bpm-slider");
    const valueEl = document.getElementById("wpl-chords2-bpm-value");
    slider.addEventListener("input", () => {
      chords2Bpm = parseInt(slider.value, 10);
      valueEl.textContent = chords2Bpm;
      updateChords2BpmFill();
      if (E.isPlaying()) E.updatePlayback({ bpm: chords2Bpm });
    });
    updateChords2BpmFill();

    const loopBtn = document.getElementById("wpl-chords2-loop-btn");
    loopBtn.addEventListener("click", () => {
      chords2LoopOn = !chords2LoopOn;
      loopBtn.classList.toggle("active", chords2LoopOn);
      if (E.isPlaying()) E.updatePlayback({ loop: chords2LoopOn });
    });

    const clickBtn = document.getElementById("wpl-chords2-click-btn");
    clickBtn.addEventListener("click", () => {
      chords2ClickOn = !chords2ClickOn;
      clickBtn.classList.toggle("active", chords2ClickOn);
      if (E.isPlaying()) E.updatePlayback({ click: chords2ClickOn });
    });

    const playBtn = document.getElementById("wpl-chords2-play-btn");
    playBtn.addEventListener("click", () => {
      if (E.isPlaying()) {
        E.stopPlayThrough();
        resetChords2PlayButton();
        renderChords2();
        return;
      }
      startChords2Practice();
    });
  }

  // ---------- Scales panel ----------
  // Maps curScaleType (Choose a Scale row index) to its chord-data.js key,
  // and curScaleView (Choose a View row index) to what that view lights up:
  // 0 Note Names / 1 Scale Degrees light every octave of the scale at once
  // (Chris: "always displays the same note names across the entire keyboard
  // width"); 2/3 Right Hand light only that 1- or 2-octave run with finger
  // numbers instead of note names; 4/5 do the same for Left Hand. Order
  // here must stay in lockstep with SCALE_TYPES/SCALE_VIEWS below.
  const SCALE_TYPE_KEYS = ["major", "minor", "pentMajor", "pentMinor", "bluesMajor", "bluesMinor"];
  const RH_BASE_OCT = 3; // matches the old single-note preview's register
  const LH_BASE_OCT = 2; // one octave below RH, same as chord voicings' left hand
  const KEY_COLOR_RIGHT = "linear-gradient(#fca5a5,#f87171)"; // matches renderChord's right-hand red
  const KEY_COLOR_LEFT = "linear-gradient(#7dd3fc,#38bdf8)";  // matches renderChord's left-hand blue

  function curScaleKey() { return SCALE_TYPE_KEYS[curScaleType]; }

  // Audio-only: a simple one-hand ascending run for playback/preview. The
  // on-screen key labels are a separate, static map (see renderScaleKeyMap)
  // that doesn't change per playback step -- Chris's spec describes a fixed
  // reference chart per scale+view selection, not a note-by-note flash.
  function currentScaleSteps() {
    const scaleKey = curScaleKey();
    let octaves = 1, hand = "right", baseOct = RH_BASE_OCT;
    if (curScaleView === 3) octaves = 2;
    if (curScaleView === 4) { hand = "left"; baseOct = LH_BASE_OCT; }
    if (curScaleView === 5) { hand = "left"; baseOct = LH_BASE_OCT; octaves = 2; }
    const ascent = D.buildScaleAscent(scaleKey, octaves);
    return ascent.map(step => {
      const noteWithOct = step.name + (baseOct + step.octaveOffset);
      return {
        name: step.name,
        right: hand === "right" ? [noteWithOct] : [],
        left: hand === "left" ? [noteWithOct] : []
      };
    });
  }

  // Lights the on-screen keyboard for the current scale + view. Notes/
  // Degrees light every octave (5 on-screen octaves) with the same label
  // repeating; RH/LH Fingers light only that hand's specific 1- or 2-octave
  // run, labeled with finger numbers. Also shows/hides the Bass note/Chord
  // tones legend rows to match which color(s) actually appear.
  function renderScaleKeyMap() {
    const scaleKey = curScaleKey();
    const entries = [];
    if (curScaleView === 0 || curScaleView === 1) {
      const tones = D.scaleDefs[scaleKey].tones;
      for (let oct = 0; oct < 5; oct++) {
        tones.forEach(t => {
          const tNote = E.transposeNote(t.note + (oct + 2), curKeyPc, useFlats);
          const name = tNote.replace(/[0-9]/g, "");
          const pc = D.noteToPc[name];
          const label = curScaleView === 0 ? E.toDisplayFlat(name) : t.degree;
          entries.push({ pc, oct, label, color: KEY_COLOR_RIGHT });
        });
      }
    } else {
      const octaves = (curScaleView === 3 || curScaleView === 5) ? 2 : 1;
      const isLeft = curScaleView === 4 || curScaleView === 5;
      const baseOct = isLeft ? LH_BASE_OCT : RH_BASE_OCT;
      const fingers = (isLeft ? D.scaleDefs[scaleKey].lhFingers : D.scaleDefs[scaleKey].rhFingers)[octaves];
      D.buildScaleAscent(scaleKey, octaves).forEach((step, i) => {
        const tNote = E.transposeNote(step.name + (baseOct + step.octaveOffset), curKeyPc, useFlats);
        const name = tNote.replace(/[0-9]/g, "");
        const oct = parseInt(tNote.replace(/[^0-9]/g, ""), 10) - 2;
        const pc = D.noteToPc[name];
        entries.push({ pc, oct, label: String(fingers[i] != null ? fingers[i] : ""), color: isLeft ? KEY_COLOR_LEFT : KEY_COLOR_RIGHT });
      });
    }
    E.renderScaleMap(entries);
    document.getElementById("wpl-either-legend").style.display = "none";
    const hasLeft = entries.some(e => e.color === KEY_COLOR_LEFT);
    const hasRight = entries.some(e => e.color === KEY_COLOR_RIGHT);
    document.getElementById("wpl-bass-legend").style.display = hasLeft ? "" : "none";
    document.getElementById("wpl-chord-legend").style.display = hasRight ? "" : "none";
  }

  // highlightStep is accepted (playback passes the current step index) but
  // only affects nothing visual right now -- the key map above is a static
  // reference chart for the current scale+view, not a per-note flash.
  function renderScale(highlightStep) {
    const rootName = E.toDisplayFlat(E.transposeNote("C4", curKeyPc, useFlats).replace(/[0-9]/g, ""));
    // Reuse the Choose-a-Scale/View rows' own SHORT label pieces here (not
    // the full desktop spelling) -- this readout box is a fixed 140x50px
    // sized for short values like "Root High"/"1st Inv", and full text like
    // "Right Hand 2 Octaves" or "Pentatonic Major" overflows it. "Pent
    // Major"/"RH 2 Octaves" etc. read fine at that size and are already the
    // exact abbreviations shown on mobile, so nothing new to learn.
    const scaleType = SCALE_TYPES[curScaleType];
    const scaleLabel = rootName + " " + scaleType.numShort + " " + scaleType.name;
    setReadoutValue(document.getElementById("wpl-chord-name"), scaleLabel, scaleLabel);
    const view = SCALE_VIEWS[curScaleView];
    const viewLabel = view.nShort + " " + view.l;
    setReadoutValue(document.getElementById("wpl-step-label"), viewLabel, viewLabel);
    renderScaleKeyMap();
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

  // ---------- Choose a Scale row ----------
  // Copied verbatim from buildProgTabs()'s .prog-tab pattern (button,
  // num/name divs, same active-class toggle) -- only the data source
  // differs (a fixed array here instead of D.progressionNames).
  // "Pentatonic" is the only title here too long to keep spelled out on
  // mobile (Chris, 2026-09-04: "Pent" on mobile, "Pentatonic" on desktop) --
  // same full/short span pattern as the view row below, same breakpoint.
  const SCALE_TYPES = [
    { numFull: "Major", numShort: "Major", name: "Scale" },
    { numFull: "Minor", numShort: "Minor", name: "Scale" },
    { numFull: "Pentatonic", numShort: "Pent", name: "Major" },
    { numFull: "Pentatonic", numShort: "Pent", name: "Minor" },
    { numFull: "Blues", numShort: "Blues", name: "Major" },
    { numFull: "Blues", numShort: "Blues", name: "Minor" }
  ];
  let curScaleType = 0;
  function buildScaleTypeRow() {
    const wrap = document.getElementById("wpl-scale-type-row");
    wrap.innerHTML = "";
    SCALE_TYPES.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "prog-tab" + (i === curScaleType ? " active" : "");
      b.innerHTML = `<div class="num"><span class="wpl-lbl-full">${opt.numFull}</span><span class="wpl-lbl-short">${opt.numShort}</span></div><div class="name">${opt.name}</div>`;
      b.addEventListener("click", () => {
        curScaleType = i;
        document.querySelectorAll("#wpl-scale-type-row .prog-tab").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
        onScaleSettingChanged();
      });
      wrap.appendChild(b);
    });
  }

  // ---------- Choose a View row ----------
  // Copied verbatim from buildStepButtons()'s .step-btn pattern (div, not
  // button; n/l divs; touchstart handled the same way) -- only the data
  // source differs (a fixed array here instead of the current
  // progression's chords).
  // "Right Hand"/"Left Hand" wrap to 2 lines on mobile (2 words, narrow
  // column), which grows that button taller than its neighbors and, since
  // flex rows stretch every button to the tallest one, grows the WHOLE
  // row -- Chris, 2026-09-04: "that row shell size can never change."
  // "RH"/"LH" on mobile, spelled out on desktop -- same full/short span
  // pattern and breakpoint as the type row above.
  const SCALE_VIEWS = [
    { nFull: "Note", nShort: "Note", l: "Names" },
    { nFull: "Scale", nShort: "Scale", l: "Degrees" },
    { nFull: "Right Hand", nShort: "RH", l: "1 Octave" },
    { nFull: "Right Hand", nShort: "RH", l: "2 Octaves" },
    { nFull: "Left Hand", nShort: "LH", l: "1 Octave" },
    { nFull: "Left Hand", nShort: "LH", l: "2 Octaves" }
  ];
  let curScaleView = 0;
  function buildScaleViewRow() {
    const wrap = document.getElementById("wpl-scale-view-row");
    wrap.innerHTML = "";
    SCALE_VIEWS.forEach((opt, i) => {
      const btn = document.createElement("div");
      btn.className = "step-btn" + (i === curScaleView ? " active" : "");
      btn.innerHTML = `<div class="n"><span class="wpl-lbl-full">${opt.nFull}</span><span class="wpl-lbl-short">${opt.nShort}</span></div><div class="l">${opt.l}</div>`;
      const activate = () => {
        curScaleView = i;
        document.querySelectorAll("#wpl-scale-view-row .step-btn").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        onScaleSettingChanged();
      };
      btn.addEventListener("click", activate);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); activate(); }, { passive: false });
      wrap.appendChild(btn);
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

  // ---------- Init ----------
  function init() {
    buildTabBar();
    startTrialCountdown();
    buildKeyTabs();
    buildProgTabs();
    buildScaleTypeRow();
    buildScaleViewRow();
    buildPositionTabs2();
    buildQualityRow2();
    E.buildKeyboard(document.getElementById("wpl-piano"), document.getElementById("wpl-status"));
    buildStepButtons();
    wirePlaybar();
    wireScalesPlaybar();
    wireChords2Playbar();
    if (activeTabId === "chords2") {
      renderChords2();
    } else if (activeTabId === "scales") {
      renderScale();
    } else {
      render();
    }
    wireAutoResize();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
