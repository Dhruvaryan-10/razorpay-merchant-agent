import { cn } from '@/lib/cn';
import type { StockLevel } from '@/types';

/**
 * Stock coverage: quantity against a scale of 1.5x the threshold, with a tick
 * at the threshold. Out of stock draws no bar, only the tick.
 */
export function StockMeter({
  quantity,
  threshold,
  level,
  className,
}: {
  quantity: number | null;
  threshold: number;
  level: StockLevel;
  className?: string;
}) {
  const scale = threshold * 1.5;
  const pct = quantity === null ? 0 : Math.min(100, Math.max(0, (quantity / scale) * 100));
  const tick = (threshold / scale) * 100;
  return (
    <span aria-hidden className={cn('relative block h-1.5 w-full rounded-[1px] bg-well', className)}>
      <span
        className={cn(
          'absolute inset-y-0 left-0 rounded-[1px]',
          level === 'out' ? 'bg-critical' : level === 'low' ? 'bg-caution' : 'bg-mute'
        )}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute -inset-y-0.5 w-px bg-ink-3" style={{ left: `${tick}%` }} />
    </span>
  );
}
