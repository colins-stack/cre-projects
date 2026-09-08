"use client";

import { STYLES, LABELS } from "@/components/status-badge";
import type { TaskStatus } from "@/lib/types";

const NON_DONE_STATUSES: TaskStatus[] = ["todo", "inprogress", "blocked"];

export function TaskStatusControl({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={status === "done"}
          onChange={(e) => onChange(e.target.checked ? "done" : "todo")}
          aria-label={status === "done" ? "Mark as not done" : "Mark as done"}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-md border border-gray-300 bg-surface transition-colors peer-hover:border-accent-400 peer-checked:border-accent-600 peer-checked:bg-accent-600 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-100" />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="relative h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        >
          <path
            d="M3 8.5l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>
      <div className="inline-flex overflow-hidden rounded-full border border-gray-200">
        {NON_DONE_STATUSES.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={status === s}
            className={`px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors ${
              i > 0 ? "border-l border-gray-200" : ""
            } ${
              status === s
                ? STYLES[s]
                : "bg-surface text-gray-500 hover:bg-gray-100"
            }`}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
