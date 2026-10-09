import { AnimatedNumber, Delta } from '@/components/ui/Figure';
import { formatMoney, formatMoneyWhole, formatPercent, percentChange } from '@/lib/format';
import { revenueDefinition, PERIODS } from '@/lib/dashboard';
import type { Dashboard } from '@/types';
import { RevenueChart } from './RevenueChart';

/** The one figure-xl on the page: net revenue, its change and its definition. */
export function RevenuePanel({ data }: { data: Dashboard }) {
  const { current, previous, key } = data.period;
  const change = percentChange(current.net_revenue, previous.net_revenue);
  const comparedTo = PERIODS.find((p) => p.value === key)?.word ?? 'the previous period';
  const hasRevenue = data.period.series.some((p) => p.revenue > 0);

  return (
    <section aria-labelledby="revenue-heading" className="min-w-0">
      <h2 id="revenue-heading" className="text-cell text-ink-2">
        Net revenue
      </h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <AnimatedNumber value={current.net_revenue} format={formatMoneyWhole} className="text-figure-l text-ink sm:text-figure-xl" />
        <span className="flex flex-wrap items-baseline gap-x-2">
          <Delta value={change} format={(n) => formatPercent(n).replace(/^[+−]/, '')} className="text-cell" />
          {change !== null ? (
            <span className="tnum text-meta text-ink-3">
              from {formatMoney(previous.net_revenue)} in {comparedTo}
            </span>
          ) : null}
        </span>
      </div>
      <p className="mt-2 max-w-measure text-meta text-ink-3">{revenueDefinition(data)}</p>

      <div className="mt-8">
        {hasRevenue || data.period.series.some((p) => p.prev_revenue > 0) ? (
          <RevenueChart series={data.period.series} hourly={key === 'today'} />
        ) : (
          <p className="border-y border-line py-16 text-cell text-ink-3">
            No paid orders in this period yet, so there is no trend to draw.
          </p>
        )}
      </div>
    </section>
  );
}
