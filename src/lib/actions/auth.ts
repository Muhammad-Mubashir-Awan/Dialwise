"use server";

import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth-rules";

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("google", { redirectTo: safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : null) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
