"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type DayPoint, niceScale } from "@/lib/stats";

/** Used until the chart's real width is measured. */
const DEFAULT_WIDTH = 640;
const MIN_WIDTH = 240;
const H = 220;
const MARGIN = { left: 34, right: 8, top: 10, bottom: 26 };
const PLOT_H = H - MARGIN.top - MARGIN.bottom;
/** Room one date label needs, so labels never run into each other. */
const LABEL_SPACE = 46;
const LABEL_EVERY = [1, 2, 3, 5, 7, 10];
/** Space between the two segments of a bar, so they read as separate. */
const SEGMENT_GAP = 2;

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Legend() {
  const swatch = "mr-1.5 inline-block size-2.5 rounded-[2px] align-[-1px]";
  return (
    <ul className="m-0 flex list-none gap-3.5 p-0 text-xs whitespace-nowrap text-muted-foreground">
      <li>
        <i className={`${swatch} bg-chart-1`} />
        Conversation
      </li>
      <li>
        <i className={`${swatch} bg-chart-2`} />
        No conversation
      </li>
    </ul>
  );
}

/** Calls per day as stacked bars: the part you spoke to someone, and the rest. Also available as a table. */
export function CallsChart({ series }: { series: DayPoint[] }) {
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // Drawn at its real width, so the text stays the size it was designed at on a phone instead of shrinking with it.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setMeasured(Math.floor(entry.contentRect.width)));
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);

  const W = Math.max(MIN_WIDTH, measured);
  const total = series.reduce((sum, d) => sum + d.calls, 0);
  const { top, step } = niceScale(Math.max(...series.map((d) => d.calls), 1));
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const y = (value: number) => MARGIN.top + PLOT_H - (value / top) * PLOT_H;
  const slot = (W - MARGIN.left - MARGIN.right) / series.length;
  const barWidth = Math.max(2, slot * 0.72);
  const labelEvery = LABEL_EVERY.find((n) => n * slot >= LABEL_SPACE) ?? 10;
  const hovered = hover === null ? null : series[hover];

  return (
    <section aria-labelledby="stats-calls-title" className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-3">
        <h2 id="stats-calls-title" className="text-sm font-semibold">
          Calls per day
        </h2>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <Legend />
          <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)}>
            {asTable ? "Show chart" : "Show as table"}
          </Button>
        </div>
      </div>
      <div className="p-4">
        {asTable ? (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="[&>th]:h-8 [&>th]:border-b [&>th]:px-2 [&>th]:text-left [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground [&>th.num]:text-right">
                  <th>Day</th>
                  <th className="num">Calls</th>
                  <th className="num">Conversations</th>
                  <th className="num">No conversation</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:h-8 [&>tr>td]:border-b [&>tr>td]:px-2 [&>tr>td.num]:text-right [&>tr>td.num]:font-mono [&>tr>td.num]:tabular-nums">
                {[...series].reverse().map((d) => (
                  <tr key={d.day}>
                    <td>{longDay.format(d.day)}</td>
                    <td className="num">{d.calls}</td>
                    <td className="num">{d.conversations}</td>
                    <td className="num">{d.calls - d.conversations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div ref={setBox} className="relative" onPointerLeave={() => setHover(null)}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`Calls per day over the last ${series.length} days, ${plural(total, "call")} in total. Use Show as table for each day.`}
              className="block h-auto w-full"
            >
              <g className="stroke-border" strokeWidth={1}>
                {ticks.map((tick) => (
                  <line key={tick} x1={MARGIN.left} x2={W - MARGIN.right} y1={y(tick)} y2={y(tick)} />
                ))}
              </g>
              <g className="fill-muted-foreground font-mono text-[10px]">
                {ticks.map((tick) => (
                  <text key={tick} x={MARGIN.left - 6} y={y(tick) + 3} textAnchor="end">
                    {tick}
                  </text>
                ))}
              </g>
              {series.map((d, i) => {
                const x = MARGIN.left + i * slot + (slot - barWidth) / 2;
                const other = d.calls - d.conversations;
                const conversationHeight = (d.conversations / top) * PLOT_H;
                const otherHeight = (other / top) * PLOT_H;
                const gap = d.conversations > 0 && other > 0 ? SEGMENT_GAP : 0;
                const isToday = i === series.length - 1;
                return (
                  <g key={d.day}>
                    {hover === i && (
                      <rect
                        x={MARGIN.left + i * slot}
                        y={MARGIN.top}
                        width={slot}
                        height={PLOT_H}
                        className="fill-foreground/5"
                      />
                    )}
                    {d.conversations > 0 && (
                      <rect
                        x={x}
                        y={MARGIN.top + PLOT_H - conversationHeight}
                        width={barWidth}
                        height={conversationHeight}
                        rx={Math.min(2, barWidth / 2)}
                        className="fill-chart-1"
                      />
                    )}
                    {other > 0 && (
                      <rect
                        x={x}
                        y={MARGIN.top + PLOT_H - conversationHeight - otherHeight}
                        width={barWidth}
                        height={Math.max(1, otherHeight - gap)}
                        rx={Math.min(2, barWidth / 2)}
                        className="fill-chart-2"
                      />
                    )}
                    {(series.length - 1 - i) % labelEvery === 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={H - 8}
                        textAnchor="middle"
                        className="fill-muted-foreground font-mono text-[10px]"
                      >
                        {isToday ? "Today" : shortDay.format(d.day)}
                      </text>
                    )}
                    {/* A wider target than the bar, so thin bars are easy to point at. */}
                    <rect
                      x={MARGIN.left + i * slot}
                      y={MARGIN.top}
                      width={slot}
                      height={PLOT_H}
                      fill="transparent"
                      onPointerEnter={() => setHover(i)}
                      onPointerDown={() => setHover(i)}
                    />
                  </g>
                );
              })}
            </svg>
            {hovered && hover !== null && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
                style={{
                  left: `clamp(110px, ${((MARGIN.left + hover * slot + slot / 2) / W) * 100}%, calc(100% - 110px))`,
                }}
              >
                <strong className="block font-medium">{longDay.format(hovered.day)}</strong>
                <span className="font-mono">{plural(hovered.calls, "call")}</span>
                <span className="text-muted-foreground"> · </span>
                <span className="font-mono">{plural(hovered.conversations, "conversation")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
