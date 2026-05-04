import Link from "next/link";
import type { Project } from "@/app/types/project";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ProjectCardProps = {
  project: Project;
  onDelete: () => void;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Project["status"], string> = {
  Active: "text-green-400",
  Blocked: "text-red-400",
  Paused: "text-yellow-400",
};

const PRIORITY_COLOR: Record<Project["priority"], string> = {
  Low: "text-white/40",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

function getProgress(project: Project): number {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const done = project.tasks.filter((t) => t.done).length;
  return Math.round((done / project.tasks.length) * 100);
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const progress = getProgress(project);
  const openTasks = project.tasks.filter((t) => !t.done).length;

  return (
    <div className="border border-white/10 p-5 rounded-lg hover:border-white/20 transition-colors">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">{project.title}</h2>
        <span className={`text-sm ${STATUS_COLOR[project.status]}`}>
          {project.status}
        </span>
      </div>

      {/* META */}
      <div className="mt-3 flex gap-3 text-sm text-white/50 flex-wrap">
        <span>{project.category}</span>
        <span className={PRIORITY_COLOR[project.priority]}>
          {project.priority}
        </span>
        {project.deadline && <span>Due {project.deadline}</span>}
        <span>{openTasks} open task{openTasks !== 1 ? "s" : ""}</span>
      </div>

      {/* PROGRESS */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/30 mb-1">
          <span>
            {project.tasks.filter((t) => t.done).length}/{project.tasks.length} done
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
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Open project →
        </Link>
        <button
          onClick={onDelete}
          className="text-sm text-white/20 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}