/* Worship Piano Lab — chord & scale data
 * All progressions are voiced in the key of C; the piano engine transposes
 * them live to whichever key is selected. Do not change existing voicings
 * without confirming with Chris first — they were hand-picked for sound.
 */
(function (global) {
  const progressionNames = [
    "Foundation",
    "Smooth",
    "Soft",
    "Loud",
    "Full"
  ];

  const progressionBlurbs = [
    "Solid triads. Learn the map of the keys first.",
    "Add motion between chords with smoother voice leading.",
    "Simple two-note voicings for a soft, intimate feel.",
    "Bigger, doubled voicings for a fuller, more dynamic sound.",
    "Four-note extended voicings for a rich, layered sound."
  ];

  const prog1 = [
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C2", "C3"], right: ["E4", "G4", "C5"] },
    { bottomLabel: "2m",  topLabel: "4/2", name: "F/D", left: ["D2", "D3"], right: ["F4", "A4", "C5"] },
    { bottomLabel: "1/3", topLabel: "1/3", name: "C/E", left: ["E2", "E3"], right: ["E4", "G4", "C5"] },
    { bottomLabel: "4",   topLabel: "4",   name: "F",   left: ["F2", "F3"], right: ["F4", "A4", "C5"] },
    { bottomLabel: "5",   topLabel: "5",   name: "G",   left: ["G2", "G3"], right: ["D4", "G4", "B4"] },
    { bottomLabel: "6m",  topLabel: "1/6", name: "C/A", left: ["A2", "A3"], right: ["E4", "G4", "C5"] },
    { bottomLabel: "5/7", topLabel: "5/7", name: "G/B", left: ["B2", "B3"], right: ["D4", "G4", "B4"] },
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C3", "C4"], right: ["E4", "G4", "C5"] }
  ];

  const prog2 = [
    { bottomLabel: "1",   topLabel: "1",     name: "C",     left: ["C2", "C3"], right: ["C5", "E5", "G5"] },
    { bottomLabel: "2m",  topLabel: "1⁴/2", name: "C⁴/D", left: ["D2", "D3"], right: ["C5", "F5", "G5"] },
    { bottomLabel: "1/3", topLabel: "1/3",   name: "C/E",   left: ["E2", "E3"], right: ["C5", "E5", "G5"] },
    { bottomLabel: "4",   topLabel: "1⁴/4", name: "C⁴/F", left: ["F2", "F3"], right: ["C5", "F5", "G5"] },
    { bottomLabel: "5",   topLabel: "1²/5", name: "C²/G", left: ["G2", "G3"], right: ["C5", "D5", "G5"] },
    { bottomLabel: "6m",  topLabel: "1/6",   name: "C/A",   left: ["A2", "A3"], right: ["C5", "E5", "G5"] },
    { bottomLabel: "5/7", topLabel: "1²/7", name: "C²/B", left: ["B2", "B3"], right: ["C5", "D5", "G5"] },
    { bottomLabel: "1",   topLabel: "1",     name: "C",     left: ["C3", "C4"], right: ["C5", "E5", "G5"] }
  ];

  // Soft (progression 3) uses only the top bass note, not the octave pair
  // every other progression doubles -- Chris, 2026-09-05: "on progressions
  // 3 - remove the lower bass octave. it's soft and we only need the top
  // bass note on this."
  const prog3 = [
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C3"], right: ["G3", "E4"] },
    { bottomLabel: "2m",  topLabel: "4/2", name: "Dm",  left: ["D3"], right: ["A3", "F4"] },
    { bottomLabel: "1/3", topLabel: "1/3", name: "C/E", left: ["E3"], right: ["C4", "G4"] },
    { bottomLabel: "4",   topLabel: "4",   name: "F",   left: ["F3"], right: ["C4", "A4"] },
    { bottomLabel: "5",   topLabel: "5",   name: "G",   left: ["G3"], right: ["D4", "B4"] },
    { bottomLabel: "6m",  topLabel: "1/6", name: "Am",  left: ["A3"], right: ["E4", "C5"] },
    { bottomLabel: "5/7", topLabel: "5/7", name: "G/B", left: ["B3"], right: ["G4", "D5"] },
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C4"], right: ["G4", "E5"] }
  ];

  const prog4 = [
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C2", "C3"], right: ["C4", "G4", "C5"] },
    { bottomLabel: "2m",  topLabel: "4/2", name: "F/D", left: ["D2", "D3"], right: ["C4", "F4", "C5"] },
    { bottomLabel: "1/3", topLabel: "1/3", name: "C/E", left: ["E2", "E3"], right: ["C4", "G4", "C5"] },
    { bottomLabel: "4",   topLabel: "4",   name: "F",   left: ["F2", "F3"], right: ["C4", "F4", "C5"] },
    { bottomLabel: "5",   topLabel: "5",   name: "G",   left: ["G2", "G3"], right: ["D4", "G4", "D5"] },
    { bottomLabel: "6m",  topLabel: "1/6", name: "C/A", left: ["A2", "A3"], right: ["C4", "G4", "C5"] },
    { bottomLabel: "5/7", topLabel: "5/7", name: "G/B", left: ["B2", "B3"], right: ["D4", "G4", "D5"] },
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C3", "C4"], right: ["C4", "G4", "C5"] }
  ];

  const prog5 = [
    { bottomLabel: "1",   topLabel: "1",     name: "C",     left: ["C2", "C3"], right: ["G4", "C5", "E5", "G5"] },
    { bottomLabel: "2m",  topLabel: "4²/2", name: "F²/D", left: ["D2", "D3"], right: ["A4", "C5", "F5", "G5"] },
    { bottomLabel: "1/3", topLabel: "1/3",   name: "C/E",   left: ["E2", "E3"], right: ["G4", "C5", "E5", "G5"] },
    { bottomLabel: "4",   topLabel: "4²",    name: "F²",    left: ["F2", "F3"], right: ["A4", "C5", "F5", "G5"] },
    { bottomLabel: "5",   topLabel: "5⁴",    name: "G⁴",    left: ["G2", "G3"], right: ["G4", "C5", "D5", "G5"] },
    { bottomLabel: "6m",  topLabel: "1/6",   name: "C/A",   left: ["A2", "A3"], right: ["G4", "C5", "E5", "G5"] },
    { bottomLabel: "5/7", topLabel: "5⁴/7", name: "G⁴/B", left: ["B2", "B3"], right: ["G4", "C5", "D5", "G5"] },
    { bottomLabel: "1",   topLabel: "1",     name: "C",     left: ["C3", "C4"], right: ["G4", "C5", "E5", "G5"] }
  ];

  const allProgs = [prog1, prog2, prog3, prog4, prog5];

  // ---------- Chords tab ----------
  // Chord dictionary: any root x any quality x any position. Voiced in the
  // key of C, same as the progressions above — piano-engine's transposeNote
  // moves each shape to whichever root is selected via the shared key-tabs.
  // Left hand always anchors the chord's root note (Chris's "left hand is
  // the bass player" rule) — only the right hand changes across positions.
  const chordQualityNames = ["Major", "Minor", "Sus2", "Sus4", "Maj7", "Min7"];
  const chordQualitySuffix = { Major: "", Minor: "m", Sus2: "2", Sus4: "4", Maj7: "maj7", Min7: "m7" };
  // Full words (not "Inv" abbreviations), per Chris 2026-08-31 — ui.js
  // splits each label on its first space and renders it as two stacked
  // lines on the button ("1st" / "Inversion"), so every entry here must be
  // exactly two words.
  const chordPositionNames = ["Root Low", "1st Inversion", "2nd Inversion", "Root High"];
  // A 4-note 7th chord actually has a 4th inversion (bass on the 7th) where
  // a 3-note triad only has "root voiced an octave up" to fill that 4th
  // slot — so Maj7/Min7 reuse the same 4-button position row but swap its
  // last label/voicing to a real 3rd Inversion instead (Chris, 2026-08-30:
  // "just change Root High to 3rd Inv when you click on the Maj7 or Min7
  // tabs"). ui.js's getChordPositionNames(quality) is what picks between
  // these two arrays — never read chordPositionNames directly for a
  // quality-aware UI spot, always go through that helper.
  const chordPositionNamesSeventh = ["Root Low", "1st Inversion", "2nd Inversion", "3rd Inversion"];
  const seventhQualities = ["Maj7", "Min7"];

  const chordVoicings = {
    Major: [
      { name: "C", left: ["C2", "C3"], right: ["C4", "E4", "G4"] },
      { name: "C", left: ["C2", "C3"], right: ["E4", "G4", "C5"] },
      { name: "C", left: ["C2", "C3"], right: ["G4", "C5", "E5"] },
      { name: "C", left: ["C2", "C3"], right: ["C5", "E5", "G5"] }
    ],
    Minor: [
      { name: "Cm", left: ["C2", "C3"], right: ["C4", "Eb4", "G4"] },
      { name: "Cm", left: ["C2", "C3"], right: ["Eb4", "G4", "C5"] },
      { name: "Cm", left: ["C2", "C3"], right: ["G4", "C5", "Eb5"] },
      { name: "Cm", left: ["C2", "C3"], right: ["C5", "Eb5", "G5"] }
    ],
    Sus2: [
      { name: "C2", left: ["C2", "C3"], right: ["C4", "D4", "G4"] },
      { name: "C2", left: ["C2", "C3"], right: ["D4", "G4", "C5"] },
      { name: "C2", left: ["C2", "C3"], right: ["G4", "C5", "D5"] },
      { name: "C2", left: ["C2", "C3"], right: ["C5", "D5", "G5"] }
    ],
    Sus4: [
      { name: "C4", left: ["C2", "C3"], right: ["C4", "F4", "G4"] },
      { name: "C4", left: ["C2", "C3"], right: ["F4", "G4", "C5"] },
      { name: "C4", left: ["C2", "C3"], right: ["G4", "C5", "F5"] },
      { name: "C4", left: ["C2", "C3"], right: ["C5", "F5", "G5"] }
    ],
    // Chris plays these a lot (4maj7, 2m7, 6m7 in his progressions) —
    // added 2026-08-30. Same left-hand-anchors-root convention as every
    // other quality; right hand is the full 4-note 7th chord stack, one
    // true inversion per position (see chordPositionNamesSeventh above).
    Maj7: [
      { name: "Cmaj7", left: ["C2", "C3"], right: ["C4", "E4", "G4", "B4"] },
      { name: "Cmaj7", left: ["C2", "C3"], right: ["E4", "G4", "B4", "C5"] },
      { name: "Cmaj7", left: ["C2", "C3"], right: ["G4", "B4", "C5", "E5"] },
      { name: "Cmaj7", left: ["C2", "C3"], right: ["B4", "C5", "E5", "G5"] }
    ],
    Min7: [
      { name: "Cm7", left: ["C2", "C3"], right: ["C4", "Eb4", "G4", "Bb4"] },
      { name: "Cm7", left: ["C2", "C3"], right: ["Eb4", "G4", "Bb4", "C5"] },
      { name: "Cm7", left: ["C2", "C3"], right: ["G4", "Bb4", "C5", "Eb5"] },
      { name: "Cm7", left: ["C2", "C3"], right: ["Bb4", "C5", "Eb5", "G5"] }
    ]
  };

  const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const flatNames  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const preferFlats = [1, 3, 5, 8, 10];
  const noteToPc = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4,
    "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10, "B": 11
  };
  // Chris, 2026-09-01: "the flat character on the Min7 buttons is a real
  // flat character... on the 5 buttons of flats it looks like just a 'b'
  // symbol" — these are pure display labels (never used for lookups; `pc`
  // is what the rest of the app keys off of), so switching them to the
  // real ♭ (U+266D) is a safe, display-only change. F# is left as "F#"
  // (a sharp, not a flat — not part of what was asked).
  const keyList = [
    { pc: 0, label: "C" }, { pc: 2, label: "D" }, { pc: 4, label: "E" },
    { pc: 5, label: "F" }, { pc: 7, label: "G" }, { pc: 9, label: "A" },
    { pc: 11, label: "B" }, { pc: 1, label: "D♭" }, { pc: 3, label: "E♭" },
    // Real ♯ glyph (was plain ASCII "#") -- Chris, 2026-09-05: this was the
    // one key tab still showing a keyboard "#" while every flat key tab
    // here already stored the real ♭ symbol directly. parseLetterAccidental
    // above accepts this glyph too, so the scale-spelling math for this key
    // is unaffected.
    { pc: 6, label: "F♯" }, { pc: 8, label: "A♭" }, { pc: 10, label: "B♭" }
  ];

  // ---------- Scales tab ----------
  // Written in the key of C, same convention as the chord voicings above —
  // piano-engine.js transposes live to the selected key.
  //
  // `tones` is one octave's worth of scale-tone note names + Nashville-style
  // degree labels, in ascending order starting on the root — this is both
  // (a) what "Note Names"/"Scale Degrees" light up identically in every
  // octave across the keyboard, and (b) the raw material buildScaleAscent
  // below cycles through to generate a multi-octave run for the RH/LH
  // fingering views.
  //
  // `rhFingers`/`lhFingers` are keyed by root key label (matching keyList's
  // own `label` strings above), each holding one finger-number array per
  // octave count. Every array's length matches the note sequence
  // buildScaleAscent produces for that scale/octave count (7 or 6 or 5
  // tones/octave + 1 trailing top root) -- entries are `null` until a real
  // finger number is filled in.
  //
  // Cleared 2026-09-05 -- Chris: "delete all of the LH RH numbers. I'm
  // going to go through this tomorrow one by one and fill them in. it's
  // hard to have them all filled in and then find the incorrect ones."
  // Every key/scale/hand/octave combination below is a blank slate (all
  // `null`) so he can re-enter each one deliberately rather than hunting
  // for wrong values mixed in with right ones.
  const SCALE_DEFS = {
    major: {
      displayName: "Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "E", degree: "3" },
        { note: "F", degree: "4" }, { note: "G", degree: "5" }, { note: "A", degree: "6" },
        { note: "B", degree: "7" }
      ],
      rhFingers: {
        "C": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
        "D♭": { 1: [2, 3, 1, 2, 3, 4, 1, 2], 2: [2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2] },
        "D": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
        "E♭": { 1: [3, 1, 2, 3, 4, 1, 2, 3], 2: [3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3] },
        "E": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
        "F": { 1: [1, 2, 3, 4, 1, 2, 3, 4], 2: [1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4] },
        "F♯": { 1: [2, 3, 4, 1, 2, 3, 1, 2], 2: [2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2] },
        "G": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
        "A♭": { 1: [3, 4, 1, 2, 3, 1, 2, 3], 2: [3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3] },
        "A": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
        "B♭": { 1: [2, 1, 2, 3, 1, 2, 3, 4], 2: [2, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4] },
        "B": { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
      }
    },
    minor: {
      displayName: "Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "Eb", degree: "♭3" },
        { note: "F", degree: "4" }, { note: "G", degree: "5" }, { note: "Ab", degree: "♭6" },
        { note: "Bb", degree: "♭7" }
      ],
      rhFingers: {
        "C": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] }
      }
    },
    pentMajor: {
      displayName: "Pentatonic Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "E", degree: "3" },
        { note: "G", degree: "5" }, { note: "A", degree: "6" }
      ],
      rhFingers: {
        "C": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] }
      }
    },
    pentMinor: {
      displayName: "Pentatonic Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "Eb", degree: "♭3" }, { note: "F", degree: "4" },
        { note: "G", degree: "5" }, { note: "Bb", degree: "♭7" }
      ],
      rhFingers: {
        "C": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null] }
      }
    },
    bluesMajor: {
      displayName: "Blues Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "Eb", degree: "♭3" },
        { note: "E", degree: "3" }, { note: "G", degree: "5" }, { note: "A", degree: "6" }
      ],
      rhFingers: {
        "C": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] }
      }
    },
    bluesMinor: {
      displayName: "Blues Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "Eb", degree: "♭3" }, { note: "F", degree: "4" },
        { note: "Gb", degree: "♭5" }, { note: "G", degree: "5" }, { note: "Bb", degree: "♭7" }
      ],
      rhFingers: {
        "C": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] }
      },
      lhFingers: {
        "C": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "D": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "E": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "F♯": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "G": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "A": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B♭": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] },
        "B": { 1: [null, null, null, null, null, null, null], 2: [null, null, null, null, null, null, null, null, null, null, null, null, null] }
      }
    }
  };

  // Cycles a scale's one-octave `tones` across `octaves` octaves and caps it
  // with the top root — e.g. major/2 -> 15 entries (7+7+1), pentMajor/2 -> 11
  // (5+5+1) — matching every rhFingers/lhFingers array's length above.
  function buildScaleAscent(scaleKey, octaves) {
    const def = SCALE_DEFS[scaleKey];
    const ascent = [];
    for (let oct = 0; oct < octaves; oct++) {
      def.tones.forEach(t => ascent.push({ name: t.note, octaveOffset: oct }));
    }
    ascent.push({ name: def.tones[0].note, octaveOffset: octaves }); // top root
    return ascent;
  }

  function degreeLabelForNote(scaleKey, name) {
    const t = SCALE_DEFS[scaleKey].tones.find(t => t.note === name);
    return t ? t.degree : "1";
  }

  // Looks up a finger-number array, handling both shapes rhFingers/
  // lhFingers can currently take: per-key (an object of rootLabel ->
  // {1:[...],2:[...]}, e.g. major's rhFingers) or scale-type-wide (a flat
  // {1:[...],2:[...]} shared by every key, for any hand/scale-type
  // combination that doesn't have real per-key numbers yet -- see the
  // SCALE_DEFS comment above). `rootLabel` is one of keyList's own label
  // strings ("C", "D♭", ...); table[rootLabel] is undefined on a flat
  // table (whose only keys are the octave numbers 1/2), so this falls
  // through to the flat table itself in that case -- one lookup works for
  // both shapes without the caller needing to know which one it's getting.
  function getFingers(scaleKey, hand, rootLabel, octaves) {
    const table = SCALE_DEFS[scaleKey][hand + "Fingers"];
    const perKey = table[rootLabel] || table;
    return perKey[octaves];
  }

  // ---------- Correct scale-tone spelling in any of the 12 keys ----------
  // Chris, 2026-09-04/05: the Note Names view was spelling minor-scale
  // "flat" degrees (b3/b6/b7 etc) as sharps in some keys, and separately
  // spelling the plain Major scale wrong in F/Db/Eb/Ab/Bb. Root cause: note
  // names were being picked from a single global sharp-or-flat table keyed
  // only off which KEY is selected (or, briefly, off whether the tone's own
  // C-written spelling happened to contain a "b"), neither of which is how
  // real key spelling works. A scale's letter names always run through each
  // of the 7 letters once with no repeats/skips (its "shape" — how many
  // letters up from the root each degree is — is fixed no matter the key),
  // and the ACCIDENTAL on each letter is whatever's needed to land on the
  // right pitch, which can be a flat, a sharp, or nothing depending on the
  // key: e.g. F minor's b3 is Ab (letter must be A, the 3rd letter from F),
  // while E minor's b3 is G natural (E major's 3rd is G#, so lowering it a
  // semitone removes the sharp instead of adding a flat).
  const NATURAL_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const NATURAL_LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function parseLetterAccidental(noteStr) {
    const letter = noteStr[0];
    let acc = 0;
    if (noteStr.length > 1) {
      const c = noteStr[1];
      // Accepts both the ASCII "#" every SCALE_DEFS tone still uses AND the
      // real ♯ (U+266F) -- keyList's F# entry now stores the real glyph
      // directly (matching how its flat siblings already store real ♭),
      // and that label is what spellScaleToneInKey's rootLabel comes from
      // (Chris, 2026-09-05, from the key tab still showing a plain
      // keyboard "#" while every flat key tab showed the real symbol).
      if (c === "#" || c === "♯") acc = 1;
      else if (c === "b" || c === "♭") acc = -1;
    }
    return { letter, acc };
  }

  // How many letters up from the root (0-6) a scale tone sits, and how many
  // semitones up from the root it sits -- both fixed, key-independent
  // properties of the scale's shape, read directly off its C-written tones
  // (root=C=letter index 0, so a tone's own letter index IS its letterOffset,
  // and its own pc IS its semitoneOffset).
  function toneShape(noteInC) {
    const { letter, acc } = parseLetterAccidental(noteInC);
    return {
      letterOffset: NATURAL_LETTERS.indexOf(letter),
      semitoneOffset: (NATURAL_LETTER_PC[letter] + acc + 12) % 12
    };
  }

  // Spells a scale tone (given as a letter/semitone offset from the root --
  // see toneShape above) correctly for any root key label from keyList
  // ("C", "F#", "B♭", ...). Returns both the correctly-spelled name (ASCII
  // "b" for flats -- pass through toDisplayFlat for the real ♭ glyph) and
  // its pitch class (for lighting the right piano key).
  function spellScaleTone(rootLabel, letterOffset, semitoneOffset) {
    const root = parseLetterAccidental(rootLabel);
    const rootLetterIdx = NATURAL_LETTERS.indexOf(root.letter);
    const targetLetter = NATURAL_LETTERS[(rootLetterIdx + letterOffset) % 7];
    const rootPc = (NATURAL_LETTER_PC[root.letter] + root.acc + 12) % 12;
    const targetPc = (rootPc + semitoneOffset) % 12;
    let accidental = targetPc - NATURAL_LETTER_PC[targetLetter];
    if (accidental > 6) accidental -= 12;
    if (accidental < -6) accidental += 12;
    // A note that lands on a WHITE key is always shown as that plain
    // natural letter, never an accidental on a neighboring letter -- Chris,
    // 2026-09-05: "the white notes can never be labeled as a flat. Cb needs
    // to always be a B and Fb needs to always be an E. same with any other
    // white notes that are incorrectly labeled as flats." Strict letter-
    // progression theory can spell a white key as Cb/Fb or even a double
    // flat (Bbb, Abb, Ebb), but that's needless confusion once it's
    // physically a plain white key with no black key involved -- applies
    // the same way to the sharp mirror image (E#, B#) for consistency.
    if (accidental !== 0) {
      const naturalLetter = NATURAL_LETTERS.find(l => NATURAL_LETTER_PC[l] === targetPc);
      if (naturalLetter) return { name: naturalLetter, pc: targetPc };
    }
    const accStr = accidental > 0 ? "#".repeat(accidental) : accidental < 0 ? "b".repeat(-accidental) : "";
    return { name: targetLetter + accStr, pc: targetPc };
  }

  // Convenience: spell a scale tone that's written in C (i.e. one of
  // SCALE_DEFS's own `tones[].note` values) in whatever key is selected.
  function spellScaleToneInKey(noteInC, rootLabel) {
    const shape = toneShape(noteInC);
    return spellScaleTone(rootLabel, shape.letterOffset, shape.semitoneOffset);
  }

  global.WPL_DATA = {
    progressionNames,
    progressionBlurbs,
    allProgs,
    sharpNames,
    flatNames,
    preferFlats,
    noteToPc,
    keyList,
    chordQualityNames,
    chordQualitySuffix,
    chordPositionNames,
    chordPositionNamesSeventh,
    seventhQualities,
    chordVoicings,
    scaleDefs: SCALE_DEFS,
    buildScaleAscent,
    degreeLabelForNote,
    spellScaleToneInKey,
    getFingers
  };
})(window);
