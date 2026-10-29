"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { createSequence, isTypingTarget } from "@/lib/hotkeys";
import { navHrefForKey } from "@/lib/nav";
import { CommandMenu } from "./command-menu";
import { ShellContext } from "./shell-context";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const goSequence = useRef(createSequence("g"));

  const shell = useMemo(
    () => ({
      openCommandMenu: () => {
        setMobileNavOpen(false);
        setCommandOpen(true);
      },
      openShortcuts: () => {
        setMobileNavOpen(false);
        setShortcutsOpen(true);
      },
      closeMobileNav: () => setMobileNavOpen(false),
      isGoPending: () => goSequence.current.pending(),
    }),
    [],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role='dialog']")) return;

      const step = goSequence.current.press(e.key);
      if (step.kind === "match") {
        const href = navHrefForKey(step.key);
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }
      if (step.kind === "pending") return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    // Lets e2e tests wait until shortcuts are live instead of racing hydration.
    document.documentElement.dataset.shellReady = "true";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      delete document.documentElement.dataset.shellReady;
    };
  }, [router]);

  return (
    <ShellContext.Provider value={shell}>
      <div className="grid h-dvh grid-cols-1 md:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="hidden overflow-y-auto border-r bg-sidebar md:block">
          <SidebarNav />
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">
          <button
            type="button"
            className="fixed top-[max(10px,env(safe-area-inset-top))] left-[max(10px,env(safe-area-inset-left))] z-20 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" className="size-4" />
          </button>
          {children}
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(280px,85vw)] bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onShowShortcuts={() => setShortcutsOpen(true)} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </ShellContext.Provider>
  );
}
