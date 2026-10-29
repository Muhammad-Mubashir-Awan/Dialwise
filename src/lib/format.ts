/** Display helpers for dates and times. Pure; the client components pass in the current time. */

const MINUTE = 60_000;

function duration(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / MINUTE);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours}h ${rest}m` : `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** "5m ago", "2h 30m ago", "in 3h", "2 days ago"; "just now" within a minute. */
export function relativeTime(at: Date, now: Date): string {
  const diff = at.getTime() - now.getTime();
  if (Math.abs(diff) < MINUTE) return "just now";
  return diff < 0 ? `${duration(diff)} ago` : `in ${duration(diff)}`;
}
