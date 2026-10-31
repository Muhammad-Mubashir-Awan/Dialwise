"use client";

import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

/** Shown when a page or a save fails unexpectedly. The sidebar stays, so the rest of the app is still reachable. */
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PageHeader title="Something went wrong" />
      <PageBody>
        <div className="max-w-xl rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
          <p className="mb-3">This page didn&apos;t finish loading. Check your connection, then try again.</p>
          <Button onClick={() => retry()}>Try again</Button>
        </div>
      </PageBody>
    </>
  );
}
