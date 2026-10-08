import { Mark } from '@/components/ui/StatusMark';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { stockStatus } from '@/lib/status';
import type { Product } from '@/types';

/**
 * Stock quantity in the Ledger status language: healthy stock gets no mark
 * (absence of colour is the signal); low gets an amber ring, out a red
 * diamond. The word is always present for assistive tech and greyscale.
 */
export function StockValue({ product, className }: { product: Pick<Product, 'stock_level' | 'stock_quantity'>; className?: string }) {
  const level = product.stock_level;
  const meta = stockStatus(level);

  if (level === 'untracked') {
    return <span className={cn('text-ink-3', className)}>Not tracked</span>;
  }

  return (
    <span
      className={cn(
        'tnum inline-flex items-center gap-2 whitespace-nowrap',
        level === 'out' ? 'text-critical' : level === 'low' ? 'text-caution' : 'text-ink',
        className
      )}
    >
      {level !== 'healthy' ? <Mark kind={meta.mark} /> : null}
      {formatNumber(product.stock_quantity ?? 0)}
      <span className={level === 'healthy' ? 'sr-only' : 'text-meta'}>{level === 'healthy' ? 'in stock' : meta.short.toLowerCase()}</span>
    </span>
  );
}

/** Published is the default and gets no mark; anything else is named. */
export function PublishState({ status }: { status: string }) {
  if (!status || status === 'publish') return <span className="text-ink-3">Published</span>;
  const label = status === 'draft' ? 'Draft' : status === 'private' ? 'Private' : status === 'pending' ? 'In review' : status;
  return (
    <span className="inline-flex items-center gap-2 text-ink-2">
      <Mark kind="hollow-neutral" />
      {label}
    </span>
  );
}
