import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAllowedEmail, isPublicPath, loginRedirectPath } from "@/lib/auth-rules";

/**
 * First line of defence: no session, no page. Data reads still call requireUser() (src/lib/session.ts).
 *
 * This only reads the session cookie. NextAuth's `auth()` proxy wrapper re-sends the cookie on every
 * request, so a request still in flight when you sign out (a link prefetch) could sign you back in.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search, protocol } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;
  // Auth.js names the cookie "__Secure-authjs.session-token" over https and "authjs.session-token" over http.
  const token = secret ? await getToken({ req, secret, secureCookie: protocol === "https:" }) : null;
  const signedIn = isAllowedEmail(token?.email, process.env.ALLOWED_EMAIL);

  if (pathname === "/login" && signedIn) {
    return Response.redirect(new URL("/queue", req.nextUrl));
  }
  if (signedIn || isPublicPath(pathname)) return;

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Sign in to use this API." }, { status: 401 });
  }
  return Response.redirect(new URL(loginRedirectPath(pathname + search), req.nextUrl));
}

export const config = {
  // Everything except Next's build assets and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)"],
};
