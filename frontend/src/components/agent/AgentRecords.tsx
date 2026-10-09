'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StockValue } from '@/components/products/StockValue';
import { AnimatedNumber, Delta } from '@/components/ui/Figure';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusMark } from '@/components/ui/StatusMark';
import { useCustomers, useDashboard, useOrder, useOrders, useProducts } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { cn } from '@/lib/cn';
import { formatMoney, formatMoneyWhole, formatNumber, formatPercent, formatWhen, percentChange, plural } from '@/lib/format';
import { duration } from '@/lib/motion';
import { orderStatus } from '@/lib/status';
import type { AgentResponse, Customer, Order, Product } from '@/types';

const orderColumns: Column<Order>[] = [
  { key: 'no', header: 'Order', cell: (o) => <span className="font-mono text-code">#{o.order_number}</span>, skeletonWidth: 'w-12' },
  { key: 'customer', header: 'Customer', cell: (o) => <span className="block max-w-[200px] truncate">{o.customer_name || 'Guest'}</span> },
  { key: 'placed', header: 'Placed', hideBelow: 'md', cell: (o) => <span className="tnum text-ink-2">{formatWhen(o.created_at)}</span> },
  {
    key: 'status',
    header: 'Status',
    hideBelow: 'lg',
    cell: (o) => {
      const m = orderStatus(o.status);
      return <StatusMark kind={m.mark} label={m.label} muted={m.recedes} />;
    },
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (o) => <span className={cn('tnum font-medium', orderStatus(o.status).recedes && 'text-ink-3 line-through')}>{formatMoney(o.total, o.currency)}</span>,
  },
];

const productColumns: Column<Product>[] = [
  {
    key: 'name',
    header: 'Product',
    cell: (p) => (
      <span className="block truncate">
        {p.name} {p.sku ? <span className="font-mono text-[11.5px] text-ink-3">{p.sku}</span> : null}
      </span>
    ),
  },
  { key: 'price', header: 'Price', align: 'right', hideBelow: 'md', cell: (p) => <span className="tnum">{formatMoney(p.price)}</span> },
  { key: 'stock', header: 'Stock', align: 'right', cell: (p) => <StockValue product={p} /> },
];

const customerColumns: Column<Customer>[] = [
  { key: 'name', header: 'Customer', cell: (c) => c.name || 'Unnamed customer' },
  { key: 'city', header: 'City', hideBelow: 'md', cell: (c) => <span className="text-ink-2">{c.address?.city || '—'}</span> },
  { key: 'orders', header: 'Orders', align: 'right', cell: (c) => <span className="tnum text-ink-2">{formatNumber(c.order_count)}</span> },
  { key: 'ltv', header: 'Lifetime value', align: 'right', cell: (c) => <span className="tnum font-medium">{formatMoney(c.total_spent)}</span> },
];

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.quick, delay: 0.08 }}>
      {children}
    </motion.div>
  );
}

function Footer({ href, label, shown, total }: { href: string; label: string; shown?: number; total?: number }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-meta text-ink-3">
      <span>{shown !== undefined && total !== undefined && total > shown ? `Showing ${shown} of ${formatNumber(total)}` : ''}</span>
      <Link href={href} className="text-cell text-accent hover:text-accent-strong">
        {label}
      </Link>
    </div>
  );
}

function OrdersRecords({ minTotal }: { minTotal?: number }) {
  const drawer = useRecordParam('order');
  const { data, isPending } = useOrders({ status: 'pending', min_total: minTotal, per_page: 10 });
  const href = `/app/orders?status=pending${minTotal ? `&min=${minTotal}` : ''}`;
  return (
    <Reveal>
      <DataTable
        caption="Matching orders"
        columns={orderColumns}
        rows={data?.items}
        loading={isPending}
        skeletonRows={4}
        getRowId={(o) => o.id}
        onOpen={(o) => drawer.open(o.external_id)}
        empty={<p className="py-3 text-cell text-ink-3">No matching orders.</p>}
      />
      <Footer href={href} label="Open in Orders" shown={data?.items.length} total={data?.total} />
    </Reveal>
  );
}

function ProductRecords({ stock, search }: { stock?: 'low' | 'out'; search?: string }) {
  const drawer = useRecordParam('product');
  const { data, isPending } = useProducts({ stock_status: stock, search, per_page: 10 });
  const href = stock ? `/app/products?stock=${stock}` : `/app/products?q=${encodeURIComponent(search ?? '')}`;
  return (
    <Reveal>
      <DataTable
        caption="Matching products"
        columns={productColumns}
        rows={data?.items}
        loading={isPending}
        skeletonRows={3}
        getRowId={(p) => p.id}
        onOpen={(p) => drawer.open(p.external_id)}
        empty={<p className="py-3 text-cell text-ink-3">No matching products.</p>}
      />
      <Footer href={href} label={stock ? 'Open in Products' : 'Search in Products'} shown={data?.items.length} total={data?.total} />
    </Reveal>
  );
}

