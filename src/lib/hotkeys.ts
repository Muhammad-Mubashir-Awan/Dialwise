/** True when a key press should go to a form field instead of a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return (target as Element).closest("input, textarea, select, [contenteditable='true']") !== null;
}

export type SequenceResult = { kind: "pending" } | { kind: "match"; key: string } | { kind: "none" };

/**
 * Tracks two-key sequences such as "G then Q". Call `press` for each key;
 * it returns `match` with the second key when the sequence completes
 * within `timeoutMs` of the leader key.
 */
export function createSequence(leader: string, timeoutMs = 1200, now: () => number = Date.now) {
  let armedAt: number | null = null;
  return {
    press(key: string): SequenceResult {
      const k = key.toLowerCase();
      if (armedAt !== null && now() - armedAt <= timeoutMs) {
        armedAt = null;
        return { kind: "match", key: k };
      }
      armedAt = null;
      if (k === leader) {
        armedAt = now();
        return { kind: "pending" };
      }
      return { kind: "none" };
    },
    /** True while waiting for the second key, so other shortcuts can stand aside (G then S is not "skip"). */
    pending(): boolean {
      return armedAt !== null && now() - armedAt <= timeoutMs;
    },
    reset() {
      armedAt = null;
    },
  };
}
