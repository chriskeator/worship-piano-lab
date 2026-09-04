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

  const prog3 = [
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C2", "C3"], right: ["G3", "E4"] },
    { bottomLabel: "2m",  topLabel: "4/2", name: "Dm",  left: ["D2", "D3"], right: ["A3", "F4"] },
    { bottomLabel: "1/3", topLabel: "1/3", name: "C/E", left: ["E2", "E3"], right: ["C4", "G4"] },
    { bottomLabel: "4",   topLabel: "4",   name: "F",   left: ["F2", "F3"], right: ["C4", "A4"] },
    { bottomLabel: "5",   topLabel: "5",   name: "G",   left: ["G2", "G3"], right: ["D4", "B4"] },
    { bottomLabel: "6m",  topLabel: "1/6", name: "Am",  left: ["A2", "A3"], right: ["E4", "C5"] },
    { bottomLabel: "5/7", topLabel: "5/7", name: "G/B", left: ["B2", "B3"], right: ["G4", "D5"] },
    { bottomLabel: "1",   topLabel: "1",   name: "C",   left: ["C3", "C4"], right: ["G4", "E5"] }
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
    { pc: 6, label: "F#" }, { pc: 8, label: "A♭" }, { pc: 10, label: "B♭" }
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
  // `rhFingers`/`lhFingers` are Chris's exact finger-number sequences
  // (2026-09-04), one array per octave count, each already verified to be
  // the same length as the note sequence buildScaleAscent produces for that
  // scale/octave count (7 or 6 tones/octave + 1 trailing top root) — except
  // pentMajor/pentMinor's 2-octave LH, which Chris sourced from Google and
  // flagged as unverified; both came in one finger too long (12 vs the
  // expected 11), so the trailing extra digit is dropped here to keep the
  // note/finger arrays aligned. Chris confirmed the RH numbers are all
  // correct and asked not to worry about correctness of LH beyond that.
  const SCALE_DEFS = {
    major: {
      displayName: "Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "E", degree: "3" },
        { note: "F", degree: "4" }, { note: "G", degree: "5" }, { note: "A", degree: "6" },
        { note: "B", degree: "7" }
      ],
      rhFingers: { 1: [1, 2, 3, 1, 2, 3, 4, 5], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5] },
      lhFingers: { 1: [5, 4, 3, 2, 1, 3, 2, 1], 2: [5, 4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1] }
    },
    minor: {
      displayName: "Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "Eb", degree: "♭3" },
        { note: "F", degree: "4" }, { note: "G", degree: "5" }, { note: "Ab", degree: "♭6" },
        { note: "Bb", degree: "♭7" }
      ],
      rhFingers: { 1: [1, 2, 3, 1, 2, 3, 4, 1], 2: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1] },
      lhFingers: { 1: [4, 3, 2, 1, 3, 2, 1, 4], 2: [4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1, 4] }
    },
    pentMajor: {
      displayName: "Pentatonic Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "E", degree: "3" },
        { note: "G", degree: "5" }, { note: "A", degree: "6" }
      ],
      rhFingers: { 1: [1, 2, 3, 1, 3, 5], 2: [1, 2, 3, 1, 3, 1, 2, 3, 1, 3, 5] },
      lhFingers: { 1: [5, 4, 3, 2, 1, 2], 2: [5, 4, 3, 2, 1, 3, 2, 1, 3, 2, 1] }
    },
    pentMinor: {
      displayName: "Pentatonic Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "Eb", degree: "♭3" }, { note: "F", degree: "4" },
        { note: "G", degree: "5" }, { note: "Bb", degree: "♭7" }
      ],
      rhFingers: { 1: [1, 3, 1, 2, 3, 5], 2: [1, 3, 1, 2, 3, 1, 3, 1, 2, 3, 5] },
      lhFingers: { 1: [5, 4, 3, 2, 1, 2], 2: [5, 4, 3, 2, 1, 3, 2, 1, 3, 2, 1] }
    },
    bluesMajor: {
      displayName: "Blues Major",
      tones: [
        { note: "C", degree: "1" }, { note: "D", degree: "2" }, { note: "D#", degree: "♭3" },
        { note: "E", degree: "3" }, { note: "G", degree: "5" }, { note: "A", degree: "6" }
      ],
      rhFingers: { 1: [1, 2, 3, 1, 2, 3, 5], 2: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 5] },
      lhFingers: { 1: [5, 4, 3, 2, 1, 2, 1], 2: [5, 4, 3, 2, 1, 2, 1, 4, 3, 2, 1, 2, 1] }
    },
    bluesMinor: {
      displayName: "Blues Minor",
      tones: [
        { note: "C", degree: "1" }, { note: "Eb", degree: "♭3" }, { note: "F", degree: "4" },
        { note: "F#", degree: "♭5" }, { note: "G", degree: "5" }, { note: "Bb", degree: "♭7" }
      ],
      rhFingers: { 1: [1, 2, 3, 4, 1, 3, 5], 2: [1, 2, 3, 4, 1, 3, 1, 2, 3, 4, 1, 3, 5] },
      lhFingers: { 1: [5, 4, 3, 2, 1, 2, 1], 2: [5, 4, 3, 2, 1, 2, 1, 4, 3, 2, 1, 2, 1] }
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
    degreeLabelForNote
  };
})(window);
