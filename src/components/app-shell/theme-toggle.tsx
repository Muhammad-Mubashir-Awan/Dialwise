"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ORDER = ["system", "light", "dark"] as const;
const LABELS = { system: "System", light: "Light", dark: "Dark" } as const;
const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser; render "System" on the server.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current = mounted && theme && theme in LABELS ? (theme as keyof typeof LABELS) : "system";
  const Icon = ICONS[current];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      className={className}
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABELS[current]}. Switch to ${LABELS[next]}`}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span>Theme: {LABELS[current]}</span>
    </button>
  );
}
