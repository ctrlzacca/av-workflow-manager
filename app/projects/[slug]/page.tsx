"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Project, Category } from "@/app/types/project";
import { renderIcon } from "@/app/lib/renderIcon";
import { PRESET_SOFTWARES } from "@/app/lib/presetSoftwares";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-[var(--text)]/60",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

  // dopo CATEGORY_LOGO
function getProjectBackground(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    ["#1a1a2e", "#16213e", "#0f3460"],
    ["#1a1a1a", "#2d1b2e", "#1a0a2e"],
    ["#0a1628", "#0d2137", "#0a2818"],
    ["#1e1a0a", "#2e2010", "#1e0a0a"],
    ["#0a1a1a", "#0d2e2e", "#0a1e2e"],
    ["#1a0a1a", "#2e102e", "#1a0a2e"],
    ["#0a1e0a", "#102e10", "#0a2e1a"],
    ["#1e0a0a", "#2e1010", "#2e1a0a"],
  ];
  const palette = palettes[Math.abs(hash) % palettes.length];
  const angle = Math.abs(hash >> 4) % 360;
  return `linear-gradient(${angle}deg, ${palette[0]}99, ${palette[1]}99, ${palette[2]}99)`;
}

// ─── MOOD FORM ────────────────────────────────────────────────────────────────

