"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import type { Project } from "@/app/types/project";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);

  // ── LOAD ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProject() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error loading project:", error.message);
        setLoading(false);
        return;
      }

      setProject(data);
      setLoading(false);
    }

    loadProject();
  }, [slug]);

  // ── UPDATE FIELD ──────────────────────────────────────────────────────────

  async function updateField<K extends keyof Project>(
    field: K,
    value: Project[K]
  ) {
    if (!project) return;

    const { error } = await supabase
      .from("projects")
      .update({ [field]: value })
      .eq("slug", slug);

    if (error) {
      console.error("Error updating field:", error.message);
      return;
    }

    setProject((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  // ── ADD TASK ──────────────────────────────────────────────────────────────

  async function addTask() {
    if (!newTask.trim() || !project) return;

    const updatedTasks = [
      ...(project.tasks ?? []),
      { title: newTask.trim(), done: false },
    ];

    await updateField("tasks", updatedTasks);
    setNewTask("");
  }

  function handleTaskKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTask();
  }

  // ── TOGGLE TASK ───────────────────────────────────────────────────────────

  async function toggleTask(index: number) {
    if (!project) return;

    const updatedTasks = project.tasks.map((t, i) =>
      i === index ? { ...t, done: !t.done } : t
    );

    await updateField("tasks", updatedTasks);
  }

  // ── DELETE TASK ───────────────────────────────────────────────────────────

  async function deleteTask(index: number, taskTitle: string) {
    if (!project) return;

    const confirmed = window.confirm(`Delete task "${taskTitle}"?`);
    if (!confirmed) return;

    const updatedTasks = project.tasks.filter((_, i) => i !== index);
    await updateField("tasks", updatedTasks);
  }

  // ── PROGRESS ──────────────────────────────────────────────────────────────

  const progress = useMemo(() => {
    if (!project || project.tasks.length === 0) return 0;
    const done = project.tasks.filter((t) => t.done).length;
    return Math.round((done / project.tasks.length) * 100);
  }, [project]);

  // ── AVAILABLE FOLDERS ─────────────────────────────────────────────────────

  useEffect(() => {
    async function loadAllFolders() {
      const { data } = await supabase
        .from("projects")
        .select("*");
      setAllProjects(data ?? []);
    }
    loadAllFolders();
  }, [project?.folder]);

  const availableFolders = Array.from(
    new Set(
      allProjects
        .filter((p) => p.category === project?.category)
        .map((p) => p.folder?.trim())
        .filter((f): f is string => !!f)
    )
  ).sort();

  // ─── LOADING / NOT FOUND ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-10 bg-black text-white min-h-screen">
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-10 bg-black text-white min-h-screen">
        <p className="text-white/40 text-sm mb-4">Project not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="p-10 bg-black text-white min-h-screen max-w-2xl mx-auto">

      {/* BACK */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-white/40 hover:text-white transition-colors mb-8 block"
      >
        ← All projects
      </button>

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <img
          src={CATEGORY_LOGO[project.category]}
          alt={project.category}
          className="w-7 h-7 object-contain invert flex-shrink-0"
        />
        <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
      </div>

      <p className="text-white/40 text-sm mt-2 ml-10">
        {project.category}
        {" · "}
        <span className={PRIORITY_COLOR[project.priority]}>
          {project.priority} priority
        </span>
        {project.deadline && ` · Due ${project.deadline}`}
      </p>

      {/* META CONTROLS */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <select
          value={project.status}
          onChange={(e) =>
            updateField("status", e.target.value as Project["status"])
          }
          className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
        >
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Blocked">Blocked</option>
        </select>

        <select
          value={project.priority}
          onChange={(e) =>
            updateField("priority", e.target.value as Project["priority"])
          }
          className={`bg-black border border-white/20 text-sm px-2 py-1 focus:outline-none ${PRIORITY_COLOR[project.priority]}`}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <input
          type="date"
          value={project.deadline}
          onChange={(e) => updateField("deadline", e.target.value)}
          className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
        />
                <div className="flex gap-1 items-center">
  {!showNewFolder ? (
    <>
      <select
        value={project.folder?.trim() || ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setShowNewFolder(true);
            updateField("folder", "");
          } else {
            updateField("folder", e.target.value);
          }
        }}
        className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none"
      >
        <option value="">Nessuna cartella</option>
        {availableFolders.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
        <option value="__new__">+ Nuova cartella...</option>
      </select>

      {project.folder?.trim() && (
        <button
          onClick={async () => {
            const confirmed = window.confirm(
              `Eliminare la cartella "${project.folder}" da tutti i progetti? I progetti non verranno eliminati.`
            );
            if (!confirmed) return;
            await supabase
              .from("projects")
              .update({ folder: "" })
              .eq("folder", project.folder)
              .eq("category", project.category);
            updateField("folder", "");
          }}
          className="text-xs text-white/30 hover:text-red-400 transition-colors ml-1 border border-white/20 px-1.5 py-1 rounded"
          title="Elimina cartella da tutti i progetti"
        >
          🗑
        </button>
      )}
    </>
  ) : (
    <input
      autoFocus
      type="text"
      placeholder="Nome nuova cartella..."
      className="bg-black border border-white/20 text-white/70 text-sm px-2 py-1 focus:outline-none w-44"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = (e.target as HTMLInputElement).value.trim();
          if (val) updateField("folder", val);
          setShowNewFolder(false);
        }
        if (e.key === "Escape") {
          setShowNewFolder(false);
        }
      }}
      onBlur={(e) => {
        const val = e.target.value.trim();
        if (val) updateField("folder", val);
        setShowNewFolder(false);
      }}
    />
  )}
      </div>
    </div>

      {/* PROGRESS */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>
            {project.tasks.filter((t) => t.done).length}/{project.tasks.length} tasks done
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

      {/* TASKS */}
      <h2 className="mt-10 text-lg font-semibold tracking-wide">Tasks</h2>

      <div className="flex gap-2 mt-3">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleTaskKeyDown}
          className="flex-1 p-2 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm"
          placeholder="Add a task..."
        />
        <button
          onClick={addTask}
          className="bg-white text-black px-4 font-bold hover:bg-white/80 transition-colors"
        >
          +
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {project.tasks.map((task, i) => (
          <div
            key={i}
            className="flex justify-between items-center border border-white/10 px-3 py-2 hover:border-white/20 transition-colors"
          >
            {/* TOGGLE */}
            <div
              onClick={() => toggleTask(i)}
              className={`cursor-pointer flex-1 text-sm select-none ${
                task.done ? "line-through text-white/30" : "text-white/80"
              }`}
            >
              <span className="mr-2">{task.done ? "✓" : "·"}</span>
              {task.title}
            </div>

            {/* DELETE */}
            <button
              onClick={() => deleteTask(i, task.title)}
              className="text-white/20 hover:text-red-400 transition-colors ml-3 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        {project.tasks.length === 0 && (
          <p className="text-white/20 text-sm py-2">No tasks yet.</p>
        )}
      </div>

      {/* INFO */}
<h2 className="mt-10 text-lg font-semibold tracking-wide">Info</h2>

<div className="mt-3 space-y-2">

  {/* CAMPI ABLETON */}
  {project.category === "Ableton" && (
    <>
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-sm w-24 flex-shrink-0">BPM</span>
        <input
          type="text"
          value={project.bpm ?? ""}
          onChange={(e) => updateField("bpm", e.target.value)}
          placeholder="es. 120"
          className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-white/30 text-sm w-24 flex-shrink-0">Tonalità</span>
        <input
          type="text"
          value={project.key ?? ""}
          onChange={(e) => updateField("key", e.target.value)}
          placeholder="es. C minor"
          className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
        />
      </div>
    </>
  )}

  {/* CAMPI TOUCHDESIGNER */}
  {project.category === "TouchDesigner" && (
    <>
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-sm w-24 flex-shrink-0">Risoluzione</span>
        <input
          type="text"
          value={project.resolution ?? ""}
          onChange={(e) => updateField("resolution", e.target.value)}
          placeholder="es. 1920x1080"
          className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-white/30 text-sm w-24 flex-shrink-0">FPS</span>
        <input
          type="text"
          value={project.fps ?? ""}
          onChange={(e) => updateField("fps", e.target.value)}
          placeholder="es. 60"
          className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
        />
      </div>
    </>
  )}

  {/* CAMPI COMUNI */}
  <div className="flex items-center gap-3">
    <span className="text-white/30 text-sm w-24 flex-shrink-0">Plugin</span>
    <input
      type="text"
      value={project.plugins ?? ""}
      onChange={(e) => updateField("plugins", e.target.value)}
      placeholder="es. Serum, Reverb"
      className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
    />
  </div>

  <div className="flex items-center gap-3">
  <span className="text-white/30 text-sm w-24 flex-shrink-0">Link</span>
  {project.links?.trim() ? (
    <div className="flex items-center gap-2 flex-1">
      
      <a  href={project.links}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 text-sm truncate flex-1 transition-colors"
      >
        {project.links}
      </a>
      <button
        onClick={() => updateField("links", "")}
        className="text-white/20 hover:text-red-400 transition-colors text-xs flex-shrink-0"
      >
        ✕
      </button>
    </div>
  ) : (
    <input
      type="text"
      value={project.links ?? ""}
      onChange={(e) => updateField("links", e.target.value)}
      placeholder="es. https://soundcloud.com/..."
      className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
    />
  )}
</div>

  <div className="flex items-center gap-3">
    <span className="text-white/30 text-sm w-24 flex-shrink-0">Extra</span>
    <input
      type="text"
      value={project.extra_info ?? ""}
      onChange={(e) => updateField("extra_info", e.target.value)}
      placeholder="Info aggiuntive..."
      className="flex-1 bg-transparent border-b border-white/10 text-white/80 text-sm py-1 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
    />
  </div>

</div>

      {/* NOTES */}
      <h2 className="mt-10 text-lg font-semibold tracking-wide">Notes</h2>

      <textarea
        value={project.notes ?? ""}
        onChange={(e) => updateField("notes", e.target.value)}
        placeholder="Add notes..."
        className="w-full mt-3 p-3 bg-white/5 border border-white/10 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors min-h-[150px] text-sm resize-none"
      />
    </div>
  );
}