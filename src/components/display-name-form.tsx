"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DisplayNameForm({
  userId,
  currentName,
}: {
  userId: string;
  currentName: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: name.trim() });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xs space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Your name
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Used to match tasks assigned to you on the My Tasks page — it
          should match however you&rsquo;re spelled as an assignee elsewhere.
        </p>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Name saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
