"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { renderIcon } from "@/app/lib/renderIcon";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALES: Record<string, { name: string; intervals: number[] }> = {
  major: { name: "Maggiore", intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: "Minore Naturale", intervals: [0, 2, 3, 5, 7, 8, 10] },
  harmonic_minor: { name: "Minore Armonica", intervals: [0, 2, 3, 5, 7, 8, 11] },
  dorian: { name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  pentatonic_major: { name: "Pentatonica Maggiore", intervals: [0, 2, 4, 7, 9] },
  pentatonic_minor: { name: "Pentatonica Minore", intervals: [0, 3, 5, 7, 10] },
};

// Accordi base per grado
const SCALE_CHORD_DEGREES: Record<string, string[]> = {
  major: ["maj", "min", "min", "maj", "maj", "min", "dim"],
  minor: ["min", "dim", "maj", "min", "min", "maj", "maj"],
  harmonic_minor: ["min", "dim", "aug", "min", "maj", "maj", "dim"],
  dorian: ["min", "min", "maj", "maj", "min", "dim", "maj"],
  phrygian: ["min", "maj", "maj", "min", "dim", "maj", "min"],
  lydian: ["maj", "maj", "min", "dim", "maj", "min", "min"],
  mixolydian: ["maj", "min", "dim", "maj", "min", "min", "maj"],
  pentatonic_major: ["maj", "min", "min", "maj", "min"],
  pentatonic_minor: ["min", "maj", "min", "min", "maj"],
};

// Estensioni accordo
type Extension = "base" | "7" | "maj7" | "9" | "sus2" | "sus4" | "add9" | "6";

const EXTENSIONS: { id: Extension; label: string; intervals: number[] }[] = [
  { id: "base", label: "Triade", intervals: [] },
  { id: "7", label: "7", intervals: [10] },
  { id: "maj7", label: "maj7", intervals: [11] },
  { id: "9", label: "9", intervals: [10, 14] },
  { id: "sus2", label: "sus2", intervals: [] },
  { id: "sus4", label: "sus4", intervals: [] },
  { id: "add9", label: "add9", intervals: [14] },
  { id: "6", label: "6", intervals: [9] },
];

// Frequenze standard (A4 = 440 Hz)
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4_FREQ = 440;
const A4_MIDI = 69;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getNoteFromIndex(root: number, interval: number): string {
  return NOTES[(root + interval) % 12];
}

function getScaleNotes(root: number, scaleKey: string): string[] {
  return SCALES[scaleKey].intervals.map((i) => getNoteFromIndex(root, i));
}

function getChordIntervals(baseType: string, extension: Extension): number[] {
  const base: Record<string, number[]> = {
    maj: [0, 4, 7],
    min: [0, 3, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
  };

  let intervals = [...(base[baseType] ?? [0, 4, 7])];

  switch (extension) {
    case "sus2": return [0, 2, 7];
    case "sus4": return [0, 5, 7];
    case "7": return [...intervals, baseType === "maj" ? 11 : 10];
    case "maj7": return [...intervals, 11];
    case "9": return [...intervals, baseType === "maj" ? 11 : 10, 14];
    case "add9": return [...intervals, 14];
    case "6": return [...intervals, 9];
    default: return intervals;
  }
}

function getChordLabel(root: string, baseType: string, extension: Extension): string {
  const suffixes: Record<string, Record<Extension, string>> = {
    maj: { base: "", "7": "maj7", maj7: "maj7", "9": "9", sus2: "sus2", sus4: "sus4", add9: "add9", "6": "6" },
    min: { base: "m", "7": "m7", maj7: "mM7", "9": "m9", sus2: "sus2", sus4: "sus4", add9: "madd9", "6": "m6" },
    dim: { base: "dim", "7": "dim7", maj7: "dimM7", "9": "dim9", sus2: "dimsus2", sus4: "dimsus4", add9: "dimadd9", "6": "dim6" },
    aug: { base: "aug", "7": "aug7", maj7: "augM7", "9": "aug9", sus2: "augsus2", sus4: "augsus4", add9: "augadd9", "6": "aug6" },
  };
  return `${root}${suffixes[baseType]?.[extension] ?? ""}`;
}

function getChordsForScale(root: number, scaleKey: string, extension: Extension) {
  const scale = SCALES[scaleKey];
  const degrees = SCALE_CHORD_DEGREES[scaleKey] ?? [];
  return scale.intervals.map((interval, idx) => {
    const chordRoot = (root + interval) % 12;
    const baseType = degrees[idx] ?? "maj";
    const intervals = getChordIntervals(baseType, extension);
    const noteNames = intervals.map((i) => NOTES[(chordRoot + i) % 12]);
    return {
      root: NOTES[chordRoot],
      label: getChordLabel(NOTES[chordRoot], baseType, extension),
      degree: ["I", "II", "III", "IV", "V", "VI", "VII"][idx],
      notes: noteNames,
    };
  });
}

function bpmToMs(bpm: number, subdivision: string): number {
  const base = 60000 / bpm;
  const multipliers: Record<string, number> = {
    "1/1": 4, "1/2": 2, "1/4": 1, "1/8": 0.5,
    "1/16": 0.25, "1/4T": 2 / 3, "1/8T": 1 / 3,
  };
  return Math.round(base * (multipliers[subdivision] ?? 1));
}

function noteToFreq(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 0;
  const midi = noteIndex + (octave + 1) * 12;
  return parseFloat((A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12)).toFixed(2));
}

