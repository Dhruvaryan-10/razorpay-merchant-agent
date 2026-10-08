import type { Dashboard, PeriodKey } from '@/types';
import { formatAge, formatMoney, plural } from './format';
import type { MarkKind } from './status';

export const PERIODS: { value: PeriodKey; label: string; word: string }[] = [
  { value: 'today', label: 'Today', word: 'this time yesterday' },
  { value: '7d', label: '7D', word: 'the previous 7 days' },
  { value: '30d', label: '30D', word: 'the previous 30 days' },
  { value: '90d', label: '90D', word: 'the previous 90 days' },
];

export function parsePeriod(value: string | null | undefined): PeriodKey {
  return PERIODS.some((p) => p.value === value) ? (value as PeriodKey) : '30d';
}

const REVENUE_STATUSES = new Set(['processing', 'on-hold', 'completed']);

/** "18 paid orders. Excludes 6 pending (₹48,210) and 4 cancelled (₹38,950)." */
export function revenueDefinition(data: Dashboard) {
  const { current, status_breakdown } = data.period;
  const excluded = status_breakdown
    .filter((s) => !REVENUE_STATUSES.has(s.status) && s.count > 0)
    .sort((a, b) => b.value - a.value)
    .map((s) => `${s.count} ${s.status.replace(/-/g, ' ')} (${formatMoney(s.value)})`);
  const paid = `${plural(current.paid_orders, 'paid order')}.`;
  if (!excluded.length) return paid;
  const list =
    excluded.length === 1 ? excluded[0] : `${excluded.slice(0, -1).join(', ')} and ${excluded[excluded.length - 1]}`;
  return `${paid} Excludes ${list}.`;
}

export interface AttentionItem {
  key: string;
  mark: MarkKind;
  title: string;
  detail: string;
  action: string;
  href: string;
}

/**
 * The attention queue, ranked by money at risk: open pending orders first,
 * then out-of-stock products (most unmet demand first), then low stock.
 * Every line is built from the dashboard response; nothing is inferred.
 */
export function attentionItems(data: Dashboard, limit = 5): AttentionItem[] {
  const items: AttentionItem[] = [];
  const { pending, inventory } = data;

  if (pending.count > 0) {
    const oldest = pending.oldest;
    items.push({
      key: 'pending',
      mark: 'hollow-caution',
      title: `${plural(pending.count, 'pending order')} awaiting payment`,
      detail: oldest
        ? `${formatMoney(pending.value)} on hold. The oldest, #${oldest.order_number}, was placed ${formatAge(oldest.created_at)} ago.`
        : `${formatMoney(pending.value)} on hold.`,
      action: 'Review',
      href: '/app/orders?status=pending',
    });
  }

  const out = inventory.at_risk.filter((p) => p.stock_level === 'out');
  const low = inventory.at_risk.filter((p) => p.stock_level === 'low');

  out.forEach((p) =>
    items.push({
      key: `out-${p.id}`,
      mark: 'diamond',
      title: `${p.name} is out of stock`,
      detail: [
        p.sku,
        formatMoney(p.price),
        p.pending_orders ? `in ${plural(p.pending_orders, 'pending order')}` : 'no open orders',
      ]
        .filter(Boolean)
        .join(' · '),
      action: 'View',
      href: `/app/inventory?product=${p.id}`,
    })
  );

  low.forEach((p) =>
    items.push({
      key: `low-${p.id}`,
      mark: 'hollow-caution',
      title: `${p.name} is down to ${plural(p.stock_quantity ?? 0, 'unit')}`,
      detail: [p.sku, `threshold ${inventory.threshold}`, p.pending_units ? `${p.pending_units} in pending orders` : '']
        .filter(Boolean)
        .join(' · '),
      action: 'View',
      href: `/app/inventory?product=${p.id}`,
    })
  );

  const atRiskTotal = inventory.low + inventory.out;
  if (items.length > limit) {
    const shown = items.slice(0, limit - 1);
    const hiddenProducts = atRiskTotal - shown.filter((i) => i.key !== 'pending').length;
    shown.push({
      key: 'more',
      mark: 'hollow-caution',
      title: `${plural(hiddenProducts, 'more product')} need${hiddenProducts === 1 ? 's' : ''} restocking`,
      detail: `Below the threshold of ${inventory.threshold} or out of stock.`,
      action: 'Inventory',
      href: '/app/inventory',
    });
    return shown;
  }
  return items;
}
