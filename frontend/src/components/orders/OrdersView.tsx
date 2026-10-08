'use client';

import { useState } from 'react';
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { FilterChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, RowChevron, type Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorNotice } from '@/components/ui/EmptyState';
import { Input, SearchInput } from '@/components/ui/Input';
import { Kbd } from '@/components/ui/Kbd';
import { Pagination } from '@/components/ui/Pagination';
import { StatusMark } from '@/components/ui/StatusMark';
import { Tabs } from '@/components/ui/Tabs';
import { useOrderCounts, useOrders } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useSlashToFocus, useUrlSearch } from '@/hooks/useUrlSearch';
import { useUrlState } from '@/hooks/useUrlState';
import { cn } from '@/lib/cn';
import { formatMoney, formatNumber, formatWhen } from '@/lib/format';
import { ORDER_STATUS_TABS, orderStatus, paymentLabel } from '@/lib/status';
import type { Order } from '@/types';
import { OrderDrawer } from './OrderDrawer';

const PER_PAGE = 20;

const columns: Column<Order>[] = [
  {
    key: 'order',
    header: 'Order',
    cell: (o) => <span className="font-mono text-code">#{o.order_number}</span>,
    skeletonWidth: 'w-12',
  },
  {
    key: 'placed',
    header: 'Placed',
    cell: (o) => <span className="tnum whitespace-nowrap text-ink-2">{formatWhen(o.created_at)}</span>,
    skeletonWidth: 'w-24',
  },
  { key: 'customer', header: 'Customer', cell: (o) => <span className="block max-w-[220px] truncate">{o.customer_name || 'Guest'}</span> },
  {
    key: 'status',
    header: 'Status',
    cell: (o) => {
      const meta = orderStatus(o.status);
      return <StatusMark kind={meta.mark} label={meta.label} muted={meta.recedes} />;
    },
  },
  {
    key: 'payment',
    header: 'Payment',
    hideBelow: 'xl',
    cell: (o) => <span className="text-ink-2">{paymentLabel(o.payment_method, o.payment_method_title)}</span>,
  },
  {
    key: 'items',
    header: 'Items',
    align: 'right',
    hideBelow: 'lg',
    cell: (o) => <span className="tnum text-ink-2">{formatNumber(o.item_count)}</span>,
    skeletonWidth: 'w-6',
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (o) => (
      <span className={cn('tnum font-medium', orderStatus(o.status).recedes && 'text-ink-3 line-through decoration-ink-4')}>
        {formatMoney(o.total, o.currency)}
      </span>
    ),
  },
  { key: 'open', header: '', align: 'right', cell: () => <RowChevron />, skeletonWidth: 'w-0' },
];

function mobileRow(o: Order) {
  const meta = orderStatus(o.status);
  return (
    <span className="flex flex-col gap-1">
      <span className="flex justify-between gap-3">
        <span className="font-mono text-code">#{o.order_number}</span>
        <span className={cn('tnum font-medium', meta.recedes && 'text-ink-3 line-through')}>{formatMoney(o.total, o.currency)}</span>
      </span>
      <span className="flex justify-between gap-3 text-meta text-ink-2">
        <span className="truncate">
          {o.customer_name || 'Guest'} · {formatWhen(o.created_at)}
        </span>
        <StatusMark kind={meta.mark} label={meta.label} muted={meta.recedes} />
      </span>
    </span>
  );
}

