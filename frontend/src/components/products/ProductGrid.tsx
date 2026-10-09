'use client';

import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Product } from '@/types';
import { ProductImage } from './ProductImage';
import { StockValue } from './StockValue';

/**
 * Grid view: for catalogues where the picture is how a product is recognised.
 * Tiles are spacing and type, not cards: no border, no shadow, no badges.
 */
export function ProductGrid({
  products,
  loading,
  selectedId,
  onOpen,
}: {
  products: Product[] | undefined;
  loading: boolean;
  selectedId: number | null;
  onOpen: (product: Product) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label="Products">
      {loading && !products
        ? Array.from({ length: 12 }, (_, i) => (
            <li key={i} aria-hidden className="flex flex-col gap-2.5">
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </li>
          ))
        : products?.map((product) => {
            const selected = selectedId === product.external_id;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onOpen(product)}
                  aria-current={selected ? 'true' : undefined}
                  className="group flex w-full flex-col gap-2.5 rounded-sm text-left focus-visible:outline-offset-4"
                >
                  <ProductImage
                    src={product.image}
                    name={product.name}
                    size="tile"
                    className={cn(
                      'transition-[box-shadow] duration-instant group-hover:shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]',
                      selected && 'shadow-[inset_0_0_0_2px_rgb(var(--accent))] group-hover:shadow-[inset_0_0_0_2px_rgb(var(--accent))]'
                    )}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-cell text-ink group-hover:text-accent">{product.name}</span>
                    <span className="flex items-baseline justify-between gap-2 text-meta">
                      <span className="tnum text-ink-2">{formatMoney(product.price)}</span>
                      <StockValue product={product} className="text-meta" />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
    </ul>
  );
}
