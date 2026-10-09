import { AnimatedNumber, Delta } from '@/components/ui/Figure';
import { formatMoneyWhole, formatNumber, formatPercent, percentChange, plural } from '@/lib/format';
import type { Dashboard } from '@/types';

function Item({
  label,
  value,
  format,
  delta,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  delta: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-4 sm:px-6 sm:first:pl-0">
      <dt className="text-meta text-ink-3">{label}</dt>
      <dd className="text-figure-m text-ink">
        <AnimatedNumber value={value} format={format} />
      </dd>
      <dd>{delta}</dd>
    </div>
  );
}

/** Four secondary figures in one ruled row. No boxes. */
export function FigureStrip({ data }: { data: Dashboard }) {
  const { current, previous } = data.period;
  const change = (a: number, b: number) => (
    <Delta value={percentChange(a, b)} format={(n) => `${formatPercent(n).replace(/^[+−]/, '')} vs previous`} />
  );

  return (
    <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-line">
      <Item label="Orders" value={current.orders} format={formatNumber} delta={change(current.orders, previous.orders)} />
      <Item
        label="Average order"
        value={current.average_order}
        format={formatMoneyWhole}
        delta={change(current.average_order, previous.average_order)}
      />
      <Item
        label="Items sold"
        value={current.items_sold}
        format={formatNumber}
        delta={change(current.items_sold, previous.items_sold)}
      />
      <Item
        label="Customers"
        value={data.metrics.total_customers}
        format={formatNumber}
        delta={<span className="tnum text-meta text-ink-3">{plural(current.unique_buyers, 'buyer')} this period</span>}
      />
    </dl>
  );
}
