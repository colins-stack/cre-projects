"use client";

export function Checkbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span className="absolute inset-0 rounded-md border border-gray-300 bg-surface transition-colors peer-hover:border-accent-400 peer-checked:border-accent-600 peer-checked:bg-accent-600 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-100" />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="relative h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      >
        <path
          d="M3 8.5l3 3 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}
