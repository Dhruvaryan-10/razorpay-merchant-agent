import type { AgentIntent } from '@/types';

/**
 * Mirrors the backend's intent patterns (backend/app/services/agent_service.py)
 * in the same order, so the composer can preview what will run before it runs.
 * The backend remains the source of truth; this only drives the preview.
 */
export interface ParsedIntent {
  intent: AgentIntent;
  chips: { k: string; v: string }[];
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function parseIntent(raw: string): ParsedIntent | null {
  const q = raw.toLowerCase().trim();
  if (!q) return null;
  let m: RegExpMatchArray | null;

  const amount =
    q.match(/pending\s+orders?\s+above\s+[$₹]?\s*([\d,]+)/) ||
    q.match(/find.*pending.*orders?.*[$₹]?\s*([\d,]+)/) ||
    q.match(/orders?\s+above\s+[$₹]?\s*([\d,]+).*pending/) ||
    q.match(/[$₹]?\s*([\d,]+).*pending\s+orders?/);
  if (amount) {
    const n = Number(amount[1].replace(/,/g, ''));
    if (Number.isFinite(n))
      return {
        intent: 'high_value_pending_orders',
        chips: [{ k: 'Orders', v: '' }, { k: 'status', v: 'pending' }, { k: 'amount ≥', v: money(n) }],
      };
  }
  if (/pending\s+orders|find.*pending.*orders|show.*pending.*orders/.test(q))
    return { intent: 'pending_orders', chips: [{ k: 'Orders', v: '' }, { k: 'status', v: 'pending' }] };
  if (/low[\s-]+stock|low\s+inventory/.test(q))
    return { intent: 'low_stock_products', chips: [{ k: 'Products', v: '' }, { k: 'stock', v: 'below threshold' }] };
  if (/out\s+of\s+stock|out-of-stock|unavailable\s+products?/.test(q))
    return { intent: 'out_of_stock', chips: [{ k: 'Products', v: '' }, { k: 'stock', v: 'out' }] };
  if (/recent\s+customers|new\s+customers|latest\s+customers/.test(q))
    return { intent: 'recent_customers', chips: [{ k: 'Customers', v: '' }, { k: 'sort', v: 'newest' }] };
  if ((m = q.match(/order\s+#?(\d+)/))) return { intent: 'search_order_by_number', chips: [{ k: 'Order', v: `#${m[1]}` }] };
  if ((m = q.match(/product\s+(.+)/)))
    return { intent: 'search_product', chips: [{ k: 'Products', v: '' }, { k: 'name ~', v: m[1].trim() }] };
  if ((m = q.match(/customer\s+(.+)/)))
    return { intent: 'search_customer', chips: [{ k: 'Customers', v: '' }, { k: 'name ~', v: m[1].trim() }] };
  if (/today['’]?s?\s+sales|sales\s+today/.test(q))
    return { intent: 'todays_sales', chips: [{ k: 'Sales', v: '' }, { k: 'period', v: 'today' }] };
  return null;
}

/** Supported questions, grouped. Bracketed parts are examples to edit. */
export const CAPABILITIES: { group: string; items: string[] }[] = [
  { group: 'Orders', items: ['Find pending orders', 'Pending orders above ₹2,000', 'Order #1010', 'Today’s sales'] },
  { group: 'Inventory', items: ['Show low-stock products', 'Out of stock items'] },
  { group: 'Products', items: ['Product Mouse'] },
  { group: 'Customers', items: ['Recent customers', 'Customer Rahul'] },
];

export const agentHref = (query: string) => `/app/agent?q=${encodeURIComponent(query)}`;
