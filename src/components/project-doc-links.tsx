"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DocLinkEditor } from "@/components/doc-link-editor";
import type { DocLink } from "@/lib/types";

export function ProjectDocLinks({
  projectId,
  links,
}: {
  projectId: string;
  links: DocLink[];
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleAdd(link: DocLink) {
    const { error } = await supabase
      .from("projects")
      .update({ doc_links: [...links, link] })
      .eq("id", projectId);

    if (!error) router.refresh();
    return { error: error?.message ?? null };
  }

  return <DocLinkEditor links={links} onAdd={handleAdd} />;
}
