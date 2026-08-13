export type ProjectStatus =
  | "future"
  | "planned"
  | "active"
  | "onhold"
  | "completed";

export type TaskStatus = "todo" | "inprogress" | "blocked" | "done";

export interface DocLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  doc_links: DocLink[];
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  due_date: string | null;
  assignee: string | null;
  doc_links: DocLink[];
  created_at: string;
  completed_at: string | null;
}

export interface TaskWithProject extends Task {
  projects: { name: string } | null;
}
