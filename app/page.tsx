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
  { value: "deadline_asc", label: "Deadline (prima i urgenti)" },
  { value: "deadline_desc", label: "Deadline (ultimi)" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PRIORITY_ORDER: Record<Project["priority"], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-white/40",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

const CATEGORY_LOGO: Record<Project["category"], string> = {
  Ableton: "/ableton.svg",
  TouchDesigner: "/touchdesigner.svg",
};

// ─── SORT FUNCTION ────────────────────────────────────────────────────────────

function sortProjects(projects: Project[], sort: SortOption): Project[] {
  const sorted = [...projects];

  switch (sort) {
    case "created_desc":
      return sorted;
    case "created_asc":
      return sorted.reverse();
    case "priority_desc":
      return sorted.sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
    case "priority_asc":
      return sorted.sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      );
    case "deadline_asc":
      return sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case "deadline_desc":
      return sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      });
    default:
      return sorted;
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

  // ── LOAD ──────────────────────────────────────────────────────────────────

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading projects:", error.message);
      return;
    }

    setProjects(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // ── ADD PROJECT ───────────────────────────────────────────────────────────

  async function addProject() {
    if (!newProject.trim()) return;

    const slug = `${slugify(newProject)}-${Date.now()}`;

    const newProj: Project = {
      title: newProject.trim(),
      slug,
      status: "Active",
      priority: "Low",
      deadline: "",
      category: "Ableton",
      notes: "",
      tasks: [],
      folder: "",
    };

    const { error } = await supabase.from("projects").insert(newProj);

    if (error) {
      console.error("Error adding project:", error.message);
      return;
    }

    setNewProject("");
    loadProjects();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addProject();
  }

  // ── UPDATE FIELD ──────────────────────────────────────────────────────────

  async function updateField<K extends keyof Project>(
    slug: string,
    field: K,
    value: Project[K]
  ) {
    const { error } = await supabase
      .from("projects")
      .update({ [field]: value })
      .eq("slug", slug);

    if (error) {
      console.error("Error updating field:", error.message);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, [field]: value } : p))
    );
  }

  // ── DELETE PROJECT ────────────────────────────────────────────────────────

  async function deleteProject(slug: string, title: string) {
    const confirmed = window.confirm(`Delete project "${title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error("Error deleting project:", error.message);
      return;
    }

    setProjects((prev) => prev.filter((p) => p.slug !== slug));
  }

  // ── FILTER + FOLDER + SORT ────────────────────────────────────────────────

  // progetti filtrati per categoria
  const filteredByCategory = projects.filter(
    (p) => filter === "All" || p.category === filter
  );

  // cartelle disponibili per la categoria selezionata (escluse le vuote)
  const availableFolders = Array.from(
    new Set(
      filteredByCategory
        .map((p) => p.folder?.trim())
        .filter((f) => f && f.length > 0)
    )
  ).sort();

  // se il filtro categoria cambia, resetta la cartella attiva
  function handleFilterChange(f: Filter) {
    setFilter(f);
    setActiveFolder(null);
  }

  // progetti filtrati per categoria + cartella
  const filteredByFolder = activeFolder
    ? filteredByCategory.filter((p) => p.folder?.trim() === activeFolder)
    : filteredByCategory;

  const sorted = sortProjects(filteredByFolder, sort);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-white p-10">

      {/* HEADER */}
      <h1 className="text-4xl font-bold tracking-tight mb-1">
        AV Workflow Manager
      </h1>
      <p className="text-white/40 text-sm mb-8">
        {projects.length} project{projects.length !== 1 ? "s" : ""}
      </p>

      {/* FILTERS + SORT */}
      <div className="flex flex-wrap gap-2 mb-3 justify-between items-center">

        {/* CATEGORY FILTERS */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`flex items-center gap-1.5 px-3 py-1 text-sm border transition-colors ${
                filter === f
                  ? "border-white text-white"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              {f !== "All" && (
                <img
                  src={CATEGORY_LOGO[f as Project["category"]]}
                  alt={f}
                  className="w-3.5 h-3.5 object-contain invert"
                />
              )}
              {f}
            </button>
          ))}
        </div>

        {/* SORT */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bg-black border border-white/20 text-white/50 text-sm px-2 py-1 focus:outline-none hover:border-white/40 transition-colors"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* FOLDER SUBFILTERS */}
      {availableFolders.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveFolder(null)}
            className={`px-3 py-1 text-xs border transition-colors ${
              activeFolder === null
                ? "border-white/60 text-white/60"
                : "border-white/10 text-white/30 hover:border-white/30"
            }`}
          >
            Tutte le cartelle
          </button>
          {availableFolders.map((folder) => {
            const count = filteredByCategory.filter(
              (p) => p.folder?.trim() === folder
            ).length;
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  activeFolder === folder
                    ? "border-white/60 text-white/60"
                    : "border-white/10 text-white/30 hover:border-white/30"
                }`}
              >
                {folder}
                <span className="ml-1 text-white/20">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ADD PROJECT */}
      <div className="flex gap-2 mb-10">
        <input
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New project name..."
          className="flex-1 p-2 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
        />
        <button
          onClick={addProject}
          className="bg-white text-black px-5 font-bold hover:bg-white/80 transition-colors"
        >
          +
        </button>
      </div>

      {/* PROJECT LIST */}
      {loading && (
        <p className="text-white/30 text-sm">Loading projects...</p>
      )}

      {!loading && sorted.length === 0 && (
        <p className="text-white/30 text-sm">No projects yet.</p>
      )}

      <div className="space-y-4">
        {sorted.map((project) => {
          const progress = getProgress(project);

          return (
            <div
              key={project.slug}
              className="border border-white/10 p-5 rounded-lg hover:border-white/20 transition-colors"
            >
              {/* TITLE */}
              <div className="flex items-center gap-2">
                <img
                  src={CATEGORY_LOGO[project.category]}
                  alt={project.category}
                  className="w-5 h-5 object-contain invert flex-shrink-0"
                />
                <input
                  value={project.title}
                  onChange={(e) =>
                    updateField(project.slug, "title", e.target.value)
                  }
                  className="text-xl font-semibold bg-transparent w-full focus:outline-none focus:border-b focus:border-white/20"
                />
                {project.folder?.trim() && (
                  <span className="text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {project.folder}
                  </span>
                )}
              </div>

              {/* META CONTROLS */}
              <div className="flex gap-2 mt-3 flex-wrap items-center">
                <select
                  value={project.category}
                  onChange={(e) =>
                    updateField(
                      project.slug,
                      "category",
                      e.target.value as Project["category"]
                    )
                  }
                  className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
                >
                  <option value="Ableton">Ableton</option>
                  <option value="TouchDesigner">TouchDesigner</option>
                </select>

                <select
                  value={project.priority}
                  onChange={(e) =>
                    updateField(
                      project.slug,
                      "priority",
                      e.target.value as Project["priority"]
                    )
                  }
                  className={`bg-black border border-white/20 text-sm px-2 py-1 focus:outline-none ${PRIORITY_COLOR[project.priority]}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  value={project.status}
                  onChange={(e) =>
                    updateField(
                      project.slug,
                      "status",
                      e.target.value as Project["status"]
                    )
                  }
                  className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Blocked">Blocked</option>
                </select>

                <input
                  type="date"
                  value={project.deadline}
                  onChange={(e) =>
                    updateField(project.slug, "deadline", e.target.value)
                  }
                  className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
                />
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>
                    {project.tasks.filter((t) => t.done).length}/
                    {project.tasks.length} tasks
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1 bg-white/10">
                  <div
                    className="h-1 bg-white transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-between items-center mt-4">
                <Link
                  href={`/projects/${project.slug}`}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Open project →
                </Link>
                <button
                  onClick={() => deleteProject(project.slug, project.title)}
                  className="text-sm text-white/30 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}