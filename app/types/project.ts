// ─── SHARED TYPES ────────────────────────────────────────────────────────────

export type Task = {
  title: string;
  done: boolean;
};

export type Project = {
  title: string;
  slug: string;
  status: "Active" | "Blocked" | "Paused";
  priority: "Low" | "Medium" | "High";
  deadline: string;
  category: "Ableton" | "TouchDesigner";
  notes: string;
  tasks: Task[];
  folder: string;
  bpm: string;
  key: string;
  resolution: string;
  fps: string;
  plugins: string;
  links: string;
  extra_info: string;
};