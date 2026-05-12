"use client";

import { useState } from "react";
import Link from "next/link";

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

const CHORD_TYPES: Record<string, { name: string; intervals: number[] }> = {
  maj: { name: "", intervals: [0, 4, 7] },
  min: { name: "m", intervals: [0, 3, 7] },
  dim: { name: "dim", intervals: [0, 3, 6] },
  aug: { name: "aug", intervals: [0, 4, 8] },
  maj7: { name: "maj7", intervals: [0, 4, 7, 11] },
  min7: { name: "m7", intervals: [0, 3, 7, 10] },
  dom7: { name: "7", intervals: [0, 4, 7, 10] },
};

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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getNoteFromIndex(root: number, interval: number): string {
  return NOTES[(root + interval) % 12];
}

function getScaleNotes(root: number, scaleKey: string): string[] {
  const scale = SCALES[scaleKey];
  return scale.intervals.map((i) => getNoteFromIndex(root, i));
}

function getChordsForScale(root: number, scaleKey: string) {
  const scale = SCALES[scaleKey];
  const degrees = SCALE_CHORD_DEGREES[scaleKey] ?? [];
  return scale.intervals.map((interval, idx) => {
    const chordRoot = (root + interval) % 12;
    const chordType = CHORD_TYPES[degrees[idx]] ?? CHORD_TYPES.maj;
    return {
      root: NOTES[chordRoot],
      type: chordType.name,
      label: `${NOTES[chordRoot]}${chordType.name}`,
      degree: ["I", "II", "III", "IV", "V", "VI", "VII"][idx],
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

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// ── HARMONIC ANALYSIS ─────────────────────────────────────────────────────────

function HarmonicTool() {
  const [rootIndex, setRootIndex] = useState(0);
  const [scaleKey, setScaleKey] = useState("major");

  const scaleNotes = getScaleNotes(rootIndex, scaleKey);
  const chords = getChordsForScale(rootIndex, scaleKey);

  return (
    <div className="space-y-5">
      {/* SELECTORS */}
      <div className="flex gap-2 flex-wrap">
        <div>
          <p className="text-xs text-white/40 mb-1.5">Tonalità</p>
          <div className="flex flex-wrap gap-1.5">
            {NOTES.map((note, i) => (
              <button
                key={note}
                onClick={() => setRootIndex(i)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                  rootIndex === i ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          <p className="text-xs text-white/40 mb-1.5">Scala</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SCALES).map(([key, { name }]) => (
              <button
                key={key}
                onClick={() => setScaleKey(key)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  scaleKey === key ? "bg-white text-black" : "bg-white/5 border border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SCALE NOTES */}
      <div>
        <p className="text-xs text-white/40 mb-2">Note della scala</p>
        <div className="flex gap-2 flex-wrap">
          {scaleNotes.map((note, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-sm font-semibold">
                {note}
              </div>
              <span className="text-xs text-white/30">
                {["I", "II", "III", "IV", "V", "VI", "VII"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CHORDS */}
      <div>
        <p className="text-xs text-white/40 mb-2">Accordi compatibili</p>
        <div className="grid grid-cols-2 gap-2">
          {chords.map((chord, i) => (
            <div
              key={i}
              className="border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-base font-bold">{chord.label}</p>
                <p className="text-xs text-white/30">{chord.degree} grado</p>
              </div>
              <div className="flex gap-0.5">
                {CHORD_TYPES[SCALE_CHORD_DEGREES[scaleKey]?.[i] ?? "maj"]?.intervals.map((interval, j) => (
                  <div key={j} className="w-1.5 h-6 rounded-full bg-white/20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RELATIVE */}
      <div className="border border-white/8 rounded-xl p-4">
        <p className="text-xs text-white/40 mb-1">
          {scaleKey === "major" ? "Relativa minore" : scaleKey === "minor" ? "Relativa maggiore" : "Relativa maggiore"}
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

// ── BPM CONVERTER ─────────────────────────────────────────────────────────────

function BpmTool() {
  const [bpm, setBpm] = useState(120);
  const subdivisions = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/4T", "1/8T"];

  return (
    <div className="space-y-5">
      {/* BPM INPUT */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">BPM</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBpm(b => Math.max(1, b - 1))}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 text-lg hover:border-white/30 transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Math.max(1, Math.min(300, Number(e.target.value))))}
            className="flex-1 text-center text-3xl font-bold bg-transparent focus:outline-none text-white"
          />
          <button
            onClick={() => setBpm(b => Math.min(300, b + 1))}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 text-lg hover:border-white/30 transition-colors"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={40}
          max={300}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full mt-3 accent-white"
        />
      </div>

      {/* RESULTS */}
      <div>
        <p className="text-xs text-white/40 mb-2">Durate in millisecondi</p>
        <div className="space-y-2">
          {subdivisions.map((sub) => (
            <div
              key={sub}
              className="flex items-center justify-between border border-white/8 rounded-xl px-4 py-3"
            >
              <span className="text-sm text-white/60 w-16">{sub}</span>
              <span className="text-sm font-mono font-semibold">{bpmToMs(bpm, sub)} ms</span>
              <span className="text-xs text-white/30 w-16 text-right">
                {(bpmToMs(bpm, sub) / 1000).toFixed(3)}s
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FREQUENCY */}
      <div className="border border-white/8 rounded-xl p-4">
        <p className="text-xs text-white/40 mb-1">Frequenza (Hz)</p>
        <p className="text-xl font-bold">{(bpm / 60).toFixed(3)} Hz</p>
        <p className="text-xs text-white/30 mt-0.5">Utile per LFO e modulazioni a tempo</p>
      </div>
    </div>
  );
}

// ── MOOD PALETTE ──────────────────────────────────────────────────────────────

function MoodPaletteTool() {
  const [mood, setMood] = useState("");
  const [count, setCount] = useState(5);
  const [palette, setPalette] = useState<{ hex: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function generatePalette() {
    if (!mood.trim()) return;
    setLoading(true);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Genera una palette di esattamente ${count} colori per questo mood/atmosfera: "${mood}".
Rispondi SOLO con un array JSON, senza altro testo, backtick o markdown. Formato esatto:
[{"hex":"#RRGGBB","name":"nome colore in italiano"}]
I colori devono essere armoniosi, evocativi del mood richiesto, e visivamente interessanti.`,
          },
        ],
      }),
    });

    const data = await response.json();
    try {
      const text = data.content[0].text.trim();
      const parsed = JSON.parse(text);
      setPalette(parsed);
    } catch {
      setPalette([]);
    }
    setLoading(false);
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyAll() {
    const text = palette.map((c) => c.hex).join(", ");
    navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-5">
      {/* MOOD INPUT */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Mood / Atmosfera</p>
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") generatePalette(); }}
          placeholder="es. dark ambient, alba invernale, tensione urbana..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* COUNT */}
      <div>
        <p className="text-xs text-white/40 mb-1.5">Numero di colori: <span className="text-white/70">{count}</span></p>
        <input
          type="range"
          min={3}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-white"
        />
        <div className="flex justify-between text-xs text-white/20 mt-1">
          <span>3</span>
          <span>10</span>
        </div>
      </div>

      {/* GENERATE */}
      <button
        onClick={generatePalette}
        disabled={loading || !mood.trim()}
        className="w-full py-4 bg-white text-black rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity"
      >
        {loading ? "Generazione..." : "Genera palette"}
      </button>

      {/* PALETTE */}
      {palette.length > 0 && (
        <div className="space-y-3">
          {/* PREVIEW */}
          <div className="flex h-16 rounded-xl overflow-hidden">
            {palette.map((color, i) => (
              <div
                key={i}
                className="flex-1 cursor-pointer hover:flex-[2] transition-all duration-200"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyHex(color.hex)}
              />
            ))}
          </div>

          {/* LIST */}
          <div className="space-y-2">
            {palette.map((color, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-white/8 rounded-xl px-4 py-3 cursor-pointer hover:border-white/20 transition-colors"
                onClick={() => copyHex(color.hex)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1">
                  <p className="text-sm font-mono font-semibold">{color.hex}</p>
                  <p className="text-xs text-white/40">{color.name}</p>
                </div>
                <span className="text-xs text-white/30">
                  {copied === color.hex ? "✓ Copiato" : "Tocca per copiare"}
                </span>
              </div>
            ))}
          </div>

          {/* COPY ALL */}
          <button
            onClick={copyAll}
            className="w-full py-3 border border-white/10 rounded-xl text-white/50 text-sm hover:border-white/30 transition-colors"
          >
            {copied === "all" ? "✓ Tutti copiati" : "Copia tutti gli hex"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type ToolId = "harmonic" | "bpm" | "palette" | null;

const TOOL_CATEGORIES = [
  {
    label: "AV",
    subcategories: [
      {
        label: "Ableton",
        icon: "/ableton.svg",
        tools: [
          { id: "harmonic" as ToolId, name: "Analisi Armonica", description: "Scale, accordi e note compatibili" },
          { id: "bpm" as ToolId, name: "Convertitore BPM→ms", description: "Durate per delay, LFO e sincronizzazione" },
        ],
      },
      {
        label: "TouchDesigner",
        icon: "/touchdesigner.svg",
        tools: [],
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
          { id: "palette" as ToolId, name: "Palette da Mood", description: "Genera palette colori da un'atmosfera" },
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
      default: return null;
    }
  }

  function getToolName() {
    for (const cat of TOOL_CATEGORIES) {
      for (const sub of cat.subcategories) {
        const tool = sub.tools.find((t) => t.id === activeTool);
        if (tool) return tool.name;
      }
    }
    return "";
  }

  // ─── TOOL VIEW ───────────────────────────────────────────────────────────────

  if (activeTool) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col">
        <header className="sticky top-0 z-50 bg-black border-b border-white/8 px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTool(null)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-bold text-base">{getToolName()}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-36">
          {renderTool()}
        </div>

        {/* BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/8 flex items-center justify-around px-6 pb-10 pt-4">
          <Link href="/" className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs text-white/30 font-medium">Home</span>
          </Link>
          <Link href="/calendar" className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-white/30 font-medium">Calendario</span>
          </Link>
          <div className="w-10 h-10" />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-xs text-white/60 font-medium">Tools</span>
          </div>
          <Link href="/settings" className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs text-white/30 font-medium">Settings</span>
          </Link>
        </nav>
      </main>
    );
  }

  // ─── TOOLS LIST ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/8 px-5 pt-14 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Tools</h1>
        <p className="text-white/30 text-xs mt-0.5">Strumenti per la produzione</p>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-36 space-y-8">
        {TOOL_CATEGORIES.map((cat) => (
          <section key={cat.label}>
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
              {cat.label}
            </h2>

            <div className="space-y-4">
              {cat.subcategories.map((sub) => (
                <div key={sub.label}>
                  {/* SUBCATEGORY HEADER */}
                  <div className="flex items-center gap-2 mb-2">
                    {sub.icon ? (
                      <img src={sub.icon} alt={sub.label} className="w-4 h-4 object-contain invert opacity-50" />
                    ) : (
                      <span className="text-sm">{(sub as any).emoji}</span>
                    )}
                    <span className="text-sm text-white/50 font-medium">{sub.label}</span>
                  </div>

                  {sub.tools.length === 0 ? (
                    <p className="text-white/20 text-xs pl-6 py-2">Nessun tool disponibile</p>
                  ) : (
                    <div className="space-y-2 pl-0">
                      {sub.tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveTool(tool.id)}
                          className="w-full flex items-center justify-between border border-white/10 rounded-2xl px-5 py-4 hover:border-white/20 active:bg-white/5 transition-all text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold">{tool.name}</p>
                            <p className="text-xs text-white/40 mt-0.5">{tool.description}</p>
                          </div>
                          <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/8 flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Home</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Calendario</span>
        </Link>
        <div className="w-10 h-10" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <span className="text-xs text-white/60 font-medium">Tools</span>
        </div>
        <Link href="/settings" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Settings</span>
        </Link>
      </nav>
    </main>
  );
}