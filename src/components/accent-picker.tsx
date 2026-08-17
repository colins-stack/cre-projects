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
    <div className="flex flex-wrap items-start gap-4">
      {ACCENTS.map((accent) => (
        <button
          key={accent.key}
          onClick={() => selectAccent(accent.key)}
          aria-label={`${accent.label} accent color`}
          className="flex flex-col items-center gap-1.5"
        >
          <span
            data-swatch={accent.key}
            className="h-7 w-7 rounded-full border border-gray-300"
            style={
              accent.key === "plain"
                ? {
                    background: "linear-gradient(135deg, #000 50%, #fff 50%)",
                  }
                : { background: `var(--swatch-${accent.key})` }
            }
          />
          <span className="text-xs text-gray-600">{accent.label}</span>
        </button>
      ))}
    </div>
  );
}
