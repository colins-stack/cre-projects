import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/new-project-form";
import { NewLaneForm } from "@/components/new-lane-form";
import { ProjectBoard } from "@/components/project-board";
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

const UNASSIGNED = "unassigned";

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

  let query = supabase.from("projects").select("*").order("position");
  if (activeFilter) query = query.eq("status", activeFilter);

  const [{ data: projects }, { data: taskRows }, { data: lanes }] =
    await Promise.all([
      query,
      supabase.from("tasks").select("project_id, status"),
      supabase.from("lanes").select("*").order("position"),
    ]);

  const progressByProject: Record<string, { done: number; total: number }> =
    {};
  for (const task of taskRows ?? []) {
    if (!task.project_id) continue;
    const current = progressByProject[task.project_id] ?? {
      done: 0,
      total: 0,
    };
    current.total += 1;
    if (task.status === "done") current.done += 1;
    progressByProject[task.project_id] = current;
  }

  const allProjects = (projects as Project[] | null) ?? [];
  const allLanes = (lanes as Lane[] | null) ?? [];

  const projectsByLane: Record<string, Project[]> = { [UNASSIGNED]: [] };
  for (const lane of allLanes) projectsByLane[lane.id] = [];
  for (const project of allProjects) {
    const key = project.lane_id ?? UNASSIGNED;
    if (!projectsByLane[key]) projectsByLane[key] = [];
    projectsByLane[key].push(project);
  }

  const projectCountByLane: Record<string, number> = {};
  for (const [key, list] of Object.entries(projectsByLane)) {
    projectCountByLane[key] = list.length;
  }

  const dndEnabled = !activeFilter;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
        <div className="flex gap-2">
          <NewLaneForm nextPosition={allLanes.length} />
          <NewProjectForm
            lanes={allLanes}
            projectCountByLane={projectCountByLane}
          />
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
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

      <p className="mb-6 text-xs text-gray-500">
        {dndEnabled
          ? "Drag lanes or project cards to reorder them."
          : 'Switch to "All" to drag and drop.'}
      </p>

      {allProjects.length === 0 && allLanes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects{activeFilter ? ` with status "${activeFilter}"` : ""}{" "}
          yet.
        </p>
      ) : (
        <ProjectBoard
          initialLanes={allLanes}
          initialProjectsByLane={projectsByLane}
          progressByProject={progressByProject}
          dndEnabled={dndEnabled}
        />
      )}
    </div>
  );
}