function freqToNote(freq: number): { note: string; octave: number; cents: number } {
  if (freq <= 0) return { note: "-", octave: 0, cents: 0 };
  const midi = 12 * Math.log2(freq / A4_FREQ) + A4_MIDI;
  const midiRound = Math.round(midi);
  const cents = Math.round((midi - midiRound) * 100);
  const noteIndex = ((midiRound % 12) + 12) % 12;
  const octave = Math.floor(midiRound / 12) - 1;
  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// ── HARMONIC ANALYSIS ─────────────────────────────────────────────────────────

function HarmonicTool() {
  const [rootIndex, setRootIndex] = useState(0);
  const [scaleKey, setScaleKey] = useState("major");
  const [extension, setExtension] = useState<Extension>("base");
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  const scaleNotes = getScaleNotes(rootIndex, scaleKey);
  const chords = getChordsForScale(rootIndex, scaleKey, extension);

  return (
    <div className="space-y-5">

      {/* TONALITÀ */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Tonalità</p>
        <div className="flex flex-wrap gap-1.5">
          {NOTES.map((note, i) => (
            <button
              key={note}
              onClick={() => { setRootIndex(i); setSelectedChord(null); }}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                rootIndex === i ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
              }`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* SCALA */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Scala</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SCALES).map(([key, { name }]) => (
            <button
              key={key}
              onClick={() => { setScaleKey(key); setSelectedChord(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                scaleKey === key ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ESTENSIONE */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Tipo accordo</p>
        <div className="flex flex-wrap gap-1.5">
          {EXTENSIONS.map((ext) => (
            <button
              key={ext.id}
              onClick={() => { setExtension(ext.id); setSelectedChord(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                extension === ext.id ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
              }`}
            >
              {ext.label}
            </button>
          ))}
        </div>
      </div>

      {/* NOTE SCALA */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-2">Note della scala</p>
        <div className="flex gap-2 flex-wrap">
          {scaleNotes.map((note, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[color:var(--border)]/20 flex items-center justify-center text-sm font-semibold">
                {note}
              </div>
              <span className="text-xs text-[var(--text)]/30">
                {["I", "II", "III", "IV", "V", "VI", "VII"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ACCORDI */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-2">Accordi compatibili</p>
        <div className="grid grid-cols-2 gap-2">
          {chords.map((chord, i) => (
            <button
              key={i}
              onClick={() => setSelectedChord(selectedChord === i ? null : i)}
              className={`border rounded-xl px-4 py-3 text-left transition-all ${
                selectedChord === i ? "border-[color:var(--border)]/40 bg-[var(--card)]" : "border-[color:var(--border)] hover:border-[color:var(--border)]/20"
              }`}
            >
              <p className="text-base font-bold">{chord.label}</p>
              <p className="text-xs text-[var(--text)]/30">{chord.degree} grado</p>
              {selectedChord === i && (
                <p className="text-xs text-[var(--text)]/50 mt-1">{chord.notes.join(" · ")}</p>
              )}
            </button>
          ))}
        </div>
        {selectedChord !== null && (
          <p className="text-xs text-[var(--text)]/30 mt-2 text-center">Tocca di nuovo per chiudere</p>
        )}
      </div>

      {/* RELATIVA */}
      <div className="border border-[color:var(--border)]/8 rounded-xl p-4">
        <p className="text-xs text-[var(--text)]/40 mb-1">
          {scaleKey === "major" ? "Relativa minore" : "Relativa maggiore"}
        </p>
        <p className="text-sm font-semibold">
          {scaleKey === "major"
            ? `${NOTES[(rootIndex + 9) % 12]} minore`
            : `${NOTES[(rootIndex + 3) % 12]} maggiore`}
        </p>
      </div>
    </div>
  );
}

// ── BPM + NOTE/FREQ CONVERTER ─────────────────────────────────────────────────

function BpmTool() {
  const [bpm, setBpm] = useState(120);
  const [activeSection, setActiveSection] = useState<"bpm" | "notefreq">("bpm");

  // Note → Freq
  const [selectedNote, setSelectedNote] = useState("A");
  const [selectedOctave, setSelectedOctave] = useState(4);

  // Freq → Note
  const [inputFreq, setInputFreq] = useState("440");

  const subdivisions = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/4T", "1/8T"];
  const octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const computedFreq = noteToFreq(selectedNote, selectedOctave);
  const computedNote = freqToNote(parseFloat(inputFreq));

  return (
    <div className="space-y-5">

      {/* SECTION TABS */}
      <div className="flex border border-[color:var(--border)] rounded-xl overflow-hidden">
        <button
          onClick={() => setActiveSection("bpm")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeSection === "bpm" ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "text-[var(--text)]/40"
          }`}
        >
          BPM → ms
        </button>
        <button
          onClick={() => setActiveSection("notefreq")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeSection === "notefreq" ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "text-[var(--text)]/40"
          }`}
        >
          Nota ↔ Hz
        </button>
      </div>

      {/* BPM SECTION */}
      {activeSection === "bpm" && (
        <>
          <div>
            <p className="text-xs text-[var(--text)]/40 mb-1.5">BPM</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBpm(b => Math.max(1, b - 1))}
                className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-lg hover:border-[color:var(--border)]/30 transition-colors"
              >−</button>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Math.max(1, Math.min(300, Number(e.target.value))))}
                className="flex-1 text-center text-3xl font-bold bg-transparent focus:outline-none text-[var(--text)]"
              />
              <button
                onClick={() => setBpm(b => Math.min(300, b + 1))}
                className="w-10 h-10 rounded-xl bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 text-lg hover:border-[color:var(--border)]/30 transition-colors"
              >+</button>
            </div>
            <input
              type="range" min={40} max={300} value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full mt-3 accent-[var(--text)]"
            />
          </div>

          <div>
            <p className="text-xs text-[var(--text)]/40 mb-2">Durate in millisecondi</p>
            <div className="space-y-2">
              {subdivisions.map((sub) => (
                <div key={sub} className="flex items-center justify-between border border-[color:var(--border)]/8 rounded-xl px-4 py-3">
                  <span className="text-sm text-[var(--text)]/60 w-16">{sub}</span>
                  <span className="text-sm font-mono font-semibold">{bpmToMs(bpm, sub)} ms</span>
                  <span className="text-xs text-[var(--text)]/30 w-16 text-right">{(bpmToMs(bpm, sub) / 1000).toFixed(3)}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[color:var(--border)]/8 rounded-xl p-4">
            <p className="text-xs text-[var(--text)]/40 mb-1">Frequenza LFO (Hz)</p>
            <p className="text-xl font-bold">{(bpm / 60).toFixed(3)} Hz</p>
            <p className="text-xs text-[var(--text)]/30 mt-0.5">Utile per LFO e modulazioni a tempo</p>
          </div>
        </>
      )}

      {/* NOTE ↔ FREQ SECTION */}
      {activeSection === "notefreq" && (
        <div className="space-y-6">

          {/* NOTA → FREQUENZA */}
          <div>
            <p className="text-xs text-[var(--text)]/40 mb-3">Nota → Frequenza</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {NOTE_NAMES.map((note) => (
                <button
                  key={note}
                  onClick={() => setSelectedNote(note)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all${
                    selectedNote === note ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {octaves.map((oct) => (
                <button
                  key={oct}
                  onClick={() => setSelectedOctave(oct)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    selectedOctave === oct ? "bg-[var(--button-bg)] text-[var(--button-text)]" : "bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
                  }`}
                >
                  {oct}
                </button>
              ))}
            </div>

            <div className="border border-[color:var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text)]/40 mb-1">{selectedNote}{selectedOctave}</p>
              <p className="text-3xl font-bold">{computedFreq} <span className="text-lg text-[var(--text)]/40">Hz</span></p>
            </div>
          </div>

          {/* FREQUENZA → NOTA */}
          <div>
            <p className="text-xs text-[var(--text)]/40 mb-3">Frequenza → Nota</p>

            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                value={inputFreq}
                onChange={(e) => setInputFreq(e.target.value)}
                placeholder="es. 440"
                className="flex-1 text-center text-2xl font-bold bg-[var(--card)] border border-[color:var(--border)] rounded-xl py-3 focus:outline-none focus:border-[color:var(--border)]/30 text-[var(--text)]"
              />
              <span className="text-[var(--text)]/40 text-sm">Hz</span>
            </div>

            {parseFloat(inputFreq) > 0 && (
              <div className="border border-[color:var(--border)] rounded-xl p-4">
                <p className="text-xs text-[var(--text)]/40 mb-1">Nota più vicina</p>
                <p className="text-3xl font-bold">
                  {computedNote.note}{computedNote.octave}
                  {computedNote.cents !== 0 && (
                    <span className={`text-sm ml-2 ${Math.abs(computedNote.cents) > 10 ? "text-yellow-400" : "text-[var(--text)]/40"}`}>
                      {computedNote.cents > 0 ? `+${computedNote.cents}` : computedNote.cents} cents
                    </span>
                  )}
                </p>
                {computedNote.cents === 0 && (
                  <p className="text-xs text-green-400 mt-1">Intonazione perfetta</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MoodPaletteTool() {
  const [count, setCount] = useState(5);

  const [palette, setPalette] = useState<
    { hex: string; locked: boolean }[]
  >([]);

  const [copied, setCopied] = useState<string | null>(null);
  const [savedPalettes, setSavedPalettes] = useState<
  {
    id: number;
    name: string;
    colors: { hex: string; locked: boolean }[];
  }[]
>([]);

  function randomHex(): string {
    return (
      "#" +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")
    );
  }

  function generatePalette() {
    setPalette((prev) =>
      Array.from({ length: count }, (_, i) =>
        prev[i]?.locked
          ? prev[i]
          : {
              hex: randomHex(),
              locked: false,
            }
      )
    );
  }

useEffect(() => {
  generatePalette();

  const stored = localStorage.getItem("saved-palettes");

  if (stored) {
    setSavedPalettes(JSON.parse(stored));
  }
}, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        generatePalette();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [palette]);

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    setCopied(hex);

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  }

  function copyAll() {
    navigator.clipboard.writeText(
      palette.map((c) => c.hex).join(", ")
    );

    setCopied("all");

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  }

  function saveCurrentPalette() {
  if (palette.length === 0) return;

  const name = prompt("Nome palette:");

  if (!name) return;

  const newPalette = {
    id: Date.now(),
    name,
    colors: palette,
  };

  const updated = [...savedPalettes, newPalette];

  setSavedPalettes(updated);

  localStorage.setItem(
    "saved-palettes",
    JSON.stringify(updated)
  );
}

function loadPalette(colors: { hex: string; locked: boolean }[]) {
  setPalette(colors);
}

function renamePalette(id: number) {
  const newName = prompt("Nuovo nome palette:");

  if (!newName) return;

  const updated = savedPalettes.map((p) =>
    p.id === id
      ? {
          ...p,
          name: newName,
        }
      : p
  );

  setSavedPalettes(updated);

  localStorage.setItem(
    "saved-palettes",
    JSON.stringify(updated)
  );
}

function deletePalette(id: number) {
  const confirmed = window.confirm(
    "Eliminare questa palette?"
  );

  if (!confirmed) return;

  const updated = savedPalettes.filter(
    (p) => p.id !== id
  );

  setSavedPalettes(updated);

  localStorage.setItem(
    "saved-palettes",
    JSON.stringify(updated)
  );
}

  return (
    <div className="space-y-5">

      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">
          Numero di colori:
          <span className="text-[var(--text)]/70 ml-1">{count}</span>
        </p>

        <input
          type="range"
          min={3}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-[var(--text)]"
        />

        <div className="flex justify-between text-xs text-[var(--text)]/20 mt-1">
          <span>3</span>
          <span>10</span>
        </div>
      </div>

      <button
        onClick={generatePalette}
        className="w-full py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm"
      >
        🎲 Genera nuova palette
      </button>

      <button
      onClick={saveCurrentPalette}
      className="w-full py-3 border border-[color:var(--border)] rounded-xl text-sm text-[var(--text)]/60 hover:border-[color:var(--border)]/30"
    >
      💾 Salva palette
    </button>

      {palette.length > 0 && (
  <div className="space-y-3">

    <div className="flex h-20 rounded-xl overflow-hidden">
      {palette.map((color, i) => (
        <div
          key={i}
          className="relative flex-1 hover:flex-[2] transition-all duration-200 cursor-pointer group"
          style={{ backgroundColor: color.hex }}
          onClick={() => copyHex(color.hex)}
        >
          <input
            type="color"
            value={color.hex}
            onChange={(e) => {
              const updated = [...palette];
              updated[i] = {
                ...updated[i],
                hex: e.target.value,
              };
              setPalette(updated);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();

              const updated = [...palette];
              updated[i] = {
                ...updated[i],
                locked: !updated[i].locked,
              };
              setPalette(updated);
            }}
            className="absolute top-2 right-2 text-sm bg-[var(--bg)]/40 rounded-md px-2 py-1"
          >
            {color.locked ? "🔒" : "🔓"}
          </button>
        </div>
      ))}
    </div>

    <div className="space-y-2">
      {palette.map((color, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border border-[color:var(--border)]/8 rounded-xl px-4 py-3 cursor-pointer hover:border-[color:var(--border)]/20"
          onClick={() => copyHex(color.hex)}
        >
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: color.hex }}
          />

          <div className="flex-1">
            <p className="text-sm font-mono font-semibold">
              {color.hex}
            </p>
            <p className="text-xs text-[var(--text)]/40">
              {color.locked ? "Bloccato" : "Modificabile"}
            </p>
          </div>

          <span className="text-xs text-[var(--text)]/30">
            {copied === color.hex ? "✓ Copiato" : "Copia"}
          </span>
        </div>
      ))}
    </div>

    <button
      onClick={copyAll}
      className="w-full py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/50 text-sm hover:border-[color:var(--border)]/30"
    >
      {copied === "all" ? "✓ Tutti copiati" : "Copia tutti gli hex"}
    </button>

  </div>
)}

{/* 👇 QUESTO È FUORI, NON DENTRO palette */}
{savedPalettes.length > 0 && (
  <div className="space-y-3 pt-4">

    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-[var(--text)]/80">
        Palette salvate
      </h3>

      <span className="text-xs text-[var(--text)]/30">
        {savedPalettes.length}
      </span>
    </div>

    <div className="space-y-2">
      {savedPalettes.map((saved) => (
        <div
          key={saved.id}
          className="border border-[color:var(--border)] rounded-xl p-3 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">

            <button
              onClick={() => loadPalette(saved.colors)}
              className="text-sm font-medium text-left flex-1 hover:text-[var(--text)]"
            >
              {saved.name}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => renamePalette(saved.id)}
                className="text-xs text-[var(--text)]/40 hover:text-[var(--text)]"
              >
                ✏️
              </button>

              <button
                onClick={() => deletePalette(saved.id)}
                className="text-xs text-[var(--text)]/40 hover:text-red-400"
              >
                🗑
              </button>
            </div>

          </div>

          <div className="flex h-10 rounded-lg overflow-hidden">
            {saved.colors.map((color, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
    )}
    </div>
  );
}
  // ── RESOLUTION CALCULATOR ─────────────────────────────────────────────────────

function ResolutionTool() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [outputType, setOutputType] = useState<"monitor" | "projector">("monitor");

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  function getAspectRatio(w: number, h: number): string {
    const d = gcd(w, h);
    return `${w / d}:${h / d}`;
  }

  function getAspectName(w: number, h: number): string {
    const ratio = w / h;
    if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9 — Widescreen standard";
    if (Math.abs(ratio - 16 / 10) < 0.01) return "16:10 — Widescreen monitor";
    if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3 — Standard legacy";
    if (Math.abs(ratio - 21 / 9) < 0.01) return "21:9 — Ultrawide";
    if (Math.abs(ratio - 1) < 0.01) return "1:1 — Quadrato";
    if (Math.abs(ratio - 32 / 9) < 0.01) return "32:9 — Super ultrawide";
    if (ratio > 2.3) return "Ultra panoramico";
    return "Formato custom";
  }

  function getTDWindowSize(w: number, h: number): string {
    const common = [
      [3840, 2160], [2560, 1440], [1920, 1080],
      [1280, 720], [1024, 768], [800, 600],
    ];
    const match = common.find(([cw, ch]) => cw === w && ch === h);
    return match ? "Risoluzione nativa — usa direttamente" : "Risoluzione custom — imposta manualmente in Window COMP";
  }

  function getSuggestedFPS(w: number, h: number, type: "monitor" | "projector"): string {
    const pixels = w * h;
    if (type === "projector") {
      if (pixels <= 1920 * 1080) return "60 FPS — ottimale per proiettori standard";
      if (pixels <= 3840 * 2160) return "30 FPS — consigliato per 4K su proiettore";
      return "24 FPS — consigliato per risoluzioni molto alte";
    }
    if (pixels <= 1920 * 1080) return "60 FPS — standard per monitor Full HD";
    if (pixels <= 2560 * 1440) return "60 FPS — ottimale per QHD";
    if (pixels <= 3840 * 2160) return "30-60 FPS — dipende dalla GPU";
    return "24-30 FPS — risoluzioni molto alte, verifica GPU";
  }

  function getCanvasSize(w: number, h: number): { w: number; h: number } {
    return { w: Math.round(w / 2), h: Math.round(h / 2) };
  }

  function getRelatedResolutions(w: number, h: number) {
    return [
      { label: "Full (1x)", w, h },
      { label: "Half (½x)", w: Math.round(w / 2), h: Math.round(h / 2) },
      { label: "Quarter (¼x)", w: Math.round(w / 4), h: Math.round(h / 4) },
      { label: "Double (2x)", w: w * 2, h: h * 2 },
    ];
  }

  const aspectRatio = getAspectRatio(width, height);
  const aspectName = getAspectName(width, height);
  const tdWindow = getTDWindowSize(width, height);
  const suggestedFPS = getSuggestedFPS(width, height, outputType);
  const canvas = getCanvasSize(width, height);
  const related = getRelatedResolutions(width, height);
  const totalPixels = (width * height / 1_000_000).toFixed(2);

  return (
    <div className="space-y-5">

      {/* OUTPUT TYPE */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Tipo di output</p>
        <div className="flex gap-2">
          {(["monitor", "projector"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOutputType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                outputType === t ? "bg-[var(--button-bg)] text-[var(--button-text)] border-[color:var(--border)]" : "bg-[var(--card)] border-[color:var(--border)] text-[var(--text)]/50"
              }`}
            >
              {t === "monitor" ? "🖥 Monitor" : "📽 Proiettore"}
            </button>
          ))}
        </div>
      </div>

      {/* RESOLUTION INPUT */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Risoluzione</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
            className=" w-fit scale-90 origin-left flex-1 text-center text-xl font-bold bg-[var(--card)] border border-[color:var(--border)] rounded-xl py-3 focus:outline-none focus:border-[color:var(--border)]/30 text-[var(--text)]"
          />
          <span className="text-[var(--text)]/30 font-bold">×</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
            className="w-fit scale-90 origin-left flex-1 text-center text-xl font-bold bg-[var(--card)] border border-[color:var(--border)] rounded-xl py-3 focus:outline-none focus:border-[color:var(--border)]/30 text-[var(--text)]"
          />
        </div>
      </div>

      {/* PRESET RISOLUZIONI */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Preset comuni</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "FHD", w: 1920, h: 1080 },
            { label: "QHD", w: 2560, h: 1440 },
            { label: "4K", w: 3840, h: 2160 },
            { label: "HD", w: 1280, h: 720 },
            { label: "XGA", w: 1024, h: 768 },
            { label: "WXGA", w: 1280, h: 800 },
            { label: "Square", w: 1080, h: 1080 },
            { label: "Portrait", w: 1080, h: 1920 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setWidth(p.w); setHeight(p.h); }}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                width === p.w && height === p.h
                  ? "bg-[var(--button-bg)] text-[var(--button-text)] border-[color:var(--border)]"
                  : "bg-[var(--card)] border-[color:var(--border)] text-[var(--text)]/50 hover:border-[color:var(--border)]/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* RISULTATI */}
      <div className="space-y-2">

        <div className="border border-[color:var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--text)]/40 mb-1">Aspect Ratio</p>
          <p className="text-2xl font-bold">{aspectRatio}</p>
          <p className="text-xs text-[var(--text)]/40 mt-0.5">{aspectName}</p>
        </div>

        <div className="border border-[color:var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--text)]/40 mb-1">Pixel totali</p>
          <p className="text-2xl font-bold">{totalPixels} <span className="text-sm text-[var(--text)]/40">MP</span></p>
          <p className="text-xs text-[var(--text)]/40 mt-0.5">{(width * height).toLocaleString()} pixel</p>
        </div>

        <div className="border border-[color:var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--text)]/40 mb-2">Impostazioni TouchDesigner</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text)]/50">Window COMP</span>
              <span className="text-xs font-mono text-[var(--text)]/80">{width} × {height}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text)]/50">Canvas consigliato</span>
              <span className="text-xs font-mono text-[var(--text)]/80">{canvas.w} × {canvas.h}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text)]/50">FPS target</span>
              <span className="text-xs font-mono text-[var(--text)]/80">{suggestedFPS.split(" — ")[0]}</span>
            </div>
            <p className="text-xs text-[var(--text)]/30 pt-1 border-t border-[color:var(--border)]/5">{tdWindow}</p>
            <p className="text-xs text-[var(--text)]/30">{suggestedFPS.split(" — ")[1]}</p>
          </div>
        </div>

        <div className="border border-[color:var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--text)]/40 mb-2">Risoluzioni correlate</p>
          <div className="space-y-1.5">
            {related.map((r) => (
              <div
                key={r.label}
                className="flex justify-between items-center cursor-pointer hover:bg-[var(--card)] px-2 py-1 rounded-lg transition-colors"
                onClick={() => { setWidth(r.w); setHeight(r.h); }}
              >
                <span className="text-xs text-[var(--text)]/50">{r.label}</span>
                <span className="text-xs font-mono text-[var(--text)]/70">{r.w} × {r.h}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
// ── FPS BUDGET ────────────────────────────────────────────────────────────────

type GpuTier = "integrated" | "mobile_low" | "mobile_mid" | "dedicated";

const GPU_TIERS: { id: GpuTier; label: string; multiplier: number }[] = [
  { id: "integrated", label: "Integrata (Intel/Apple M)", multiplier: 0.3 },
  { id: "mobile_low", label: "Mobile entry (GTX 1650)", multiplier: 0.5 },
  { id: "mobile_mid", label: "Mobile mid (RTX 3060)", multiplier: 0.8 },
  { id: "dedicated", label: "Desktop dedicata (RTX 3080+)", multiplier: 1.0 },
];

// costo base in ms su GPU desktop dedicata a 1080p/60fps
const TD_OPERATIONS: { label: string; category: string; baseCost: number; description: string }[] = [
  { label: "Feedback TOP", category: "TOP", baseCost: 0.5, description: "Buffer circolare" },
  { label: "Blur TOP", category: "TOP", baseCost: 1.2, description: "Gaussian blur standard" },
  { label: "Composite TOP", category: "TOP", baseCost: 0.3, description: "Compositing layer" },
  { label: "GLSL TOP (semplice)", category: "GLSL", baseCost: 0.8, description: "Shader semplice" },
  { label: "GLSL TOP (complesso)", category: "GLSL", baseCost: 3.0, description: "Raymarching / noise pesante" },
  { label: "Level TOP", category: "TOP", baseCost: 0.2, description: "Correzione colore" },
  { label: "Ramp TOP", category: "TOP", baseCost: 0.1, description: "Generatore gradiente" },
  { label: "Noise TOP", category: "TOP", baseCost: 1.5, description: "Noise procedurale" },
  { label: "Video stream in", category: "I/O", baseCost: 2.0, description: "Input video live" },
  { label: "Syphon/Spout in", category: "I/O", baseCost: 1.0, description: "Texture sharing" },
  { label: "Render TOP (3D)", category: "3D", baseCost: 4.0, description: "Render scena 3D" },
  { label: "PBR Material", category: "3D", baseCost: 2.5, description: "Materiale PBR" },
  { label: "Particle GPU", category: "3D", baseCost: 3.5, description: "Sistema particelle GPU" },
  { label: "Audio Analysis", category: "CHOP", baseCost: 0.3, description: "FFT / analisi audio" },
];

function FpsBudgetTool() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [targetFps, setTargetFps] = useState(60);
  const [gpuTier, setGpuTier] = useState<GpuTier>("mobile_low");
  const [selectedOps, setSelectedOps] = useState<Record<string, number>>({});

  const gpu = GPU_TIERS.find((g) => g.id === gpuTier)!;

  // risoluzione scale factor rispetto a 1080p
  const resolutionFactor = (width * height) / (1920 * 1080);

  // budget totale in ms per frame
  const frameBudgetMs = parseFloat((1000 / targetFps).toFixed(2));

  // overhead fisso TD (~30% del budget)
  const overheadMs = parseFloat((frameBudgetMs * 0.3).toFixed(2));
  const availableMs = parseFloat((frameBudgetMs - overheadMs).toFixed(2));

  // costo effettivo di un'operazione
  function getEffectiveCost(baseCost: number): number {
    return parseFloat((baseCost * resolutionFactor / gpu.multiplier).toFixed(2));
  }

  // costo totale selezionato
  const totalCost = Object.entries(selectedOps).reduce((acc, [label, count]) => {
    const op = TD_OPERATIONS.find((o) => o.label === label);
    if (!op || count === 0) return acc;
    return acc + getEffectiveCost(op.baseCost) * count;
  }, 0);

  const usagePercent = Math.min(100, Math.round((totalCost / availableMs) * 100));

  function getStatusColor(): string {
    if (usagePercent < 60) return "text-green-400";
    if (usagePercent < 85) return "text-yellow-400";
    return "text-red-400";
  }

  function getStatusLabel(): string {
    if (usagePercent < 60) return "✓ Budget ok";
    if (usagePercent < 85) return "⚠ Vicino al limite";
    return "✕ Budget superato";
  }

  function updateOp(label: string, count: number) {
    setSelectedOps((prev) => ({ ...prev, [label]: Math.max(0, count) }));
  }

  const categories = [...new Set(TD_OPERATIONS.map((o) => o.category))];

  return (
    <div className="space-y-5">

      {/* GPU */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">GPU</p>
        <div className="space-y-1.5">
          {GPU_TIERS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGpuTier(g.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                gpuTier === g.id ? "bg-[var(--button-bg)] text-[var(--button-text)] border-[color:var(--border)]" : "bg-[var(--card)] border-[color:var(--border)] text-[var(--text)]/50"
              }`}
            >
              <span>{g.label}</span>
              <span className="text-xs opacity-60">×{g.multiplier}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RISOLUZIONE + FPS */}
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-xs text-[var(--text)]/40 mb-1.5">Risoluzione</p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full text-center text-sm font-bold bg-[var(--card)] border border-[color:var(--border)] rounded-xl py-2.5 focus:outline-none text-[var(--text)]"
            />
            <span className="text-[var(--text)]/30 text-xs">×</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full text-center text-sm font-bold bg-[var(--card)] border border-[color:var(--border)] rounded-xl py-2.5 focus:outline-none text-[var(--text)]"
            />
          </div>
        </div>
        <div className="w-24">
          <p className="text-xs text-[var(--text)]/40 mb-1.5">FPS target</p>
          <select
            value={targetFps}
            onChange={(e) => setTargetFps(Number(e.target.value))}
            className="w-full bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)] text-sm px-2 py-2.5 rounded-xl focus:outline-none"
          >
            {[24, 30, 60].map((f) => (
              <option key={f} value={f} className="bg-[var(--bg)]">{f} fps</option>
            ))}
          </select>
        </div>
      </div>

      {/* BUDGET SUMMARY */}
      <div className="border border-[color:var(--border)] rounded-2xl p-4 space-y-2">
        <p className="text-xs text-[var(--text)]/40">Budget per frame</p>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text)]/50">Totale</span>
          <span className="font-mono">{frameBudgetMs} ms</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text)]/50">Overhead TD</span>
          <span className="font-mono text-[var(--text)]/40">− {overheadMs} ms</span>
        </div>
        <div className="flex justify-between text-sm border-t border-[color:var(--border)] pt-2">
          <span className="text-[var(--text)]/80 font-medium">Disponibile</span>
          <span className="font-mono font-bold">{availableMs} ms</span>
        </div>
      </div>

      {/* OPERAZIONI */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-2">Operazioni nel tuo setup</p>
        {categories.map((cat) => (
          <div key={cat} className="mb-3">
            <p className="text-xs text-[var(--text)]/25 uppercase tracking-widest mb-1.5 pl-1">{cat}</p>
            <div className="space-y-1">
              {TD_OPERATIONS.filter((o) => o.category === cat).map((op) => {
                const count = selectedOps[op.label] ?? 0;
                const cost = getEffectiveCost(op.baseCost);
                return (
                  <div
                    key={op.label}
                    className="flex items-center gap-3 border border-[color:var(--border)]/8 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text)]/70 truncate">{op.label}</p>
                      <p className="text-xs text-[var(--text)]/25">{cost} ms/istanza</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateOp(op.label, count - 1)}
                        className="w-6 h-6 rounded-lg bg-[var(--card)] text-[var(--text)]/40 text-sm flex items-center justify-center"
                      >−</button>
                      <span className="text-sm font-mono w-4 text-center text-[var(--text)]/70">{count}</span>
                      <button
                        onClick={() => updateOp(op.label, count + 1)}
                        className="w-6 h-6 rounded-lg bg-[var(--card)] text-[var(--text)]/40 text-sm flex items-center justify-center"
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* RISULTATO */}
      <div className={`border rounded-2xl p-4 space-y-3 ${
        usagePercent < 60 ? "border-green-500/20 bg-green-500/5" :
        usagePercent < 85 ? "border-yellow-400/20 bg-yellow-400/5" :
        "border-red-400/20 bg-red-400/5"
      }`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${getStatusColor()}`}>{getStatusLabel()}</p>
          <p className={`text-2xl font-bold ${getStatusColor()}`}>{usagePercent}%</p>
        </div>
        <div className="w-full h-2 bg-[var(--card)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              usagePercent < 60 ? "bg-green-400" : usagePercent < 85 ? "bg-yellow-400" : "bg-red-400"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--text)]/40">
          <span>Usato: {totalCost.toFixed(2)} ms</span>
          <span>Rimasto: {Math.max(0, availableMs - totalCost).toFixed(2)} ms</span>
        </div>
        {usagePercent >= 85 && (
          <div className="pt-2 border-t border-[color:var(--border)] space-y-1">
            <p className="text-xs text-[var(--text)]/50 font-medium">Suggerimenti:</p>
            <p className="text-xs text-[var(--text)]/30">· Riduci la risoluzione del canvas interno</p>
            <p className="text-xs text-[var(--text)]/30">· Usa Cook Type "Always" solo sui TOP critici</p>
            <p className="text-xs text-[var(--text)]/30">· Sostituisci Blur con un GLSL blur ottimizzato</p>
            <p className="text-xs text-[var(--text)]/30">· Abbassa il target FPS a 30</p>
          </div>
        )}
      </div>
    </div>
  );
}
// ── GLSL SNIPPETS ─────────────────────────────────────────────────────────────

type GlslParam = {
  id: string;
  label: string;
  type: "float" | "int" | "color";
  min?: number;
  max?: number;
  step?: number;
  value: number;
};

type GlslSnippet = {
  id: string;
  label: string;
  category: "Base" | "Avanzati";
  description: string;
  tdNote: string;
  params: GlslParam[];
  generate: (params: Record<string, number>) => string;
};

// ── GLSL ARCHIVE ──────────────────────────────────────────────────────────────

type GlslEntry = {
  id: number;
  title: string;
  code: string;
  notes: string;
  createdAt: string;
};

function GlslTool() {
  const [entries, setEntries] = useState<GlslEntry[]>(() => {
    const saved = localStorage.getItem("glsl-archive");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<Partial<GlslEntry>>({});
  const [copied, setCopied] = useState(false);

  function save(updated: GlslEntry[]) {
    setEntries(updated);
    localStorage.setItem("glsl-archive", JSON.stringify(updated));
  }

  function openNew() {
    setDraft({ title: "", code: "", notes: "" });
    setIsNew(true);
    setSelectedId(null);
  }

  function openEntry(entry: GlslEntry) {
    setDraft({ ...entry });
    setSelectedId(entry.id);
    setIsNew(false);
  }

  function saveEntry() {
    if (!draft.title?.trim()) return;
    if (isNew) {
      const newEntry: GlslEntry = {
        id: Date.now(),
        title: draft.title!.trim(),
        code: draft.code ?? "",
        notes: draft.notes ?? "",
        createdAt: new Date().toLocaleDateString("it-IT"),
      };
      save([newEntry, ...entries]);
    } else {
      save(entries.map((e) => e.id === selectedId ? { ...e, ...draft, title: draft.title!.trim() } : e));
    }
    closeDetail();
  }

  function deleteEntry(id: number) {
    const confirmed = window.confirm("Eliminare questo snippet?");
    if (!confirmed) return;
    save(entries.filter((e) => e.id !== id));
    closeDetail();
  }

  function closeDetail() {
    setSelectedId(null);
    setIsNew(false);
    setDraft({});
  }

  function copyCode() {
    navigator.clipboard.writeText(draft.code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────

  if (isNew || selectedId !== null) {
    return (
      <div className="space-y-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-[var(--text)]/40 hover:text-[var(--text)] text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Archivio
          </button>
          {selectedId !== null && (
            <button
              onClick={() => deleteEntry(selectedId)}
              className="text-xs text-[var(--text)]/20 hover:text-red-400 transition-colors"
            >
              Elimina
            </button>
          )}
        </div>

        {/* TITOLO */}
        <input
          value={draft.title ?? ""}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Nome snippet..."
          className="w-full bg-transparent border-b border-[color:var(--border)] text-[var(--text)] font-bold text-lg focus:outline-none focus:border-[color:var(--border)]/30 pb-1 transition-colors"
        />

        {/* CODICE */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[var(--text)]/40 uppercase tracking-widest">Codice GLSL</p>
            <button
              onClick={copyCode}
              className="text-xs text-[var(--text)]/30 hover:text-[var(--text)] transition-colors"
            >
              {copied ? "✓ Copiato" : "Copia"}
            </button>
          </div>
          <textarea
            value={draft.code ?? ""}
            onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            placeholder={"// Incolla o scrivi il tuo codice GLSL...\nvoid main() {\n  \n}"}
            className="w-full bg-[var(--card)] border border-[color:var(--border)]/8 rounded-xl px-4 py-3 text-xs font-mono text-[var(--text)]/80 focus:outline-none focus:border-[color:var(--border)]/20 resize-none leading-relaxed transition-colors"
            rows={14}
            spellCheck={false}
          />
        </div>

        {/* NOTE */}
        <div>
          <p className="text-xs text-[var(--text)]/40 uppercase tracking-widest mb-1.5">Note</p>
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Descrizione, operatori usati, come funziona..."
            className="w-full bg-[var(--card)] border border-[color:var(--border)]/8 rounded-xl px-4 py-3 text-sm text-[var(--text)]/70 focus:outline-none focus:border-[color:var(--border)]/20 resize-none leading-relaxed transition-colors"
            rows={4}
          />
        </div>

        {/* SAVE */}
        <button
          onClick={saveEntry}
          disabled={!draft.title?.trim()}
          className="w-full py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity"
        >
          {isNew ? "Crea snippet" : "Salva modifiche"}
        </button>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      <button
        onClick={openNew}
        className="w-full py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Nuovo snippet
      </button>

      {entries.length === 0 ? (
        <p className="text-[var(--text)]/20 text-sm text-center py-10">
          Nessuno snippet ancora.{"\n"}Creane uno con il tasto +
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => openEntry(entry)}
              className="w-full flex items-center justify-between border border-[color:var(--border)] rounded-2xl px-5 py-4 hover:border-[color:var(--border)]/20 active:bg-[var(--card)] transition-all text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{entry.title}</p>
                <p className="text-xs text-[var(--text)]/30 mt-0.5">{entry.createdAt}</p>
                {entry.notes && (
                  <p className="text-xs text-[var(--text)]/20 mt-1 truncate">{entry.notes}</p>
                )}
              </div>
              <svg className="w-4 h-4 text-[var(--text)]/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// ── TYPOGRAPHY CALCULATOR ─────────────────────────────────────────────────────

const SCALE_RATIOS = [
  { label: "Minor Second (1.067)", value: 1.067 },
  { label: "Major Second (1.125)", value: 1.125 },
  { label: "Minor Third (1.200)", value: 1.200 },
  { label: "Major Third (1.250)", value: 1.250 },
  { label: "Perfect Fourth (1.333)", value: 1.333 },
  { label: "Augmented Fourth (1.414)", value: 1.414 },
  { label: "Perfect Fifth (1.500)", value: 1.500 },
  { label: "Golden Ratio (1.618)", value: 1.618 },
];

  const FONT_PRESETS: { name: string; lineHeightSuggested: number; note: string }[] = [
    { name: "Helvetica", lineHeightSuggested: 1.4, note: "Sans-serif geometrico, interlinea compatta" },
    { name: "Arial", lineHeightSuggested: 1.45, note: "Sans-serif neutro, simile a Helvetica" },
    { name: "Garamond", lineHeightSuggested: 1.6, note: "Serif classico, necessita più respiro" },
    { name: "Times New Roman", lineHeightSuggested: 1.5, note: "Serif tradizionale, standard editoriale" },
    { name: "Futura", lineHeightSuggested: 1.35, note: "Geometrico, molto compatto" },
    { name: "Bodoni", lineHeightSuggested: 1.55, note: "Serif didone, contrasto alto" },
    { name: "Gill Sans", lineHeightSuggested: 1.45, note: "Umanistico, leggibile" },
    { name: "Minion", lineHeightSuggested: 1.5, note: "Serif editoriale, ottimo per testo lungo" },
    { name: "Custom", lineHeightSuggested: 1.5, note: "Inserisci il tuo font" },
  ];

  const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

  const PAGE_FORMATS: Record<string, { w: number; h: number; label: string }> = {
    A3: { w: 297, h: 420, label: "A3 — 297 × 420 mm" },
    A4: { w: 210, h: 297, label: "A4 — 210 × 297 mm" },
    A5: { w: 148, h: 210, label: "A5 — 148 × 210 mm" },
    A6: { w: 105, h: 148, label: "A6 — 105 × 148 mm" },
  };

  // suggerisce la font size ottimale in pt in base al formato
  function suggestFontSize(format: string): { min: number; max: number; ideal: number } {
    const suggestions: Record<string, { min: number; max: number; ideal: number }> = {
      A3: { min: 11, max: 14, ideal: 12 },
      A4: { min: 9, max: 12, ideal: 10 },
      A5: { min: 8, max: 10, ideal: 9 },
      A6: { min: 7, max: 9, ideal: 8 },
    };
    return suggestions[format] ?? { min: 9, max: 12, ideal: 10 };
  }

function TypographyTool() {
  const [unit, setUnit] = useState<"pt" | "px">("pt");
  const [baseSize, setBaseSize] = useState(10);
  const [ratio, setRatio] = useState(1.333);
  const [lineHeightRatio, setLineHeightRatio] = useState(1.5);
  const [copied, setCopied] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontWeight, setFontWeight] = useState(400);
  const [pageFormat, setPageFormat] = useState<"A3" | "A4" | "A5" | "A6">("A4");
  const [showPreview, setShowPreview] = useState(false);

  const DPI = 72; // standard tipografico

  function ptToPx(pt: number): number {
    return parseFloat((pt * (96 / 72)).toFixed(2));
  }

  function pxToPt(px: number): number {
    return parseFloat((px * (72 / 96)).toFixed(2));
  }

  function convert(value: number): { primary: number; secondary: number } {
    if (unit === "pt") return { primary: value, secondary: ptToPx(value) };
    return { primary: value, secondary: pxToPt(value) };
  }

  function formatVal(v: number): string {
    return v % 1 === 0 ? v.toString() : v.toFixed(1);
  }

  // scala tipografica dal basso verso l'alto
  const base = unit === "pt" ? baseSize : baseSize;
  const caption = parseFloat((base / ratio).toFixed(2));
  const small = parseFloat((base * Math.pow(ratio, 0.5)).toFixed(2));
  const sub = parseFloat((base * ratio).toFixed(2));
  const h3 = parseFloat((base * Math.pow(ratio, 2)).toFixed(2));
  const h2 = parseFloat((base * Math.pow(ratio, 3)).toFixed(2));
  const h1 = parseFloat((base * Math.pow(ratio, 4)).toFixed(2));

  // interlinea
  function lineHeight(size: number): number {
    return parseFloat((size * lineHeightRatio).toFixed(2));
  }

  // spaziature basate sul baseline grid
  const baseline = lineHeight(base);
  const spacingXS = parseFloat((baseline * 0.25).toFixed(2));
  const spacingSM = parseFloat((baseline * 0.5).toFixed(2));
  const spacingMD = parseFloat((baseline * 1).toFixed(2));
  const spacingLG = parseFloat((baseline * 2).toFixed(2));
  const spacingXL = parseFloat((baseline * 4).toFixed(2));

  const hierarchy = [
    { label: "H1 — Titolo principale", size: h1, weight: "700" },
    { label: "H2 — Titolo sezione", size: h2, weight: "700" },
    { label: "H3 — Sottotitolo", size: h3, weight: "600" },
    { label: "Sub — Sottotitolo piccolo", size: sub, weight: "500" },
    { label: "Body — Corpo testo", size: base, weight: "400" },
    { label: "Small — Testo secondario", size: small, weight: "400" },
    { label: "Caption — Didascalia", size: caption, weight: "400" },
  ];

  const spacings = [
    { label: "XS", value: spacingXS, use: "Spaziatura interna minima" },
    { label: "SM", value: spacingSM, use: "Padding elementi, gap tight" },
    { label: "MD", value: spacingMD, use: "Baseline grid, margine standard" },
    { label: "LG", value: spacingLG, use: "Spaziatura tra sezioni" },
    { label: "XL", value: spacingXL, use: "Margini pagina, sezioni grandi" },
  ];

  function copyValue(val: string) {
    navigator.clipboard.writeText(val);
    setCopied(val);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyAll() {
    const lines = [
      `// Scala tipografica — base ${baseSize}${unit}, ratio ${ratio}`,
      ...hierarchy.map((h) => `${h.label}: ${formatVal(h.size)}${unit} / leading ${formatVal(lineHeight(h.size))}${unit}`),
      "",
      "// Spaziature",
      ...spacings.map((s) => `${s.label}: ${formatVal(s.value)}${unit}`),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied("all");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    
    <div className="space-y-5">

            {/* FONT SELECTOR */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Font di riferimento</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FONT_PRESETS.map((f) => (
            <button
              key={f.name}
              onClick={() => {
                setFontFamily(f.name);
                if (f.name !== "Custom") setLineHeightRatio(f.lineHeightSuggested);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                fontFamily === f.name ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/50"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        {fontFamily !== "Custom" && (
          <p className="text-xs text-white/30">
            {FONT_PRESETS.find((f) => f.name === fontFamily)?.note}
          </p>
        )}
        {fontFamily === "Custom" && (
          <input
            placeholder="Nome font..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        )}
      </div>

      {/* FONT WEIGHT */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Peso font</p>
        <div className="flex flex-wrap gap-1.5">
          {FONT_WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => setFontWeight(w)}
              className={`w-12 py-1.5 rounded-xl text-xs border transition-all ${
                fontWeight === w ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/50"
              }`}
              style={{ fontWeight: w }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* PAGE FORMAT */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Formato pagina</p>
        <div className="flex gap-2">
          {Object.entries(PAGE_FORMATS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => {
                setPageFormat(key as any);
                const s = suggestFontSize(key);
                setBaseSize(unit === "pt" ? s.ideal : parseFloat(ptToPx(s.ideal).toFixed(0)));
              }}
              className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                pageFormat === key ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/50"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30 mt-1.5">{PAGE_FORMATS[pageFormat].label}</p>
        {(() => {
          const s = suggestFontSize(pageFormat);
          return (
            <p className="text-xs text-white/25 mt-0.5">
              Font size consigliata: <span className="text-white/50">{s.min}–{s.max} pt</span> · ideale <span className="text-white/50">{s.ideal} pt</span>
            </p>
          );
        })()}
      </div>

      {/* UNIT SELECTOR */}
      <div className="flex gap-2">
        {(["pt", "px"] as const).map((u) => (
          <button
            key={u}
            onClick={() => {
              if (u === "px" && unit === "pt") setBaseSize(parseFloat(ptToPx(baseSize).toFixed(0)));
              if (u === "pt" && unit === "px") setBaseSize(parseFloat(pxToPt(baseSize).toFixed(0)));
              setUnit(u);
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              unit === u ? "bg-[var(--button-bg)] text-[var(--button-text)] border-[color:var(--border)]" : "bg-[var(--card)] border-[color:var(--border)] text-[var(--text)]/50"
            }`}
          >
            {u === "pt" ? "pt — Stampa" : "px — Schermo"}
          </button>
        ))}
      </div>

      {/* BASE SIZE */}
      <div>
        <div className="flex justify-between mb-1.5">
          <p className="text-xs text-[var(--text)]/40">Corpo testo base</p>
          <span className="text-xs font-mono text-[var(--text)]/70">{baseSize} {unit}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setBaseSize(b => Math.max(6, b - 1))} className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 flex items-center justify-center">−</button>
          <input
            type="range"
            min={unit === "pt" ? 6 : 8}
            max={unit === "pt" ? 14 : 20}
            step={0.5}
            value={baseSize}
            onChange={(e) => setBaseSize(Number(e.target.value))}
            className="flex-1 accent-[var(--text)]"
          />
          <button onClick={() => setBaseSize(b => Math.min(unit === "pt" ? 14 : 20, b + 1))} className="w-9 h-9 rounded-xl bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 flex items-center justify-center">+</button>
        </div>
        <p className="text-xs text-[var(--text)]/25 mt-1 text-right">
          = {unit === "pt" ? ptToPx(baseSize) : pxToPt(baseSize)} {unit === "pt" ? "px" : "pt"}
        </p>
      </div>

      {/* SCALE RATIO */}
      <div>
        <p className="text-xs text-[var(--text)]/40 mb-1.5">Scala modulare</p>
        <div className="flex flex-wrap gap-1.5">
          {SCALE_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRatio(r.value)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                ratio === r.value ? "bg-[var(--button-bg)] text-[var(--button-text)] border-[color:var(--border)]" : "bg-[var(--card)] border-[color:var(--border)] text-[var(--text)]/50"
              }`}
            >
              {r.label.split(" (")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* LINE HEIGHT */}
      <div>
        <div className="flex justify-between mb-1.5">
          <p className="text-xs text-[var(--text)]/40">Rapporto interlinea</p>
          <span className="text-xs font-mono text-[var(--text)]/70">{lineHeightRatio}</span>
        </div>
        <input
          type="range"
          min={1.2}
          max={2.0}
          step={0.05}
          value={lineHeightRatio}
          onChange={(e) => setLineHeightRatio(Number(e.target.value))}
          className="w-full accent-[var(--text)]"
        />
        <div className="flex justify-between text-xs text-[var(--text)]/20 mt-1">
          <span>1.2 — compatto</span>
          <span>2.0 — ariosa</span>
        </div>
      </div>

      {/* GERARCHIA */}
      <div>
        <p className="text-xs text-[var(--text)]/40 uppercase tracking-widest mb-2">Gerarchia tipografica</p>
        <div className="space-y-1.5">
          {hierarchy.map((h) => {
            const lh = lineHeight(h.size);
            const secSize = unit === "pt" ? ptToPx(h.size) : pxToPt(h.size);
            const secLh = unit === "pt" ? ptToPx(lh) : pxToPt(lh);
            const valStr = `${formatVal(h.size)}${unit}`;
            return (
              <div
                key={h.label}
                onClick={() => copyValue(valStr)}
                className="flex items-center justify-between border border-[color:var(--border)]/8 rounded-xl px-4 py-3 cursor-pointer hover:border-[color:var(--border)]/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[var(--text)]/40 truncate">{h.label}</p>
                  <p className="text-xs text-[var(--text)]/25 mt-0.5">
                    leading {formatVal(lh)}{unit}
                    <span className="ml-2 opacity-60">({formatVal(secLh)}{unit === "pt" ? "px" : "pt"})</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-mono font-bold">{formatVal(h.size)}<span className="text-xs text-[var(--text)]/40 ml-0.5">{unit}</span></p>
                  <p className="text-xs text-[var(--text)]/30">{formatVal(secSize)}{unit === "pt" ? "px" : "pt"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SPAZIATURE */}
      <div>
        <p className="text-xs text-[var(--text)]/40 uppercase tracking-widest mb-2">Spaziature</p>
        <div className="space-y-1.5">
          {spacings.map((s) => {
            const sec = unit === "pt" ? ptToPx(s.value) : pxToPt(s.value);
            const valStr = `${formatVal(s.value)}${unit}`;
            return (
              <div
                key={s.label}
                onClick={() => copyValue(valStr)}
                className="flex items-center justify-between border border-[color:var(--border)]/8 rounded-xl px-4 py-3 cursor-pointer hover:border-[color:var(--border)]/20 transition-colors"
              >
                <div>
                  <p className="text-sm font-mono font-semibold">{s.label}</p>
                  <p className="text-xs text-[var(--text)]/30 mt-0.5">{s.use}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-mono font-bold">{formatVal(s.value)}<span className="text-xs text-[var(--text)]/40 ml-0.5">{unit}</span></p>
                  <p className="text-xs text-[var(--text)]/30">{formatVal(sec)}{unit === "pt" ? "px" : "pt"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COPY ALL */}
      <button
        onClick={copyAll}
        className="w-full py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/50 text-sm hover:border-[color:var(--border)]/30 transition-colors"
      >
        {copied === "all" ? "✓ Tutto copiato" : "Copia tutti i valori"}
      </button>

    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

function BottomNav({ activePage }: { activePage?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-t border-[color:var(--border)]/8 flex items-center justify-around px-6 pb-10 pt-4">
      <Link href="/" className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className="text-xs text-[var(--text)]/30 font-medium">Home</span>
      </Link>

      <Link href="/calendar" className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-xs text-[var(--text)]/30 font-medium">Calendario</span>
      </Link>

      <div className="w-10 h-10" />

      <div className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h7v6H4V5zm9 0h7v4h-7V5zM4 13h7v6H4v-6zm9-2h7v8h-7v-8z"/>
          </svg>
        </div>
        <span className="text-xs text-[var(--text)]/30 font-medium">Tools</span>
      </div>

      <Link href="/settings" className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-xs text-[var(--text)]/30 font-medium">Settings</span>
      </Link>
    </nav>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type ToolId = "harmonic" | "bpm" | "palette" | "resolution" | "fps" | "glsl" | "typography" | null;

const TOOL_CATEGORIES = [
  {
    label: "AV",
    subcategories: [
      {
        label: "Ableton",
        icon: "/ableton.svg",
        emoji: null,
        tools: [
          { id: "harmonic" as ToolId, name: "Analisi Armonica", description: "Scale, accordi e note compatibili" },
          { id: "bpm" as ToolId, name: "BPM to ms / Note to Hz", description: "BPM→ms e conversione nota↔frequenza" },
        ],
      },
      {
        label: "TouchDesigner",
        icon: "/touchdesigner.svg",
        emoji: null,
        tools: [
            { id: "resolution" as ToolId, name: "Calcolatore Risoluzione", description: "Aspect ratio e impostazioni TD per qualsiasi output" },
            { id: "fps" as ToolId, name: "FPS Budget", description: "Stima il budget GPU per il tuo setup TD" },
            { id: "glsl" as ToolId, name: "Snippet GLSL", description: "Pattern e effetti pronti per GLSL TOP" },
        ],
      },
    ],
  },
  {
    label: "Graphic Design",
    subcategories: [
      {
        label: "Colore",
        icon: null,
        emoji: "🎨",
        tools: [
          { id: "palette" as ToolId, name: "Generatore Palette", description: "Genera palette colori" },
          { id: "typography" as ToolId, name: "Calcolatore Tipografico", description: "Gerarchia, interlinea e spaziature ottimali" },
        ],
      },
    ],
  },
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  function renderTool() {
    switch (activeTool) {
      case "harmonic": return <HarmonicTool />;
      case "bpm": return <BpmTool />;
      case "palette": return <MoodPaletteTool />;
      case "resolution": return <ResolutionTool/>;
      case "fps": return <FpsBudgetTool />;
      case "glsl": return <GlslTool />;
      case "typography": return <TypographyTool />;
      default: return null;
    }
  }

  function getToolName() {
    for (const cat of TOOL_CATEGORIES)
      for (const sub of cat.subcategories) {
        const tool = sub.tools.find((t) => t.id === activeTool);
        if (tool) return tool.name;
      }
    return "";
  }

  if (activeTool) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
        <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)]/8 px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTool(null)}
              className="w-9 h-9 rounded-xl bg-[var(--card)] flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-4 h-4 text-[var(--text)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base">{getToolName()}</h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-36">
          {renderTool()}
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)]/8 px-5 pt-14 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Tools</h1>
        <p className="text-[var(--text)]/30 text-xs mt-0.5">Strumenti per la produzione</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-36 space-y-8">
        {TOOL_CATEGORIES.map((cat) => (
          <section key={cat.label}>
            <h2 className="text-xs font-semibold text-[var(--text)]/30 uppercase tracking-widest mb-4">{cat.label}</h2>
            <div className="space-y-4">
              {cat.subcategories.map((sub) => (
                <div key={sub.label}>
                  <div className="flex items-center gap-2 mb-2">
                    {sub.icon ? (
                      <img
                      src={sub.icon}
                      alt={sub.label}
                      className="w-4 h-4 object-contain opacity-70 dark-icon"
                    />
                    ) : (
                      <span className="text-sm">{sub.emoji}</span>
                    )}
                    <span className="text-sm text-[var(--text)]/50 font-medium">{sub.label}</span>
                  </div>
                  {sub.tools.length === 0 ? (
                    <p className="text-[var(--text)]/20 text-xs pl-6 py-2">Nessun tool disponibile</p>
                  ) : (
                    <div className="space-y-2">
                      {sub.tools.map((tool) => (
                        <button
                          key={String(tool.id)}
                          onClick={() => setActiveTool(tool.id)}
                          className="w-full flex items-center justify-between border border-[color:var(--border)] rounded-2xl px-5 py-4 hover:border-[color:var(--border)]/20 active:bg-[var(--card)] transition-all text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold">{tool.name}</p>
                            <p className="text-xs text-[var(--text)]/40 mt-0.5">{tool.description}</p>
                          </div>
                          <svg className="w-4 h-4 text-[var(--text)]/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}