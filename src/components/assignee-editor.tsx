"use client";

import { useState } from "react";

export function AssigneeEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (assignees: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addDraft() {
    const name = draft.trim();
    setDraft("");
    if (!name || value.includes(name)) return;
    onChange([...value, name]);
  }

  function removeAt(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-gray-500">Unassigned</span>
        ) : (
          value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
            >
              {name}
              <button
                type="button"
                onClick={() => removeAt(name)}
                aria-label={`Remove ${name}`}
                className="text-gray-500 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Add a name, press Enter"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <button
          type="button"
          onClick={addDraft}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Add
        </button>
      </div>
    </div>
  );
}
