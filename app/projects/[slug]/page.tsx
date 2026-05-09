"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import type { Project } from "@/app/types/project";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-white/30",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

const CATEGORY_LOGO: Record<Project["category"], string> = {
  Ableton: "/ableton.svg",
  TouchDesigner: "/touchdesigner.svg",
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "info" | "notes">("tasks");
  const [showSaved, setShowSaved] = useState(false);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).single();
      if (error) { console.error("Error loading project:", error.message); setLoading(false); return; }
      setProject(data);
      setLoading(false);
    }
    loadProject();
  }, [slug]);

  useEffect(() => {
    async function loadAllFolders() {
      const { data } = await supabase.from("projects").select("*");
      setAllProjects(data ?? []);
    }
    loadAllFolders();
  }, [project?.folder]);

  // ── UPDATE FIELD ──────────────────────────────────────────────────────────

  async function updateField<K extends keyof Project>(field: K, value: Project[K]) {
  if (!project) return;
  const { error } = await supabase.from("projects").update({ [field]: value }).eq("slug", slug);
  if (error) { console.error("Error updating field:", error.message); return; }
  setProject((prev) => (prev ? { ...prev, [field]: value } : prev));

  // feedback visivo
  setShowSaved(true);
  setTimeout(() => setShowSaved(false), 2000);
}

  // ── ADD TASK ──────────────────────────────────────────────────────────────

  async function addTask() {
    if (!newTask.trim() || !project) return;
    const updatedTasks = [...(project.tasks ?? []), { title: newTask.trim(), done: false }];
    await updateField("tasks", updatedTasks);
    setNewTask("");
  }

  // ── TOGGLE TASK ───────────────────────────────────────────────────────────

  async function toggleTask(index: number) {
    if (!project) return;
    const updatedTasks = project.tasks.map((t, i) => i === index ? { ...t, done: !t.done } : t);
    await updateField("tasks", updatedTasks);
  }

  // ── DELETE TASK ───────────────────────────────────────────────────────────

  async function deleteTask(index: number, taskTitle: string) {
    if (!project) return;
    const confirmed = window.confirm(`Eliminare "${taskTitle}"?`);
    if (!confirmed) return;
    const updatedTasks = project.tasks.filter((_, i) => i !== index);
    await updateField("tasks", updatedTasks);
  }

  // ── AVAILABLE FOLDERS ─────────────────────────────────────────────────────

  const availableFolders = Array.from(
    new Set(
      allProjects
        .filter((p) => p.category === project?.category)
        .map((p) => p.folder?.trim())
        .filter((f): f is string => !!f)
    )
  ).sort();

  // ── PROGRESS ──────────────────────────────────────────────────────────────

  const progress = useMemo(() => {
    if (!project || project.tasks.length === 0) return 0;
    const done = project.tasks.filter((t) => t.done).length;
    return Math.round((done / project.tasks.length) * 100);
  }, [project]);

  // ─── LOADING / NOT FOUND ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/20 text-sm">Caricamento...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-white/20 text-sm">Progetto non trovato.</p>
        <button onClick={() => router.push("/")} className="text-sm text-white/40 hover:text-white">← Home</button>
      </div>
    );
  }

  const doneTasks = project.tasks.filter((t) => t.done).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER FISSO */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-white/8 px-5 pt-14 pb-0">

        {/* BACK + LOGO + TITOLO */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <img src={CATEGORY_LOGO[project.category]} alt={project.category} className="w-5 h-5 object-contain invert opacity-70" />
          </div>

          <h1 className="font-bold text-base flex-1 truncate">{project.title}</h1>

          <span className={`text-xs font-medium flex-shrink-0 ${PRIORITY_COLOR[project.priority]}`}>
            {project.priority}
          </span>
          {/* SAVE FEEDBACK */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs transition-all duration-300 ${
          showSaved ? "text-green-400 opacity-100" : "text-white/0 opacity-0"
          }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Salvato
          </div>
        </div>

        {/* META CONTROLS */}
        <div className="flex gap-2 flex-wrap mb-3">
          <select
            value={project.status}
            onChange={(e) => updateField("status", e.target.value as Project["status"])}
            className="bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="Active" className="bg-black">Active</option>
            <option value="Paused" className="bg-black">Paused</option>
            <option value="Blocked" className="bg-black">Blocked</option>
          </select>

          <select
            value={project.priority}
            onChange={(e) => updateField("priority", e.target.value as Project["priority"])}
            className={`bg-white/5 border border-white/10 text-xs px-3 py-2 rounded-xl focus:outline-none ${PRIORITY_COLOR[project.priority]}`}
          >
            <option value="Low" className="bg-black">Low</option>
            <option value="Medium" className="bg-black">Medium</option>
            <option value="High" className="bg-black">High</option>
          </select>

          <select
            value={project.category}
            onChange={(e) => updateField("category", e.target.value as Project["category"])}
            className="bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="Ableton" className="bg-black">Ableton</option>
            <option value="TouchDesigner" className="bg-black">TouchDesigner</option>
          </select>

          <input
            type="date"
            value={project.deadline}
            onChange={(e) => updateField("deadline", e.target.value)}
            className="bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
          />
        </div>

        {/* FOLDER */}
        <div className="flex items-center gap-2 mb-3">
          {!showNewFolder ? (
            <>
              <select
                value={project.folder?.trim() || ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") { setShowNewFolder(true); updateField("folder", ""); }
                  else { updateField("folder", e.target.value); }
                }}
                className="bg-white/5 border border-white/10 text-white/40 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="" className="bg-black">Nessuna cartella</option>
                {availableFolders.map((f) => (
                  <option key={f} value={f} className="bg-black">{f}</option>
                ))}
                <option value="__new__" className="bg-black">+ Nuova cartella...</option>
              </select>

              {project.folder?.trim() && (
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(`Eliminare la cartella "${project.folder}" da tutti i progetti?`);
                    if (!confirmed) return;
                    await supabase.from("projects").update({ folder: "" }).eq("folder", project.folder).eq("category", project.category);
                    updateField("folder", "");
                  }}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            <input
              autoFocus
              type="text"
              placeholder="Nome cartella..."
              className="bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-white/20 w-44"
              onKeyDown={(e) => {
                if (e.key === "Enter") { const val = (e.target as HTMLInputElement).value.trim(); if (val) updateField("folder", val); setShowNewFolder(false); }
                if (e.key === "Escape") setShowNewFolder(false);
              }}
              onBlur={(e) => { const val = e.target.value.trim(); if (val) updateField("folder", val); setShowNewFolder(false); }}
            />
          )}
        </div>

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/25 mb-1.5">
            <span>{doneTasks}/{project.tasks.length} tasks completate</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-white/8 rounded-full">
            <div className="h-full bg-white/50 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/8">
          {(["tasks", "info", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-white text-white" : "border-transparent text-white/30"
              }`}
            >
              {tab === "tasks" ? `Tasks (${project.tasks.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-36">

        {/* ── TAB TASKS ── */}
        {activeTab === "tasks" && (
          <div>
            <div className="flex gap-2 mb-5">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 text-sm"
                placeholder="Aggiungi task..."
              />
              <button onClick={addTask} className="bg-white text-black px-5 rounded-xl font-bold text-lg">
                +
              </button>
            </div>

            <div className="space-y-2">
              {project.tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border border-white/8 rounded-xl px-4 py-4"
                >
                  <button
                    onClick={() => toggleTask(i)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      task.done ? "bg-white border-white" : "border-white/20"
                    }`}
                  >
                    {task.done && (
                      <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${task.done ? "line-through text-white/20" : "text-white/80"}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(i, task.title)}
                    className="text-white/15 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-400/10 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {project.tasks.length === 0 && (
                <p className="text-white/15 text-sm text-center py-12">Nessuna task ancora.</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB INFO ── */}
        {activeTab === "info" && (
          <div className="divide-y divide-white/5">

            {project.category === "Ableton" && (
              <>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-white/30 text-sm w-24 flex-shrink-0">BPM</span>
                  <input type="text" value={project.bpm ?? ""} onChange={(e) => updateField("bpm", e.target.value)} placeholder="es. 120" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-white/30 text-sm w-24 flex-shrink-0">Tonalità</span>
                  <input type="text" value={project.key ?? ""} onChange={(e) => updateField("key", e.target.value)} placeholder="es. C minor" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
              </>
            )}

            {project.category === "TouchDesigner" && (
              <>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-white/30 text-sm w-24 flex-shrink-0">Risoluzione</span>
                  <input type="text" value={project.resolution ?? ""} onChange={(e) => updateField("resolution", e.target.value)} placeholder="es. 1920x1080" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-white/30 text-sm w-24 flex-shrink-0">FPS</span>
                  <input type="text" value={project.fps ?? ""} onChange={(e) => updateField("fps", e.target.value)} placeholder="es. 60" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
              </>
            )}

            <div className="flex items-center gap-4 py-4">
              <span className="text-white/30 text-sm w-24 flex-shrink-0">Plugin</span>
              <input type="text" value={project.plugins ?? ""} onChange={(e) => updateField("plugins", e.target.value)} placeholder="es. Serum, Reverb" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
            </div>

            <div className="flex items-center gap-4 py-4">
              <span className="text-white/30 text-sm w-24 flex-shrink-0">Link</span>
              {project.links?.trim() ? (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <a
                    href={project.links.startsWith("http") ? project.links : `https://${project.links}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm truncate flex-1 min-w-0"
                  >
                    {project.links.replace(/^https?:\/\//, "")}
                  </a>
                  <button
                    onClick={() => updateField("links", "")}
                    className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center border border-white/10 rounded-lg text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input type="text" value={project.links ?? ""} onChange={(e) => updateField("links", e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
              )}
            </div>

            <div className="flex items-center gap-4 py-4">
              <span className="text-white/30 text-sm w-24 flex-shrink-0">Extra</span>
              <input type="text" value={project.extra_info ?? ""} onChange={(e) => updateField("extra_info", e.target.value)} placeholder="Info aggiuntive..." className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
            </div>

          {/* DELETE PROJECT */}
            <div className="flex items-center gap-4 py-4">
            <span className="text-white/30 text-sm w-24 flex-shrink-0">Progetto</span>
            <button
            onClick={async () => {
            const confirmed = window.confirm(`Eliminare "${project.title}"? Questa azione è irreversibile.`);
            if (!confirmed) return;
            const { error } = await supabase.from("projects").delete().eq("slug", slug);
            if (!error) router.push("/");
            }}
            className="text-red-400/60 hover:text-red-400 text-sm transition-colors border border-red-400/20 hover:border-red-400/40 px-4 py-2 rounded-xl"
            >
            Elimina progetto
            </button>
            </div>
          </div>
        )}

        {/* ── TAB NOTES ── */}
        {activeTab === "notes" && (
          <textarea
            value={project.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Scrivi qui le tue note..."
            className="w-full h-80 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15 resize-none leading-relaxed"
          />
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/8 flex items-center justify-around px-8 pb-10 pt-4">
        <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-white/30 font-medium">Home</span>
        </button>

        <div className="w-14 h-14" />

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