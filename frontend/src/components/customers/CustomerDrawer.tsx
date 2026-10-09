'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';
import { StepButtons, useSiblingSteps } from '@/components/ui/DrawerStepper';
import { ErrorNotice } from '@/components/ui/EmptyState';
import { Kbd } from '@/components/ui/Kbd';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { Mark } from '@/components/ui/StatusMark';
import { Glyph } from '@/components/ui/glyphs';
import { useCustomer, useOrders } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { formatDate, formatDayMonth, formatMoney, formatNumber } from '@/lib/format';
import { duration } from '@/lib/motion';
import { orderStatus } from '@/lib/status';
import { adminCustomerUrl } from '@/lib/woocommerce';
import type { Customer } from '@/types';

const customerId = (c: Pick<Customer, 'external_id'>) => c.external_id;

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          // Clipboard blocked; the value is still visible.
        }
      }}
      className="group inline-flex items-center gap-1.5 text-left text-ink-2 hover:text-ink"
    >
      <span className="break-all">{value}</span>
      <span className="sr-only">, copy {label}</span>
      <span className="text-meta text-ink-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        {copied ? 'Copied' : <Glyph name="copy" size={11} />}
      </span>
    </button>
  );
}

/** Read-only customer detail (?customer=): contact, lifetime figures, order history. */
export function CustomerDrawer({ siblings = [] }: { siblings?: Customer[] }) {
  const { store } = useStore();
  const { id, close, replace } = useRecordParam('customer');
  const { data: detail, isError, error, refetch } = useCustomer(id);
  const orders = useOrders({ customer_id: id ?? undefined, per_page: 10 }, id !== null && id > 0);
  const steps = useSiblingSteps(siblings, id, customerId, replace);

  const customer = detail ?? siblings.find((c) => c.external_id === id);
  const address = customer?.address;
  const addressLines = address
    ? ([
        [address.address_1, address.address_2].filter(Boolean).join(', '),
        [address.city, address.state, address.postcode].filter(Boolean).join(' '),
        address.country,
      ].filter(Boolean) as string[])
    : [];
  const lastOrder = orders.data?.items[0];
  const wooUrl = id !== null ? adminCustomerUrl(store, id) : null;
  const firstName = customer?.name.split(' ')[0] ?? '';

  return (
    <Drawer
      open={id !== null}
      onOpenChange={(open) => !open && close()}
      label={customer?.name || 'Customer'}
      title={customer ? customer.name || 'Unnamed customer' : <Skeleton className="h-4 w-40" />}
      navigation={
        steps.active ? <StepButtons prev={steps.prev} next={steps.next} getId={customerId} go={replace} noun="customer" /> : null
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {wooUrl ? (
            <a
              href={wooUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-ink px-3 text-cell font-medium text-on-ink hover:bg-ink/85"
            >
              Open in WooCommerce
              <Glyph name="external" size={12} />
            </a>
          ) : null}
          {firstName ? (
            <Link
              href={`/app/agent?q=${encodeURIComponent(`Customer ${firstName}`)}`}
              className="ml-auto text-cell text-accent hover:text-accent-strong"
            >
              Ask about {firstName}
            </Link>
          ) : null}
        </div>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={id ?? 'none'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.instant }}
        >
          {isError ? (
            <div className="p-5">
              <ErrorNotice message={`Couldn’t load this customer. ${(error as Error).message}`} onRetry={() => refetch()} />
            </div>
          ) : null}

          <DrawerSection>
            {customer ? (
              <div className="flex flex-col gap-1 text-cell">
                {customer.email ? <CopyValue value={customer.email} label="email" /> : null}
                {customer.phone ? <CopyValue value={customer.phone} label="phone" /> : null}
                {customer.created_at ? <span className="text-meta text-ink-3">Customer since {formatDate(customer.created_at)}</span> : null}
              </div>
            ) : (
              <SkeletonText lines={2} />
            )}
          </DrawerSection>

          <DrawerSection>
            {customer ? (
              <dl className="grid grid-cols-3 divide-x divide-line">
                <div className="pr-4">
                  <dt className="text-meta text-ink-3">Orders</dt>
                  <dd className="tnum text-figure-m text-ink">{formatNumber(customer.order_count)}</dd>
                </div>
                <div className="px-4">
                  <dt className="text-meta text-ink-3">Lifetime value</dt>
                  <dd className="tnum text-figure-m text-ink">{formatMoney(customer.total_spent)}</dd>
                </div>
                <div className="pl-4">
                  <dt className="text-meta text-ink-3">Last order</dt>
                  <dd className="tnum text-figure-m text-ink">
                    {orders.isPending && id ? <Skeleton className="mt-1 h-5 w-16" /> : lastOrder ? formatDayMonth(lastOrder.created_at) : '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <Skeleton className="h-12 w-full" />
            )}
          </DrawerSection>

          <DrawerSection
            title="Orders"
            aside={
              orders.data && orders.data.total > orders.data.items.length ? (
                <span className="text-meta text-ink-3">Latest 10 of {formatNumber(orders.data.total)}</span>
              ) : null
            }
          >
            {orders.isPending && id ? (
              <SkeletonText lines={3} />
            ) : orders.data?.items.length ? (
              <ul>
                {orders.data.items.map((o) => {
                  const meta = orderStatus(o.status);
                  return (
                    <li key={o.id} className="border-b border-line last:border-b-0">
                      <Link
                        href={`/app/orders?order=${o.external_id}`}
                        className="tnum grid grid-cols-[10px_4.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2 text-cell hover:bg-well/60"
                      >
                        <Mark kind={meta.mark} />
                        <span className="font-mono text-code">#{o.order_number}</span>
                        <span className="truncate text-ink-2">
                          {formatDayMonth(o.created_at)} · {meta.label}
                        </span>
                        <span className={cn('text-right', meta.recedes ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>
                          {formatMoney(o.total, o.currency)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-cell text-ink-3">No orders linked to this customer.</p>
            )}
          </DrawerSection>

          {addressLines.length ? (
            <DrawerSection title="Billing address">
              <p className="text-cell text-ink-2">
                {addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </DrawerSection>
          ) : null}

          {steps.active ? (
            <p className="hidden px-5 py-4 text-meta text-ink-3 md:block">
              <Kbd>[</Kbd> <Kbd>]</Kbd> previous and next · <Kbd>esc</Kbd> close
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </Drawer>
  );
}
