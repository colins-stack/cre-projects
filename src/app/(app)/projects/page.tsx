import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { DocLinkChips } from "@/components/doc-link-chips";
import { NewProjectForm } from "@/components/new-project-form";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = [
  "future",
  "planned",
  "active",
  "onhold",
  "completed",
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  future: "Future",
  planned: "Planned",
  active: "Active",
  onhold: "On hold",
  completed: "Completed",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = STATUSES.includes(status as ProjectStatus)
    ? (status as ProjectStatus)
    : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (activeFilter) query = query.eq("status", activeFilter);

  const [{ data: projects }, { data: taskRows }] = await Promise.all([
    query,
    supabase.from("tasks").select("project_id, status"),
  ]);

  const progressByProject = new Map<string, { done: number; total: number }>();
  for (const task of taskRows ?? []) {
    if (!task.project_id) continue;
    const current = progressByProject.get(task.project_id) ?? {
      done: 0,
      total: 0,
    };
    current.total += 1;
    if (task.status === "done") current.done += 1;
    progressByProject.set(task.project_id, current);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
        <NewProjectForm />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/projects"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !activeFilter
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          } border border-gray-200`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/projects?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeFilter === s
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } border border-gray-200`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects{activeFilter ? ` with status "${activeFilter}"` : ""}{" "}
          yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(projects as Project[]).map((project) => {
            const progress = progressByProject.get(project.id);
            return (
              <div
                key={project.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-medium text-gray-900">
                    {project.name}
                  </h2>
                  <StatusBadge status={project.status} />
                </div>

                {project.description && (
                  <p className="mb-3 text-sm text-gray-600">
                    {project.description}
                  </p>
                )}

                <p className="mb-3 text-xs text-gray-500">
                  {progress ? `${progress.done}/${progress.total} done` : "No tasks yet"}
                </p>

                <DocLinkChips links={project.doc_links ?? []} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
