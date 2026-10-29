"use client";

import { useRouter } from "next/navigation";
import { Keyboard, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/lib/nav";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
};

export function CommandMenu({ open, onOpenChange, onShowShortcuts }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search and commands"
      description="Go to a page or run a command"
    >
      {/* This shadcn version's CommandDialog doesn't wrap children in <Command>; cmdk needs it. */}
      <Command>
        <CommandInput placeholder="Type a command or a page name" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                value={`Go to ${item.label}`}
                onSelect={() => run(() => router.push(item.href))}
              >
                <item.icon aria-hidden="true" />
                {item.label}
                <CommandShortcut>G {item.key.toUpperCase()}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Commands">
            <CommandItem
              value="Switch theme"
              onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            >
              <SunMoon aria-hidden="true" />
              Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
            </CommandItem>
            <CommandItem value="Show keyboard shortcuts" onSelect={() => run(onShowShortcuts)}>
              <Keyboard aria-hidden="true" />
              Keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
