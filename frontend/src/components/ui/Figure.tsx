'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { duration, ease } from '@/lib/motion';

/**
 * A number that interpolates between values when the data changes (period
 * switch), so the size of the change is visible. Tabular figures keep the
 * width steady. Reduced motion shows the final value immediately.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduce || from === value) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration: duration.data,
      ease: ease.out,
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className={cn('tnum', className)}>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/** Label under a figure, as in "Average order". */
export function FigureBlock({
  label,
  children,
  detail,
  className,
}: {
  label: string;
  children: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-meta text-ink-3">{label}</span>
      <span className="text-figure-m text-ink">{children}</span>
      {detail ? <span className="text-meta text-ink-3">{detail}</span> : null}
    </div>
  );
}

/** Change against the previous period, coloured only when meaningful. */
export function Delta({
  value,
  format,
  invert,
  className,
}: {
  /** Percentage change, or null when there's no previous data to compare. */
  value: number | null;
  format: (n: number) => string;
  /** For metrics where down is good. */
  invert?: boolean;
  className?: string;
}) {
  if (value === null) {
    return <span className={cn('text-meta text-ink-3', className)}>No earlier data to compare</span>;
  }
  const up = value > 0.05;
  const down = value < -0.05;
  const good = invert ? down : up;
  const bad = invert ? up : down;
  return (
    <span
      className={cn(
        'tnum text-meta',
        good ? 'text-positive' : bad ? 'text-critical' : 'text-ink-3',
        className
      )}
    >
      {up ? '↑ ' : down ? '↓ ' : ''}
      {format(Math.abs(value))}
    </span>
  );
}
