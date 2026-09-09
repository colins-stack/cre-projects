import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectCardContent } from "@/components/project-board";
import { TaskManager } from "@/components/task-manager";
import type { Profile, Project, Task } from "@/lib/types";

export default async function MyTasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const displayName = (profile as Profile | null)?.display_name;

  if (!displayName) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">
          My Tasks and Projects
        </h1>
        <p className="text-sm text-gray-500">
          Set your name in{" "}
          <Link href="/settings" className="text-accent-600 hover:underline">
            Settings
          </Link>{" "}
          to see tasks and projects assigned to you here.
        </p>
      </div>
    );
  }

  const [{ data: tasks }, { data: projects }, { data: myProjects }] =
    await Promise.all([
      supabase.from("tasks").select("*").contains("assignees", [displayName]),
      supabase.from("projects").select("id, name").order("name"),
      supabase
        .from("projects")
        .select("*")
        .contains("assignees", [displayName])
        .order("name"),
    ]);

  const typedMyProjects = (myProjects as Project[] | null) ?? [];

  const { data: myProjectTasks } =
    typedMyProjects.length > 0
      ? await supabase
          .from("tasks")
          .select("project_id, status")
          .in(
            "project_id",
            typedMyProjects.map((p) => p.id),
          )
      : { data: [] };

  const progressByProject: Record<string, { done: number; total: number }> =
    {};
  for (const task of myProjectTasks ?? []) {
    if (!task.project_id) continue;
    const current = progressByProject[task.project_id] ?? {
      done: 0,
      total: 0,
    };
    current.total += 1;
    if (task.status === "done") current.done += 1;
    progressByProject[task.project_id] = current;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        My Tasks and Projects
      </h1>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        My Projects
      </h2>
      {typedMyProjects.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">
          No projects assigned to you.
        </p>
      ) : (
        <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {typedMyProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm transition-colors hover:border-gray-300"
            >
              <ProjectCardContent
                project={project}
                progress={progressByProject[project.id]}
              />
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-gray-900">My Tasks</h2>
      <TaskManager
        tasks={(tasks as Task[]) ?? []}
        projects={projects ?? []}
        defaultAssignees={[displayName]}
      />
    </div>
  );
}