function CustomerRecords({ search, recent }: { search?: string; recent?: boolean }) {
  const drawer = useRecordParam('customer');
  // "Recent" mirrors the agent: newest join dates first, from the first 100 customers.
  const { data, isPending } = useCustomers({ search, per_page: recent ? 100 : 10 });
  const rows = recent
    ? [...(data?.items ?? [])]
        .filter((c) => c.created_at)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, 10)
    : data?.items;
  return (
    <Reveal>
      <DataTable
        caption="Matching customers"
        columns={customerColumns}
        rows={isPending ? undefined : rows}
        loading={isPending}
        skeletonRows={3}
        getRowId={(c) => c.id}
        onOpen={(c) => drawer.open(c.external_id)}
        empty={<p className="py-3 text-cell text-ink-3">No matching customers.</p>}
      />
      <Footer
        href={search ? `/app/customers?q=${encodeURIComponent(search)}` : '/app/customers'}
        label="Open in Customers"
        shown={recent ? undefined : data?.items.length}
        total={recent ? undefined : data?.total}
      />
    </Reveal>
  );
}

function OrderRecord({ orderId }: { orderId: number }) {
  const drawer = useRecordParam('order');
  const { data, isPending, isError } = useOrder(orderId);
  if (isPending) return <Skeleton className="h-11 w-full" />;
  if (isError || !data) return null;
  const meta = orderStatus(data.status);
  return (
    <Reveal>
      <button
        type="button"
        onClick={() => drawer.open(data.external_id)}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-y border-line py-3 text-left text-cell hover:bg-well/60"
      >
        <span className="font-mono text-code">#{data.order_number}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <span className="truncate">{data.customer_name || 'Guest'}</span>
          <StatusMark kind={meta.mark} label={meta.label} muted={meta.recedes} />
          <span className="tnum text-ink-3">{formatWhen(data.created_at)}</span>
        </span>
        <span className="tnum font-medium">{formatMoney(data.total, data.currency)}</span>
      </button>
    </Reveal>
  );
}

function SalesSummary() {
  const { data, isPending } = useDashboard('today');
  if (isPending || !data) return <Skeleton className="h-16 w-72" />;
  const { current, previous } = data.period;
  return (
    <Reveal>
      <div className="flex flex-wrap items-end gap-x-12 gap-y-4">
        <div>
          <AnimatedNumber value={current.net_revenue} format={formatMoneyWhole} className="text-figure-l text-ink" />
          <div className="text-meta text-ink-3">Net revenue today, paid orders only</div>
        </div>
        <div>
          <div className="tnum text-figure-m text-ink">{formatNumber(current.orders)}</div>
          <div className="text-meta text-ink-3">{plural(current.paid_orders, 'paid order')} of {formatNumber(current.orders)} placed</div>
        </div>
        <div>
          <Delta
            value={percentChange(current.net_revenue, previous.net_revenue)}
            format={(n) => `${formatPercent(n).replace(/^[+−]/, '')} vs this time yesterday`}
            className="text-cell"
          />
          <div className="tnum text-meta text-ink-3">Yesterday by now {formatMoney(previous.net_revenue)}</div>
        </div>
      </div>
      <Footer href="/app?period=today" label="Open today in Overview" />
    </Reveal>
  );
}

/** The records behind an answer, fetched through the same endpoints the workspaces use. */
export function AgentRecords({ response }: { response: AgentResponse }) {
  const p = response.params;
  switch (response.intent) {
    case 'pending_orders':
      return <OrdersRecords />;
    case 'high_value_pending_orders':
      return <OrdersRecords minTotal={Number(p.amount_threshold) || undefined} />;
    case 'low_stock_products':
      return <ProductRecords stock="low" />;
    case 'out_of_stock':
      return <ProductRecords stock="out" />;
    case 'search_product':
      return <ProductRecords search={String(p.query ?? '')} />;
    case 'recent_customers':
      return <CustomerRecords recent />;
    case 'search_customer':
      return <CustomerRecords search={String(p.query ?? '')} />;
    case 'search_order_by_number':
      return response.tools[0]?.output?.found ? <OrderRecord orderId={Number(p.order_id)} /> : null;
    case 'todays_sales':
      return <SalesSummary />;
    default:
      return null;
  }
}
