"use client";

import { useState } from "react";
import type { DocLink } from "@/lib/types";

export function DocLinkEditor({
  links,
  onChange,
}: {
  links: DocLink[];
  onChange: (links: DocLink[]) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingIndex(null);
    setLabel("");
    setUrl("");
    setError(null);
    setOpen(true);
  }

  function openEdit(index: number) {
    const link = links[index];
    setEditingIndex(index);
    setLabel(link.label);
    setUrl(link.url);
    setError(null);
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditingIndex(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const nextLinks =
      editingIndex === null
        ? [...links, { label, url }]
        : links.map((l, i) => (i === editingIndex ? { label, url } : l));

    const result = await onChange(nextLinks);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setLabel("");
    setUrl("");
    closeForm();
  }

  async function handleRemove(index: number) {
    setError(null);
    const result = await onChange(links.filter((_, i) => i !== index));
    if (result.error) setError(result.error);
  }

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {links.map((link, i) => (
            <li
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-0.5 pl-2 pr-1 text-xs text-gray-700"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {link.label}
              </a>
              <button
                type="button"
                onClick={() => openEdit(i)}
                aria-label={`Edit ${link.label}`}
                className="px-0.5 text-gray-400 hover:text-gray-700"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${link.label}`}
                className="px-0.5 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

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
            {editingIndex === null ? "Add" : "Save"}
          </button>
          <button
            type="button"
            onClick={closeForm}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <button
          onClick={openAdd}
          className="text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          + Add doc link
        </button>
      )}
    </div>
  );
}
