// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createSequence, isTypingTarget } from "@/lib/hotkeys";

describe("isTypingTarget", () => {
  it("is true inside form fields and editable content", () => {
    document.body.innerHTML = `
      <input id="i"><textarea id="t"></textarea><select id="s"></select>
      <div contenteditable="true"><span id="e">x</span></div>
      <button id="b">ok</button>`;
    for (const id of ["i", "t", "s", "e"]) expect(isTypingTarget(document.getElementById(id))).toBe(true);
    expect(isTypingTarget(document.getElementById("b"))).toBe(false);
  });

  it("is false for null and non-element targets", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
  });
});

describe("createSequence", () => {
  it("matches the second key after the leader", () => {
    const seq = createSequence("g", 1000, () => 0);
    expect(seq.press("g")).toEqual({ kind: "pending" });
    expect(seq.press("L")).toEqual({ kind: "match", key: "l" });
  });

  it("does nothing for keys without the leader", () => {
    const seq = createSequence("g", 1000, () => 0);
    expect(seq.press("l")).toEqual({ kind: "none" });
  });

  it("expires when the second key comes too late", () => {
    let t = 0;
    const seq = createSequence("g", 1000, () => t);
    seq.press("g");
    t = 1500;
    expect(seq.press("l")).toEqual({ kind: "none" });
  });

  it("starts over after a match", () => {
    const seq = createSequence("g", 1000, () => 0);
    seq.press("g");
    seq.press("q");
    expect(seq.press("q")).toEqual({ kind: "none" });
  });

  it("says whether it's waiting for the second key", () => {
    let t = 0;
    const seq = createSequence("g", 1000, () => t);
    expect(seq.pending()).toBe(false);
    seq.press("g");
    expect(seq.pending()).toBe(true);
    t = 1500;
    expect(seq.pending()).toBe(false);
    seq.press("g");
    seq.press("s");
    expect(seq.pending()).toBe(false);
  });
});
