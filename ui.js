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

  // ---------- State ----------
  let curKeyPc = 0;
  let useFlats = false;
  let curProg = 0;
  let curStep = 0;
  let bpm = 80;
  let loopOn = false;
  let clickOn = false;
  let playingDisplayedProg = null; // which progression the step row currently shows while playing

  // ---------- Tabs ----------
  const TABS = [
    { id: "progressions", label: "Progressions", soon: false },
    { id: "chords", label: "Chords", soon: true },
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
        document.querySelectorAll(".wpl-panel").forEach(p => { p.style.display = "none"; });
        document.getElementById("wpl-panel-" + tab.id).style.display = "";
        if (tab.id !== "progressions") { E.stopPlayThrough(); resetPlayButton(); }
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
      const locked = DEMO_MODE && k.pc !== 0;
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

  // ---------- Render ----------
  function render(highlightStep) {
    const prog = D.allProgs[curProg];
    const stepToShow = highlightStep != null ? highlightStep : curStep;
    const ch = prog[stepToShow];
    document.getElementById("wpl-chord-name").innerHTML = E.formatLabel(E.transposeChordName(ch.name, curKeyPc, useFlats));
    document.getElementById("wpl-step-label").innerHTML = E.formatLabel(ch.topLabel);
    document.querySelectorAll(".step-btn").forEach((b, i) => {
      b.classList.toggle("active", i === stepToShow);
      b.querySelector(".n").textContent = E.transposeChordName(prog[i].name, curKeyPc, useFlats);
    });
    const { usePurple } = E.renderChord(ch, curKeyPc, useFlats, curProg, stepToShow);
    document.getElementById("wpl-either-legend").style.display = usePurple ? "" : "none";
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
    document.querySelectorAll(".step-btn.playing").forEach(b => b.classList.remove("playing"));
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
        document.querySelectorAll(".step-btn").forEach((b, idx) => b.classList.toggle("playing", idx === i));
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

  // ---------- Mobile-only status reposition ----------
  // On narrow screens, move the "Tap any chord..." status line down between
  // the progression buttons and the step row, instead of leaving it under
  // the piano legend — reuses existing vertical space there so the whole
  // shell sits shorter and needs less scrolling on a phone.
  function wireMobileStatusReposition() {
    const statusEl = document.getElementById("wpl-status");
    const originalParent = statusEl.parentNode;
    const originalNextSibling = statusEl.nextSibling;
    const stepRow = document.getElementById("wpl-step-row");
    const mq = window.matchMedia("(max-width: 520px)");

    function applyPosition(isMobile) {
      if (isMobile) {
        if (statusEl.nextSibling !== stepRow || statusEl.parentNode !== stepRow.parentNode) {
          stepRow.parentNode.insertBefore(statusEl, stepRow);
        }
      } else if (statusEl.parentNode !== originalParent) {
        if (originalNextSibling) {
          originalParent.insertBefore(statusEl, originalNextSibling);
        } else {
          originalParent.appendChild(statusEl);
        }
      }
    }

    applyPosition(mq.matches);
    mq.addEventListener("change", (e) => applyPosition(e.matches));
  }

  // ---------- Init ----------
  function init() {
    buildTabBar();
    buildKeyTabs();
    buildProgTabs();
    E.buildKeyboard(document.getElementById("wpl-piano"), document.getElementById("wpl-status"));
    buildStepButtons();
    wirePlaybar();
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
