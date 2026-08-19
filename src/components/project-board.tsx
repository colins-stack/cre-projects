"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { DocLinkChips } from "@/components/doc-link-chips";
import { LaneHeader } from "@/components/lane-header";
import { GripIcon } from "@/components/grip-icon";
import type { Lane, Project } from "@/lib/types";

type ProgressMap = Record<string, { done: number; total: number }>;
type ProjectsByLane = Record<string, Project[]>;

const UNASSIGNED = "unassigned";

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
};

export function ProjectBoard({
  initialLanes,
  initialProjectsByLane,
  progressByProject,
  dndEnabled,
}: {
  initialLanes: Lane[];
  initialProjectsByLane: ProjectsByLane;
  progressByProject: ProgressMap;
  dndEnabled: boolean;
}) {
  const supabase = createClient();

  const [lanes, setLanes] = useState(initialLanes);
  const [projectsByLane, setProjectsByLane] = useState(initialProjectsByLane);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function containerKeyOf(projectId: string): string | null {
    for (const [key, list] of Object.entries(projectsByLane)) {
      if (list.some((p) => p.id === projectId)) return key;
    }
    return null;
  }

  async function persistLaneOrder(newLanes: Lane[]) {
    await Promise.all(
      newLanes.map((lane, index) =>
        supabase.from("lanes").update({ position: index }).eq("id", lane.id),
      ),
    );
  }

  async function persistProjectOrder(containerKey: string, list: Project[]) {
    const lane_id = containerKey === UNASSIGNED ? null : containerKey;
    await Promise.all(
      list.map((project, index) =>
        supabase
          .from("projects")
          .update({ position: index, lane_id })
          .eq("id", project.id),
      ),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (activeId.startsWith("lane:")) {
      if (!overId.startsWith("lane:")) return;
      const oldIndex = lanes.findIndex((l) => `lane:${l.id}` === activeId);
      const newIndex = lanes.findIndex((l) => `lane:${l.id}` === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(lanes, oldIndex, newIndex);
      setLanes(reordered);
      await persistLaneOrder(reordered);
      return;
    }

    if (activeId.startsWith("project:")) {
      const projectId = activeId.slice("project:".length);
      const sourceKey = containerKeyOf(projectId);
      if (!sourceKey) return;

      let destKey: string;
      let destIndex: number;

      if (overId.startsWith("container:")) {
        destKey = overId.slice("container:".length);
        destIndex = (projectsByLane[destKey] ?? []).length;
      } else if (overId.startsWith("project:")) {
        const overProjectId = overId.slice("project:".length);
        const foundKey = containerKeyOf(overProjectId);
        if (!foundKey) return;
        destKey = foundKey;
        destIndex = projectsByLane[destKey].findIndex(
          (p) => p.id === overProjectId,
        );
      } else {
        return;
      }

      const sourceList = [...(projectsByLane[sourceKey] ?? [])];
      const sourceIndex = sourceList.findIndex((p) => p.id === projectId);
      if (sourceIndex === -1) return;
      const [moved] = sourceList.splice(sourceIndex, 1);

      if (sourceKey === destKey) {
        const adjustedIndex =
          sourceIndex < destIndex ? destIndex - 1 : destIndex;
        sourceList.splice(adjustedIndex, 0, moved);
        setProjectsByLane((prev) => ({ ...prev, [sourceKey]: sourceList }));
        await persistProjectOrder(sourceKey, sourceList);
      } else {
        const destList = [...(projectsByLane[destKey] ?? [])];
        const movedWithLane = {
          ...moved,
          lane_id: destKey === UNASSIGNED ? null : destKey,
        };
        destList.splice(destIndex, 0, movedWithLane);
        setProjectsByLane((prev) => ({
          ...prev,
          [sourceKey]: sourceList,
          [destKey]: destList,
        }));
        await Promise.all([
          persistProjectOrder(sourceKey, sourceList),
          persistProjectOrder(destKey, destList),
        ]);
      }
    }
  }

  const activeLane = activeId?.startsWith("lane:")
    ? lanes.find((l) => `lane:${l.id}` === activeId)
    : undefined;
  const activeProject = activeId?.startsWith("project:")
    ? Object.values(projectsByLane)
        .flat()
        .find((p) => `project:${p.id}` === activeId)
    : undefined;

  return (
    <DndContext
      id="project-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-8">
        <SortableContext
          items={lanes.map((l) => `lane:${l.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {lanes.map((lane) => (
            <LaneSection
              key={lane.id}
              lane={lane}
              projects={projectsByLane[lane.id] ?? []}
              progressByProject={progressByProject}
              dndEnabled={dndEnabled}
            />
          ))}
        </SortableContext>

        <div>
          {lanes.length > 0 && (
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              Unassigned
            </h2>
          )}
          <ProjectDropZone
            containerKey={UNASSIGNED}
            projects={projectsByLane[UNASSIGNED] ?? []}
            progressByProject={progressByProject}
            dndEnabled={dndEnabled}
            emptyText="No unassigned projects."
          />
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeLane ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1 shadow-lg ring-1 ring-gray-200">
            <span className="text-gray-400">
              <GripIcon />
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {activeLane.name}
            </span>
          </div>
        ) : activeProject ? (
          <div className="rotate-1 scale-105 rounded-xl border border-gray-200 bg-surface p-5 shadow-xl">
            <ProjectCardContent
              project={activeProject}
              progress={progressByProject[activeProject.id]}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function LaneSection({
  lane,
  projects,
  progressByProject,
  dndEnabled,
}: {
  lane: Lane;
  projects: Project[];
  progressByProject: ProgressMap;
  dndEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `lane:${lane.id}`,
      data: { type: "lane" },
      disabled: !dndEnabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        {dndEnabled && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder lane"
            className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripIcon />
          </button>
        )}
        <LaneHeader lane={lane} />
      </div>
      <ProjectDropZone
        containerKey={lane.id}
        projects={projects}
        progressByProject={progressByProject}
        dndEnabled={dndEnabled}
        emptyText="No projects in this lane yet."
      />
    </div>
  );
}

function ProjectDropZone({
  containerKey,
  projects,
  progressByProject,
  dndEnabled,
  emptyText,
}: {
  containerKey: string;
  projects: Project[];
  progressByProject: ProgressMap;
  dndEnabled: boolean;
  emptyText: string;
}) {
  const { setNodeRef } = useDroppable({
    id: `container:${containerKey}`,
    disabled: !dndEnabled,
  });

  return (
    <SortableContext
      items={projects.map((p) => `project:${p.id}`)}
      strategy={rectSortingStrategy}
    >
      <div ref={setNodeRef} className="min-h-12">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyText}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                progress={progressByProject[project.id]}
                dndEnabled={dndEnabled}
              />
            ))}
          </div>
        )}
      </div>
    </SortableContext>
  );
}

function SortableProjectCard({
  project,
  progress,
  dndEnabled,
}: {
  project: Project;
  progress: { done: number; total: number } | undefined;
  dndEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `project:${project.id}`,
      data: { type: "project" },
      disabled: !dndEnabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-xl border p-5 shadow-sm transition-colors ${
        isDragging
          ? "border-dashed border-gray-300 bg-gray-50"
          : "border-gray-200 bg-surface hover:border-gray-300"
      }`}
    >
      {dndEnabled && (
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder project"
          className="absolute right-2 top-2 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripIcon />
        </button>
      )}
      <div className={isDragging ? "invisible" : ""}>
        <ProjectCardContent project={project} progress={progress} />
      </div>
    </div>
  );
}

function ProjectCardContent({
  project,
  progress,
}: {
  project: Project;
  progress: { done: number; total: number } | undefined;
}) {
  return (
    <>
      <Link href={`/projects/${project.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-2 pr-6">
          <h3 className="font-medium text-gray-900">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="mb-3 text-sm text-gray-600">{project.description}</p>
        )}

        <p className="mb-3 text-xs text-gray-500">
          {progress
            ? `${progress.done}/${progress.total} done`
            : "No tasks yet"}
        </p>
      </Link>

      <DocLinkChips links={project.doc_links ?? []} />
    </>
  );
}
