// ─── SHARED TYPES ────────────────────────────────────────────────────────────

export type Task = {
  title: string;
  done: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  is_image?: boolean;
  fields: string[];
  created_at?: string;
  user_id?: string;
  default_tasks?: Array<{ title: string; done: boolean }>;
  color?: string
};

export type Project = {
  title: string;
  slug: string;
  status: "Active" | "Blocked" | "Paused";
  priority: "Low" | "Medium" | "High";
  deadline: string;
  category: string;
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
  custom_fields?: Record<string, string>;
  user_id?: string;
  moodboard?: Array<{
  title: string;
  url: string;
  note: string;
  }>;
};