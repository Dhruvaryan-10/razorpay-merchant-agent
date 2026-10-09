import type { OrderStatus, StockLevel } from '@/types';

/**
 * Status language. A status is always a mark plus a word, never colour alone,
 * and the mark shapes differ so states survive colour blindness and greyscale.
 */
export type MarkKind = 'hollow-caution' | 'solid-accent' | 'solid-positive' | 'dash' | 'diamond' | 'hollow-neutral';

export interface StatusMeta {
  label: string;
  mark: MarkKind;
  /** Cancelled-like states recede: grey text, struck amount. */
  recedes?: boolean;
}

const ORDER_STATUS: Record<string, StatusMeta> = {
  pending: { label: 'Pending', mark: 'hollow-caution' },
  'on-hold': { label: 'On hold', mark: 'hollow-caution' },
  processing: { label: 'Processing', mark: 'solid-accent' },
  completed: { label: 'Completed', mark: 'solid-positive' },
  cancelled: { label: 'Cancelled', mark: 'dash', recedes: true },
  refunded: { label: 'Refunded', mark: 'dash', recedes: true },
  failed: { label: 'Failed', mark: 'diamond' },
  'checkout-draft': { label: 'Draft', mark: 'hollow-neutral', recedes: true },
};

export function orderStatus(status: OrderStatus): StatusMeta {
  return (
    ORDER_STATUS[status] ?? {
      label: status ? status[0].toUpperCase() + status.slice(1).replace(/-/g, ' ') : 'Unknown',
      mark: 'hollow-neutral',
    }
  );
}

/** Statuses offered as tabs, in the order the work flows. */
export const ORDER_STATUS_TABS = ['pending', 'processing', 'on-hold', 'completed', 'cancelled'] as const;

const STOCK: Record<StockLevel, StatusMeta & { short: string }> = {
  out: { label: 'Out of stock', short: 'Out', mark: 'diamond' },
  low: { label: 'Low stock', short: 'Low', mark: 'hollow-caution' },
  healthy: { label: 'In stock', short: 'Healthy', mark: 'solid-positive' },
  untracked: { label: 'Not tracked', short: 'Untracked', mark: 'hollow-neutral' },
};

export function stockStatus(level: StockLevel) {
  return STOCK[level] ?? STOCK.untracked;
}

/** Payment method codes WooCommerce commonly returns, when no title is given. */
export function paymentLabel(method: string, title?: string) {
  if (title) return title;
  const known: Record<string, string> = {
    upi: 'UPI',
    credit_card: 'Card',
    bank_transfer: 'Bank transfer',
    bacs: 'Bank transfer',
    cod: 'Cash on delivery',
    razorpay: 'Razorpay',
  };
  return known[method] ?? (method ? method.replace(/_/g, ' ') : '—');
}
