"use client";

import { useState } from "react";
import { DocLinkChips } from "@/components/doc-link-chips";
import type { DocLink } from "@/lib/types";

export function DocLinkEditor({
  links,
  onAdd,
}: {
  links: DocLink[];
  onAdd: (link: DocLink) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const result = await onAdd({ label, url });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setLabel("");
    setUrl("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <DocLinkChips links={links} />

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <input
            required
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
          <input
            required
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent-600 px-2 py-1 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          + Add doc link
        </button>
      )}
    </div>
  );
}
