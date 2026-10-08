'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Mark } from '@/components/ui/StatusMark';
import { formatMoney, formatNumber } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import { ORDER_STATUS_TABS, orderStatus } from '@/lib/status';
import { cn } from '@/lib/cn';
import type { Dashboard } from '@/types';

const SEGMENT_FILL: Record<string, string> = {
  pending: 'bg-caution',
  'on-hold': 'bg-caution/60',
  processing: 'bg-accent',
  completed: 'bg-positive',
  cancelled: 'bg-ink-4',
  refunded: 'bg-ink-4/60',
  failed: 'bg-critical',
};

/** One stacked bar (count-weighted); every segment links to its filtered orders. */
export function OrderPipeline({ data }: { data: Dashboard }) {
  const reduce = useReducedMotion();
  // Workflow order; unknown statuses go last.
  const order = [...ORDER_STATUS_TABS, 'refunded', 'failed'] as string[];
  const rank = (status: string) => (order.includes(status) ? order.indexOf(status) : order.length);
  const rows = [...data.period.status_breakdown].sort((a, b) => rank(a.status) - rank(b.status));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <section aria-labelledby="pipeline-heading" className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pipeline-heading" className="text-heading text-ink">
          Order pipeline
        </h2>
        <Link href="/app/orders" className="text-meta text-accent hover:text-accent-strong">
          All {formatNumber(total)} orders
        </Link>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-cell text-ink-3">No orders were placed in this period.</p>
      ) : (
        <>
          <div className="mt-4 flex h-2 w-full gap-px overflow-hidden rounded-[2px] bg-well" aria-hidden>
            {rows.map((row) => (
              <motion.span
                key={row.status}
                className={cn('h-full origin-left', SEGMENT_FILL[row.status] ?? 'bg-mute')}
                style={{ width: `${(row.count / total) * 100}%` }}
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: duration.data, ease: ease.out }}
              />
            ))}
          </div>
          <ul className="mt-3">
            {rows.map((row) => {
              const meta = orderStatus(row.status);
              return (
                <li key={row.status} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/app/orders?status=${row.status}`}
                    className="tnum grid grid-cols-[minmax(0,1fr)_3rem_6.5rem] items-center gap-3 py-2 text-cell hover:bg-well/60"
                  >
                    <span className="inline-flex items-center gap-2 text-ink">
                      <Mark kind={meta.mark} />
                      {meta.label}
                    </span>
                    <span className="text-right text-ink-2">{formatNumber(row.count)}</span>
                    <span className={cn('text-right', meta.recedes ? 'text-ink-3' : 'text-ink')}>{formatMoney(row.value)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
