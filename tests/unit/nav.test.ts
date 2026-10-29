import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath, navHrefForKey } from "@/lib/nav";

describe("navHrefForKey", () => {
  it("maps each G-shortcut key to its page", () => {
    expect(navHrefForKey("q")).toBe("/queue");
    expect(navHrefForKey("f")).toBe("/follow-ups");
    expect(navHrefForKey("l")).toBe("/leads");
    expect(navHrefForKey("t")).toBe("/lists");
    expect(navHrefForKey("i")).toBe("/import");
    expect(navHrefForKey("s")).toBe("/stats");
    expect(navHrefForKey("p")).toBe("/settings");
  });

  it("ignores case and returns null for unknown keys", () => {
    expect(navHrefForKey("Q")).toBe("/queue");
    expect(navHrefForKey("x")).toBeNull();
  });

  it("gives every page a unique shortcut key", () => {
    const keys = NAV_ITEMS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("isActivePath", () => {
  it("matches the page and its sub-pages only", () => {
    expect(isActivePath("/leads", "/leads")).toBe(true);
    expect(isActivePath("/leads/abc", "/leads")).toBe(true);
    expect(isActivePath("/leadsx", "/leads")).toBe(false);
    expect(isActivePath("/queue", "/leads")).toBe(false);
  });
});
