"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

// ─── COMMON FILE SHORTCUTS ──────────────────────────────────────────────────

const COMMON_FILES = [
  "app/page.tsx",
  "app/projects/[slug]/page.tsx",
  "app/calendar/page.tsx",
  "app/tools/page.tsx",
  "app/team/page.tsx",
  "app/settings/page.tsx",
  "app/globals.css",
  "app/lib/renderIcon.tsx",
  "app/lib/presetSoftwares.ts",
  "app/types/project.ts",
  "middleware.ts",
];

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [path, setPath] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  // ── AUTH CHECK ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      // il controllo vero è lato server nelle API, qui è solo UX
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  // ── LOAD FILE ─────────────────────────────────────────────────────────────

  async function loadFile(filePath: string) {
    if (!filePath.trim()) return;
    setLoading(true);
    setStatus(null);
    setShowFilePicker(false);

    try {
      const res = await fetch(`/api/admin/read?path=${encodeURIComponent(filePath.trim())}`);
      const data = await res.json();

      if (data.error && !data.content) {
        setContent("");
        setStatus({ type: "error", text: "File non trovato — verrà creato al commit." });
      } else {
        setContent(data.content ?? "");
      }
      setPath(filePath.trim());
    } catch (err) {
      setStatus({ type: "error", text: "Errore nel caricamento del file." });
    }
    setLoading(false);
  }

  // ── COMMIT ────────────────────────────────────────────────────────────────

  async function commitFile() {
    if (!path.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Path e messaggio di commit sono obbligatori." });
      return;
    }

    const confirmed = window.confirm(`Confermi il commit su "${path}"?\n\nQuesto farà partire il deploy automatico su Vercel.`);
    if (!confirmed) return;

    setCommitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path.trim(), content, message: message.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", text: data.error ?? "Errore nel commit." });
      } else {
        setStatus({ type: "success", text: "✓ Commit effettuato! Deploy in corso su Vercel." });
        setMessage("");
      }
    } catch (err) {
      setStatus({ type: "error", text: "Errore di rete durante il commit." });
    }
    setCommitting(false);
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  if (authorized === null) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <p className="text-[var(--text)]/30 text-sm">Verifica accesso...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)] px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settings")}
            className="w-9 h-9 rounded-full bg-[var(--card)] border border-[color:var(--border)] flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-[var(--text)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Admin — Editor</h1>
            <p className="text-[var(--text)]/30 text-xs">Modifica file e pubblica su GitHub</p>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-10 space-y-4">

        {/* FILE PATH */}
        <div>
          <p className="text-xs text-[var(--text)]/40 mb-1.5">Percorso file</p>
          <div className="flex gap-2">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="es. app/page.tsx"
              className="flex-1 bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm font-mono text-[var(--text)] focus:outline-none"
            />
            <button
              onClick={() => setShowFilePicker(!showFilePicker)}
              className="px-3 py-3 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 flex-shrink-0"
            >
              Scegli
            </button>
          </div>

          {showFilePicker && (
            <div className="mt-2 border border-[color:var(--border)] rounded-xl divide-y divide-[color:var(--border)] overflow-hidden">
              {COMMON_FILES.map((f) => (
                <button
                  key={f}
                  onClick={() => loadFile(f)}
                  className="w-full text-left px-3 py-2.5 text-xs font-mono text-[var(--text)]/60 hover:bg-[var(--card)] transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => loadFile(path)}
            disabled={loading || !path.trim()}
            className="w-full mt-2 py-2.5 border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 disabled:opacity-30"
          >
            {loading ? "Caricamento..." : "Carica contenuto attuale"}
          </button>
        </div>

        {/* CONTENT EDITOR */}
        <div>
          <p className="text-xs text-[var(--text)]/40 mb-1.5">Contenuto file</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Il contenuto del file apparirà qui dopo il caricamento, oppure incolla direttamente il nuovo codice..."
            className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-xs font-mono text-[var(--text)]/80 focus:outline-none resize-none leading-relaxed"
            rows={16}
            spellCheck={false}
          />
          <p className="text-xs text-[var(--text)]/20 mt-1">{content.length.toLocaleString()} caratteri</p>
        </div>

        {/* COMMIT MESSAGE */}
        <div>
          <p className="text-xs text-[var(--text)]/40 mb-1.5">Messaggio commit</p>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="es. fix header home mobile"
            className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] focus:outline-none"
          />
        </div>

        {/* STATUS */}
        {status && (
          <div className={`p-3 rounded-xl text-xs ${
            status.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {status.text}
          </div>
        )}

        {/* COMMIT BUTTON */}
        <button
          onClick={commitFile}
          disabled={committing || !path.trim() || !message.trim()}
          className="w-full py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm disabled:opacity-30"
        >
          {committing ? "Pubblicazione..." : "Commit e Deploy"}
        </button>

        <p className="text-xs text-[var(--text)]/20 text-center">
          Il commit va direttamente su <span className="font-mono">main</span> — Vercel farà il deploy automaticamente in 1-2 minuti.
        </p>

      </div>
    </main>
  );
}