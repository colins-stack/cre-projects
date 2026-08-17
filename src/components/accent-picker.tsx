"use client";

const ACCENTS = [
  { key: "terracotta", label: "Terracotta" },
  { key: "blue", label: "Blue" },
  { key: "sage", label: "Sage" },
  { key: "rose", label: "Rose" },
  { key: "plain", label: "Plain" },
] as const;

function selectAccent(key: string) {
  document.documentElement.setAttribute("data-accent", key);
  localStorage.setItem("accent", key);
}

export function AccentPicker() {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 px-3">
      {ACCENTS.map((accent) => (
        <button
          key={accent.key}
          onClick={() => selectAccent(accent.key)}
          aria-label={`${accent.label} accent color`}
          title={accent.label}
          data-swatch={accent.key}
          className="h-5 w-5 rounded-full border border-gray-300"
          style={
            accent.key === "plain"
              ? { background: "linear-gradient(135deg, #000 50%, #fff 50%)" }
              : { background: `var(--swatch-${accent.key})` }
          }
        />
      ))}
    </div>
  );
}
