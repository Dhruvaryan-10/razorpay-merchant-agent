import Link from 'next/link';
import { StockMeter } from '@/components/ui/Meter';
import { Mark } from '@/components/ui/StatusMark';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Dashboard } from '@/types';

/** The five most at-risk products, out of stock first, against the threshold. */
export function InventoryHealth({ data }: { data: Dashboard }) {
  const { inventory } = data;
  const healthy = inventory.total - inventory.low - inventory.out;
  const risk = inventory.at_risk.slice(0, 5);

  return (
    <section aria-labelledby="inventory-heading" className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="inventory-heading" className="text-heading text-ink">
          Inventory health
        </h2>
        <Link href="/app/inventory" className="text-meta text-accent hover:text-accent-strong">
          Inventory
        </Link>
      </div>
      <p className="tnum mt-1 text-meta text-ink-3">
        {formatNumber(healthy)} healthy · {formatNumber(inventory.low)} low · {formatNumber(inventory.out)} out · threshold{' '}
        {inventory.threshold}
      </p>

      {risk.length === 0 ? (
        <p className="mt-4 text-cell text-ink-2">Every tracked product is at or above the threshold.</p>
      ) : (
        <ul className="mt-3">
          {risk.map((p) => (
            <li key={p.id} className="border-b border-line last:border-b-0">
              <Link
                href={`/app/inventory?product=${p.id}`}
                className="grid grid-cols-[10px_minmax(0,1fr)_minmax(64px,96px)_2rem] items-center gap-3 py-2.5 hover:bg-well/60"
              >
                <Mark kind={p.stock_level === 'out' ? 'diamond' : 'hollow-caution'} />
                <span className="min-w-0 truncate text-cell text-ink">
                  {p.name} <span className="font-mono text-[11.5px] text-ink-3">{p.sku}</span>
                </span>
                <StockMeter quantity={p.stock_quantity} threshold={inventory.threshold} level={p.stock_level} />
                <span
                  className={cn(
                    'tnum text-right text-cell',
                    p.stock_level === 'out' ? 'text-critical' : 'text-caution'
                  )}
                >
                  {p.stock_quantity ?? 0}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {risk.length ? (
        <p className="mt-2 text-meta text-ink-3">Bars scale to 1.5× the threshold. The tick marks the threshold.</p>
      ) : null}
    </section>
  );
}
