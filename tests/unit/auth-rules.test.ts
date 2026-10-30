import { describe, expect, it } from "vitest";
import {
  canSignIn,
  isAllowedEmail,
  isPublicPath,
  loginRedirectPath,
  safeCallbackUrl,
  signInErrorMessage,
} from "@/lib/auth-rules";

const OWNER = "owner@example.com";

describe("canSignIn", () => {
  const google = { provider: "google", email: OWNER, emailVerified: true };

  it("lets the owner's verified Google account in", () => {
    expect(canSignIn(google, OWNER)).toBe(true);
  });

  it("ignores case and surrounding spaces in both addresses", () => {
    expect(canSignIn({ ...google, email: "  Owner@Example.COM " }, " OWNER@example.com")).toBe(true);
  });

  it("turns away any other Google account", () => {
    expect(canSignIn({ ...google, email: "someone@example.com" }, OWNER)).toBe(false);
  });

  it("turns away an unverified Google email", () => {
    expect(canSignIn({ ...google, emailVerified: false }, OWNER)).toBe(false);
    expect(canSignIn({ ...google, emailVerified: undefined }, OWNER)).toBe(false);
  });

  it("turns away other providers", () => {
    expect(canSignIn({ ...google, provider: "github" }, OWNER)).toBe(false);
  });

  it("lets nobody in when ALLOWED_EMAIL is not set", () => {
    expect(canSignIn(google, undefined)).toBe(false);
    expect(canSignIn(google, "  ")).toBe(false);
  });
});

describe("isAllowedEmail", () => {
  it("is false when either address is missing", () => {
    expect(isAllowedEmail(null, OWNER)).toBe(false);
    expect(isAllowedEmail(OWNER, undefined)).toBe(false);
  });

  it("accepts any address on a comma, semicolon or space separated list, ignoring case and spaces", () => {
    const list = " Owner@Example.com ,  friend@example.com;third@example.com fourth@example.com";
    for (const email of ["owner@example.com", "FRIEND@example.com", "third@example.com", "fourth@example.com"]) {
      expect(isAllowedEmail(email, list), email).toBe(true);
    }
  });

  it("turns away addresses that are not on the list, including near misses", () => {
    const list = "owner@example.com,friend@example.com";
    for (const email of [
      "stranger@example.com",
      "friend@example.com.evil.test",
      "xfriend@example.com",
      "example.com",
    ]) {
      expect(isAllowedEmail(email, list), email).toBe(false);
    }
  });

  it("lets nobody in when the list is empty or only separators", () => {
    expect(isAllowedEmail(OWNER, " , ; ")).toBe(false);
    expect(isAllowedEmail("", ",")).toBe(false);
  });
});

describe("isPublicPath", () => {
  it("leaves the sign-in page and Auth.js routes open", () => {
    for (const path of ["/login", "/api/auth/signin", "/api/auth/callback/google", "/api/auth/session"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("protects everything else", () => {
    for (const path of ["/", "/queue", "/leads/123", "/api/export", "/loginx", "/api/authx", "/api/auth-bypass"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });
});

describe("safeCallbackUrl", () => {
  it("keeps a path on this site, with its query", () => {
    expect(safeCallbackUrl("/leads?status=new")).toBe("/leads?status=new");
  });

  it("falls back to the queue for anything that could leave the site", () => {
    for (const url of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null]) {
      expect(safeCallbackUrl(url), String(url)).toBe("/queue");
    }
  });

  it("never sends you back to the sign-in page", () => {
    expect(safeCallbackUrl("/login")).toBe("/queue");
  });
});

describe("loginRedirectPath", () => {
  it("remembers where you were going", () => {
    expect(loginRedirectPath("/leads?status=new")).toBe("/login?callbackUrl=%2Fleads%3Fstatus%3Dnew");
  });

  it("adds nothing for the home page", () => {
    expect(loginRedirectPath("/")).toBe("/login");
  });
});

describe("signInErrorMessage", () => {
  it("explains a refused account", () => {
    expect(signInErrorMessage("AccessDenied")).toMatch(/only the owner's google account/i);
  });

  it("points to the setup when Google sign-in isn't configured", () => {
    expect(signInErrorMessage("Configuration")).toMatch(/AUTH_GOOGLE_ID/);
  });

  it("has a general message for other errors and none when there is no error", () => {
    expect(signInErrorMessage("OAuthCallbackError")).toMatch(/try again/i);
    expect(signInErrorMessage(undefined)).toBeNull();
  });
});
