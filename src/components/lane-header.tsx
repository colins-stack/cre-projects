"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lane } from "@/lib/types";

export function LaneHeader({ lane }: { lane: Lane }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lane.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error } = await supabase
      .from("lanes")
      .update({ name })
      .eq("id", lane.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setSaving(true);
    const { error } = await supabase.from("lanes").delete().eq("id", lane.id);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={handleRename} className="mb-3 flex items-center gap-2">
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="text-xs font-medium text-accent-600 hover:text-accent-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(lane.name);
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </form>
    );
  }

  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-sm font-semibold text-gray-900">{lane.name}</h2>
      <button
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        Rename
      </button>
      {confirmingDelete ? (
        <span className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">
            Delete lane? Projects become unassigned.
          </span>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="font-medium text-red-600 hover:text-red-700"
          >
            Confirm
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
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
