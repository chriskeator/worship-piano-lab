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
  let activeTabId = "progressions";
  let curQuality = 0;
  let curPosition = 0;
  let chordsBpm = 80;
  let chordsLoopOn = false;
  let chordsClickOn = false;

  // ---------- Tabs ----------
  const TABS = [
    { id: "progressions", label: "Progressions", soon: false },
    { id: "chords", label: "Chords", soon: false },
    { id: "scales", label: "Scales", soon: true },
    { id: "riffs", label: "Riffs", soon: true }
  ];

  function buildTabBar() {
    const bar = document.getElementById("wpl-tabbar");
    bar.innerHTML = "";
    TABS.forEach((tab, i) => {
      const btn = document.createElement("button");
      btn.className = "wpl-tab" + (i === 0 ? " active" : "");
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
        activeTabId = tab.id;
        const headingLabel = document.getElementById("wpl-step-heading-label");
        if (tab.id === "chords") {
          headingLabel.textContent = "Position";
          renderChords();
        } else if (tab.id === "progressions") {
          headingLabel.textContent = "Number";
          render();
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
      btn.className = "key-tab" + (k.pc === 0 ? " active" : "") + (locked ? " locked" : "");
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
  const INTERVAL_LABELS = { 0: "1", 2: "2", 3: "♭3", 4: "3", 5: "4", 7: "5" };
  function chordToneNumbers(rightNotes) {
    return rightNotes.map(n => {
      const pc = D.noteToPc[n.replace(/[0-9]/g, "")];
      return INTERVAL_LABELS[pc] || "?";
    });
  }

  function buildChordQualityTabs() {
    const wrap = document.getElementById("wpl-chord-quality-tabs");
    wrap.innerHTML = "";
    D.chordQualityNames.forEach((name, i) => {
      const b = document.createElement("button");
      b.className = "prog-tab" + (i === 0 ? " active" : "");
      b.innerHTML = `<div class="num">${name}</div><div class="name">${chordToneNumbers(D.chordVoicings[name][curPosition].right).join("-")}</div>`;
      b.addEventListener("click", () => {
        curQuality = i;
        document.querySelectorAll("#wpl-chord-quality-tabs .prog-tab").forEach(t => t.classList.remove("active"));
        b.classList.add("active");
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

  // Refreshes the small "1-3-5"-style caption on all 4 quality buttons for
  // whichever position is currently selected — every button shows its OWN
  // quality's numbers at that position, not just the active one.
  function updateChordQualityNumbers() {
    document.querySelectorAll("#wpl-chord-quality-tabs .prog-tab").forEach((b, i) => {
      const qName = D.chordQualityNames[i];
      const nums = chordToneNumbers(D.chordVoicings[qName][curPosition].right).join("-");
      b.querySelector(".name").textContent = nums;
    });
  }

  function buildChordPositionRow() {
    const wrap = document.getElementById("wpl-chord-position-row");
    wrap.innerHTML = "";
    D.chordPositionNames.forEach((label, i) => {
      const btn = document.createElement("div");
      btn.className = "step-btn" + (i === curPosition ? " active" : "");
      btn.innerHTML = `<div class="n">${label}</div>`;
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

  function renderChords(highlightPosition) {
    const voicings = D.chordVoicings[D.chordQualityNames[curQuality]];
    const posToShow = highlightPosition != null ? highlightPosition : curPosition;
    const ch = voicings[posToShow];
    setReadoutValue(document.getElementById("wpl-chord-name"), ch.name, E.formatLabel(E.transposeChordName(ch.name, curKeyPc, useFlats)));
    const posName = D.chordPositionNames[posToShow];
    setReadoutValue(document.getElementById("wpl-step-label"), posName, posName);
    updateChordQualityNumbers();
    document.querySelectorAll("#wpl-chord-position-row .step-btn").forEach((b, i) => {
      b.classList.toggle("active", i === posToShow);
    });
    E.renderChord(ch, curKeyPc, useFlats, -1, -1);
    document.getElementById("wpl-either-legend").style.display = "none";
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
    E.buildKeyboard(document.getElementById("wpl-piano"), document.getElementById("wpl-status"));
    buildStepButtons();
    wirePlaybar();
    wireChordsPlaybar();
    render();
    wireAutoResize();
    wireMobileStatusReposition();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