export function OrdersView() {
  const url = useUrlState();
  const drawer = useRecordParam('order');
  const status = url.get('status');
  const min = url.getNumber('min');
  const page = Math.max(1, url.getNumber('page') ?? 1);

  const { search, setSearch, query: urlQuery } = useUrlSearch();
  const searchRef = useSlashToFocus();

  const [amountDraft, setAmountDraft] = useState('');
  const [addingAmount, setAddingAmount] = useState(false);

  const params = {
    page,
    per_page: PER_PAGE,
    status: status || undefined,
    search: urlQuery || undefined,
    min_total: min ?? undefined,
  };
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useOrders(params);
  const counts = useOrderCounts(ORDER_STATUS_TABS);

  const filtered = Boolean(status || urlQuery || min !== null);
  const clearFilters = () => {
    setSearch('');
    url.set({ status: null, q: null, min: null, page: null });
  };

  const tabs = [
    { value: '', label: 'All', count: counts.data?.all },
    ...ORDER_STATUS_TABS.map((s) => ({ value: s, label: orderStatus(s).label, count: counts.data?.[s] })),
  ].filter((t) => t.value === '' || t.value === status || (t.count ?? 1) > 0);

  const emptyTitle = (() => {
    const parts = [status ? `${orderStatus(status).label.toLowerCase()} orders` : 'orders'];
    if (min !== null) parts.push(`of ${formatMoney(min)} or more`);
    if (urlQuery) parts.push(`matching “${urlQuery}”`);
    return `No ${parts.join(' ')}.`;
  })();

  const applyAmount = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amountDraft.replace(/[₹,\s]/g, ''));
    if (Number.isFinite(value) && value > 0) url.set({ min: value, page: null });
    setAddingAmount(false);
    setAmountDraft('');
  };

  return (
    <>
      <PageHeader
        title="Orders"
        meta={data ? `${formatNumber(data.total)} ${filtered ? 'matching' : 'in total'}` : undefined}
      >
        <Tabs
          id="orders-status"
          label="Order status"
          controls="orders-table"
          items={tabs}
          value={status}
          onChange={(value) => url.set({ status: value || null, page: null })}
        />
      </PageHeader>

      <PageBody className="pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInput
            ref={searchRef}
            label="Search orders"
            shortcut="/"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          {min !== null ? (
            <FilterChip onRemove={() => url.set({ min: null, page: null })} removeLabel="Remove amount filter">
              Amount ≥ {formatMoney(min)}
            </FilterChip>
          ) : addingAmount ? (
            <form onSubmit={applyAmount} className="flex items-center gap-1.5">
              <label htmlFor="min-amount" className="text-meta text-ink-2">
                Amount at least
              </label>
              <Input
                id="min-amount"
                autoFocus
                inputMode="numeric"
                placeholder="₹2,000"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                onBlur={() => !amountDraft && setAddingAmount(false)}
                onKeyDown={(e) => e.key === 'Escape' && setAddingAmount(false)}
                className="h-8 w-28"
              />
              <Button type="submit" size="sm" variant="quiet">
                Apply
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setAddingAmount(true)}>
              + Amount filter
            </Button>
          )}
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              Clear filters
            </Button>
          ) : null}
        </div>

        {isError ? (
          <ErrorNotice className="mb-3" message={`Couldn’t load orders. ${(error as Error).message}`} onRetry={() => refetch()} />
        ) : null}

        <DataTable
          id="orders-table"
          caption="Orders"
          columns={columns}
          rows={data?.items}
          getRowId={(o) => o.id}
          onOpen={(o) => drawer.open(o.external_id)}
          selectedId={drawer.id !== null ? String(drawer.id) : null}
          loading={isPending}
          stale={isPlaceholderData}
          rowMuted={(o) => !!orderStatus(o.status).recedes}
          mobileRow={mobileRow}
          keyboard
          empty={
            <EmptyState
              title={filtered ? emptyTitle : 'No orders yet.'}
              detail={filtered ? undefined : 'Orders appear here as soon as your store receives them.'}
              action={filtered ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          }
        />

        {data && data.total > 0 ? (
          <Pagination page={page} perPage={PER_PAGE} total={data.total} onPage={(p) => url.set({ page: p > 1 ? p : null })} noun="orders">
            <p className="hidden text-meta text-ink-3 xl:block">
              <Kbd>j</Kbd> <Kbd>k</Kbd> move · <Kbd>↵</Kbd> open · <Kbd>/</Kbd> search
            </p>
          </Pagination>
        ) : null}
      </PageBody>

      <OrderDrawer siblings={data?.items} />
    </>
  );
}
