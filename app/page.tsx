"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Project, Category } from "@/app/types/project";
import { renderIcon } from "@/app/lib/renderIcon";
import { PRESET_SOFTWARES } from "@/app/lib/presetSoftwares";
import { useRef } from "react";
import { usePwaInstall } from "@/app/hooks/usePwaInstall";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getProgress(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const done = project.tasks.filter((t) => t.done).length;
  return Math.round((done / project.tasks.length) * 100);
}

function getProjectBackground(project: Project, categories: Category[]): string {
  const category = categories.find((c) => c.name === project.category);

  if (category?.color) {
    return category.color;
  }

  let hash = 0;

  for (let i = 0; i < project.slug.length; i++) {
    hash = project.slug.charCodeAt(i) + ((hash << 5) - hash);
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

  return `linear-gradient(${angle}deg, ${palette[0]}, ${palette[1]}, ${palette[2]})`;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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
  Low: "bg-[var(--text)]",
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProject, setNewProject] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("created_desc");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { canInstall, isInstalled, install } = usePwaInstall();


  // ── LOAD ──────────────────────────────────────────────────────────────────

  async function loadData() {
    const [projectsRes, categoriesRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
    ]);

    if (projectsRes.error) { console.error("Error loading projects:", projectsRes.error.message); }
    else { setProjects(projectsRes.data ?? []); }

    if (!categoriesRes.error) { setCategories(categoriesRes.data ?? []); }

    setLoading(false);
  }

