import { AppShell } from "@/components/app-shell/app-shell";
import { navCountsByHref } from "@/components/app-shell/nav-counts";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell navCounts={navCountsByHref}>{children}</AppShell>;
}
