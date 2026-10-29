"use client";

import { createContext, useContext } from "react";

type ShellContextValue = {
  openCommandMenu: () => void;
  openShortcuts: () => void;
  closeMobileNav: () => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside <AppShell>");
  return value;
}