useEffect(() => {
  if (searchOpen) {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }
}, [searchOpen])

  useEffect(() => {
    // leggi preferenze di default
    const savedFilter = localStorage.getItem("defaultFilter");
    const savedSort = localStorage.getItem("defaultSort");
    if (savedFilter) setFilter(savedFilter);
    if (savedSort) setSort(savedSort as SortOption);

    loadData();
  }, []);

  // ── ALL FILTERS ───────────────────────────────────────────────────────────

  const allFilters = [
    "All",
    ...categories.map((c) => c.name),
  ];

  // ── ADD PROJECT ───────────────────────────────────────────────────────────

  async function addProject() {
  if (!newProject.trim()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const slug = `${slugify(newProject)}-${Date.now()}`;

  const cat = categories.find((c) => c.name === newProjectCategory);
  const defaultTasks = cat?.default_tasks ?? [];

  const newProj: Project = {
    title: newProject.trim(), slug,
    status: "Active", priority: "Low", deadline: "",
    category: newProjectCategory,
    notes: "", folder: "",
    tasks: defaultTasks,
    bpm: "", key: "", resolution: "", fps: "",
    plugins: "", links: "", extra_info: "",
    custom_fields: {},
    user_id: user.id,
  };

  const { error } = await supabase.from("projects").insert(newProj);
  if (error) { console.error("Error adding project:", error.message); return; }

  setNewProject("");
  setNewProjectCategory("Ableton");
  setShowAdd(false);
  loadData();
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

  function handleFilterChange(f: string) { setFilter(f); setActiveFolder(null); }

  const filteredByFolder = activeFolder
    ? filteredByCategory.filter((p) => p.folder?.trim() === activeFolder)
    : filteredByCategory;

  const filtered = search.trim()
    ? filteredByFolder.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : filteredByFolder;

  const sorted = sortProjects(filtered, sort);

  // ── CATEGORY ICON ─────────────────────────────────────────────────────────

  // In page.tsx
  function getCategoryIcon(categoryName: string) {
    const preset = PRESET_SOFTWARES.find((p) => p.name === categoryName);

    if (preset) {
      return renderIcon(preset.icon, preset.isImage, "w-4 h-4", true);
    }

    const cat = categories.find((c) => c.name === categoryName);

    return renderIcon(cat?.icon ?? "📁", cat?.is_image, "w-4 h-4", true);
  }

  function getCategoryIconSmall(categoryName: string) {
    const preset = PRESET_SOFTWARES.find((p) => p.name === categoryName);

    if (preset) {
      return renderIcon(preset.icon, preset.isImage, "w-3.5 h-3.5");
    }

    const cat = categories.find((c) => c.name === categoryName);

    return renderIcon(cat?.icon ?? "📁", cat?.is_image, "w-3.5 h-3.5");
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">

{/* HEADER HOME */}
<header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-[color:var(--border)] px-5 pt-14 pb-3">

  {/* RIGA 1 — Logo + Titolo + Ricerca */}
  <div className="flex items-center gap-3 mb-4">
    <img src="/icon-512.png" alt="AV" className="w-12 h-12 rounded-xl flex-shrink-0" />
    <p className="text-[var(--text)] font-bold text-xl tracking-tight flex-1 truncate">
      Workflow Manager
    </p>

    <div className="flex items-center gap-2 flex-shrink-0">
      <input
        ref={searchInputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca..."
        className={`h-8 bg-[var(--card)] border border-[color:var(--border)] rounded-xl px-3 text-xs text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none transition-all duration-200 ${
          searchOpen ? "w-30 opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      />
      <button
        onClick={() => {
          if (searchOpen) { setSearch(""); setSearchOpen(false); }
          else { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }
        }}
        className="w-8 h-8 rounded-xl bg-[var(--card)] border border-[color:var(--border)] flex items-center justify-center flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5 text-[var(--text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  </div>

  {/* RIGA 2 — Filtri categoria */}
  <div className="flex gap-2 overflow-x-auto scrollbar-none mb-2">
    {allFilters.map((f) => (
      <button
        key={f}
        onClick={() => handleFilterChange(f)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border flex-shrink-0 transition-all ${
          filter === f
            ? "border-[color:var(--border)] text-[var(--text)] bg-[var(--card)] font-medium"
            : "border-[color:var(--border)] text-[var(--text)]/50"
        }`}
      >
        {f !== "All" && getCategoryIconSmall(f)}
        {f}
      </button>
    ))}
  </div>

  {/* RIGA 3 — Sottofiltri cartelle */}
  {availableFolders.length > 0 && (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-2">
      <button
        onClick={() => setActiveFolder(null)}
        className={`px-3 py-1 text-xs rounded-lg border flex-shrink-0 transition-all ${
          activeFolder === null
            ? "border-[color:var(--border)] text-[var(--text)]/50 bg-[var(--card)]"
            : "border-[color:var(--border)] text-[var(--text)]/25"
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
            className={`px-3 py-1 text-xs rounded-lg border flex-shrink-0 transition-all ${
              activeFolder === folder
                ? "border-[color:var(--border)] text-[var(--text)]/50 bg-[var(--card)]"
                : "border-[color:var(--border)] text-[var(--text)]/25"
            }`}
          >
            {folder} <span className="opacity-50 ml-1">({count})</span>
          </button>
        );
      })}
    </div>
  )}

  {/* RIGA 4 — Sort a sinistra */}
  <div className="flex justify-start">
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value as SortOption)}
      className="bg-transparent text-[var(--text)]/30 text-xs focus:outline-none cursor-pointer"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value} className="bg-[var(--bg)]">{o.label}</option>
      ))}
    </select>
  </div>

</header>

            {/* INSTALL BANNER ↓ QUI */}
      {canInstall && !isInstalled && (
        <div className="px-5 pt-2">
          <div className="bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            
            <p className="text-xs text-[var(--text)]/80 leading-tight">
              Installa l'app per accesso rapido
            </p>

            <button
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-[var(--button-bg)] text-[var(--button-text)] text-xs font-medium"
            >
              Installa
            </button>

          </div>
        </div>
      )}

      {/* PROJECT LIST */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-36">
        {loading && <p className="text-[var(--text)]/20 text-sm text-center mt-16">Caricamento...</p>}
        {!loading && sorted.length === 0 && (
          <p className="text-[var(--text)]/20 text-sm text-center mt-16">Nessun progetto ancora.</p>
        )}

        <div className="space-y-3">
          {sorted.map((project) => {
            const progress = getProgress(project);
            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                style={{ background: getProjectBackground(project, categories)}}
                className="block border border-[color:var(--border)] rounded-2xl p-5 hover:border-[color:var(--border)] active:brightness-110 transition-all"
              >
                {/* TOP ROW */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--card)] flex items-center justify-center">
                      <div className="[&_img]:invert [&_img]:opacity-70">
                        {getCategoryIcon(project.category)}
                      </div>
                    </div>
                    <span className="font-semibold text-base truncate text-white">{project.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[project.status]}`} />
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[project.priority]}`} />
                  </div>
                </div>

                {/* META ROW */}
                <div className="flex items-center gap-2 mt-3 ml-11">
                  {project.folder?.trim() && (
                    <span className="text-xs text-white/30 border border-white/20 px-2 py-0.5 rounded-full">
                      {project.folder}
                    </span>
                  )}
                  {project.deadline && (
                    <span className="text-xs text-white/25">{project.deadline}</span>
                  )}
                  <span className="text-xs text-white/20 ml-auto">{STATUS_LABEL[project.status]}</span>
                </div>

                {/* PROGRESS */}
                <div className="mt-3 ml-11">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white/50 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-white/25 flex-shrink-0">{progress}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ADD PROJECT MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-20 bg-[var(--bg)] backdrop-blur flex items-end">
          <div className="w-full bg-[var(--bg)] border-t border-[color:var(--border)] p-6 rounded-t-3xl">
            <div className="w-10 h-1 bg-[var(--card)] rounded-full mx-auto mb-5" />
            <h2 className="text-base font-semibold mb-4">Nuovo progetto</h2>

            <input
              autoFocus
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome progetto..."
              className="w-full p-4 bg-[var(--card)] border border-[color:var(--border)] rounded-xl text-[var(--text)] placeholder:text-[color:var(--text-placeholder)] focus:outline-none focus:border-[color:var(--border)] text-base mb-4"
            />

        {/* CATEGORY SELECTOR */}
            {categories.length === 0 ? (
              <div className="border border-[color:var(--border)] rounded-xl p-4 mb-4 text-center space-y-3">
                <p className="text-[var(--text)] text-sm">Nessuna categoria ancora.</p>
                <p className="text-[var(--text)] text-xs">Aggiungi prima un software in Settings per poter creare un progetto.</p>
                <Link
                  href="/settings"
                  onClick={() => setShowAdd(false)}
                  className="block w-full py-3 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl text-sm font-semibold"
                >
                  Vai a Settings →
                </Link>
              </div>
            ) : (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id ?? cat.name}
                    type="button"
                    onClick={() => setNewProjectCategory(cat.name)}
                    className={`px-4 py-3 rounded-xl border text-sm whitespace-nowrap ${newProjectCategory === cat.name ? "border-[color:var(--button-bg)] bg-[var(--button-bg)] text-[var(--button-text)]" : "border-[color:var(--border)] text-[var(--text)]"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          <Link
            href="/settings"
            onClick={() => setShowAdd(false)}
            className="block text-center text-xs text-[var(--text)] hover:text-[var(--text-hover)] transition-colors mt-2 py-2"
          >
            Gestisci categorie →
          </Link>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAdd(false); setNewProject(""); setNewProjectCategory("Ableton"); }}
                className="flex-1 py-4 border border-[color:var(--border)] rounded-xl text-[color:var(--text-soft)] text-sm font-medium"
              >
                Annulla
              </button>
                <button
                  onClick={addProject}
                  disabled={categories.length === 0 || !newProjectCategory}
                  className="flex-1 py-4 bg-[var(--button-bg)] text-[var(--button-text)] rounded-xl font-semibold text-sm disabled:opacity-30"
                >
                  Crea progetto
                </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg)]/95 backdrop-blur border-t border-[color:var(--border)] flex items-center justify-around px-6 pb-10 pt-4">
        <Link href="/" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/60 font-medium">Home</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Calendario</span>
        </Link>
        <button onClick={() => setShowAdd(true)} className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center text-[var(--text)]">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Nuovo</span>
        </button>
        <Link href="/tools" className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h7v6H4V5zm9 0h7v4h-7V5zM4 13h7v6H4v-6zm9-2h7v8h-7v-8z"/>
            </svg>
          </div>
          <span className="text-xs text-[var(--text)]/30 font-medium">Tools</span>
        </Link>
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
    </main>
  );
}