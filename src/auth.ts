import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { canSignIn } from "@/lib/auth-rules";

// Reads AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from the environment.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // JWT sessions in an encrypted cookie: one user, so no session tables are needed.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ account, profile }) {
      return canSignIn(
        { provider: account?.provider, email: profile?.email, emailVerified: profile?.email_verified as boolean },
        process.env.ALLOWED_EMAIL,
      );
    },
  },
});
