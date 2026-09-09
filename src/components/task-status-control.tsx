"use client";

import { Checkbox } from "@/components/checkbox";
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
      <Checkbox
        checked={status === "done"}
        onChange={(checked) => onChange(checked ? "done" : "todo")}
        ariaLabel={status === "done" ? "Mark as not done" : "Mark as done"}
      />
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
