import { describe, expect, it } from "vitest";
import { leadsHref, parseLeadFilters } from "@/lib/lead-filters";

const LIST_ID = "6f1c2a4e-8b0d-4c3e-9f7a-1b2c3d4e5f60";

describe("parseLeadFilters", () => {
  it("reads search, status, list, tag and page", () => {
    expect(parseLeadFilters({ q: " amelia ", status: "interested", list: LIST_ID, tag: "saas", page: "2" })).toEqual({
      q: "amelia",
      status: "interested",
      list: LIST_ID,
      tag: "saas",
      page: 2,
    });
  });

  it("accepts 'none' for leads in no list", () => {
    expect(parseLeadFilters({ list: "none" }).list).toBe("none");
  });

  it("ignores values it doesn't understand", () => {
    expect(parseLeadFilters({ status: "bogus", list: "abc", page: "-3", q: "" })).toEqual({ page: 1 });
    expect(parseLeadFilters({ page: "x" })).toEqual({ page: 1 });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseLeadFilters({ tag: ["saas", "warm"] }).tag).toBe("saas");
  });
});

describe("leadsHref", () => {
  it("links to the leads page with only the filters that are set", () => {
    expect(leadsHref({ page: 1 })).toBe("/leads");
    expect(leadsHref({ q: "amelia", status: "new", page: 1 })).toBe("/leads?q=amelia&status=new");
  });

  it("applies changes and goes back to page 1 when a filter changes", () => {
    expect(leadsHref({ q: "a", page: 3 }, { tag: "saas" })).toBe("/leads?q=a&tag=saas");
    expect(leadsHref({ q: "a", tag: "saas", page: 3 }, { tag: undefined })).toBe("/leads?q=a");
  });

  it("keeps the filters when moving between pages", () => {
    expect(leadsHref({ q: "a", page: 1 }, { page: 2 })).toBe("/leads?q=a&page=2");
  });
});
