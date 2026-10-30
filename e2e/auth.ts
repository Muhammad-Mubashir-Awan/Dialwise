import { encode } from "next-auth/jwt";

// Only used by the e2e test server that Playwright starts on localhost. Not a real secret.
export const E2E_AUTH_SECRET = "e2e-only-secret-for-the-local-test-server-0123456789";
export const E2E_OWNER_EMAIL = "owner@example.test";
export const E2E_FRIEND_EMAIL = "Friend@Example.test";
export const E2E_STRANGER_EMAIL = "stranger@example.test";
export const OWNER_STATE = "e2e/.auth/owner.json";
export const FRIEND_STATE = "e2e/.auth/friend.json";
export const STRANGER_STATE = "e2e/.auth/stranger.json";

/** Env for the test server: real Auth.js, with a test secret and owner, and placeholder Google keys. */
export const E2E_SERVER_ENV = {
  AUTH_SECRET: E2E_AUTH_SECRET,
  AUTH_TRUST_HOST: "true",
  AUTH_GOOGLE_ID: "e2e-placeholder-client-id",
  AUTH_GOOGLE_SECRET: "e2e-placeholder-client-secret",
  // Two people on the list, written the way a person would (spaces, capitals).
  ALLOWED_EMAIL: `${E2E_OWNER_EMAIL}, ${E2E_FRIEND_EMAIL}`,
};

/** A Playwright storage state holding an Auth.js session cookie, as if `email` had signed in with Google. */
export async function sessionState(email: string, baseURL: string) {
  // Over plain http Auth.js uses this cookie name, and the name doubles as the encryption salt.
  const name = "authjs.session-token";
  const value = await encode({
    token: { email, name: "E2E User", sub: email },
    secret: E2E_AUTH_SECRET,
    salt: name,
  });
  const { hostname } = new URL(baseURL);
  return {
    cookies: [
      {
        name,
        value,
        domain: hostname,
        path: "/",
        expires: Math.floor(Date.now() / 1000) + 3600,
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  };
}
