'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { ProductDrawer } from '@/components/products/ProductDrawer';
import { ProductImage } from '@/components/products/ProductImage';
import { StockValue } from '@/components/products/StockValue';
import { Button } from '@/components/ui/Button';
import { DataTable, RowChevron, type Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorNotice } from '@/components/ui/EmptyState';
import { StockMeter } from '@/components/ui/Meter';
import { Skeleton } from '@/components/ui/Skeleton';
import { Mark } from '@/components/ui/StatusMark';
import { useDashboard, useInventory } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useUrlState } from '@/hooks/useUrlState';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber, plural } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { Product } from '@/types';

const BUCKETS = [
  { key: '0', label: '0', test: (q: number) => q <= 0 },
  { key: '1-9', label: '1–9', test: (q: number) => q >= 1 && q <= 9 },
  { key: '10-24', label: '10–24', test: (q: number) => q >= 10 && q <= 24 },
  { key: '25-49', label: '25–49', test: (q: number) => q >= 25 && q <= 49 },
  { key: '50+', label: '50+', test: (q: number) => q >= 50 },
];

function summarySentence(out: number, low: number, healthy: number, threshold: number, total: number) {
  if (!out && !low) return `All ${plural(total, 'tracked product')} are at or above the threshold of ${threshold}.`;
  const are = (n: number) => (n === 1 ? 'is' : 'are');
  const outPart = out ? `${plural(out, 'product')} ${are(out)} out of stock` : '';
  const lowPart = low
    ? out
      ? `${formatNumber(low)} ${are(low)} below the threshold of ${threshold}`
      : `${plural(low, 'product')} ${are(low)} below the threshold of ${threshold}`
    : '';
  const lead = [outPart, lowPart].filter(Boolean).join(' and ');
  return `${lead}.${healthy ? ` The other ${formatNumber(healthy)} are healthy.` : ''}`;
}

const columns: Column<Product>[] = [
  {
    key: 'product',
    header: 'Product',
    cell: (p) => (
      <span className="flex min-w-0 items-center gap-3 py-1.5">
        <ProductImage src={p.image} name={p.name} size="thumb" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-ink">{p.name}</span>
          {p.sku ? <span className="truncate font-mono text-[11.5px] leading-4 text-ink-3">{p.sku}</span> : null}
        </span>
      </span>
    ),
    skeletonWidth: 'w-48',
  },
  { key: 'price', header: 'Price', align: 'right', hideBelow: 'md', cell: (p) => <span className="tnum">{formatMoney(p.price)}</span> },
  { key: 'stock', header: 'Stock', align: 'right', cell: (p) => <StockValue product={p} /> },
  { key: 'open', header: '', align: 'right', cell: () => <RowChevron />, skeletonWidth: 'w-0' },
];

