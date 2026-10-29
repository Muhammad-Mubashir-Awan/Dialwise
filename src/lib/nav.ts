import { ChartColumn, Clock, List, Phone, SlidersHorizontal, Upload, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Second key of the "G then <key>" shortcut. */
  key: string;
  group: "work" | "manage";
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/queue", label: "Queue", icon: Phone, key: "q", group: "work" },
  { href: "/follow-ups", label: "Follow-ups", icon: Clock, key: "f", group: "work" },
  { href: "/leads", label: "Leads", icon: Users, key: "l", group: "work" },
  { href: "/lists", label: "Lists", icon: List, key: "t", group: "work" },
  { href: "/import", label: "Import", icon: Upload, key: "i", group: "manage" },
  { href: "/stats", label: "Stats", icon: ChartColumn, key: "s", group: "manage" },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal, key: "p", group: "manage" },
];

export function navHrefForKey(key: string): string | null {
  return NAV_ITEMS.find((item) => item.key === key.toLowerCase())?.href ?? null;
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
