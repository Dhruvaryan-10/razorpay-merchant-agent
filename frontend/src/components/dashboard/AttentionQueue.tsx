import Link from 'next/link';
import { Mark } from '@/components/ui/StatusMark';
import { attentionItems } from '@/lib/dashboard';
import { plural } from '@/lib/format';
import type { Dashboard } from '@/types';

/** What needs the merchant, ranked by money at risk. Each row is a link. */
export function AttentionQueue({ data }: { data: Dashboard }) {
  const items = attentionItems(data);

  return (
    <section aria-labelledby="attention-heading" className="min-w-0 border-t-2 border-ink pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="attention-heading" className="text-heading text-ink">
          Needs attention
        </h2>
        {items.length ? <span className="text-meta text-ink-3">{plural(items.length, 'item')}, by impact</span> : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-cell text-ink-2">
          Nothing is waiting on you. No pending orders, and every tracked product is above the threshold of{' '}
          {data.inventory.threshold}.
        </p>
      ) : (
        <ol className="mt-2">
          {items.map((item) => (
            <li key={item.key} className="border-b border-line last:border-b-0">
              <Link
                href={item.href}
                className="group grid grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-x-3 py-3 hover:bg-well/60 focus-visible:bg-well/60"
              >
                <Mark kind={item.mark} className="mt-[7px]" />
                <span className="min-w-0">
                  <span className="block text-cell font-medium text-ink">{item.title}</span>
                  <span className="tnum mt-0.5 block text-meta text-ink-3">{item.detail}</span>
                </span>
                <span className="mt-px whitespace-nowrap text-meta text-accent group-hover:text-accent-strong">
                  {item.action}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {data.coverage.orders_truncated ? (
        <p className="mt-3 text-meta text-ink-3">
          Based on the latest {data.coverage.orders_scanned.toLocaleString('en-IN')} orders.
        </p>
      ) : null}
    </section>
  );
}
