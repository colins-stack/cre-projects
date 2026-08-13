import { createClient } from "@/lib/supabase/server";
import { TaskFilters } from "@/components/task-filters";
import { TaskManager } from "@/components/task-manager";
import type { Task, TaskStatus } from "@/lib/types";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; status?: string; assignee?: string }>;
}) {
  const { project, status, assignee } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("tasks").select("*");
  if (project) query = query.eq("project_id", project);
  if (status) query = query.eq("status", status as TaskStatus);
  if (assignee) query = query.eq("assignee", assignee);

  const [{ data: tasks }, { data: projects }, { data: allTasks }] =
    await Promise.all([
      query,
      supabase.from("projects").select("id, name").order("name"),
      supabase.from("tasks").select("assignee").not("assignee", "is", null),
    ]);

  const assignees = Array.from(
    new Set((allTasks ?? []).map((t) => t.assignee).filter(Boolean)),
  ) as string[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tasks</h1>

      <TaskFilters projects={projects ?? []} assignees={assignees} />

      <TaskManager tasks={(tasks as Task[]) ?? []} projects={projects ?? []} />
    </div>
  );
}
