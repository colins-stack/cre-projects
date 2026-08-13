import type { DocLink } from "@/lib/types";

export function DocLinkChips({ links }: { links: DocLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
