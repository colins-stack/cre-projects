"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DocLinkChips } from "@/components/doc-link-chips";
import { DocLinkEditor } from "@/components/doc-link-editor";
import type { DocLink, Task, TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = ["todo", "inprogress", "blocked", "done"];

type ProjectOption = { id: string; name: string };

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

export function TaskManager({
  tasks,
  projectId,
  projects,
}: {
  tasks: Task[];
  projectId?: string;
  projects?: ProjectOption[];
}) {
  const sorted = sortTasks(tasks);

  return (
    <div className="space-y-4">
      <AddTaskForm projectId={projectId} projects={projects} />

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              projects={projects}
              showProject={!projectId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddTaskForm({
  projectId,
  projects,
}: {
  projectId?: string;
  projects?: ProjectOption[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [selectedProject, setSelectedProject] = useState(
    projectId ?? projects?.[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId ?? selectedProject ?? null,
      title,
      notes: notes || null,
      status,
      due_date: dueDate || null,
      assignee: assignee || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setNotes("");
    setStatus("todo");
    setDueDate("");
    setAssignee("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Assignee
          </label>
          <input
            placeholder="Name or Both"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        {!projectId && projects && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add task"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TaskRow({
  task,
  projects,
  showProject,
}: {
  task: Task;
  projects?: ProjectOption[];
  showProject: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [projectIdField, setProjectIdField] = useState(task.project_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const projectName = projects?.find((p) => p.id === task.project_id)?.name;

  async function updateFields(fields: Record<string, unknown>) {
    const completed_at =
      fields.status === "done"
        ? new Date().toISOString()
        : fields.status
          ? null
          : undefined;

    const payload =
      completed_at !== undefined ? { ...fields, completed_at } : fields;

    const { error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", task.id);

    if (error) {
      setError(error.message);
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleStatusChange(status: TaskStatus) {
    await updateFields({ status });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const ok = await updateFields({
      title,
      notes: notes || null,
      due_date: dueDate || null,
      assignee: assignee || null,
      project_id: projectIdField || null,
    });

    setSaving(false);
    if (ok) setEditing(false);
  }

  async function handleAddDocLink(link: DocLink) {
    const { error } = await supabase
      .from("tasks")
      .update({ doc_links: [...task.doc_links, link] })
      .eq("id", task.id);

    if (!error) router.refresh();
    return { error: error?.message ?? null };
  }

  if (!editing) {
    return (
      <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{task.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {showProject && projectName ? `${projectName} · ` : ""}
              {task.due_date ? `Due ${task.due_date}` : "No due date"}
              {task.assignee ? ` · ${task.assignee}` : ""}
            </p>
            {task.doc_links.length > 0 && (
              <div className="mt-2">
                <DocLinkChips links={task.doc_links} />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={task.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as TaskStatus)
              }
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Assignee
            </label>
            <input
              placeholder="Name or Both"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>

          {showProject && projects && (
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Project
              </label>
              <select
                value={projectIdField}
                onChange={(e) => setProjectIdField(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Doc links</p>
          <DocLinkEditor links={task.doc_links} onAdd={handleAddDocLink} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}
