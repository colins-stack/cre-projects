"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Subtask } from "@/lib/types";

export function SubtaskList({
  taskId,
  subtasks,
}: {
  taskId: string;
  subtasks: Subtask[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(subtask: Subtask) {
    setError(null);
    const { error } = await supabase
      .from("subtasks")
      .update({ done: !subtask.done })
      .eq("id", subtask.id);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    const { error } = await supabase.from("subtasks").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);

    const { error } = await supabase.from("subtasks").insert({
      task_id: taskId,
      title,
      assignee: assignee || null,
      position: subtasks.length,
    });

    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setAssignee("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {subtasks.length === 0 ? (
        <p className="text-sm text-gray-500">No subtasks yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3 py-2"
            >
              <input
                type="checkbox"
                checked={subtask.done}
                onChange={() => handleToggle(subtask)}
                aria-label={
                  subtask.done ? "Mark as not done" : "Mark as done"
                }
                className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-2 focus:ring-accent-100"
              />
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  subtask.done ? "text-gray-500 line-through" : "text-gray-900"
                }`}
              >
                {subtask.title}
              </span>
              {subtask.assignee && (
                <span className="shrink-0 text-xs text-gray-500">
                  {subtask.assignee}
                </span>
              )}
              <button
                onClick={() => handleDelete(subtask.id)}
                aria-label="Remove subtask"
                className="shrink-0 text-xs text-gray-400 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          required
          placeholder="Add a subtask"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <input
          placeholder="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
