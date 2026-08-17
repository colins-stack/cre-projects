import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { DocLinkChips } from "@/components/doc-link-chips";
import { NewProjectForm } from "@/components/new-project-form";
import { NewLaneForm } from "@/components/new-lane-form";
import { LaneHeader } from "@/components/lane-header";
import type { Lane, Project, ProjectStatus } from "@/lib/types";

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

  const [{ data: projects }, { data: taskRows }, { data: lanes }] =
    await Promise.all([
      query,
      supabase.from("tasks").select("project_id, status"),
      supabase.from("lanes").select("*").order("created_at"),
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

  const allProjects = (projects as Project[] | null) ?? [];
  const allLanes = (lanes as Lane[] | null) ?? [];

  const projectsByLane = new Map<string, Project[]>();
  const unassigned: Project[] = [];
  for (const project of allProjects) {
    if (project.lane_id) {
      const current = projectsByLane.get(project.lane_id) ?? [];
      current.push(project);
      projectsByLane.set(project.lane_id, current);
    } else {
      unassigned.push(project);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
        <div className="flex gap-2">
          <NewLaneForm />
          <NewProjectForm lanes={allLanes} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/projects"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !activeFilter
              ? "bg-accent-600 text-white"
              : "bg-surface text-gray-700 hover:bg-gray-100"
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
                ? "bg-accent-600 text-white"
                : "bg-surface text-gray-700 hover:bg-gray-100"
            } border border-gray-200`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {allProjects.length === 0 && allLanes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects{activeFilter ? ` with status "${activeFilter}"` : ""}{" "}
          yet.
        </p>
      ) : (
        <div className="space-y-8">
          {allLanes.map((lane) => (
            <div key={lane.id}>
              <LaneHeader lane={lane} />
              <ProjectGrid
                projects={projectsByLane.get(lane.id) ?? []}
                progressByProject={progressByProject}
                emptyText="No projects in this lane yet."
              />
            </div>
          ))}

          <div>
            {allLanes.length > 0 && (
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                Unassigned
              </h2>
            )}
            <ProjectGrid
              projects={unassigned}
              progressByProject={progressByProject}
              emptyText={
                activeFilter
                  ? `No projects with status "${activeFilter}".`
                  : "No unassigned projects."
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectGrid({
  projects,
  progressByProject,
  emptyText,
}: {
  projects: Project[];
  progressByProject: Map<string, { done: number; total: number }>;
  emptyText: string;
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((project) => {
        const progress = progressByProject.get(project.id);
        return (
          <div
            key={project.id}
            className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm hover:border-gray-300"
          >
            <Link href={`/projects/${project.id}`} className="block">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>

              {project.description && (
                <p className="mb-3 text-sm text-gray-600">
                  {project.description}
                </p>
              )}

              <p className="mb-3 text-xs text-gray-500">
                {progress
                  ? `${progress.done}/${progress.total} done`
                  : "No tasks yet"}
              </p>
            </Link>

            <DocLinkChips links={project.doc_links ?? []} />
          </div>
        );
      })}
    </div>
  );
}