export function InventoryView() {
  const reduce = useReducedMotion();
  const url = useUrlState();
  const drawer = useRecordParam('product');
  const bucket = url.get('bucket');
  const { data, isPending, isError, error, refetch } = useInventory();
  const dashboard = useDashboard('30d').data; // already cached by the sidebar

  const threshold = data?.low_stock_threshold ?? 10;
  const demand = useMemo(() => new Map(dashboard?.inventory.at_risk.map((r) => [r.id, r]) ?? []), [dashboard]);

  const queue = useMemo(() => {
    if (!data) return [];
    const out = [...data.by_status.out_of_stock].sort(
      (a, b) => (demand.get(b.id)?.pending_units ?? 0) - (demand.get(a.id)?.pending_units ?? 0)
    );
    const low = [...data.by_status.low_stock].sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0));
    return [...out, ...low];
  }, [data, demand]);

  const tracked = useMemo(
    () =>
      data
        ? [...data.by_status.out_of_stock, ...data.by_status.low_stock, ...data.by_status.healthy].sort(
            (a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)
          )
        : [],
    [data]
  );
  const counts = BUCKETS.map((b) => tracked.filter((p) => b.test(p.stock_quantity ?? 0)).length);
  const maxCount = Math.max(1, ...counts);
  const activeBucket = BUCKETS.find((b) => b.key === bucket);
  const rows = activeBucket ? tracked.filter((p) => activeBucket.test(p.stock_quantity ?? 0)) : tracked;
  const s = data?.summary;

  const segments = s
    ? [
        { key: 'out', count: s.out_of_stock, fill: 'bg-critical', label: 'out', mark: 'diamond' as const },
        { key: 'low', count: s.low_stock, fill: 'bg-caution', label: 'low', mark: 'hollow-caution' as const },
        { key: 'healthy', count: s.healthy_stock, fill: 'bg-mute', label: 'healthy', mark: null },
        { key: 'untracked', count: s.untracked, fill: 'bg-line', label: 'not tracked', mark: null },
      ].filter((x) => x.count > 0)
    : [];
  const total = segments.reduce((n, x) => n + x.count, 0);

  return (
    <>
      <PageHeader title="Inventory" meta={`Reorder threshold ${threshold}`} />
      <PageBody className="flex flex-col gap-14">
        {isError ? <ErrorNotice message={`Couldn’t load inventory. ${(error as Error).message}`} onRetry={() => refetch()} /> : null}

        {isPending ? (
          <div aria-hidden className="flex flex-col gap-4">
            <Skeleton className="h-5 w-[min(520px,100%)]" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="mt-8 h-40 w-full" />
          </div>
        ) : s ? (
          <>
            <section aria-labelledby="health-heading">
              <h2 id="health-heading" className="sr-only">
                Inventory health
              </h2>
              <p className="max-w-measure text-body text-ink">
                {summarySentence(s.out_of_stock, s.low_stock, s.healthy_stock, threshold, s.total_products - s.untracked)}
              </p>
              {total > 0 ? (
                <>
                  <div className="mt-5 flex h-2 w-full gap-px overflow-hidden rounded-[2px]" aria-hidden>
                    {segments.map((seg) => (
                      <motion.span
                        key={seg.key}
                        className={cn('h-full origin-left', seg.fill)}
                        style={{ width: `${(seg.count / total) * 100}%` }}
                        initial={reduce ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: duration.data, ease: ease.out }}
                      />
                    ))}
                  </div>
                  <ul className="tnum mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-meta text-ink-2">
                    {segments.map((seg) => (
                      <li key={seg.key} className="inline-flex items-center gap-1.5">
                        {seg.mark ? <Mark kind={seg.mark} /> : <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', seg.fill)} />}
                        {formatNumber(seg.count)} {seg.label}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {data?.truncated ? <p className="mt-2 text-meta text-ink-3">Based on the first 1,000 products.</p> : null}
            </section>

            <div className="grid gap-12 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:gap-14">
              <section aria-labelledby="act-heading" className="min-w-0 border-t-2 border-ink pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="act-heading" className="text-heading text-ink">
                    Act now
                  </h2>
                  {queue.length ? <span className="text-meta text-ink-3">Out of stock first, then lowest cover</span> : null}
                </div>
                {queue.length === 0 ? (
                  <p className="mt-4 text-cell text-ink-2">Nothing to reorder. Every tracked product is at or above the threshold.</p>
                ) : (
                  <ol className="mt-2">
                    {queue.map((p) => {
                      const pending = demand.get(p.id);
                      const qty = p.stock_quantity ?? 0;
                      const why =
                        p.stock_level === 'out'
                          ? pending?.pending_units
                            ? `Out · ${plural(pending.pending_units, 'unit')} in ${plural(pending.pending_orders, 'pending order')}`
                            : 'Out · no open demand'
                          : `${Math.round((qty / threshold) * 100)}% of threshold${pending?.pending_units ? ` · ${pending.pending_units} in pending orders` : ''}`;
                      return (
                        <li key={p.id} className="border-b border-line last:border-b-0">
                          <button
                            type="button"
                            onClick={() => drawer.open(p.external_id)}
                            className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 text-left hover:bg-well/60 sm:grid-cols-[10px_minmax(0,1fr)_minmax(72px,120px)_2.5rem]"
                          >
                            <Mark kind={p.stock_level === 'out' ? 'diamond' : 'hollow-caution'} />
                            <span className="min-w-0">
                              <span className="block truncate text-cell text-ink">
                                {p.name} <span className="font-mono text-[11.5px] text-ink-3">{p.sku}</span>
                              </span>
                              <span className="tnum block text-meta text-ink-3">{why}</span>
                            </span>
                            <StockMeter quantity={p.stock_quantity} threshold={threshold} level={p.stock_level} className="hidden sm:block" />
                            <span className={cn('tnum text-right text-cell', p.stock_level === 'out' ? 'text-critical' : 'text-caution')}>
                              {formatNumber(qty)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

              <section aria-labelledby="buckets-heading" className="min-w-0">
                <h2 id="buckets-heading" className="text-heading text-ink">
                  By quantity
                </h2>
                <p className="mt-1 text-meta text-ink-3">Tracked products by units on hand. Select a range to filter the list.</p>
                <div className="mt-5 grid grid-cols-5 items-end gap-2" role="group" aria-label="Filter by quantity">
                  {BUCKETS.map((b, i) => {
                    const active = bucket === b.key;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => url.set({ bucket: active ? null : b.key }, { replace: true })}
                        className="group flex flex-col items-stretch gap-1.5 rounded-sm text-center"
                      >
                        <span className="tnum text-cell text-ink">{counts[i]}</span>
                        <span className="flex h-20 items-end">
                          <span
                            className={cn(
                              'w-full rounded-t-[2px] transition-colors duration-instant',
                              i === 0 ? 'bg-critical' : i === 1 ? 'bg-caution' : 'bg-mute group-hover:bg-ink-4',
                              active && 'shadow-[0_0_0_2px_rgb(var(--accent))]',
                              bucket && !active && 'opacity-40'
                            )}
                            style={{ height: `${Math.max(4, (counts[i] / maxCount) * 100)}%` }}
                          />
                        </span>
                        <span className={cn('tnum text-meta', active ? 'text-accent' : 'text-ink-3')}>{b.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-meta text-ink-3">No stock history is recorded, so trends aren’t shown.</p>
              </section>
            </div>

            <section aria-labelledby="all-heading">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 id="all-heading" className="text-heading text-ink">
                  {activeBucket ? `${activeBucket.label} units` : 'All tracked products'}
                  <span className="tnum ml-2 text-meta font-regular text-ink-3">{formatNumber(rows.length)}</span>
                </h2>
                {activeBucket ? (
                  <Button size="sm" variant="ghost" onClick={() => url.set({ bucket: null }, { replace: true })}>
                    Show all
                  </Button>
                ) : null}
              </div>
              <DataTable
                caption="Tracked products by quantity"
                columns={columns}
                rows={rows}
                getRowId={(p) => p.id}
                onOpen={(p) => drawer.open(p.external_id)}
                selectedId={drawer.id !== null ? String(drawer.id) : null}
                keyboard
                mobileRow={(p) => (
                  <span className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <StockValue product={p} />
                  </span>
                )}
                empty={<EmptyState title="No products in this range." />}
              />
            </section>
          </>
        ) : null}
      </PageBody>
      <ProductDrawer siblings={queue} />
    </>
  );
}
