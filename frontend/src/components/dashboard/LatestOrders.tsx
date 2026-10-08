'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusMark } from '@/components/ui/StatusMark';
import { formatMoney, formatWhen } from '@/lib/format';
import { orderStatus } from '@/lib/status';
import { cn } from '@/lib/cn';
import type { Order } from '@/types';

export function LatestOrders({
  orders,
  onOpen,
  selectedId,
}: {
  orders: Order[];
  onOpen: (order: Order) => void;
  selectedId?: string | null;
}) {
  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      cell: (o) => <span className="font-mono text-code">#{o.order_number}</span>,
      skeletonWidth: 'w-12',
    },
    { key: 'customer', header: 'Customer', cell: (o) => o.customer_name || 'Guest' },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
      cell: (o) => {
        const meta = orderStatus(o.status);
        return <StatusMark kind={meta.mark} label={meta.label} muted={meta.recedes} />;
      },
    },
    { key: 'placed', header: 'Placed', hideBelow: 'xl', cell: (o) => <span className="tnum text-ink-2">{formatWhen(o.created_at)}</span> },
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
  ];

  return (
    <section aria-labelledby="latest-heading" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="latest-heading" className="text-heading text-ink">
          Latest orders
        </h2>
        <Link href="/app/orders" className="text-meta text-accent hover:text-accent-strong">
          Open Orders
        </Link>
      </div>
      <DataTable
        caption="Latest orders"
        columns={columns}
        rows={orders}
        getRowId={(o) => o.id}
        onOpen={onOpen}
        selectedId={selectedId}
        rowMuted={(o) => !!orderStatus(o.status).recedes}
        empty={<p className="py-6 text-cell text-ink-3">No orders yet.</p>}
        mobileRow={(o) => {
          const meta = orderStatus(o.status);
          return (
            <span className="flex flex-col gap-1">
              <span className="flex justify-between gap-3">
                <span className="font-mono text-code">#{o.order_number}</span>
                <span className="tnum font-medium">{formatMoney(o.total, o.currency)}</span>
              </span>
              <span className="flex justify-between gap-3 text-meta text-ink-2">
                <span className="truncate">{o.customer_name || 'Guest'}</span>
                <StatusMark kind={meta.mark} label={meta.label} muted={meta.recedes} />
              </span>
            </span>
          );
        }}
      />
    </section>
  );
}
