/** Follow-ups grouped by your own day. Pure: the browser passes in its idea of today, since the server can't know it. */

type Boundaries = { now: Date; endOfToday: Date; endOfWeek: Date };

/** Overdue (before now), due today (now until midnight) and the next 7 days. Anything later is left out. */
export function groupFollowUps<T extends { at: Date }>(items: T[], { now, endOfToday, endOfWeek }: Boundaries) {
  return {
    overdue: items.filter((i) => i.at < now),
    today: items.filter((i) => i.at >= now && i.at < endOfToday),
    week: items.filter((i) => i.at >= endOfToday && i.at < endOfWeek),
  };
}

/** For the sidebar: how many follow-ups are due by the end of today, and how many of those are overdue. */
export function dueToday(times: Date[], { now, endOfToday }: Omit<Boundaries, "endOfWeek">) {
  const due = times.filter((t) => t < endOfToday);
  return { due: due.length, overdue: due.filter((t) => t < now).length };
}

/** Midnight at the end of today and 7 days after that, on the browser's clock. */
export function dayBoundaries(now: Date): { endOfToday: Date; endOfWeek: Date } {
  const [y, m, d] = [now.getFullYear(), now.getMonth(), now.getDate()];
  return { endOfToday: new Date(y, m, d + 1), endOfWeek: new Date(y, m, d + 8) };
}
