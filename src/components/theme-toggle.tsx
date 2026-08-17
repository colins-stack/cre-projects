"use client";

function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
}

export function ThemeToggle() {
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="hidden h-4 w-4 dark:block"
        aria-hidden="true"
      >
        <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.14 8.05 8.05 0 0 1 .73-3.37 1 1 0 0 0-1.32-1.32A10.14 10.14 0 1 0 21.64 13Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="block h-4 w-4 dark:hidden"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path
          strokeWidth="2"
          stroke="currentColor"
          d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        />
      </svg>
      <span className="hidden dark:inline">Dark</span>
      <span className="dark:hidden">Light</span>
    </button>
  );
}
