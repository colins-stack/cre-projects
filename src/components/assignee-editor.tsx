"use client";

import { useState } from "react";

const TEAM_MEMBERS = ["Colin", "Jordyn"];

export function AssigneeEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (assignees: string[]) => void;
}) {
  const otherValue = value.find((v) => !TEAM_MEMBERS.includes(v)) ?? "";
  const [showOther, setShowOther] = useState(otherValue !== "");

  function toggleMember(name: string) {
    onChange(
      value.includes(name)
        ? value.filter((v) => v !== name)
        : [...value, name],
    );
  }

  function toggleOther() {
    if (showOther) {
      setShowOther(false);
      if (otherValue) onChange(value.filter((v) => v !== otherValue));
    } else {
      setShowOther(true);
    }
  }

  function handleOtherChange(text: string) {
    const withoutOther = value.filter((v) => v !== otherValue);
    onChange(text ? [...withoutOther, text] : withoutOther);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {TEAM_MEMBERS.map((name) => {
          const active = value.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggleMember(name)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-accent-600 bg-accent-600 text-white"
                  : "border-gray-300 bg-surface text-gray-700 hover:bg-gray-100"
              }`}
            >
              {name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={toggleOther}
          aria-pressed={showOther}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            showOther
              ? "border-accent-600 bg-accent-600 text-white"
              : "border-gray-300 bg-surface text-gray-700 hover:bg-gray-100"
          }`}
        >
          Other
        </button>
      </div>

      {showOther && (
        <input
          autoFocus
          value={otherValue}
          onChange={(e) => handleOtherChange(e.target.value)}
          placeholder="Name"
          className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
      )}
    </div>
  );
}
