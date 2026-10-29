/** The Postgres error code (e.g. "23505") behind a failed query. Drizzle wraps driver errors, so look through `cause`. */
export function pgErrorCode(error: unknown): string | null {
  for (let e = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return null;
}

export const UNIQUE_VIOLATION = "23505";
export const FOREIGN_KEY_VIOLATION = "23503";
