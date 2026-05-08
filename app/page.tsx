"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Project } from "@/app/types/project";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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
  High: 0,
  Medium: 1,
  Low: 2,
};

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-white/30",
  Medium: "text-yellow-400",
  High: "text-red-400",
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
    case "deadline_asc": return sorted.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    case "deadline_desc": return sorted.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    });
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
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

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
    const confirmed = window.confirm(`Delete "${title}"?`);
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
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/5 px-8 pt-20 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold tracking-tight">AV Workflow Manager</h1>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-transparent border border-white/15 text-white/40 text-xs px-2 py-1 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-black">{o.label}</option>
              ))}
            </select>
            <span className="text-white/20 text-xs">{sorted.length}</span>
          </div>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border flex-shrink-0 transition-all ${
                filter === f
                  ? "border-white/40 text-white bg-white/10"
                  : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              {f !== "All" && (
                <img src={CATEGORY_LOGO[f as Project["category"]]} alt={f} className="w-3 h-3 object-contain invert" />
              )}
              {f}
            </button>
          ))}
        </div>

        {/* FOLDER SUBFILTERS */}
        {availableFolders.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFolder(null)}
              className={`px-2.5 py-1 text-xs rounded-full border flex-shrink-0 transition-all ${
                activeFolder === null ? "border-white/20 text-white/50" : "border-white/5 text-white/20"
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
                  className={`px-2.5 py-1 text-xs rounded-full border flex-shrink-0 transition-all ${
                    activeFolder === folder ? "border-white/20 text-white/50" : "border-white/5 text-white/20"
                  }`}
                >
                  {folder} <span className="opacity-50">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* PROJECT LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-32">
        {loading && <p className="text-white/20 text-sm text-center mt-10">Caricamento...</p>}
        {!loading && sorted.length === 0 && (
          <p className="text-white/20 text-sm text-center mt-10">Nessun progetto.</p>
        )}

        <div className="space-y-2">
          {sorted.map((project) => {
            const progress = getProgress(project);
            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="block border border-white/8 rounded-xl p-4 hover:border-white/15 active:bg-white/5 transition-all"
              >
                {/* TOP ROW */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={CATEGORY_LOGO[project.category]}
                      alt={project.category}
                      className="w-4 h-4 object-contain invert flex-shrink-0 opacity-60"
                    />
                    <span className="font-medium text-sm truncate">{project.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[project.status]}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[project.priority]}`} />
                  </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2">
                    {project.folder?.trim() && (
                      <span className="text-xs text-white/20 border border-white/8 px-1.5 py-0.5 rounded-full">
                        {project.folder}
                      </span>
                    )}
                    {project.deadline && (
                      <span className="text-xs text-white/20">{project.deadline}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-0.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-white/40 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-white/20">{progress}%</span>
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
          <div className="w-full bg-zinc-950 border-t border-white/10 p-6 rounded-t-2xl">
            <h2 className="text-sm font-semibold mb-4 text-white/60">Nuovo progetto</h2>
            <input
              autoFocus
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome progetto..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setNewProject(""); }}
                className="flex-1 py-3 border border-white/10 rounded-lg text-white/40 text-sm"
              >
                Annulla
              </button>
              <button
                onClick={addProject}
                className="flex-1 py-3 bg-white text-black rounded-lg font-semibold text-sm"
              >
                Crea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-black/90 backdrop-blur border-t border-white/5 flex items-center justify-around px-6 pb-8 pt-3">
        <div className="flex flex-col items-center gap-1">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs text-white/60">Home</span>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1 opacity-30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-white/60">Settings</span>
        </div>
      </nav>
    </main>
  );
}