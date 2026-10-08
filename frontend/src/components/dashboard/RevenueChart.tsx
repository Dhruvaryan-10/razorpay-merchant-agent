'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatMoney, formatShortDay, formatTime, plural } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { SeriesPoint } from '@/types';

const W = 1000;
const H = 200;
const PAD_TOP = 12;

function pathFor(values: number[], max: number) {
  if (values.length === 0) return '';
  const step = values.length > 1 ? W / (values.length - 1) : 0;
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(H - (v / max) * (H - PAD_TOP)).toFixed(1)}`)
    .join(' ');
}

/**
 * Running revenue for this period (line and area) against the previous
 * period's running revenue (dashed). The line ends at the net revenue figure
 * above it, so the chart explains the number. No y-axis; the tooltip gives
 * each day's own revenue and both running totals. Keyboard: ←/→ step days.
 */
export function RevenueChart({ series, hourly }: { series: SeriesPoint[]; hourly: boolean }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const { current, previous, max } = useMemo(() => {
    const running = (values: number[]) => {
      let sum = 0;
      return values.map((v) => (sum += v));
    };
    const current = running(series.map((p) => p.revenue));
    const previous = running(series.map((p) => p.prev_revenue));
    const max = Math.max(1, ...current, ...previous) * 1.08;
    return { current, previous, max };
  }, [series]);

  const linePath = pathFor(current, max);
  const areaPath = linePath ? `${linePath} L${W} ${H} L0 ${H} Z` : '';
  const prevPath = pathFor(previous, max);
  const hasPrevious = previous.some((v) => v > 0);
  const point = active !== null ? series[active] : null;
  const xPercent = active !== null && series.length > 1 ? (active / (series.length - 1)) * 100 : 0;

  const label = (p: SeriesPoint) => (hourly ? formatTime(p.start) : formatShortDay(p.start));
  const ticks = useMemo(() => {
    if (series.length < 2) return [];
    const count = Math.min(5, series.length);
    return Array.from({ length: count }, (_, i) => Math.round((i * (series.length - 1)) / (count - 1)));
  }, [series.length]);

  const onPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setActive(Math.round(ratio * (series.length - 1)));
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActive((i) => {
      const start = i ?? series.length - 1;
      return Math.min(series.length - 1, Math.max(0, start + (event.key === 'ArrowRight' ? 1 : -1)));
    });
  };

  const total = current[current.length - 1] ?? 0;

  return (
    <figure className="m-0">
      <div
        role="img"
        tabIndex={0}
        aria-label={`Running revenue ${hourly ? 'by hour' : 'by day'}, reaching ${formatMoney(total)} over ${plural(series.length, hourly ? 'hour' : 'day')}. Use arrow keys for each ${hourly ? 'hour' : 'day'}.`}
        className="relative h-[200px] touch-none select-none rounded-sm focus-visible:outline-offset-4"
        onPointerMove={onPointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-hidden>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgb(var(--line))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="rgb(var(--line-strong))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {hasPrevious ? (
            <path d={prevPath} fill="none" stroke="rgb(var(--ink-4))" strokeWidth="1.25" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          ) : null}
          <motion.path
            key={`area-${series.length}`}
            d={areaPath}
            fill="rgb(var(--accent) / 0.06)"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.data, ease: ease.out }}
          />
          <motion.path
            key={`line-${series.length}`}
            d={linePath}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="1.75"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1, d: linePath }}
            transition={{ duration: duration.data, ease: ease.out }}
          />
        </svg>

        {point ? (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-ink/30" style={{ left: `${xPercent}%` }} />
            <span
              aria-hidden
              className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sheet bg-accent"
              style={{ left: `${xPercent}%`, top: `${H - (current[active as number] / max) * (H - PAD_TOP)}px` }}
            />
            <div
              className="pointer-events-none absolute top-0 z-10 w-max min-w-[170px] rounded-md bg-sheet px-3 py-2 text-meta shadow-e1"
              style={{
                left: `${xPercent}%`,
                transform: xPercent > 60 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
              }}
            >
              <div className="text-ink-3">{label(point)}</div>
              <div className="tnum mt-0.5 text-cell font-medium text-ink">
                {formatMoney(point.revenue)} <span className="font-regular text-ink-3">· {plural(point.orders, 'order')}</span>
              </div>
              <div className="tnum mt-0.5 text-ink-3">Running total {formatMoney(current[active as number])}</div>
              {hasPrevious ? (
                <div className="tnum text-ink-3">Previous period {formatMoney(previous[active as number])}</div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="tnum relative h-4 min-w-0 flex-1 text-meta text-ink-3" aria-hidden>
          {ticks.map((t, i) => (
            <span
              key={t}
              className={cn(
                'absolute whitespace-nowrap',
                i > 0 && i < ticks.length - 1 && 'hidden sm:inline'
              )}
              style={{
                left: `${(t / (series.length - 1)) * 100}%`,
                transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {label(series[t])}
            </span>
          ))}
        </div>
        <div className="flex gap-4 text-meta text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3 bg-accent" />
            This period, running
          </span>
          {hasPrevious ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="w-3 border-t border-dashed border-ink-4" />
              Previous
            </span>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