function MoodForm({ onAdd }: { onAdd: (item: { title: string; url: string; note: string }) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  function handleAdd() {
    if (!title.trim() || !url.trim()) return;
    onAdd({ title: title.trim(), url: url.trim(), note: note.trim() });
    setTitle("");
    setUrl("");
    setNote("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-sm hover:border-[color:var(--border)]/20 hover:text-[var(--text)]/60 transition-colors"
      >
        + Aggiungi riferimento
      </button>
    );
  }

  return (
    <div className="border border-[color:var(--border)] rounded-xl p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo (es. Four Tet - Parallel Jalebi)"
        className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Link (YouTube, Spotify, SoundCloud...)"
        className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (es. il bassline al minuto 2:30 mi ispira molto)"
        className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30 resize-none h-20"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setTitle(""); setUrl(""); setNote(""); }}
          className="flex-1 py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-sm"
        >
          Annulla
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 py-3 bg-white text-[var(--text)] rounded-xl text-sm font-semibold"
        >
          Aggiungi
        </button>
      </div>
    </div>
  );
}

// ─── MOOD ITEM ────────────────────────────────────────────────────────────────

function MoodItem({
  item,
  onSave,
  onDelete,
}: {
  item: { title: string; url: string; note: string };
  onSave: (updated: { title: string; url: string; note: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url);
  const [note, setNote] = useState(item.note);

  if (editing) {
    return (
      <div className="border border-[color:var(--border)]/20 rounded-xl p-4 space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30"
          placeholder="Titolo"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30"
          placeholder="Link"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text)]/20 focus:outline-none focus:border-[color:var(--border)]/30 resize-none h-20"
          placeholder="Nota"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setTitle(item.title); setUrl(item.url); setNote(item.note); setEditing(false); }}
            className="flex-1 py-3 border border-[color:var(--border)] rounded-xl text-[var(--text)]/40 text-sm"
          >
            Annulla
          </button>
          <button
            onClick={() => { onSave({ title: title.trim(), url: url.trim(), note: note.trim() }); setEditing(false); }}
            className="flex-1 py-3 bg-white text-[var(--text)] rounded-xl text-sm font-semibold"
          >
            Salva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[color:var(--border)]/8 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text)]/80 truncate">{item.title}</p>
          
          <a  href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 truncate block mt-0.5"
          >
            {item.url.replace(/^https?:\/\//, "")}
          </a>
          {item.note && (
            <p className="text-xs text-[var(--text)]/40 mt-2 leading-relaxed">{item.note}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="text-[var(--text)]/30 hover:text-[var(--text)] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card)] text-xs"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="text-[var(--text)]/30 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-400/10 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "info" | "notes" | "mood">("tasks");
  const [showSaved, setShowSaved] = useState(false);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAll() {
      const [projectRes, categoriesRes, allProjectsRes] = await Promise.all([
        supabase.from("projects").select("*").eq("slug", slug).single(),
        supabase.from("categories").select("*").order("created_at", { ascending: true }),
        supabase.from("projects").select("*"),
      ]);

      if (projectRes.error) { console.error("Error loading project:", projectRes.error.message); setLoading(false); return; }
      setProject(projectRes.data);
      setCategories(categoriesRes.data ?? []);
      setAllProjects(allProjectsRes.data ?? []);
      setLoading(false);
    }
    loadAll();
  }, [slug]);

  useEffect(() => {
    async function reloadFolders() {
      const { data } = await supabase.from("projects").select("*");
      setAllProjects(data ?? []);
    }
    reloadFolders();
  }, [project?.folder]);

  // ── UPDATE FIELD ──────────────────────────────────────────────────────────

  async function updateField<K extends keyof Project>(field: K, value: Project[K]) {
    if (!project) return;
    const { error } = await supabase.from("projects").update({ [field]: value }).eq("slug", slug);
    if (error) { console.error("Error updating field:", error.message); return; }
    setProject((prev) => (prev ? { ...prev, [field]: value } : prev));
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }

  // ── UPDATE CUSTOM FIELD ───────────────────────────────────────────────────

  async function updateCustomField(fieldName: string, value: string) {
    if (!project) return;
    const updated = { ...(project.custom_fields ?? {}), [fieldName]: value };
    await updateField("custom_fields", updated);
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

  // ── CURRENT CATEGORY ──────────────────────────────────────────────────────

  const presetNames = PRESET_SOFTWARES.map((p) => p.name);

  const currentCategory = categories.find((c) => c.name === project?.category);

  const isBuiltin = project ? presetNames.includes(project.category) : false;

  // ── CATEGORY ICON ─────────────────────────────────────────────────────────

  // In page.tsx
    function getCategoryIcon(categoryName: string) {
    const preset = PRESET_SOFTWARES.find((p) => p.name === categoryName);

    if (preset?.icon) {
      return (
        <img
          src={preset.icon}
          alt={categoryName}
          className="w-4 h-4 object-contain opacity-70"
        />
      );
    }

  const cat = categories.find((c) => c.name === categoryName);

  if (cat?.is_image && cat.icon.startsWith("/")) {
    return (
      <img
        src={cat.icon}
        alt={cat.name}
        className="w-4 h-4 object-contain opacity-70"
      />
    );
  }

  return renderIcon(cat?.icon ?? "📁", cat?.is_image);
}

  // ─── LOADING / NOT FOUND ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <p className="text-[var(--text)]/50 text-sm">Caricamento...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--text)]/50 text-sm">Progetto non trovato.</p>
        <button onClick={() => router.push("/")} className="text-sm text-[var(--text)]/40 hover:text-[var(--text)]">← Home</button>
      </div>
    );
  }

  const doneTasks = project.tasks.filter((t) => t.done).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative" 
      >
      {/* HEADER FISSO */}
      <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)]/8 px-5 pt-14 pb-0">

        {/* BACK + LOGO + TITOLO */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl bg-[var(--card)] flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-4 h-4 text-[var(--text)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-9 h-9 rounded-xl bg-[var(--card)] flex items-center justify-center flex-shrink-0">
            {getCategoryIcon(project.category)}
          </div>

          <h1 className="font-bold text-base flex-1 truncate">{project.title}</h1>

          {/* SAVE FEEDBACK */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs transition-all duration-300 ${
            showSaved ? "text-green-400 opacity-100" : "text-[var(--text)]/0 opacity-0"
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Salvato
          </div>

          <span className={`text-xs font-medium flex-shrink-0 ${PRIORITY_COLOR[project.priority]}`}>
            {project.priority}
          </span>
        </div>

        {/* META CONTROLS */}
        <div className="flex gap-2 flex-wrap mb-3">
          <select
            value={project.status}
            onChange={(e) => updateField("status", e.target.value as Project["status"])}
            className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="Active" className="bg-[var(--bg)]">Active</option>
            <option value="Paused" className="bg-[var(--bg)]">Paused</option>
            <option value="Blocked" className="bg-[var(--bg)]">Blocked</option>
          </select>

          <select
            value={project.priority}
            onChange={(e) => updateField("priority", e.target.value as Project["priority"])}
            className={`bg-[var(--card)] border border-[color:var(--border)] text-xs px-3 py-2 rounded-xl focus:outline-none ${PRIORITY_COLOR[project.priority]}`}
          >
            <option value="Low" className="bg-[var(--bg)]">Low</option>
            <option value="Medium" className="bg-[var(--bg)]">Medium</option>
            <option value="High" className="bg-[var(--bg)]">High</option>
          </select>

          <select
            value={project.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
          >
            <option value="Ableton" className="bg-[var(--bg)]">Ableton</option>
            <option value="TouchDesigner" className="bg-[var(--bg)]">TouchDesigner</option>
            {categories.map((cat) => (
            <option key={cat.id} value={cat.name} className="bg-[var(--bg)]">
              {cat.name}
            </option>
            ))}
          </select>

          <input
            type="date"
            value={project.deadline}
            onChange={(e) => updateField("deadline", e.target.value)}
            className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 text-xs px-3 py-2 rounded-xl focus:outline-none"
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
                className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/40 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="" className="bg-[var(--bg)]">Nessuna cartella</option>
                {availableFolders.map((f) => (
                  <option key={f} value={f} className="bg-[var(--bg)]">{f}</option>
                ))}
                <option value="__new__" className="bg-[var(--bg)]">+ Nuova cartella...</option>
              </select>

              {project.folder?.trim() && (
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(`Eliminare la cartella "${project.folder}" da tutti i progetti?`);
                    if (!confirmed) return;
                    await supabase.from("projects").update({ folder: "" }).eq("folder", project.folder).eq("category", project.category);
                    updateField("folder", "");
                  }}
                  className="w-8 h-8 rounded-xl bg-[var(--card)] border border-[color:var(--border)] flex items-center justify-center text-[var(--text)]/60 hover:text-red-400 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Nome cartella..."
              className="bg-[var(--card)] border border-[color:var(--border)] text-[var(--text)]/50 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[color:var(--border)]/20 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) updateField("folder", val);
                  setShowNewFolder(false);
                }
                if (e.key === "Escape") setShowNewFolder(false);
              }}
              ref={(input) => { if (input) (input as any)._ref = input; }}
              id="new-folder-input"
            />
            <button
              onClick={() => {
                const input = document.getElementById("new-folder-input") as HTMLInputElement;
                const val = input?.value.trim();
                if (val) updateField("folder", val);
                setShowNewFolder(false);
              }}
              className="bg-white text-[var(--text)] text-xs px-3 py-2 rounded-xl font-semibold flex-shrink-0"
            >
              OK
            </button>
          </div>
          )}
        </div>

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--text)]/60 mb-1.5">
            <span>{doneTasks}/{project.tasks.length} tasks completate</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-[var(--card)] rounded-full">
            <div className="h-full bg-[var(--card)] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[color:var(--border)]/8">
          {(["tasks", "info", "notes", "mood"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? "border-[color:var(--border)] text-[var(--text)]" : "border-transparent text-[var(--text)]/60"
              }`}
            >
              
              {tab === "tasks" ? `Tasks (${project.tasks.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
          {/* SFONDO COLORATO — solo nel content */}
          <div
            className="absolute left-0 right-0 -z-10 opacity-60 pointer-events-none"
            style={{
              background: getProjectBackground(slug),
              top: "0",
              bottom: "0",
            }}
          />
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
        className="flex-1 p-4 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text)]/50 focus:outline-none focus:border-[color:var(--border)]/20 text-sm"
        placeholder="Aggiungi task..."
      />
      <button onClick={addTask} className="bg-white text-[var(--text)] px-5 rounded-xl font-bold text-lg">+</button>
    </div>

    <div className="space-y-2">
      {project.tasks.map((task, i) => (
        <div
          key={i}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData("text/plain"));
            const to = i;
            if (from === to) return;
            const updated = [...project.tasks];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);
            updateField("tasks", updated);
          }}
          className="flex items-center gap-3 border border-[color:var(--border)] rounded-xl px-4 py-4 cursor-grab active:cursor-grabbing active:border-[color:var(--border)]/30 active:bg-[var(--card)] transition-all"
        >
          {/* TOGGLE */}
          <button
            onClick={() => toggleTask(i)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              task.done ? "bg-white border-[color:var(--border)]" : "border-[color:var(--border)]/20"
            }`}
          >
            {task.done && (
              <svg className="w-3 h-3 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* TITOLO */}
          <span className={`flex-1 text-sm ${task.done ? "line-through text-[var(--text)]/70" : "text-[var(--text)]/80"}`}>
            {task.title}
          </span>

          {/* BOTTONI MOBILE ↑↓ */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => {
                if (i === 0) return;
                const updated = [...project.tasks];
                [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                updateField("tasks", updated);
              }}
              className="text-[var(--text)]/70 hover:text-[var(--text)]/70 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card)] text-sm disabled:opacity-20"
              disabled={i === 0}
            >
              ▲
            </button>
            <button
              onClick={() => {
                if (i === project.tasks.length - 1) return;
                const updated = [...project.tasks];
                [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
                updateField("tasks", updated);
              }}
              className="text-[var(--text)]/70 hover:text-[var(--text)]/70 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card)] text-sm disabled:opacity-20"
              disabled={i === project.tasks.length - 1}
            >
              ▼
            </button>
          </div>

          {/* DELETE */}
          <button
            onClick={() => deleteTask(i, task.title)}
            className="text-[var(--text)]/50 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-400/10 text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
      {project.tasks.length === 0 && (
        <p className="text-[var(--text)]/50 text-sm text-center py-12">Nessuna task ancora.</p>
      )}
    </div>
  </div>
)}

        {/* ── TAB INFO ── */}
        {activeTab === "info" && (
          <div className="divide-y divide-white/5">

            <div className="flex items-center gap-4 py-4">
            <span className="text-[var(--text)]/70 text-sm w-24 flex-shrink-0">Titolo</span>
            <input
              type="text"
              value={project.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none border-b border-[color:var(--border)] focus:border-[color:var(--border)]/30 transition-colors pb-0.5"
            />
          </div>

            {/* CAMPI ABLETON */}
            {project.category === "Ableton" && (
              <>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">BPM</span>
                  <input type="text" value={project.bpm ?? ""} onChange={(e) => updateField("bpm", e.target.value)} placeholder="es. 120" className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
                </div>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Tonalità</span>
                  <input type="text" value={project.key ?? ""} onChange={(e) => updateField("key", e.target.value)} placeholder="es. C minor" className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
                </div>
              </>
            )}

            {/* CAMPI TOUCHDESIGNER */}
            {project.category === "TouchDesigner" && (
              <>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Risoluzione</span>
                  <input type="text" value={project.resolution ?? ""} onChange={(e) => updateField("resolution", e.target.value)} placeholder="es. 1920x1080" className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
                </div>
                <div className="flex items-center gap-4 py-4">
                  <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">FPS</span>
                  <input type="text" value={project.fps ?? ""} onChange={(e) => updateField("fps", e.target.value)} placeholder="es. 60" className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
                </div>
              </>
            )}

            {/* CAMPI CUSTOM CATEGORY */}
            {!isBuiltin && currentCategory?.fields.map((fieldName) => (
              <div key={fieldName} className="flex items-center gap-4 py-4">
                <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0 truncate">{fieldName}</span>
                <input
                  type="text"
                  value={project.custom_fields?.[fieldName] ?? ""}
                  onChange={(e) => updateCustomField(fieldName, e.target.value)}
                  placeholder={`es. ${fieldName}...`}
                  className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40"
                />
              </div>
            ))}

            {/* CAMPI COMUNI */}
            <div className="flex items-center gap-4 py-4">
              <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Plugin</span>
              <input type="text" value={project.plugins ?? ""} onChange={(e) => updateField("plugins", e.target.value)} placeholder="es. Serum, Reverb" className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
            </div>

            <div className="flex items-center gap-4 py-4">
              <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Link</span>
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
                  <button onClick={() => updateField("links", "")} className="text-[var(--text)]/50 hover:text-red-400 transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[color:var(--border)] rounded-lg text-xs">✕</button>
                </div>
              ) : (
                <input type="text" value={project.links ?? ""} onChange={(e) => updateField("links", e.target.value)} placeholder="https://..." className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
              )}
            </div>

            <div className="flex items-center gap-4 py-4">
              <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Extra</span>
              <input type="text" value={project.extra_info ?? ""} onChange={(e) => updateField("extra_info", e.target.value)} placeholder="Info aggiuntive..." className="flex-1 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40" />
            </div>

            {/* DELETE */}
            <div className="flex items-center gap-4 py-4">
              <span className="text-[var(--text)]/60 text-sm w-24 flex-shrink-0">Progetto</span>
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
            className="w-full h-80 bg-transparent text-[var(--text)]/80 text-sm focus:outline-none placeholder:text-[var(--text)]/40 resize-none leading-relaxed"
          />
        )}

            {/* ── TAB MOOD ── */}
    {activeTab === "mood" && (
      <div>
        {/* ADD REFERENCE */}
        <MoodForm onAdd={async (item) => {
          const updated = [...(project.moodboard ?? []), item];
          await updateField("moodboard", updated);
        }} />

      {/* LIST */}
      <div className="mt-4 space-y-3">
        {(project.moodboard ?? []).length === 0 && (
          <p className="text-[var(--text)]/40 text-sm text-center py-8">Nessun riferimento ancora.</p>
        )}
        {(project.moodboard ?? []).map((item, i) => (
          <MoodItem
            key={i}
            item={item}
            onSave={async (updated) => {
              const list = [...(project.moodboard ?? [])];
              list[i] = updated;
              await updateField("moodboard", list);
            }}
            onDelete={async () => {
              const confirmed = window.confirm(`Eliminare "${item.title}"?`);
              if (!confirmed) return;
              const updated = (project.moodboard ?? []).filter((_, j) => j !== i);
              await updateField("moodboard", updated);
            }}
          />
        ))}
      </div>
      </div>
    )}
      </div>


      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-t border-[color:var(--border)]/8 flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Home</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Calendario</span>
        </Link>
        <div className="w-10 h-10" />
        <Link href="/tools" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h7v6H4V5zm9 0h7v4h-7V5zM4 13h7v6H4v-6zm9-2h7v8h-7v-8z"/>
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Tools</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Settings</span>
        </Link>
      </nav>
    </main>
  );
}