"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import FilePicker from "./components/FilePicker";

type StagedFile = { path: string; content: string; originalContent: string };
type CommitInfo = { sha: string; message: string; date: string; author: string };

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [view, setView] = useState<"editor" | "history">("editor");

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);

  const [newPath, setNewPath] = useState("");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetPath, setUploadTargetPath] = useState("");

  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [historyPath, setHistoryPath] = useState("");
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewCommit, setPreviewCommit] = useState<{ sha: string; content: string } | null>(null);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      if (!data.authorized) { router.push("/"); return; }
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  async function addFileToBatch(filePath: string) {
    const trimmed = filePath.trim();
    if (!trimmed) return;
    if (stagedFiles.some((f) => f.path === trimmed)) {
      setActiveFileIndex(stagedFiles.findIndex((f) => f.path === trimmed));
      setNewPath(""); setShowFilePicker(false);
      return;
    }
    setLoading(true); setShowFilePicker(false); setStatus(null);
    try {
      const res = await fetch(`/api/admin/read?path=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const content = data.content ?? "";
      setStagedFiles((prev) => [...prev, { path: trimmed, content, originalContent: content }]);
      setActiveFileIndex(stagedFiles.length);
      setNewPath("");
    } catch {
      setStatus({ type: "error", text: "Errore nel caricamento del file." });
    }
    setLoading(false);
  }

  function triggerUpload(targetPath: string) {
    if (!targetPath.trim()) {
      setStatus({ type: "error", text: "Scrivi prima il percorso di destinazione (es. app/page.tsx)." });
      return;
    }
    setUploadTargetPath(targetPath.trim());
    fileInputRef.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const uploadedContent = reader.result as string;
      const targetPath = uploadTargetPath;
      const existingIndex = stagedFiles.findIndex((f) => f.path === targetPath);

      if (existingIndex >= 0) {
        setStagedFiles((prev) => prev.map((f, i) => (i === existingIndex ? { ...f, content: uploadedContent } : f)));
        setActiveFileIndex(existingIndex);
      } else {
        setLoading(true);
        try {
          const res = await fetch(`/api/admin/read?path=${encodeURIComponent(targetPath)}`);
          const data = await res.json();
          setStagedFiles((prev) => [...prev, { path: targetPath, content: uploadedContent, originalContent: data.content ?? "" }]);
          setActiveFileIndex(stagedFiles.length);
        } catch {
          setStagedFiles((prev) => [...prev, { path: targetPath, content: uploadedContent, originalContent: "" }]);
          setActiveFileIndex(stagedFiles.length);
        }
        setLoading(false);
      }
      setStatus({ type: "success", text: `File caricato in "${targetPath}" — rivedi e pubblica quando vuoi.` });
      setNewPath(""); setUploadTargetPath("");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function updateActiveFileContent(newContent: string) {
    if (activeFileIndex === null) return;
    setStagedFiles((prev) => prev.map((f, i) => (i === activeFileIndex ? { ...f, content: newContent } : f)));
  }

  function removeFileFromBatch(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeFileIndex === index) setActiveFileIndex(null);
    else if (activeFileIndex !== null && activeFileIndex > index) setActiveFileIndex(activeFileIndex - 1);
  }

  const changedFiles = stagedFiles.filter((f) => f.content !== f.originalContent);

  async function commitBatch() {
    if (changedFiles.length === 0) { setStatus({ type: "error", text: "Nessuna modifica da pubblicare." }); return; }
    if (!commitMessage.trim()) { setStatus({ type: "error", text: "Scrivi un messaggio di commit." }); return; }
    const confirmed = window.confirm(
      `Confermi il commit di ${changedFiles.length} file?\n\n${changedFiles.map((f) => `• ${f.path}`).join("\n")}\n\nQuesto farà partire il deploy automatico su Vercel.`
    );
    if (!confirmed) return;
    setCommitting(true); setStatus(null);
    try {
      const res = await fetch("/api/admin/commit-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: changedFiles.map((f) => ({ path: f.path, content: f.content })), message: commitMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: data.error ?? "Errore nel commit." });
      } else {
        setStatus({ type: "success", text: `✓ ${data.filesCount} file pubblicati! Deploy in corso su Vercel.` });
        setCommitMessage(""); setStagedFiles([]); setActiveFileIndex(null);
      }
    } catch {
      setStatus({ type: "error", text: "Errore di rete durante il commit." });
    }
    setCommitting(false);
  }

  async function loadHistory(filePath: string) {
    if (!filePath.trim()) return;
    setLoadingHistory(true); setCommits([]); setPreviewCommit(null);
    try {
      const res = await fetch(`/api/admin/history?path=${encodeURIComponent(filePath.trim())}`);
      const data = await res.json();
      setCommits(data.commits ?? []);
      setHistoryPath(filePath.trim());
    } catch {
      setStatus({ type: "error", text: "Errore nel caricamento della cronologia." });
    }
    setLoadingHistory(false);
  }

  async function previewVersion(sha: string) {
    setLoading(true); setStatus(null);
    try {
      const res = await fetch(`/api/admin/read-version?path=${encodeURIComponent(historyPath)}&sha=${sha}`);
      const data = await res.json();
      if (!res.ok) { setStatus({ type: "error", text: data.error ?? "Errore nel caricamento versione." }); setLoading(false); return; }
      if (data.content !== undefined) setPreviewCommit({ sha, content: data.content });
    } catch (err: any) {
      setStatus({ type: "error", text: "Errore di rete: " + err.message });
    }
    setLoading(false);
  }

  function restoreVersion() {
    if (!previewCommit) return;
    const existing = stagedFiles.findIndex((f) => f.path === historyPath);
    if (existing >= 0) {
      setStagedFiles((prev) => prev.map((f, i) => (i === existing ? { ...f, content: previewCommit.content } : f)));
      setActiveFileIndex(existing);
    } else {
      setStagedFiles((prev) => [...prev, { path: historyPath, content: previewCommit.content, originalContent: "" }]);
      setActiveFileIndex(stagedFiles.length);
    }
    setView("editor");
    setStatus({ type: "success", text: "Versione caricata nell'editor — rivedi e pubblica quando vuoi." });
  }

  if (authorized === null) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <p className="text-[var(--text)]/30 text-sm">Verifica accesso...</p>
      </main>
    );
  }

  const activeFile = activeFileIndex !== null ? stagedFiles[activeFileIndex] : null;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">

      <input
        ref={fileInputRef}
        type="file"
        accept=".ts,.tsx,.js,.jsx,.css,.json,.md,text/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)] px-5 pt-14 pb-3">
        <div className="mb-3">
          <h1 className="text-lg font-bold tracking-tight">Admin — Editor</h1>
          <p className="text-[var(--text)]/30 text-xs">Modifica file e pubblica su GitHub</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("editor")}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${view === "editor" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--text)]/50 border border-[color:var(--border)]"}`}
          >
            Editor {changedFiles.length > 0 && `(${changedFiles.length})`}
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${view === "history" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--text)]/50 border border-[color:var(--border)]"}`}
          >
            Cronologia
          </button>
        </div>
      </header>

      {view === "editor" && (
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-10 space-y-4">

          <div>
            <p className="text-xs text-[var(--text)]/40 mb-1.5">Percorso file (nuovo o esistente)</p>
            <div className="flex gap-2">
              <input
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="es. app/page.tsx"
                onKeyDown={(e) => { if (e.key === "Enter") addFileToBatch(newPath); }}
                className="flex-1 bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm font-mono text-[var(--text)] focus:outline-none"
              />
              <button
                onClick={() => setShowFilePicker(!showFilePicker)}
                className="px-3 py-3 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 flex-shrink-0"
              >
                Sfoglia
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => addFileToBatch(newPath)}
                disabled={loading || !newPath.trim()}
                className="flex-1 py-2.5 border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 disabled:opacity-30"
              >
                {loading ? "..." : "Modifica online"}
              </button>
              <button
                onClick={() => triggerUpload(newPath)}
                disabled={loading || !newPath.trim()}
                className="flex-1 py-2.5 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/70 font-medium disabled:opacity-30 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Carica file
              </button>
            </div>
            <p className="text-xs text-[var(--text)]/20 mt-1.5">
              "Modifica online" apre il testo nell'editor sotto. "Carica file" sostituisce il contenuto con un file dal tuo telefono.
            </p>
          </div>

          {stagedFiles.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text)]/40 mb-1.5">File nel batch ({stagedFiles.length})</p>
              <div className="space-y-1.5">
                {stagedFiles.map((f, i) => {
                  const isChanged = f.content !== f.originalContent;
                  const isActive = activeFileIndex === i;
                  return (
                    <div key={f.path} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${isActive ? "border-[color:var(--text)]/30 bg-[var(--card)]" : "border-[color:var(--border)]"}`}>
                      <button onClick={() => setActiveFileIndex(i)} className="flex-1 text-left min-w-0">
                        <p className="text-xs font-mono truncate">{f.path}</p>
                        <p className="text-xs text-[var(--text)]/30">{isChanged ? "● modificato" : "invariato"}</p>
                      </button>
                      <button onClick={() => triggerUpload(f.path)} className="text-[var(--text)]/30 hover:text-[var(--text)] transition-colors w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0" title="Sostituisci con file">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button onClick={() => removeFileFromBatch(i)} className="text-[var(--text)]/20 hover:text-red-400 transition-colors w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0">✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeFile && (
            <div>
              <p className="text-xs text-[var(--text)]/40 mb-1.5 font-mono">{activeFile.path}</p>
              <textarea
                value={activeFile.content}
                onChange={(e) => updateActiveFileContent(e.target.value)}
                className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-xs font-mono text-[var(--text)]/80 focus:outline-none resize-none leading-relaxed"
                rows={16}
                spellCheck={false}
              />
              <p className="text-xs text-[var(--text)]/20 mt-1">{activeFile.content.length.toLocaleString()} caratteri</p>
            </div>
          )}

          {changedFiles.length > 0 && (
            <>
              <div>
                <p className="text-xs text-[var(--text)]/40 mb-1.5">Messaggio commit (per tutti i file)</p>
                <input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="es. fix header e aggiornamento tool"
                  className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] focus:outline-none"
                />
              </div>
              <button
                onClick={commitBatch}
                disabled={committing || !commitMessage.trim()}
                className="w-full py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm disabled:opacity-30"
              >
                {committing ? "Pubblicazione..." : `Commit ${changedFiles.length} file e Deploy`}
              </button>
            </>
          )}

          {status && (
            <div className={`p-3 rounded-xl text-xs ${status.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              {status.text}
            </div>
          )}

          <p className="text-xs text-[var(--text)]/20 text-center">
            Il commit va direttamente su <span className="font-mono">main</span> — Vercel farà il deploy automaticamente in 1-2 minuti.
          </p>
        </div>
      )}

      {view === "history" && (
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-10 space-y-4">
          <div>
            <p className="text-xs text-[var(--text)]/40 mb-1.5">File di cui vedere la cronologia</p>
            <div className="flex gap-2">
              <input
                value={historyPath}
                onChange={(e) => setHistoryPath(e.target.value)}
                placeholder="es. app/page.tsx"
                onKeyDown={(e) => { if (e.key === "Enter") loadHistory(historyPath); }}
                className="flex-1 bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm font-mono text-[var(--text)] focus:outline-none"
              />
              <button
                onClick={() => setShowHistoryPicker(!showHistoryPicker)}
                className="px-3 py-3 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 flex-shrink-0"
              >
                Sfoglia
              </button>
            </div>
            <button
              onClick={() => loadHistory(historyPath)}
              disabled={loadingHistory || !historyPath.trim()}
              className="w-full mt-2 py-2.5 border border-[color:var(--border)] rounded-xl text-xs text-[var(--text)]/50 disabled:opacity-30"
            >
              {loadingHistory ? "Caricamento..." : "Cerca cronologia"}
            </button>
          </div>

          {commits.length > 0 && (
            <div className="space-y-1.5">
              {commits.map((c) => (
                <div key={c.sha} className="border border-[color:var(--border)] rounded-xl p-3">
                  <p className="text-sm font-medium truncate">{c.message}</p>
                  <p className="text-xs text-[var(--text)]/30 mt-0.5">
                    {c.author} · {new Date(c.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <button onClick={() => previewVersion(c.sha)} className="mt-2 text-xs text-[var(--text)]/50 border border-[color:var(--border)] px-3 py-1.5 rounded-full">
                    Vedi questa versione
                  </button>
                </div>
              ))}
            </div>
          )}

          {previewCommit && (
            <div className="border border-[color:var(--border)] rounded-xl p-3 space-y-2">
              <p className="text-xs text-[var(--text)]/40">Anteprima versione {previewCommit.sha.slice(0, 7)}</p>
              <textarea readOnly value={previewCommit.content} className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-xs font-mono text-[var(--text)]/70 resize-none" rows={12} />
              <button onClick={restoreVersion} className="w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-sm font-semibold">
                Ripristina questa versione nell'editor
              </button>
            </div>
          )}
        </div>
      )}

      {showFilePicker && (
        <FilePicker onSelect={(path) => { setShowFilePicker(false); addFileToBatch(path); }} onClose={() => setShowFilePicker(false)} />
      )}
      {showHistoryPicker && (
        <FilePicker onSelect={(path) => { setShowHistoryPicker(false); setHistoryPath(path); loadHistory(path); }} onClose={() => setShowHistoryPicker(false)} />
      )}

    </main>
  );
}