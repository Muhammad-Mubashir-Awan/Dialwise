"use client";

import { useEffect, useState } from "react";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { sessionEnded } from "@/lib/session-ended";

/** Shown when a page or a save fails unexpectedly. The sidebar stays, so the rest of the app is still reachable. */
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    void sessionEnded().then((ended) => {
      if (!ended) return;
      setSignedOut(true);
      // Reloading goes to sign-in, which then brings you back to this page.
      window.location.reload();
    });
  }, []);

  return (
    <>
      <PageHeader title={signedOut ? "Signed out" : "Something went wrong"} />
      <PageBody>
        <div className="max-w-xl rounded-lg border bg-card px-4 py-7 text-center text-sm text-muted-foreground">
          {signedOut ? (
            <p role="status">Your session has ended. Taking you to sign in…</p>
          ) : (
            <>
              <p className="mb-3">This page didn&apos;t finish loading. Check your connection, then try again.</p>
              <Button onClick={() => retry()}>Try again</Button>
            </>
          )}
        </div>
      </PageBody>
    </>
  );
}
