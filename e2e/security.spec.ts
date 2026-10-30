import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  test.skip(({ isMobile }) => isMobile, "headers don't depend on the device");

  for (const path of ["/login", "/queue", "/api/export?type=leads"]) {
    test(`are sent on ${path}`, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["strict-transport-security"]).toContain("max-age=");
    });
  }
});
