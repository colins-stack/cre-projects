import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { ProjectDocLinks } from "@/components/project-doc-links";
import { ProjectLanePicker } from "@/components/project-lane-picker";
import { TaskManager } from "@/components/task-manager";
import type { Lane, Project, Task } from "@/lib/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: tasks }, { data: lanes }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("lanes").select("*").order("created_at"),
    ]);

  if (!project) notFound();

  const typedProject = project as Project;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {typedProject.name}
          </h1>
          <StatusBadge status={typedProject.status} />
        </div>
        {typedProject.description && (
          <p className="mb-3 text-sm text-gray-600">
            {typedProject.description}
          </p>
        )}
        <div className="mb-3">
          <ProjectLanePicker
            projectId={typedProject.id}
            laneId={typedProject.lane_id}
            lanes={(lanes as Lane[]) ?? []}
          />
        </div>
        <ProjectDocLinks
          projectId={typedProject.id}
          links={typedProject.doc_links ?? []}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Tasks</h2>
      <TaskManager tasks={(tasks as Task[]) ?? []} projectId={typedProject.id} />
    </div>
  );
}
