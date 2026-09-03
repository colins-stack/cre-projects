"use client";

import { useEffect, useState } from "react";
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
  horizontalListSortingStrategy,
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
const LAYOUT_STORAGE_KEY = "projectBoardLayout";

type BoardLayout = "horizontal" | "vertical";

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
  const [layout, setLayout] = useState<BoardLayout>("horizontal");

  // Re-sync local state whenever the server sends fresh data (e.g. after
  // router.refresh() from adding/editing a project or lane) — otherwise this
  // component keeps its stale initial state since useState only reads its
  // argument on first mount. Adjusting state during render (rather than in
  // an effect) avoids an extra commit/flash of stale data.
  const [prevInitialLanes, setPrevInitialLanes] = useState(initialLanes);
  if (initialLanes !== prevInitialLanes) {
    setPrevInitialLanes(initialLanes);
    setLanes(initialLanes);
  }

  const [prevInitialProjectsByLane, setPrevInitialProjectsByLane] =
    useState(initialProjectsByLane);
  if (initialProjectsByLane !== prevInitialProjectsByLane) {
    setPrevInitialProjectsByLane(initialProjectsByLane);
    setProjectsByLane(initialProjectsByLane);
  }

  useEffect(() => {
    // One-time read from an external system (localStorage) on mount, not a
    // derived-from-props sync — can't be done in the initializer since
    // localStorage isn't available during server rendering.
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "horizontal" || stored === "vertical") setLayout(stored);
  }, []);

  function toggleLayout() {
    setLayout((prev) => {
      const next = prev === "horizontal" ? "vertical" : "horizontal";
      localStorage.setItem(LAYOUT_STORAGE_KEY, next);
      return next;
    });
  }

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
      const overLaneId = overId.startsWith("lane:")
        ? overId.slice("lane:".length)
        : overId.startsWith("project:")
          ? containerKeyOf(overId.slice("project:".length))
          : overId.startsWith("container:")
            ? overId.slice("container:".length)
            : null;
      if (!overLaneId || overLaneId === UNASSIGNED) return;

      const oldIndex = lanes.findIndex((l) => `lane:${l.id}` === activeId);
      const newIndex = lanes.findIndex((l) => l.id === overLaneId);
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
      } else if (overId.startsWith("lane:")) {
        destKey = overId.slice("lane:".length);
        destIndex = (projectsByLane[destKey] ?? []).length;
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
      <div className="mb-3 flex justify-end">
        <LayoutToggle layout={layout} onToggle={toggleLayout} />
      </div>

      <div
        className={
          layout === "horizontal"
            ? "flex items-start gap-4 overflow-x-auto pb-4"
            : "space-y-8"
        }
      >
        <SortableContext
          items={lanes.map((l) => `lane:${l.id}`)}
          strategy={
            layout === "horizontal"
              ? horizontalListSortingStrategy
              : verticalListSortingStrategy
          }
        >
          {lanes.map((lane) => (
            <LaneSection
              key={lane.id}
              lane={lane}
              projects={projectsByLane[lane.id] ?? []}
              progressByProject={progressByProject}
              dndEnabled={dndEnabled}
              layout={layout}
            />
          ))}
        </SortableContext>

        <div
          className={`rounded-xl border border-transparent p-4 ${
            layout === "horizontal" ? "w-72 shrink-0" : ""
          }`}
        >
          {lanes.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              {dndEnabled && (
                <span className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <h2 className="text-sm font-semibold text-gray-900">
                Unassigned
              </h2>
            </div>
          )}
          <ProjectDropZone
            containerKey={UNASSIGNED}
            projects={projectsByLane[UNASSIGNED] ?? []}
            progressByProject={progressByProject}
            dndEnabled={dndEnabled}
            emptyText="No unassigned projects."
            layout={layout}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeLane ? (
          <div
            className={`rotate-1 scale-[1.02] rounded-xl border border-gray-200 bg-surface p-4 shadow-xl ${
              layout === "horizontal" ? "w-72" : ""
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-gray-400">
                <GripIcon />
              </span>
              <h2 className="text-sm font-semibold text-gray-900">
                {activeLane.name}
              </h2>
            </div>
            <LaneOverlayProjects
              projects={projectsByLane[activeLane.id] ?? []}
              progressByProject={progressByProject}
              layout={layout}
            />
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

function LayoutToggle({
  layout,
  onToggle,
}: {
  layout: BoardLayout;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={
        layout === "horizontal"
          ? "Switch to vertical layout"
          : "Switch to horizontal layout"
      }
      title={
        layout === "horizontal"
          ? "Switch to vertical layout"
          : "Switch to horizontal layout"
      }
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    >
      {layout === "horizontal" ? <ColumnsIcon /> : <RowsIcon />}
    </button>
  );
}

function ColumnsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <rect x="2" y="3" width="4" height="14" rx="1" />
      <rect x="8" y="3" width="4" height="14" rx="1" />
      <rect x="14" y="3" width="4" height="14" rx="1" />
    </svg>
  );
}

function RowsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <rect x="2" y="2" width="16" height="4" rx="1" />
      <rect x="2" y="8" width="16" height="4" rx="1" />
      <rect x="2" y="14" width="16" height="4" rx="1" />
    </svg>
  );
}

function LaneSection({
  lane,
  projects,
  progressByProject,
  dndEnabled,
  layout,
}: {
  lane: Lane;
  projects: Project[];
  progressByProject: ProgressMap;
  dndEnabled: boolean;
  layout: BoardLayout;
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-4 transition-colors ${
        layout === "horizontal" ? "w-72 shrink-0" : ""
      } ${
        isDragging ? "border-dashed border-gray-300 bg-gray-50" : "border-transparent"
      }`}
    >
      <div className={isDragging ? "invisible" : ""}>
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
          layout={layout}
        />
      </div>
    </div>
  );
}

function ProjectDropZone({
  containerKey,
  projects,
  progressByProject,
  dndEnabled,
  emptyText,
  layout,
}: {
  containerKey: string;
  projects: Project[];
  progressByProject: ProgressMap;
  dndEnabled: boolean;
  emptyText: string;
  layout: BoardLayout;
}) {
  const { setNodeRef } = useDroppable({
    id: `container:${containerKey}`,
    disabled: !dndEnabled,
  });

  return (
    <SortableContext
      items={projects.map((p) => `project:${p.id}`)}
      strategy={
        layout === "horizontal" ? verticalListSortingStrategy : rectSortingStrategy
      }
    >
      <div ref={setNodeRef} className="min-h-12">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyText}</p>
        ) : (
          <div
            className={
              layout === "horizontal"
                ? "flex flex-col gap-3"
                : "grid gap-4 sm:grid-cols-2"
            }
          >
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

function LaneOverlayProjects({
  projects,
  progressByProject,
  layout,
}: {
  projects: Project[];
  progressByProject: ProgressMap;
  layout: BoardLayout;
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-gray-500">No projects in this lane yet.</p>;
  }

  return (
    <div
      className={
        layout === "horizontal" ? "flex flex-col gap-3" : "grid gap-4 sm:grid-cols-2"
      }
    >
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-xl border border-gray-200 bg-surface p-5 shadow-sm"
        >
          <ProjectCardContent
            project={project}
            progress={progressByProject[project.id]}
          />
        </div>
      ))}
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
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

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

        {project.assignee && (
          <p className="mb-2 text-xs text-gray-500">
            Assigned to {project.assignee}
          </p>
        )}

        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>{progress ? `${progress.done}/${progress.total} done` : "No tasks yet"}</span>
          {progress && progress.total > 0 && <span>{pct}%</span>}
        </div>
        {progress && progress.total > 0 && (
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {(!progress || progress.total === 0) && <div className="mb-3" />}
      </Link>

      <DocLinkChips links={project.doc_links ?? []} />
    </>
  );
}
