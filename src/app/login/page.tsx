import { Suspense } from "react";
import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth";
import { signInErrorMessage } from "@/lib/auth-rules";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
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
        {/* searchParams are request data: with Cache Components they're read inside a boundary. */}
        <Suspense fallback={<GoogleButton callbackUrl={undefined} />}>
          <SignInForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = signInErrorMessage(first(params.error));
  return (
    <>
      {error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      )}
      <GoogleButton callbackUrl={first(params.callbackUrl)} />
    </>
  );
}

function GoogleButton({ callbackUrl }: { callbackUrl: string | undefined }) {
  return (
    <form action={signInWithGoogle}>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <Button type="submit" size="lg" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
