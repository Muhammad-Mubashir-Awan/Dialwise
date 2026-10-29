"use client";

import { createContext, useContext } from "react";

type ShellContextValue = {
  openCommandMenu: () => void;
  openShortcuts: () => void;
  closeMobileNav: () => void;
  /** True right after G, while the shell waits for the page letter. Page shortcuts should ignore that key. */
  isGoPending: () => boolean;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside <AppShell>");
  return value;
}
