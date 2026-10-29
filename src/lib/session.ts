import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/auth-rules";

export type CurrentUser = { email: string; name: string; image: string | null };

/**
 * The signed-in owner, or null. Checks ALLOWED_EMAIL again, so changing it signs out old sessions.
 * Reads the session cookie: with Cache Components, call it inside a <Suspense> boundary.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = (await auth())?.user;
  if (!user?.email || !isAllowedEmail(user.email, process.env.ALLOWED_EMAIL)) return null;
  return { email: user.email, name: user.name ?? user.email, image: user.image ?? null };
}

/** Call first in every server action, data read and page that shows data. Redirects to sign-in otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
