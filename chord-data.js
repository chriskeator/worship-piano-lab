/* Worship Piano Lab — chord & scale data
 * All progressions are voiced in the key of C; the piano engine transposes
 * them live to whichever key is selected. Do not change existing voicings
 * without confirming with Chris first — they were hand-picked for sound.
 */
(function (global) {
  const progressionNames = [
    "Foundation",
    "Smooth Transitions",
    "Soft & Intimate",
    "Big & Dynamic",
    "Full & Layered"
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

  const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const flatNames  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const preferFlats = [1, 3, 5, 8, 10];
  const noteToPc = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4,
    "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10, "B": 11
  };
  const keyList = [
    { pc: 0, label: "C" }, { pc: 2, label: "D" }, { pc: 4, label: "E" },
    { pc: 5, label: "F" }, { pc: 7, label: "G" }, { pc: 9, label: "A" },
    { pc: 11, label: "B" }, { pc: 1, label: "Db" }, { pc: 3, label: "Eb" },
    { pc: 6, label: "F#" }, { pc: 8, label: "Ab" }, { pc: 10, label: "Bb" }
  ];

  global.WPL_DATA = {
    progressionNames,
    progressionBlurbs,
    allProgs,
    sharpNames,
    flatNames,
    preferFlats,
    noteToPc,
    keyList
  };
})(window);
