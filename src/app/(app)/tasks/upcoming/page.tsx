import { createClient } from "@/lib/supabase/server";
import { TaskManager } from "@/components/task-manager";
import type { Task } from "@/lib/types";

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function UpcomingTasksPage() {
  const supabase = await createClient();
  const today = toDateOnly(new Date());

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "done")
      .gte("due_date", today)
      .order("due_date", { ascending: true }),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        Upcoming Tasks
      </h1>

      <TaskManager tasks={(tasks as Task[]) ?? []} projects={projects ?? []} />
    </div>
  );
}
