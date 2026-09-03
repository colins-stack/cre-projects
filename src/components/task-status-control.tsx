"use client";

import { StatusBadge } from "@/components/status-badge";
import type { TaskStatus } from "@/lib/types";

const NEXT_NON_DONE_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "inprogress",
  inprogress: "blocked",
  blocked: "todo",
  done: "todo",
};

export function TaskStatusControl({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={status === "done"}
        onChange={(e) => onChange(e.target.checked ? "done" : "todo")}
        aria-label={status === "done" ? "Mark as not done" : "Mark as done"}
        className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-2 focus:ring-accent-100"
      />
      <button
        type="button"
        onClick={() => onChange(NEXT_NON_DONE_STATUS[status])}
        title="Click to change status"
        className="cursor-pointer"
      >
        <StatusBadge status={status} />
      </button>
    </div>
  );
}
