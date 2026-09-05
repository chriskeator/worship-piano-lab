/* Worship Piano Lab — piano engine
 * Audio playback (real Salamander piano samples via Web Audio), the on-screen
 * keyboard, note/chord transposition, and the tempo-driven playback sequencer
 * (play-through, loop, metronome click) used by the playback bar.
 */
(function (global) {
  const D = global.WPL_DATA;
  const { sharpNames, flatNames, preferFlats, noteToPc } = D;

  // ---------- Transposition ----------
  function transposeNote(note, semitones, useFlats) {
    const name = note.replace(/[0-9]/g, "");
    const oct = parseInt(note.replace(/[^0-9]/g, ""), 10);
    const pc = noteToPc[name];
    let newPc = (pc + semitones) % 12;
    if (newPc < 0) newPc += 12;
    let newOct = oct;
    if (pc + semitones >= 12) newOct++;
    if (pc + semitones < 0) newOct--;
    const newName = useFlats ? flatNames[newPc] : sharpNames[newPc];
    return newName + newOct;
  }

  // Chris, 2026-09-01: "the flat character on the Min7 buttons is a real
  // flat character. on the 5 buttons of flats, it looks like its just a
  // 'b' symbol" — the interval numbers (♭3/♭7, see chordToneNumbers in
  // ui.js) already use the real ♭ (U+266D), but note NAMES built from
  // flatNames (above) use plain ASCII "b" ("Ab", "Bb"...), and that ASCII
  // form isn't just display text: transposeNote's return value is also fed
  // straight into noteToPc[] for audio (sample selection, playChordSound)
  // elsewhere in this file, so flatNames itself has to stay ASCII or every
  // flat-key chord goes silent. toDisplayFlat() converts only a string
  // that's about to be shown to the user and is never round-tripped back
  // through noteToPc — used here, and again in triggerKey()/renderChord()
  // below wherever a note name is about to hit a label instead of the
  // audio engine.
  function toDisplayFlat(noteLetter) {
    // Global replace (not just the first "b") -- Db minor's b6 is the one
    // legitimate double-flat ("Bbb") the correct-spelling scale logic in
    // chord-data.js produces (Chris, 2026-09-05); every other caller here
    // only ever has at most one "b" anyway, so this is a safe broadening.
    return noteLetter.replace(/b/g, "♭");
  }

  function transposeChordName(name, semitones, useFlats) {
    const has4 = name.includes("⁴");
    const has2 = name.includes("²");
    const clean = name.replace(/[²⁴]/g, "");
    function splitRootQuality(chord) {
      const m = chord.match(/^([A-G][#b]?)(.*)$/);
      if (!m) return { root: chord, quality: "" };
      return { root: m[1], quality: m[2] };
    }
    if (clean.includes("/")) {
      const [top, bass] = clean.split("/");
      const t = splitRootQuality(top);
      const b = splitRootQuality(bass);
      const tRoot = toDisplayFlat(transposeNote(t.root + "4", semitones, useFlats).replace(/[0-9]/g, ""));
      const tBass = toDisplayFlat(transposeNote(b.root + "4", semitones, useFlats).replace(/[0-9]/g, ""));
      let result = tRoot + t.quality;
      if (has4) result += "⁴";
      if (has2) result += "²";
      return result + "/" + tBass + b.quality;
    }
    const t = splitRootQuality(clean);
    let result = toDisplayFlat(transposeNote(t.root + "4", semitones, useFlats).replace(/[0-9]/g, "")) + t.quality;
    if (has4) result += "⁴";
    if (has2) result += "²";
    return result;
  }

  function formatLabel(text) {
    let html = text.replace(/⁴/g, "§4§").replace(/²/g, "§2§");
    if (html.includes("/")) {
      const parts = html.split("/");
      html = '<span style="color:#f87171">' + parts[0] + "</span>" +
             '<span style="color:#0f172a">/</span>' +
             '<span style="color:#38bdf8">' + parts[1] + "</span>";
    } else {
      html = '<span style="color:#f87171">' + html + "</span>";
    }
    return html
      .replace(/§4§/g, '<span style="font-size:0.75em;position:relative;top:-0.25em;">4</span>')
      .replace(/§2§/g, '<span style="font-size:0.75em;position:relative;top:-0.25em;">2</span>');
  }

  // ---------- Audio ----------
  const SAMPLE_BASE = "https://tonejs.github.io/audio/salamander/";
  const SAMPLE_NOTES = [
    "A0", "C1", "D#1", "F#1", "A1", "C2", "D#2", "F#2",
    "A2", "C3", "D#3", "F#3", "A3", "C4", "D#4", "F#4",
    "A4", "C5", "D#5", "F#5", "A5", "C6", "D#6", "F#6",
    "A6", "C7", "D#7", "F#7", "A7", "C8"
  ];
  const sampleBuffers = {};
  let audioCtx = null;
  let samplesLoading = false;
  let samplesReady = false;
  const pendingPlay = [];
  let activeVoices = [];
  let statusEl = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function unlockAudio() {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {}
  }
  document.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
  document.addEventListener("mousedown", unlockAudio, { once: true });

  function noteNameToMidi(note) {
    const name = note.replace(/[0-9]/g, "");
    const oct = parseInt(note.replace(/[^0-9]/g, ""), 10);
    return (oct + 1) * 12 + noteToPc[name];
  }

  function findClosestSample(note) {
    const midi = noteNameToMidi(note);
    let best = SAMPLE_NOTES[0], bestDist = Infinity;
    for (const s of SAMPLE_NOTES) {
      const d = Math.abs(noteNameToMidi(s) - midi);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    return best;
  }

  function loadSample(noteName) {
    return new Promise((resolve, reject) => {
      if (sampleBuffers[noteName]) { resolve(sampleBuffers[noteName]); return; }
      const fileName = noteName.replace("#", "s") + ".mp3";
      fetch(SAMPLE_BASE + fileName)
        .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
        .then(ab => getAudioCtx().decodeAudioData(ab))
        .then(buf => { sampleBuffers[noteName] = buf; resolve(buf); })
        .catch(err => { console.warn("Failed to load", noteName, err); reject(err); });
    });
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function ensureSamplesLoaded() {
    if (samplesReady) return Promise.resolve();
    if (samplesLoading) {
      return new Promise(resolve => {
        const check = setInterval(() => {
          if (samplesReady) { clearInterval(check); resolve(); }
        }, 40);
      });
    }
    samplesLoading = true;
    return Promise.all(SAMPLE_NOTES.map(n => loadSample(n).catch(() => null))).then(() => {
      samplesReady = true;
      samplesLoading = false;
      setStatus("");
      while (pendingPlay.length) playNotesNow(pendingPlay.shift());
    });
  }

  function stopAllVoices() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const fade = 0.12;
    activeVoices.forEach(v => {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0001), now);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        v.src.stop(now + fade + 0.02);
      } catch (e) {}
    });
    activeVoices = [];
  }

  function playSample(note, when, duration, peakGain) {
    const closest = findClosestSample(note);
    const buf = sampleBuffers[closest];
    if (!buf) return;
    const ctx = getAudioCtx();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (noteNameToMidi(note) - noteNameToMidi(closest)) / 12);
    const gain = ctx.createGain();
    const peak = peakGain != null ? peakGain : 0.28;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.setValueAtTime(peak, when + 1.1);
    gain.gain.linearRampToValueAtTime(0.0001, when + 1.8);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(when);
    src.stop(when + duration + 0.05);
    activeVoices.push({ src, gain });
  }

  function playNotesNow(notes) {
    stopAllVoices();
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const duration = 1.9;
    const counts = {};
    notes.forEach(n => {
      const pc = n.replace(/[0-9]/g, "");
      counts[pc] = (counts[pc] || 0) + 1;
    });
    notes.forEach(n => {
      const pc = n.replace(/[0-9]/g, "");
      const peak = counts[pc] > 1 ? 0.24 : 0.30;
      playSample(n, now, duration, peak);
    });
  }

  function playChordSound(ch, keyPc, useFlats) {
    unlockAudio();
    const notes = [...ch.left, ...ch.right].map(n => transposeNote(n, keyPc, useFlats));
    if (!samplesReady) {
      pendingPlay.push(notes);
      ensureSamplesLoaded();
      return;
    }
    playNotesNow(notes);
  }

  function playSingleNote(note) {
    unlockAudio();
    if (!samplesReady) {
      pendingPlay.push([note]);
      ensureSamplesLoaded();
      return;
    }
    stopAllVoices();
    playSample(note, getAudioCtx().currentTime, 1.9);
  }

  // Short synthesized metronome tick — no sample fetch needed.
  function playClick(when, accent) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = accent ? 1400 : 1000;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(accent ? 0.18 : 0.12, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 0.06);
  }

  // ---------- On-screen keyboard ----------
  let pianoEl = null;
  const OCTAVES = 5;
  const whiteNotes = ["C", "D", "E", "F", "G", "A", "B"];
  const whitePc = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const totalWhite = 7 * OCTAVES;
  const ww = 100 / totalWhite;
  let whiteEls = [], blackEls = [];
  let curKeyPc = 0, useFlats = false;

  function makeLabel(isWhite) {
    const s = document.createElement("span");
    // Font size moved out to styles.css (.key-label-white/.key-label-black)
    // so it can be bumped up on desktop only -- Chris, 2026-09-05: "on
    // desktop only, can you make the note names/number names any bigger?"
    s.className = "key-label " + (isWhite ? "key-label-white" : "key-label-black");
    s.style.cssText = `
      position: absolute;
      bottom: ${isWhite ? "4px" : "3px"};
      left: 0; right: 0;
      text-align: center;
      font-weight: 700;
      color: ${isWhite ? "#0f172a" : "#fff"};
      opacity: 0;
      pointer-events: none;
      line-height: 1;
      letter-spacing: -0.3px;
      z-index: 1;
    `;
    return s;
  }

  function makeFlashOverlay() {
    const d = document.createElement("div");
    d.className = "key-flash";
    d.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      opacity: 0;
      background: linear-gradient(#e5f2e8,#cfe3d4);
    `;
    return d;
  }

  function buildKeyboard(containerEl, statusElArg) {
    pianoEl = containerEl;
    statusEl = statusElArg || null;
    pianoEl.innerHTML = "";
    whiteEls = []; blackEls = [];

    for (let o = 0; o < OCTAVES; o++) {
      whiteNotes.forEach(n => {
        const el = document.createElement("div");
        el.style.cssText = "flex:1;background:linear-gradient(#fff,#f1f5f9);border:1px solid #cbd5e1;border-radius:0 0 5px 5px;position:relative;cursor:pointer;";
        el.dataset.pc = whitePc[n];
        el.dataset.oct = o;
        el.appendChild(makeFlashOverlay());
        el.appendChild(makeLabel(true));
        pianoEl.appendChild(el);
        whiteEls.push(el);
      });
    }
    const blackDefs = [
      { pc: 1, after: 0 }, { pc: 3, after: 1 },
      { pc: 6, after: 3 }, { pc: 8, after: 4 }, { pc: 10, after: 5 }
    ];
    for (let o = 0; o < OCTAVES; o++) {
      blackDefs.forEach(b => {
        const idx = o * 7 + b.after;
        const left = (idx + 1) * ww;
        const el = document.createElement("div");
        el.style.cssText = `position:absolute;left:${left}%;width:${ww * 0.62}%;height:58%;background:linear-gradient(#1e293b,#334155);border-radius:0 0 4px 4px;transform:translateX(-50%);z-index:2;border:1px solid #000;cursor:pointer;`;
        el.dataset.pc = b.pc;
        el.dataset.oct = o;
        el.appendChild(makeFlashOverlay());
        el.appendChild(makeLabel(false));
        pianoEl.appendChild(el);
        blackEls.push(el);
      });
    }

    let isDragging = false;
    const lastDragEl = { current: null };
    function triggerKey(el) {
      if (lastDragEl.current === el) return;
      lastDragEl.current = el;
      const pc = +el.dataset.pc;
      const oct = +el.dataset.oct + 2;
      // `name` feeds playSingleNote's noteToPc lookup below and must stay
      // the raw ASCII flatNames/sharpNames value — only the flashed on-key
      // label (pure display) gets the real ♭ (Chris, 2026-09-01).
      const name = (preferFlats.includes(pc) && useFlats) ? flatNames[pc] : sharpNames[pc];
      playSingleNote(name + oct);
      flashKey(el, toDisplayFlat(name));
    }
    function keyElAtPoint(x, y) {
      const target = document.elementFromPoint(x, y);
      if (!target) return null;
      return [...whiteEls, ...blackEls].find(e => e === target || e.contains(target));
    }
    [...whiteEls, ...blackEls].forEach(el => {
      el.addEventListener("mousedown", () => {
        isDragging = true;
        lastDragEl.current = null;
        triggerKey(el);
      });
      el.addEventListener("mouseenter", () => {
        if (isDragging) triggerKey(el);
      });
      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        isDragging = true;
        lastDragEl.current = null;
        triggerKey(el);
      }, { passive: false });
    });
    document.addEventListener("mouseup", () => { isDragging = false; lastDragEl.current = null; });
    pianoEl.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = keyElAtPoint(touch.clientX, touch.clientY);
      if (el) triggerKey(el);
    }, { passive: false });
    pianoEl.addEventListener("touchend", () => { isDragging = false; lastDragEl.current = null; });
  }

  function resetPiano() {
    whiteEls.forEach(el => {
      el.style.background = "linear-gradient(#fff,#f1f5f9)";
      el.querySelector("span").style.opacity = "0";
    });
    blackEls.forEach(el => {
      el.style.background = "linear-gradient(#1e293b,#334155)";
      el.querySelector("span").style.opacity = "0";
    });
  }

  function light(pc, oct, color, name, isWhite) {
    const list = isWhite ? whiteEls : blackEls;
    const el = list.find(e => +e.dataset.pc === pc && +e.dataset.oct === oct);
    if (!el) return;
    el.style.background = color;
    const s = el.querySelector("span");
    s.textContent = name;
    s.style.opacity = "1";
  }

  function flashKey(el, label) {
    const overlay = el.querySelector(".key-flash");
    const s = el.querySelector(".key-label");
    clearTimeout(el._flashTimeout);
    overlay.style.transition = "none";
    overlay.style.opacity = "1";
    s.textContent = label;
    s.style.opacity = "1";
    void overlay.offsetWidth;
    overlay.style.transition = "opacity 0.6s ease";
    overlay.style.opacity = "0";
    el._flashTimeout = setTimeout(() => { s.style.opacity = "0"; }, 600);
  }

  // Lights an arbitrary set of keys with custom labels/colors — used by the
  // Scales tab's "Choose a view" row, which needs to show many keys at once
  // (every octave of a scale, or a specific finger-numbered run) rather than
  // one chord's worth of notes. `entries`: [{ pc, oct, label, color }], oct
  // is the 0-4 on-screen keyboard octave index (same indexing renderChord
  // uses internally, i.e. note-octave minus 2).
  function renderScaleMap(entries) {
    resetPiano();
    entries.forEach(e => {
      const isWhite = [0, 2, 4, 5, 7, 9, 11].includes(e.pc);
      light(e.pc, e.oct, e.color, e.label, isWhite);
    });
  }

  // Lights the keyboard for a chord. `progIndex`/`stepIndex` are only used to
  // reproduce the original "either hand" purple-key special case.
  function renderChord(ch, keyPc, useFlatsArg, progIndex, stepIndex) {
    curKeyPc = keyPc;
    useFlats = useFlatsArg;
    resetPiano();
    const leftKeys = new Set();
    const rightKeys = new Set();
    const keyMeta = {};
    function keyId(pc, oct) { return pc + ":" + oct; }
    // `name` still keys noteToPc[] below (must stay ASCII) — only the copy
    // stored on keyMeta for the on-key label (drawn via light(), pure
    // display) gets the real ♭ (Chris, 2026-09-01).
    ch.left.forEach(note => {
      const tNote = transposeNote(note, keyPc, useFlatsArg);
      const name = tNote.replace(/[0-9]/g, "");
      const oct = parseInt(tNote.replace(/[^0-9]/g, ""), 10) - 2;
      const pc = noteToPc[name];
      const id = keyId(pc, oct);
      leftKeys.add(id);
      keyMeta[id] = { name: toDisplayFlat(name), pc, oct, isWhite: [0, 2, 4, 5, 7, 9, 11].includes(pc) };
    });
    ch.right.forEach(note => {
      const tNote = transposeNote(note, keyPc, useFlatsArg);
      const name = tNote.replace(/[0-9]/g, "");
      const oct = parseInt(tNote.replace(/[^0-9]/g, ""), 10) - 2;
      const pc = noteToPc[name];
      const id = keyId(pc, oct);
      rightKeys.add(id);
      keyMeta[id] = { name: toDisplayFlat(name), pc, oct, isWhite: [0, 2, 4, 5, 7, 9, 11].includes(pc) };
    });
    const allIds = new Set([...leftKeys, ...rightKeys]);
    const usePurple = (progIndex === 3 && stepIndex === 7 && (keyPc === 10 || keyPc === 11));
    allIds.forEach(id => {
      const m = keyMeta[id];
      const inL = leftKeys.has(id);
      const inR = rightKeys.has(id);
      let color;
      if (inL && inR && usePurple) color = "linear-gradient(#e9d5ff,#c084fc)";
      else if (inL && inR) color = "linear-gradient(#fca5a5,#f87171)";
      else if (inL) color = "linear-gradient(#7dd3fc,#38bdf8)";
      else color = "linear-gradient(#fca5a5,#f87171)";
      light(m.pc, m.oct, color, m.name, m.isWhite);
    });
    return { usePurple };
  }

  // ---------- Play-through sequencer ----------
  let playThroughState = null;

  function isPlaying() {
    return !!playThroughState;
  }

  function stopPlayThrough() {
    if (playThroughState) {
      playThroughState.stopped = true;
      clearTimeout(playThroughState.timeoutId);
      playThroughState = null;
    }
  }

  // Live-adjust bpm/loop/click/progArray/keyPc on a running play-through
  // without restarting it. Switching progArray mid-flight keeps the current
  // stepIndex (clamped into range if the new progression is shorter) so the
  // beat position never resets — the next scheduled step just plays the new
  // content at the same position in the sequence.
  function updatePlayback(patch) {
    if (!playThroughState) return;
    Object.assign(playThroughState, patch);
    if (patch.progArray && playThroughState.stepIndex > patch.progArray.length - 1) {
      playThroughState.stepIndex = patch.progArray.length - 1;
    }
  }

  // opts: { bpm, loop, click, beatsPerChord, onStep(index), onDone() }
  // Loop mode "bounces" up and down the progression (1,2,...8,7,...1,2,...)
  // rather than jumping back to step 0, and bpm/loop/click/progArray/keyPc
  // can all be changed live via updatePlayback() while this is running —
  // progArray/keyPc/useFlats live on the state object (not captured in a
  // closure) specifically so a key or progression switch mid-playback takes
  // effect on the next scheduled step rather than cutting playback off.
  function playThrough(progArray, keyPc, useFlatsArg, opts) {
    stopPlayThrough();
    const state = {
      stopped: false,
      timeoutId: null,
      bpm: opts.bpm || 80,
      loop: !!opts.loop,
      click: !!opts.click,
      beatsPerChord: opts.beatsPerChord || 2,
      // Scales-only (Chris, 2026-09-05: "the click on the scales tab needs
      // to be half what it is...no accents, just half...not slow down the
      // scales, just make the click not on every note, every other note")
      // -- since each scale note is already its own step, this just skips
      // the click on every other step instead of looping beatsPerChord
      // times per step like Chords/Progressions below.
      halfClick: !!opts.halfClick,
      direction: 1,
      stepIndex: 0,
      progArray: progArray,
      keyPc: keyPc,
      useFlats: useFlatsArg
    };
    playThroughState = state;

    function scheduleStep() {
      if (state.stopped) return;
      const ch = state.progArray[state.stepIndex];
      opts.onStep && opts.onStep(state.stepIndex);
      playChordSound(ch, state.keyPc, state.useFlats);
      const secPerBeat = 60 / state.bpm;
      if (state.click) {
        const ctx = getAudioCtx();
        if (state.halfClick) {
          if (state.stepIndex % 2 === 0) playClick(ctx.currentTime, false);
        } else {
          for (let b = 0; b < state.beatsPerChord; b++) {
            playClick(ctx.currentTime + b * secPerBeat, b === 0);
          }
        }
      }
      let next = state.stepIndex + state.direction;
      if (next < 0 || next >= state.progArray.length) {
        if (state.loop) {
          state.direction *= -1;
          next = state.stepIndex + state.direction;
        } else {
          playThroughState = null;
          opts.onDone && opts.onDone();
          return;
        }
      }
      state.stepIndex = next;
      state.timeoutId = setTimeout(scheduleStep, secPerBeat * state.beatsPerChord * 1000);
    }
    scheduleStep();
    return state;
  }

  global.WPL_ENGINE = {
    transposeNote,
    transposeChordName,
    formatLabel,
    toDisplayFlat,
    buildKeyboard,
    resetPiano,
    renderChord,
    renderScaleMap,
    playChordSound,
    playSingleNote,
    playThrough,
    stopPlayThrough,
    updatePlayback,
    isPlaying,
    ensureSamplesLoaded,
    get samplesReady() { return samplesReady; }
  };
})(window);
