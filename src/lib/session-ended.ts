/**
 * Browser only. After the session ends, the proxy sends every request to sign-in, so a save fails just like a
 * dropped connection would. Asking for the current page again tells the two apart: it comes back as a redirect.
 */
export async function sessionEnded(): Promise<boolean> {
  try {
    const page = await fetch(window.location.href, { method: "HEAD", redirect: "manual" });
    return page.type === "opaqueredirect";
  } catch {
    return false;
  }
}
