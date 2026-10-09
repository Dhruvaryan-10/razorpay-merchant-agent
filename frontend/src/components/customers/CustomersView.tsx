'use client';

import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, RowChevron, type Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorNotice } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/Input';
import { Kbd } from '@/components/ui/Kbd';
import { Pagination } from '@/components/ui/Pagination';
import { useCustomers } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useSlashToFocus, useUrlSearch } from '@/hooks/useUrlSearch';
import { useUrlState } from '@/hooks/useUrlState';
import { formatDate, formatMoney, formatNumber, maskEmail } from '@/lib/format';
import type { Customer } from '@/types';
import { CustomerDrawer } from './CustomerDrawer';

const PER_PAGE = 20;

// Emails are masked in the table so screen sharing is safe; the drawer shows them in full.
const columns: Column<Customer>[] = [
  {
    key: 'customer',
    header: 'Customer',
    cell: (c) => (
      <span className="flex min-w-0 flex-col py-1">
        <span className="truncate text-ink">{c.name || 'Unnamed customer'}</span>
        {c.address?.city ? <span className="truncate text-meta text-ink-3">{c.address.city}</span> : null}
      </span>
    ),
    skeletonWidth: 'w-40',
  },
  { key: 'email', header: 'Email', hideBelow: 'lg', cell: (c) => <span className="text-ink-2">{c.email ? maskEmail(c.email) : '—'}</span> },
  { key: 'orders', header: 'Orders', align: 'right', cell: (c) => <span className="tnum text-ink-2">{formatNumber(c.order_count)}</span> },
  { key: 'ltv', header: 'Lifetime value', align: 'right', cell: (c) => <span className="tnum font-medium">{formatMoney(c.total_spent)}</span> },
  {
    key: 'since',
    header: 'Customer since',
    hideBelow: 'xl',
    cell: (c) => <span className="tnum text-ink-2">{c.created_at ? formatDate(c.created_at) : '—'}</span>,
  },
  { key: 'open', header: '', align: 'right', cell: () => <RowChevron />, skeletonWidth: 'w-0' },
];

export function CustomersView() {
  const url = useUrlState();
  const drawer = useRecordParam('customer');
  const page = Math.max(1, url.getNumber('page') ?? 1);
  const { search, setSearch, query } = useUrlSearch();
  const searchRef = useSlashToFocus();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useCustomers({
    page,
    per_page: PER_PAGE,
    search: query || undefined,
  });

  const clear = () => {
    setSearch('');
    url.set({ q: null, page: null });
  };

  return (
    <>
      <PageHeader
        title="Customers"
        meta={data ? `${formatNumber(data.total)} ${query ? 'matching' : 'in total'}` : undefined}
      />
      <PageBody className="pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInput
            ref={searchRef}
            label="Search name or email"
            shortcut="/"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>

        {isError ? (
          <ErrorNotice className="mb-3" message={`Couldn’t load customers. ${(error as Error).message}`} onRetry={() => refetch()} />
        ) : null}

        <DataTable
          caption="Customers"
          columns={columns}
          rows={data?.items}
          getRowId={(c) => c.id}
          onOpen={(c) => drawer.open(c.external_id)}
          selectedId={drawer.id !== null ? String(drawer.id) : null}
          loading={isPending}
          stale={isPlaceholderData}
          keyboard
          mobileRow={(c) => (
            <span className="flex flex-col gap-1">
              <span className="flex justify-between gap-3">
                <span className="truncate">{c.name || 'Unnamed customer'}</span>
                <span className="tnum font-medium">{formatMoney(c.total_spent)}</span>
              </span>
              <span className="flex justify-between gap-3 text-meta text-ink-3">
                <span className="truncate">{c.address?.city || (c.email ? maskEmail(c.email) : '')}</span>
                <span className="tnum">{formatNumber(c.order_count)} orders</span>
              </span>
            </span>
          )}
          empty={
            <EmptyState
              title={query ? `No customers match “${query}”.` : 'No customers yet.'}
              detail={query ? undefined : 'Customers appear once they create an account or place an order.'}
              action={query ? <Button onClick={clear}>Clear search</Button> : undefined}
            />
          }
        />

        {data && data.total > 0 ? (
          <Pagination page={page} perPage={PER_PAGE} total={data.total} onPage={(p) => url.set({ page: p > 1 ? p : null })} noun="customers">
            <p className="hidden text-meta text-ink-3 xl:block">
              <Kbd>j</Kbd> <Kbd>k</Kbd> move · <Kbd>↵</Kbd> open · <Kbd>/</Kbd> search
            </p>
          </Pagination>
        ) : null}
      </PageBody>
      <CustomerDrawer siblings={data?.items} />
    </>
  );
}
