"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AssigneeEditor } from "@/components/assignee-editor";
import { StatusBadge } from "@/components/status-badge";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = [
  "future",
  "planned",
  "active",
  "onhold",
  "completed",
];

export function ProjectHeader({ project }: { project: Project }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [assignees, setAssignees] = useState(project.assignees);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name,
        description: description || null,
        status,
        assignees,
      })
      .eq("id", project.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-surface p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
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
            Assignees
          </label>
          <AssigneeEditor value={assignees} onChange={setAssignees} />
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
            onClick={() => {
              setEditing(false);
              setName(project.name);
              setDescription(project.description ?? "");
              setStatus(project.status);
              setAssignees(project.assignees);
              setError(null);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {project.name}
        </h1>
        <StatusBadge status={project.status} />
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          Edit
        </button>
        {confirmingDelete ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">
              Delete project? Its tasks will become unassigned.
            </span>
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

      {project.description && (
        <p className="mb-1 text-sm text-gray-600">{project.description}</p>
      )}

      {project.assignees.length > 0 && (
        <p className="text-sm text-gray-500">
          Assigned to {project.assignees.join(", ")}
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
