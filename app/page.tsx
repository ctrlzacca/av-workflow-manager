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

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-white/40",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

const CATEGORY_LOGO: Record<Project["category"], string> = {
  Ableton: "/ableton.svg",
  TouchDesigner: "/touchdesigner.svg",
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
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

  // ── FILTER ────────────────────────────────────────────────────────────────

  const filtered =
    filter === "All"
      ? projects
      : projects.filter((p) => p.category === filter);

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

      {/* FILTERS */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
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

      {!loading && filtered.length === 0 && (
        <p className="text-white/30 text-sm">No projects yet.</p>
      )}

      <div className="space-y-4">
        {filtered.map((project) => {
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