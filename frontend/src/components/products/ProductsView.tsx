'use client';

import { useEffect, useState } from 'react';
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, RowChevron, type Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorNotice } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/Input';
import { Kbd } from '@/components/ui/Kbd';
import { Pagination } from '@/components/ui/Pagination';
import { Segmented } from '@/components/ui/Segmented';
import { Tabs } from '@/components/ui/Tabs';
import { useInventory, useProducts } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useSlashToFocus, useUrlSearch } from '@/hooks/useUrlSearch';
import { useUrlState } from '@/hooks/useUrlState';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber } from '@/lib/format';
import type { Product } from '@/types';
import { ProductDrawer } from './ProductDrawer';
import { ProductGrid } from './ProductGrid';
import { ProductImage } from './ProductImage';
import { PublishState, StockValue } from './StockValue';

const PER_PAGE = 24; // divides evenly into 2, 3, 4 and 6 grid columns
const VIEW_KEY = 'rma.products.view';
type View = 'list' | 'grid';

const STOCK_TABS = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
  { value: 'healthy', label: 'Healthy' },
] as const;

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
  {
    key: 'category',
    header: 'Category',
    hideBelow: 'lg',
    cell: (p) => <span className="text-ink-2">{p.categories.map((c) => c.name).join(', ') || '—'}</span>,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    cell: (p) => <span className="tnum font-medium">{formatMoney(p.price)}</span>,
  },
  { key: 'stock', header: 'Stock', align: 'right', cell: (p) => <StockValue product={p} /> },
  { key: 'status', header: 'Status', hideBelow: 'xl', cell: (p) => <PublishState status={p.status} /> },
  { key: 'open', header: '', align: 'right', cell: () => <RowChevron />, skeletonWidth: 'w-0' },
];

function mobileRow(p: Product) {
  return (
    <span className="flex items-center gap-3">
      <ProductImage src={p.image} name={p.name} size="thumb" className="h-10 w-10" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex justify-between gap-3">
          <span className="truncate">{p.name}</span>
          <span className="tnum font-medium">{formatMoney(p.price)}</span>
        </span>
        <span className="flex justify-between gap-3 text-meta">
          <span className="truncate font-mono text-ink-3">{p.sku || '—'}</span>
          <StockValue product={p} className="text-meta" />
        </span>
      </span>
    </span>
  );
}

function useRememberedView(): [View, (view: View) => void] {
  const [view, setView] = useState<View>('list');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === 'grid' || saved === 'list') setView(saved);
    } catch {
      // Storage unavailable: list is the default.
    }
  }, []);
  const choose = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Preference simply won't persist.
    }
  };
  return [view, choose];
}

export function ProductsView() {
  const url = useUrlState();
  const drawer = useRecordParam('product');
  const stock = url.get('stock');
  const page = Math.max(1, url.getNumber('page') ?? 1);
  const { search, setSearch, query } = useUrlSearch();
  const searchRef = useSlashToFocus();
  const [view, setView] = useRememberedView();

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useProducts({
    page,
    per_page: PER_PAGE,
    stock_status: stock || undefined,
    search: query || undefined,
  });
  const inventory = useInventory();
  const summary = inventory.data?.summary;
  const counts: Record<string, number | undefined> = {
    '': summary?.total_products,
    low: summary?.low_stock,
    out: summary?.out_of_stock,
    healthy: summary?.healthy_stock,
  };

  const filtered = Boolean(stock || query);
  const clearFilters = () => {
    setSearch('');
    url.set({ stock: null, q: null, page: null });
  };
  const stockLabel = STOCK_TABS.find((t) => t.value === stock)?.label.toLowerCase();
  const emptyTitle = query
    ? `No ${stock ? `${stockLabel} ` : ''}products match “${query}”.`
    : stock === 'out'
      ? 'Nothing is out of stock.'
      : stock === 'low'
        ? `No products are below the threshold of ${inventory.data?.low_stock_threshold ?? 10}.`
        : stock
          ? `No ${stockLabel} products.`
          : 'No products yet.';

  const meta = data
    ? query || stock
      ? `${formatNumber(data.total)} matching`
      : `${formatNumber(data.total)} in the catalogue`
    : undefined;

  return (
    <>
      <PageHeader
        title="Products"
        meta={meta}
        actions={
          <Segmented<View>
            label="View"
            options={[
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
            ]}
            value={view}
            onChange={setView}
          />
        }
      >
        <Tabs
          id="products-stock"
          label="Stock"
          controls="products-results"
          items={STOCK_TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] }))}
          value={stock}
          onChange={(value) => url.set({ stock: value || null, page: null })}
        />
      </PageHeader>

      <PageBody className="pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInput
            ref={searchRef}
            label="Search name or SKU"
            shortcut="/"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              Clear filters
            </Button>
          ) : null}
        </div>

        {isError ? (
          <ErrorNotice className="mb-3" message={`Couldn’t load products. ${(error as Error).message}`} onRetry={() => refetch()} />
        ) : null}

        <div id="products-results">
          {view === 'list' ? (
            <DataTable
              caption="Products"
              columns={columns}
              rows={data?.items}
              getRowId={(p) => p.id}
              onOpen={(p) => drawer.open(p.external_id)}
              selectedId={drawer.id !== null ? String(drawer.id) : null}
              loading={isPending}
              stale={isPlaceholderData}
              mobileRow={mobileRow}
              keyboard
              empty={
                <EmptyState
                  title={emptyTitle}
                  action={filtered ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
                />
              }
            />
          ) : (
            <div className={cn('pt-3 transition-opacity duration-quick', isPlaceholderData && 'opacity-60')} aria-busy={isPlaceholderData}>
              <ProductGrid
                products={data?.items}
                loading={isPending}
                selectedId={drawer.id}
                onOpen={(p) => drawer.open(p.external_id)}
              />
              {data && data.items.length === 0 ? (
                <EmptyState
                  title={emptyTitle}
                  action={filtered ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
                />
              ) : null}
            </div>
          )}
        </div>

        {data && data.total > 0 ? (
          <div className={cn(view === 'grid' && 'mt-6 border-t border-line')}>
            <Pagination page={page} perPage={PER_PAGE} total={data.total} onPage={(p) => url.set({ page: p > 1 ? p : null })} noun="products">
              {view === 'list' ? (
                <p className="hidden text-meta text-ink-3 xl:block">
                  <Kbd>j</Kbd> <Kbd>k</Kbd> move · <Kbd>↵</Kbd> open · <Kbd>/</Kbd> search
                </p>
              ) : null}
            </Pagination>
          </div>
        ) : null}
      </PageBody>

      <ProductDrawer siblings={data?.items} />
    </>
  );
}
