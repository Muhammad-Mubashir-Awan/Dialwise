"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Keyboard, LogOut, Phone, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { signOutAction } from "@/lib/actions/auth";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { useShell } from "./shell-context";
import { ThemeToggle } from "./theme-toggle";

const itemClass =
  "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground pointer-coarse:min-h-11";

/** Counts shown next to nav links, keyed by href (server components streamed in by the layout). */
export type NavCounts = Partial<Record<string, React.ReactNode>>;

export function SidebarNav({ counts }: { counts?: NavCounts }) {
  const { openCommandMenu, openShortcuts } = useShell();

  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-0.5 px-2 py-3">
      <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-3.5 font-semibold tracking-tight">
        <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
          <Phone aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
        </span>
        Dialwise
      </div>

      {/* On pages whose address isn't known at build time (e.g. /leads/[id]), the links render
          without the highlight first and highlight once the address is known. */}
      <Suspense fallback={<NavLinks pathname={null} counts={counts} />}>
        <CurrentNavLinks counts={counts} />
      </Suspense>

      <div className="mt-auto flex flex-col gap-0.5 pt-3">
        <button type="button" className={itemClass} onClick={openCommandMenu}>
          <Search aria-hidden="true" className="size-4" />
          Search and commands
          <Kbd className="ml-auto whitespace-nowrap">Ctrl K</Kbd>
        </button>
        <button type="button" className={itemClass} onClick={openShortcuts}>
          <Keyboard aria-hidden="true" className="size-4" />
          Shortcuts
          <Kbd className="ml-auto">?</Kbd>
        </button>
        <ThemeToggle className={itemClass} />
        <form action={signOutAction}>
          <button type="submit" className={itemClass}>
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

function CurrentNavLinks({ counts }: { counts?: NavCounts }) {
  return <NavLinks pathname={usePathname()} counts={counts} />;
}

function NavLinks({ pathname, counts }: { pathname: string | null; counts?: NavCounts }) {
  const { closeMobileNav } = useShell();
  return (["work", "manage"] as const).map((group, gi) => (
    <div key={group} className="flex flex-col gap-0.5">
      {gi > 0 && <div role="separator" className="mx-1 my-2 h-px bg-border" />}
      {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
        const active = pathname !== null && isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileNav}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              active && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon aria-hidden="true" className="size-4" />
            {item.label}
            {counts?.[item.href]}
          </Link>
        );
      })}
    </div>
  ));
}
