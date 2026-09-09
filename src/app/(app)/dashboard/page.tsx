import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import type { Profile, TaskWithProject } from "@/lib/types";

type Filter = "mine" | "all";

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function resolveFilter(value: string | undefined): Filter {
  return value === "all" ? "all" : "mine";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ needsAttention?: string; upcoming?: string }>;
}) {
  const { needsAttention: naParam, upcoming: upParam } = await searchParams;
  const naFilter = resolveFilter(naParam);
  const upFilter = resolveFilter(upParam);

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

  const now = new Date();
  const today = toDateOnly(now);
  const in7Days = toDateOnly(new Date(now.getTime() + 7 * 86400000));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  let needsAttentionQuery = supabase
    .from("tasks")
    .select("*, projects(name)")
    .or(`status.eq.blocked,and(due_date.lt.${today},status.neq.done)`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(10);
  if (naFilter === "mine" && displayName) {
    needsAttentionQuery = needsAttentionQuery.contains("assignees", [
      displayName,
    ]);
  }

  let upcomingQuery = supabase
    .from("tasks")
    .select("*, projects(name)")
    .neq("status", "done")
    .gte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(5);
  if (upFilter === "mine" && displayName) {
    upcomingQuery = upcomingQuery.contains("assignees", [displayName]);
  }

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
    needsAttentionQuery,
    upcomingQuery,
  ]);

  const stats = [
    { label: "Active projects", value: activeProjects ?? 0 },
    { label: "Due within 7 days", value: dueSoon ?? 0 },
    { label: "Overdue", value: overdue ?? 0 },
    { label: "Completed (last 30 days)", value: completedRecently ?? 0 },
  ];

  const noNameHint = (
    <>
      Set your name in{" "}
      <Link href="/settings" className="text-accent-600 hover:underline">
        Settings
      </Link>{" "}
      to filter by mine.
    </>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-surface p-4 shadow-sm"
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
          emptyText={
            naFilter === "mine" && !displayName
              ? noNameHint
              : "Nothing blocked or overdue."
          }
          tasks={(needsAttention as TaskWithProject[] | null) ?? []}
          toggle={
            <MineAllToggle
              current={naFilter}
              mineHref={`/dashboard?needsAttention=mine&upcoming=${upFilter}`}
              allHref={`/dashboard?needsAttention=all&upcoming=${upFilter}`}
            />
          }
        />
        <TaskList
          title="Upcoming"
          emptyText={
            upFilter === "mine" && !displayName
              ? noNameHint
              : "No upcoming tasks with a due date."
          }
          tasks={(upcoming as TaskWithProject[] | null) ?? []}
          seeAllHref="/tasks/upcoming"
          toggle={
            <MineAllToggle
              current={upFilter}
              mineHref={`/dashboard?needsAttention=${naFilter}&upcoming=mine`}
              allHref={`/dashboard?needsAttention=${naFilter}&upcoming=all`}
            />
          }
        />
      </div>
    </div>
  );
}

function MineAllToggle({
  current,
  mineHref,
  allHref,
}: {
  current: Filter;
  mineHref: string;
  allHref: string;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-gray-200">
      <Link
        href={mineHref}
        className={`px-2 py-0.5 text-xs font-medium transition-colors ${
          current === "mine"
            ? "bg-accent-600 text-white"
            : "bg-surface text-gray-500 hover:bg-gray-100"
        }`}
      >
        Mine
      </Link>
      <Link
        href={allHref}
        className={`border-l border-gray-200 px-2 py-0.5 text-xs font-medium transition-colors ${
          current === "all"
            ? "bg-accent-600 text-white"
            : "bg-surface text-gray-500 hover:bg-gray-100"
        }`}
      >
        All
      </Link>
    </div>
  );
}

function TaskList({
  title,
  emptyText,
  tasks,
  seeAllHref,
  toggle,
}: {
  title: string;
  emptyText: React.ReactNode;
  tasks: TaskWithProject[];
  seeAllHref?: string;
  toggle?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {toggle}
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="text-sm">
              <Link
                href={`/tasks/${task.id}`}
                className="-m-2 flex items-start justify-between gap-2 rounded-lg p-2 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {task.projects?.name ?? "No project"}
                    {task.due_date ? ` · Due ${task.due_date}` : ""}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="mt-3 inline-block text-xs font-medium text-accent-600 hover:text-accent-700"
        >
          See all →
        </Link>
      )}
    </div>
  );
}
