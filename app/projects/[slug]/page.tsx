"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from("projects").select("*").eq("slug", slug).single();

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
        <button onClick={() => router.push("/")} className="text-sm text-white/40 hover:text-white">
          ← Home
        </button>
      </div>
    );
  }

  const doneTasks = project.tasks.filter((t) => t.done).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER FISSO */}
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/5 px-4 pt-12 pb-3">

        {/* BACK + TITLE */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push("/")} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img src={CATEGORY_LOGO[project.category]} alt={project.category} className="w-4 h-4 object-contain invert opacity-60 flex-shrink-0" />
            <h1 className="font-semibold text-sm truncate">{project.title}</h1>
          </div>
          <span className={`text-xs flex-shrink-0 ${PRIORITY_COLOR[project.priority]}`}>
            {project.priority}
          </span>
        </div>

        {/* META CONTROLS */}
        <div className="flex gap-1.5 flex-wrap">
          <select
            value={project.status}
            onChange={(e) => updateField("status", e.target.value as Project["status"])}
            className="bg-transparent border border-white/10 text-white/40 text-xs px-2 py-1 rounded-full focus:outline-none"
          >
            <option value="Active" className="bg-black">Active</option>
            <option value="Paused" className="bg-black">Paused</option>
            <option value="Blocked" className="bg-black">Blocked</option>
          </select>

          <select
            value={project.priority}
            onChange={(e) => updateField("priority", e.target.value as Project["priority"])}
            className={`bg-transparent border border-white/10 text-xs px-2 py-1 rounded-full focus:outline-none ${PRIORITY_COLOR[project.priority]}`}
          >
            <option value="Low" className="bg-black">Low</option>
            <option value="Medium" className="bg-black">Medium</option>
            <option value="High" className="bg-black">High</option>
          </select>

          <select
            value={project.category}
            onChange={(e) => updateField("category", e.target.value as Project["category"])}
            className="bg-transparent border border-white/10 text-white/40 text-xs px-2 py-1 rounded-full focus:outline-none"
          >
            <option value="Ableton" className="bg-black">Ableton</option>
            <option value="TouchDesigner" className="bg-black">TouchDesigner</option>
          </select>

          <input
            type="date"
            value={project.deadline}
            onChange={(e) => updateField("deadline", e.target.value)}
            className="bg-transparent border border-white/10 text-white/40 text-xs px-2 py-1 rounded-full focus:outline-none"
          />
        </div>

        {/* FOLDER */}
        <div className="flex items-center gap-1.5 mt-2">
          {!showNewFolder ? (
            <>
              <select
                value={project.folder?.trim() || ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") { setShowNewFolder(true); updateField("folder", ""); }
                  else { updateField("folder", e.target.value); }
                }}
                className="bg-transparent border border-white/10 text-white/30 text-xs px-2 py-1 rounded-full focus:outline-none"
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
                  className="text-white/20 hover:text-red-400 transition-colors border border-white/10 rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
              className="bg-transparent border border-white/20 text-white/50 text-xs px-2 py-1 rounded-full focus:outline-none w-36"
              onKeyDown={(e) => {
                if (e.key === "Enter") { const val = (e.target as HTMLInputElement).value.trim(); if (val) updateField("folder", val); setShowNewFolder(false); }
                if (e.key === "Escape") setShowNewFolder(false);
              }}
              onBlur={(e) => { const val = e.target.value.trim(); if (val) updateField("folder", val); setShowNewFolder(false); }}
            />
          )}
        </div>

        {/* PROGRESS */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/20 mb-1">
            <span>{doneTasks}/{project.tasks.length} tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-0.5 bg-white/8 rounded-full">
            <div className="h-full bg-white/40 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-0 mt-3 border-b border-white/5">
          {(["tasks", "info", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-white text-white" : "border-transparent text-white/30"
              }`}
            >
              {tab === "tasks" ? `Tasks (${project.tasks.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">

        {/* ── TAB TASKS ── */}
        {activeTab === "tasks" && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                className="flex-1 p-3 bg-white/5 border border-white/8 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 text-sm"
                placeholder="Aggiungi task..."
              />
              <button
                onClick={addTask}
                className="bg-white text-black px-4 rounded-lg font-bold text-sm"
              >
                +
              </button>
            </div>

            <div className="space-y-1.5">
              {project.tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-white/8 rounded-lg px-3 py-3"
                >
                  <button
                    onClick={() => toggleTask(i)}
                    className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
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
                    className="text-white/15 hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {project.tasks.length === 0 && (
                <p className="text-white/15 text-sm text-center py-8">Nessuna task.</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB INFO ── */}
        {activeTab === "info" && (
          <div className="space-y-0 divide-y divide-white/5">

            {/* TITLE EDIT */}
            <div className="flex items-center gap-3 py-3">
              <span className="text-white/25 text-xs w-20 flex-shrink-0">Titolo</span>
              <input
                type="text"
                value={project.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none"
              />
            </div>

            {project.category === "Ableton" && (
              <>
                <div className="flex items-center gap-3 py-3">
                  <span className="text-white/25 text-xs w-20 flex-shrink-0">BPM</span>
                  <input type="text" value={project.bpm ?? ""} onChange={(e) => updateField("bpm", e.target.value)} placeholder="es. 120" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <span className="text-white/25 text-xs w-20 flex-shrink-0">Tonalità</span>
                  <input type="text" value={project.key ?? ""} onChange={(e) => updateField("key", e.target.value)} placeholder="es. C minor" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
              </>
            )}

            {project.category === "TouchDesigner" && (
              <>
                <div className="flex items-center gap-3 py-3">
                  <span className="text-white/25 text-xs w-20 flex-shrink-0">Risoluzione</span>
                  <input type="text" value={project.resolution ?? ""} onChange={(e) => updateField("resolution", e.target.value)} placeholder="es. 1920x1080" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
                <div className="flex items-center gap-3 py-3">
                  <span className="text-white/25 text-xs w-20 flex-shrink-0">FPS</span>
                  <input type="text" value={project.fps ?? ""} onChange={(e) => updateField("fps", e.target.value)} placeholder="es. 60" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 py-3">
              <span className="text-white/25 text-xs w-20 flex-shrink-0">Plugin</span>
              <input type="text" value={project.plugins ?? ""} onChange={(e) => updateField("plugins", e.target.value)} placeholder="es. Serum, Reverb" className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
            </div>

            <div className="flex items-center gap-3 py-3">
              <span className="text-white/25 text-xs w-20 flex-shrink-0">Link</span>
              {project.links?.trim() ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <a
                    href={project.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm truncate flex-1 min-w-0"
                  >
                    {project.links.replace(/^https?:\/\//, "")}
                  </a>
                  <button
                    onClick={() => updateField("links", "")}
                    className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center border border-white/10 rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input type="text" value={project.links ?? ""} onChange={(e) => updateField("links", e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
              )}
            </div>

            <div className="flex items-center gap-3 py-3">
              <span className="text-white/25 text-xs w-20 flex-shrink-0">Extra</span>
              <input type="text" value={project.extra_info ?? ""} onChange={(e) => updateField("extra_info", e.target.value)} placeholder="Info aggiuntive..." className="flex-1 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15" />
            </div>
          </div>
        )}

        {/* ── TAB NOTES ── */}
        {activeTab === "notes" && (
          <textarea
            value={project.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Scrivi qui le tue note..."
            className="w-full h-64 bg-transparent text-white/80 text-sm focus:outline-none placeholder:text-white/15 resize-none leading-relaxed"
          />
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/90 backdrop-blur border-t border-white/5 flex items-center justify-around px-6 pb-8 pt-3">
        <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1">
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs text-white/30">Home</span>
        </button>

        <div className="w-12 h-12" />

        <div className="flex flex-col items-center gap-1 opacity-20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-white/30">Settings</span>
        </div>
      </nav>
    </main>
  );
}