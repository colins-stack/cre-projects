"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DocLinkEditor } from "@/components/doc-link-editor";
import { TaskStatusControl } from "@/components/task-status-control";
import type { DocLink, Task, TaskStatus } from "@/lib/types";

export function TaskDetail({
  task,
  redirectTo,
}: {
  task: Task;
  redirectTo: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Optimistic status: reflects clicks instantly instead of waiting on the
  // round trip to Supabase + router.refresh(). Re-synced from the prop
  // (adjusted during render, not in an effect) whenever the server sends a
  // fresh value.
  const [status, setStatus] = useState(task.status);
  const [prevTaskStatus, setPrevTaskStatus] = useState(task.status);
  if (task.status !== prevTaskStatus) {
    setPrevTaskStatus(task.status);
    setStatus(task.status);
  }

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

  async function handleStatusChange(newStatus: TaskStatus) {
    const previous = status;
    setStatus(newStatus);
    const ok = await updateFields({ status: newStatus });
    if (!ok) setStatus(previous);
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
    });

    setSaving(false);
    if (ok) setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleAddDocLink(link: DocLink) {
    const { error } = await supabase
      .from("tasks")
      .update({ doc_links: [...task.doc_links, link] })
      .eq("id", task.id);

    if (!error) router.refresh();
    return { error: error?.message ?? null };
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              autoFocus
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
              rows={3}
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
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <h1
              className={`text-lg font-semibold text-gray-900 ${
                status === "done" ? "text-gray-500 line-through" : ""
              }`}
            >
              {task.title}
            </h1>
            <div className="flex shrink-0 items-center gap-3">
              <TaskStatusControl status={status} onChange={handleStatusChange} />
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Edit
              </button>
              {confirmingDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Delete task?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="font-medium text-red-600 hover:text-red-700"
                  >
                    {deleting ? "Deleting…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <p className="mb-3 text-sm text-gray-500">
            {task.due_date ? `Due ${task.due_date}` : "No due date"}
            {task.assignee ? ` · ${task.assignee}` : ""}
          </p>

          {task.notes && (
            <p className="mb-3 whitespace-pre-wrap text-sm text-gray-600">
              {task.notes}
            </p>
          )}

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        </>
      )}

      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">Doc links</p>
        <DocLinkEditor links={task.doc_links} onAdd={handleAddDocLink} />
      </div>
    </div>
  );
}
