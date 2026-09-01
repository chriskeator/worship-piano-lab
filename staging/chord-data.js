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
    "Big",
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

  // ---------- Scales (Practice tab) ----------
  // Written in the key of C, same convention as the chord voicings above —
  // piano-engine.js transposes live to the selected key. Right hand starts
  // at C3 (not C4) specifically so a 3-octave run still tops out at C6,
  // which stays inside the on-screen keyboard's 5-octave range (note
  // octaves 2-6, see piano-engine.js renderChord's "oct - 2" mapping).
  // Both-hands mode shadows the right hand exactly one octave down.
  const MAJOR_SCALE_NOTE_ORDER = ["C", "D", "E", "F", "G", "A", "B"];
  const SCALE_RIGHT_BASE_OCTAVE = 3;

  function buildMajorScaleAscent(octaves) {
    const ascent = [];
    for (let oct = 0; oct < octaves; oct++) {
      MAJOR_SCALE_NOTE_ORDER.forEach(name => ascent.push({ name, octaveOffset: oct }));
    }
    ascent.push({ name: "C", octaveOffset: octaves }); // top root
    return ascent;
  }

  // direction: "up" | "down" | "updown". hands: "right" | "both".
  // Returns chord-shaped {name, left, right} steps — same shape as a
  // progression/chord-position array — so it drops straight into the
  // existing playThrough/playChordSound/renderChord engine with no changes.
  function buildScaleSteps(octaves, direction, hands) {
    const ascent = buildMajorScaleAscent(octaves);
    let seq = ascent;
    if (direction === "down") {
      seq = [...ascent].reverse();
    } else if (direction === "updown") {
      seq = [...ascent, ...[...ascent].slice(0, -1).reverse()];
    }
    return seq.map(step => {
      const rightOct = SCALE_RIGHT_BASE_OCTAVE + step.octaveOffset;
      return {
        name: step.name,
        right: [step.name + rightOct],
        left: hands === "both" ? [step.name + (rightOct - 1)] : []
      };
    });
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
    buildScaleSteps
  };
})(window);
