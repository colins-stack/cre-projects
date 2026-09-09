import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TaskManager } from "@/components/task-manager";
import type { Profile, Task } from "@/lib/types";

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
          My Tasks
        </h1>
        <p className="text-sm text-gray-500">
          Set your name in{" "}
          <Link href="/settings" className="text-accent-600 hover:underline">
            Settings
          </Link>{" "}
          to see tasks assigned to you here.
        </p>
      </div>
    );
  }

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .contains("assignees", [displayName]),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">My Tasks</h1>

      <TaskManager
        tasks={(tasks as Task[]) ?? []}
        projects={projects ?? []}
        defaultAssignees={[displayName]}
      />
    </div>
  );
}
