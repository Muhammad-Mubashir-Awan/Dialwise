/** Who may sign in and which paths need a session. Pure functions, shared by auth.ts and proxy.ts. */

const HOME = "/queue";

const normalize = (email: string | null | undefined) => (email ?? "").trim().toLowerCase();

export function isAllowedEmail(email: string | null | undefined, allowedEmail: string | null | undefined): boolean {
  const allowed = normalize(allowedEmail);
  return allowed !== "" && normalize(email) === allowed;
}

type SignInAttempt = {
  provider: string | undefined;
  email: string | null | undefined;
  emailVerified: boolean | null | undefined;
};

/** Only the owner's verified Google account gets in; an unset ALLOWED_EMAIL lets nobody in. */
export function canSignIn(attempt: SignInAttempt, allowedEmail: string | null | undefined): boolean {
  return attempt.provider === "google" && attempt.emailVerified === true && isAllowedEmail(attempt.email, allowedEmail);
}

export function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

/** A same-site path to return to after sign-in; anything else goes to the queue. */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return HOME;
  if (url === "/login" || url.startsWith("/login?")) return HOME;
  return url;
}

export function loginRedirectPath(pathWithSearch: string): string {
  return pathWithSearch === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(pathWithSearch)}`;
}

/** What to show on the sign-in page for an Auth.js error code (`?error=`). */
export function signInErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code === "AccessDenied") return "That account can't open this CRM. Only the owner's Google account can sign in.";
  if (code === "Configuration") {
    return "Google sign-in isn't set up yet. Check AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env.local.";
  }
  return "Sign-in didn't finish. Please try again.";
}
