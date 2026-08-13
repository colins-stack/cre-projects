import type { ProjectStatus, TaskStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  future: "bg-gray-100 text-gray-700",
  todo: "bg-gray-100 text-gray-700",
  planned: "bg-gray-100 text-gray-700",
  active: "bg-amber-100 text-amber-800",
  inprogress: "bg-amber-100 text-amber-800",
  onhold: "bg-amber-100 text-amber-800",
  blocked: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  done: "bg-green-100 text-green-800",
};

const LABELS: Record<string, string> = {
  future: "Future",
  planned: "Planned",
  active: "Active",
  onhold: "On hold",
  completed: "Completed",
  todo: "To do",
  inprogress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function StatusBadge({
  status,
}: {
  status: ProjectStatus | TaskStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
