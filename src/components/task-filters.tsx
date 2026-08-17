"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = ["todo", "inprogress", "blocked", "done"];

export function TaskFilters({
  projects,
  assignees,
}: {
  projects: { id: string; name: string }[];
  assignees: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <select
        value={searchParams.get("project") ?? ""}
        onChange={(e) => updateParam("project", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("assignee") ?? ""}
        onChange={(e) => updateParam("assignee", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        <option value="">All assignees</option>
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
