import { cn } from "cn";
import type { CallOutcome, LeadStatus } from "@/lib/db/schema";
import { OUTCOME_META, STATUS_META, type Tone } from "@/lib/outcomes";

const TONES: Record<Tone, string> = {
  neutral: "bg-neutral-soft text-neutral",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent text-accent-foreground",
};

export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap before:size-1.5 before:shrink-0 before:rounded-full before:bg-current",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusChip({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

export function OutcomeChip({ outcome }: { outcome: CallOutcome }) {
  const meta = OUTCOME_META[outcome];
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-subtle-foreground">None</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5 items-center rounded-sm border bg-muted px-1.5 text-xs whitespace-nowrap text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </span>
  );
}
