import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskDetail } from "@/components/task-detail";
import { SubtaskList } from "@/components/subtask-list";
import type { Subtask, Task } from "@/lib/types";

type TaskWithProjectRef = Task & {
  projects: { id: string; name: string } | null;
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: task }, { data: subtasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, projects(id, name)")
      .eq("id", id)
      .single(),
    supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", id)
      .order("position"),
  ]);

  if (!task) notFound();

  const typedTask = task as TaskWithProjectRef;
  const backHref = typedTask.projects
    ? `/projects/${typedTask.projects.id}`
    : "/tasks";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={backHref}
        className="mb-4 inline-block text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        ← {typedTask.projects ? typedTask.projects.name : "All tasks"}
      </Link>

      <TaskDetail task={typedTask} redirectTo={backHref} />

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Subtasks</h2>
        <SubtaskList taskId={id} subtasks={(subtasks as Subtask[]) ?? []} />
      </div>
    </div>
  );
}
