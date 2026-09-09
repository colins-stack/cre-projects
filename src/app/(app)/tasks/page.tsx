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
  if (assignee) query = query.contains("assignees", [assignee]);

  const [{ data: tasks }, { data: projects }, { data: allTasks }] =
    await Promise.all([
      query,
      supabase.from("projects").select("id, name").order("name"),
      supabase.from("tasks").select("assignees"),
    ]);

  const assignees = Array.from(
    new Set((allTasks ?? []).flatMap((t) => t.assignees)),
  ).sort();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Tasks</h1>

      <TaskFilters projects={projects ?? []} assignees={assignees} />

      <TaskManager tasks={(tasks as Task[]) ?? []} projects={projects ?? []} />
    </div>
  );
}
