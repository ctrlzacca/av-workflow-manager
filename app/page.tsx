"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Project } from "@/app/types/project";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getProgress(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const done = project.tasks.filter((t) => t.done).length;
  return Math.round((done / project.tasks.length) * 100);
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Ableton", "TouchDesigner"] as const;
type Filter = (typeof FILTERS)[number];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Più recenti" },
  { value: "created_asc", label: "Più vecchi" },
  { value: "priority_desc", label: "Priorità (High → Low)" },
  { value: "priority_asc", label: "Priorità (Low → High)" },
  { value: "deadline_asc", label: "Deadline (urgenti)" },
  { value: "deadline_desc", label: "Deadline (ultimi)" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PRIORITY_ORDER: Record<Project["priority"], number> = {
  High: 0, Medium: 1, Low: 2,
};

const PRIORITY_DOT: Record<Project["priority"], string> = {
  Low: "bg-white/20",
  Medium: "bg-yellow-400",
  High: "bg-red-400",
};

const STATUS_DOT: Record<Project["status"], string> = {
  Active: "bg-green-400",
  Paused: "bg-yellow-400",
  Blocked: "bg-red-400",
};

const STATUS_LABEL: Record<Project["status"], string> = {
  Active: "Attivo",
  Paused: "In pausa",
  Blocked: "Bloccato",
};

const CATEGORY_LOGO: Record<Project["category"], string> = {
  Ableton: "/ableton.svg",
  TouchDesigner: "/touchdesigner.svg",
};

// ─── SORT ────────────────────────────────────────────────────────────────────

function sortProjects(projects: Project[], sort: SortOption): Project[] {
  const sorted = [...projects];
  switch (sort) {
    case "created_desc": return sorted;
    case "created_asc": return sorted.reverse();
    case "priority_desc": return sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    case "priority_asc": return sorted.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    case "deadline_asc": return sorted.sort((a, b) => { if (!a.deadline) return 1; if (!b.deadline) return -1; return new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); });
    case "deadline_desc": return sorted.sort((a, b) => { if (!a.deadline) return 1; if (!b.deadline) return -1; return new Date(b.deadline).getTime() - new Date(a.deadline).getTime(); });
    default: return sorted;
  }
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("created_desc");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  async function loadProjects() {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) { console.error("Error loading projects:", error.message); return; }
    setProjects(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  // ── ADD PROJECT ───────────────────────────────────────────────────────────

  async function addProject() {
    if (!newProject.trim()) return;
    const slug = `${slugify(newProject)}-${Date.now()}`;
    const newProj: Project = {
      title: newProject.trim(), slug,
      status: "Active", priority: "Low", deadline: "",
      category: filter !== "All" ? filter as Project["category"] : "Ableton",
      notes: "", tasks: [], folder: "",
      bpm: "", key: "", resolution: "", fps: "",
      plugins: "", links: "", extra_info: "",
    };
    const { error } = await supabase.from("projects").insert(newProj);
    if (error) { console.error("Error adding project:", error.message); return; }
    setNewProject("");
    setShowAdd(false);
    loadProjects();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addProject();
    if (e.key === "Escape") { setShowAdd(false); setNewProject(""); }
  }

  // ── UPDATE FIELD ──────────────────────────────────────────────────────────

  async function updateField<K extends keyof Project>(slug: string, field: K, value: Project[K]) {
    const { error } = await supabase.from("projects").update({ [field]: value }).eq("slug", slug);
    if (error) { console.error("Error updating field:", error.message); return; }
    setProjects((prev) => prev.map((p) => (p.slug === slug ? { ...p, [field]: value } : p)));
  }

  // ── DELETE PROJECT ────────────────────────────────────────────────────────

  async function deleteProject(slug: string, title: string) {
    const confirmed = window.confirm(`Eliminare "${title}"?`);
    if (!confirmed) return;
    const { error } = await supabase.from("projects").delete().eq("slug", slug);
    if (error) { console.error("Error deleting project:", error.message); return; }
    setProjects((prev) => prev.filter((p) => p.slug !== slug));
  }

  // ── FILTER + FOLDER + SORT ────────────────────────────────────────────────

  const filteredByCategory = projects.filter((p) => filter === "All" || p.category === filter);
  const availableFolders = Array.from(
    new Set(filteredByCategory.map((p) => p.folder?.trim()).filter((f) => f && f.length > 0))
  ).sort();

  function handleFilterChange(f: Filter) { setFilter(f); setActiveFolder(null); }

  const filteredByFolder = activeFolder
    ? filteredByCategory.filter((p) => p.folder?.trim() === activeFolder)
    : filteredByCategory;

  const sorted = sortProjects(filteredByFolder, sort);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER FISSO */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-white/8 px-5 pt-14 pb-4">

        {/* TITOLO + SORT */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">AV Workflow</h1>
            <p className="text-white/30 text-xs mt-0.5">{sorted.length} progetti</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 text-white/50 text-xs px-3 py-2 rounded-lg focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-black">{o.label}</option>
            ))}
          </select>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl border flex-shrink-0 transition-all ${
                filter === f
                  ? "border-white/50 text-white bg-white/10 font-medium"
                  : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
              }`}
            >
              {f !== "All" && (
                <img src={CATEGORY_LOGO[f as Project["category"]]} alt={f} className="w-4 h-4 object-contain invert" />
              )}
              {f}
            </button>
          ))}
        </div>

        {/* FOLDER SUBFILTERS */}
        {availableFolders.length > 0 && (
          <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFolder(null)}
              className={`px-3 py-1.5 text-xs rounded-lg border flex-shrink-0 transition-all ${
                activeFolder === null ? "border-white/25 text-white/50 bg-white/5" : "border-white/8 text-white/25"
              }`}
            >
              Tutte
            </button>
            {availableFolders.map((folder) => {
              const count = filteredByCategory.filter((p) => p.folder?.trim() === folder).length;
              return (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`px-3 py-1.5 text-xs rounded-lg border flex-shrink-0 transition-all ${
                    activeFolder === folder ? "border-white/25 text-white/50 bg-white/5" : "border-white/8 text-white/25"
                  }`}
                >
                  {folder} <span className="opacity-50 ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* PROJECT LIST */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-36">
        {loading && <p className="text-white/20 text-sm text-center mt-16">Caricamento...</p>}
        {!loading && sorted.length === 0 && (
          <p className="text-white/20 text-sm text-center mt-16">Nessun progetto ancora.</p>
        )}

        <div className="space-y-3">
          {sorted.map((project) => {
            const progress = getProgress(project);
            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="block border border-white/10 rounded-2xl p-5 hover:border-white/20 active:bg-white/5 transition-all"
              >
                {/* TOP ROW */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <img
                        src={CATEGORY_LOGO[project.category]}
                        alt={project.category}
                        className="w-4 h-4 object-contain invert opacity-70"
                      />
                    </div>
                    <span className="font-semibold text-base truncate">{project.title}</span>
                  </div>

                  {/* STATUS + PRIORITY DOTS */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[project.status]}`} />
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[project.priority]}`} />
                    </div>
                  </div>
                </div>

                {/* META ROW */}
                <div className="flex items-center gap-2 mt-3 ml-11">
                  {project.folder?.trim() && (
                    <span className="text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full">
                      {project.folder}
                    </span>
                  )}
                  {project.deadline && (
                    <span className="text-xs text-white/25">{project.deadline}</span>
                  )}
                  <span className="text-xs text-white/20 ml-auto">
                    {STATUS_LABEL[project.status]}
                  </span>
                </div>

                {/* PROGRESS */}
                <div className="mt-3 ml-11">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/50 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/25 flex-shrink-0">
                      {project.tasks.filter((t) => t.done).length}/{project.tasks.length}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ADD PROJECT MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-20 bg-black/80 backdrop-blur flex items-end">
          <div className="w-full bg-zinc-950 border-t border-white/10 p-6 rounded-t-3xl">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h2 className="text-base font-semibold mb-4">Nuovo progetto</h2>
            <input
              autoFocus
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome progetto..."
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-base mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAdd(false); setNewProject(""); }}
                className="flex-1 py-4 border border-white/10 rounded-xl text-white/40 text-sm font-medium"
              >
                Annulla
              </button>
              <button
                onClick={addProject}
                className="flex-1 py-4 bg-white text-black rounded-xl font-semibold text-sm"
              >
                Crea progetto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/8 flex items-center justify-around px-8 pb-10 pt-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-white/60 font-medium">Home</span>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/10"
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>

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