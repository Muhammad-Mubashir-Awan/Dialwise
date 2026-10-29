import { describe, expect, it } from "vitest";
import { duration, relativeTime } from "@/lib/format";

const NOW = new Date("2026-10-29T12:00:00Z");
const at = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

describe("relativeTime", () => {
  it("says just now within a minute", () => {
    expect(relativeTime(at(0), NOW)).toBe("just now");
    expect(relativeTime(new Date(NOW.getTime() - 59_000), NOW)).toBe("just now");
  });

  it("counts minutes, then hours and minutes, then days", () => {
    expect(relativeTime(at(-5), NOW)).toBe("5m ago");
    expect(relativeTime(at(-120), NOW)).toBe("2h ago");
    expect(relativeTime(at(-150), NOW)).toBe("2h 30m ago");
    expect(relativeTime(at(-26 * 60), NOW)).toBe("1 day ago");
    expect(relativeTime(at(-72 * 60), NOW)).toBe("3 days ago");
  });

  it("describes future times", () => {
    expect(relativeTime(at(45), NOW)).toBe("in 45m");
    expect(relativeTime(at(3 * 60), NOW)).toBe("in 3h");
    expect(relativeTime(at(46 * 60), NOW)).toBe("in 2 days");
  });
});

describe("duration", () => {
  it("is the same short form relativeTime uses, without direction", () => {
    expect(duration(45 * 60_000)).toBe("45m");
    expect(duration(-150 * 60_000)).toBe("2h 30m");
    expect(duration(3 * 24 * 3_600_000)).toBe("3 days");
  });
});
