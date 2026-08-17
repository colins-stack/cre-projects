"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lane } from "@/lib/types";

export function ProjectLanePicker({
  projectId,
  laneId,
  lanes,
}: {
  projectId: string;
  laneId: string | null;
  lanes: Lane[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setError(null);
    const { error } = await supabase
      .from("projects")
      .update({ lane_id: value || null })
      .eq("id", projectId);

    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Lane</label>
      <select
        defaultValue={laneId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
      >
        <option value="">No lane</option>
        {lanes.map((lane) => (
          <option key={lane.id} value={lane.id}>
            {lane.name}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
