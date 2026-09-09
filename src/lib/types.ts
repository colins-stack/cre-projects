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

export interface Lane {
  id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  doc_links: DocLink[];
  lane_id: string | null;
  position: number;
  assignees: string[];
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  due_date: string | null;
  assignees: string[];
  doc_links: DocLink[];
  created_at: string;
  completed_at: string | null;
}

export interface TaskWithProject extends Task {
  projects: { name: string } | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  assignee: string | null;
  position: number;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}
