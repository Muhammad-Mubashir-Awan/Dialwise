export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex min-h-13 flex-wrap items-center gap-2.5 border-b bg-background py-2 pr-[max(20px,env(safe-area-inset-right))] pl-14 md:pl-[max(20px,env(safe-area-inset-left))]">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto pt-5 pr-[max(16px,env(safe-area-inset-right))] pb-12 pl-[max(16px,env(safe-area-inset-left))] md:px-5">
      {children}
    </main>
  );
}

/** Placeholder until a page's slice is built. */
export function ComingSoon({ what, slice }: { what: string; slice: number }) {
  return (
    <div className="max-w-xl rounded-lg border bg-card px-4 py-7 text-center text-[13px] text-muted-foreground">
      <strong className="mb-1 block text-sm text-foreground">{what}</strong>
      Built in slice {slice} of the core plan.
    </div>
  );
}
