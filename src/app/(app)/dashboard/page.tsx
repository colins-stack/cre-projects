import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import type { TaskWithProject } from "@/lib/types";

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const today = toDateOnly(now);
  const in7Days = toDateOnly(new Date(now.getTime() + 7 * 86400000));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [
    { count: activeProjects },
    { count: dueSoon },
    { count: overdue },
    { count: completedRecently },
    { data: needsAttention },
    { data: upcoming },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "done")
      .gte("due_date", today)
      .lte("due_date", in7Days),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "done")
      .lt("due_date", today),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "done")
      .gte("completed_at", thirtyDaysAgo),
    supabase
      .from("tasks")
      .select("*, projects(name)")
      .or(`status.eq.blocked,and(due_date.lt.${today},status.neq.done)`)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("*, projects(name)")
      .neq("status", "done")
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10),
  ]);

  const stats = [
    { label: "Active projects", value: activeProjects ?? 0 },
    { label: "Due within 7 days", value: dueSoon ?? 0 },
    { label: "Overdue", value: overdue ?? 0 },
    { label: "Completed (last 30 days)", value: completedRecently ?? 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-semibold text-gray-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TaskList
          title="Needs Attention"
          emptyText="Nothing blocked or overdue."
          tasks={(needsAttention as TaskWithProject[] | null) ?? []}
        />
        <TaskList
          title="Upcoming"
          emptyText="No upcoming tasks with a due date."
          tasks={(upcoming as TaskWithProject[] | null) ?? []}
        />
      </div>
    </div>
  );
}

function TaskList({
  title,
  emptyText,
  tasks,
}: {
  title: string;
  emptyText: string;
  tasks: TaskWithProject[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {task.projects?.name ?? "No project"}
                    {task.due_date ? ` · Due ${task.due_date}` : ""}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
