import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign in" };

// Google sign-in is wired up in slice 3 (auth); until then the button opens the app.
export default function LoginPage() {
  return (
    <main className="grid min-h-full place-items-center px-[max(16px,env(safe-area-inset-left))] py-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-card p-7">
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <Phone aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
          </span>
          Cold-Call CRM
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-[13px] text-muted-foreground">
          Only the owner&apos;s Google account can sign in. Other accounts are turned away.
        </p>
        <Button asChild size="lg">
          <Link href="/queue">Continue with Google</Link>
        </Button>
      </div>
    </main>
  );
}
