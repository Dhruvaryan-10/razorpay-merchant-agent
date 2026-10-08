'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';
import { StepButtons, useSiblingSteps } from '@/components/ui/DrawerStepper';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/EmptyState';
import { Kbd } from '@/components/ui/Kbd';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { StatusMark } from '@/components/ui/StatusMark';
import { Glyph } from '@/components/ui/glyphs';
import { useCustomer, useOrder } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useStore } from '@/hooks/useStore';
import { formatDateTime, formatMoney, plural } from '@/lib/format';
import { duration } from '@/lib/motion';
import { orderStatus, paymentLabel } from '@/lib/status';
import { adminOrderUrl } from '@/lib/woocommerce';
import type { Address, Order } from '@/types';

const orderId = (o: Order) => o.external_id;

function addressLines(address: Address | undefined) {
  if (!address) return [];
  return [
    [address.address_1, address.address_2].filter(Boolean).join(', '),
    [address.city, address.state, address.postcode].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean) as string[];
}

function CustomerSummary({ customerId }: { customerId: number }) {
  const { data, isPending } = useCustomer(customerId);
  if (isPending) return <Skeleton className="mt-2 h-3 w-56" />;
  if (!data) return null;
  return (
    <p className="tnum mt-1 text-meta text-ink-3">
      {plural(data.order_count, 'order')} · {formatMoney(data.total_spent)} spent
    </p>
  );
}

/**
 * Read-only order detail. Status changes happen in WooCommerce, so the
 * drawer offers only what the workspace can actually do.
 * `siblings` enables previous/next ( [ and ] ) through the list it came from.
 */
export function OrderDrawer({ siblings = [] }: { siblings?: Order[] }) {
  const { store } = useStore();
  const { id, close, replace } = useRecordParam('order');
  const { data: order, isPending, isError, error, refetch } = useOrder(id);
  const [copied, setCopied] = useState(false);

  const fromList = siblings.find((o) => o.external_id === id);
  const head = order ?? fromList;
  const steps = useSiblingSteps(siblings, id, orderId, replace);

  const meta = head ? orderStatus(head.status) : null;
  const wooUrl = id !== null ? adminOrderUrl(store, id) : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the URL bar still holds the link.
    }
  };

  return (
    <Drawer
      open={id !== null}
      onOpenChange={(open) => !open && close()}
      label={`Order ${head?.order_number ?? id ?? ''}`}
      title={
        <span className="font-mono text-[14px]">
          Order #{head?.order_number ?? id}
        </span>
      }
      navigation={
        steps.active ? (
          <StepButtons prev={steps.prev} next={steps.next} getId={orderId} go={replace} noun="order" />
        ) : null
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {wooUrl ? (
            <a href={wooUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-ink px-3 text-cell font-medium text-on-ink hover:bg-ink/85">
              Open in WooCommerce
              <Glyph name="external" size={12} />
            </a>
          ) : null}
          <Button variant="quiet" onClick={copyLink}>
            <Glyph name="copy" size={12} />
            {copied ? 'Link copied' : 'Copy link'}
          </Button>
          {head ? (
            <Link
              href={`/app/agent?q=${encodeURIComponent(`Order #${head.order_number}`)}`}
              className="ml-auto text-cell text-accent hover:text-accent-strong"
            >
              Ask about this order
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
              <ErrorNotice message={`Couldn’t load this order. ${(error as Error).message}`} onRetry={() => refetch()} />
            </div>
          ) : null}

          <DrawerSection>
            {head && meta ? (
              <>
                <div className={`tnum text-figure-l ${meta.recedes ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink'}`}>
                  {formatMoney(head.total, head.currency)}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-cell">
                  <StatusMark kind={meta.mark} label={meta.label} />
                  <span className="tnum text-ink-2">{formatDateTime(head.created_at)}</span>
                  <span className="text-ink-2">{paymentLabel(head.payment_method, head.payment_method_title)}</span>
                </div>
              </>
            ) : (
              <>
                <Skeleton className="h-8 w-40" />
                <Skeleton className="mt-3 h-3 w-64" />
              </>
            )}
          </DrawerSection>

          <DrawerSection title="Items" aside={order ? <span className="tnum text-meta text-ink-3">{plural(order.line_items.reduce((n, i) => n + i.quantity, 0), 'unit')}</span> : null}>
            {isPending ? (
              <SkeletonText lines={3} />
            ) : order ? (
              <>
                <ul>
                  {order.line_items.map((item, i) => (
                    <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 border-b border-line py-2 text-cell last:border-b-0">
                      <span className="min-w-0">
                        <span className="text-ink">{item.name}</span>
                        {item.sku ? <span className="ml-2 font-mono text-[11.5px] text-ink-3">{item.sku}</span> : null}
                      </span>
                      <span className="tnum text-ink-3">×{item.quantity}</span>
                      <span className="tnum w-20 text-right text-ink">{formatMoney(item.total || item.price * item.quantity, order.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="tnum mt-2 flex justify-between border-t border-line-strong pt-2 text-cell font-medium">
                  <span>Total</span>
                  <span>{formatMoney(order.total, order.currency)}</span>
                </div>
              </>
            ) : null}
          </DrawerSection>

          <DrawerSection
            title="Customer"
            aside={
              head?.customer_id ? (
                <Link href={`/app/customers?customer=${head.customer_id}`} className="text-meta text-accent hover:text-accent-strong">
                  Profile
                </Link>
              ) : null
            }
          >
            {head ? (
              <div className="text-cell">
                <p className="text-ink">{head.customer_name || 'Guest checkout'}</p>
                {head.customer_email ? <p className="text-ink-2">{head.customer_email}</p> : null}
                {head.customer_id ? <CustomerSummary customerId={head.customer_id} /> : null}
                {order ? (
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      ['Billing', order.billing_address],
                      ['Shipping', order.shipping_address],
                    ].map(([label, address]) => {
                      const lines = addressLines(address as Address);
                      return (
                        <div key={label as string}>
                          <dt className="text-meta text-ink-3">{label as string}</dt>
                          <dd className="mt-1 text-ink-2">
                            {lines.length ? lines.map((l) => <span key={l} className="block">{l}</span>) : 'Not provided'}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : null}
              </div>
            ) : (
              <SkeletonText lines={2} />
            )}
          </DrawerSection>

          <p className="px-5 py-4 text-meta text-ink-3">
            Status changes are made in WooCommerce. This workspace reads your store and doesn’t offer actions it can’t perform.
          </p>
          {steps.active ? (
            <p className="hidden px-5 pb-5 text-meta text-ink-3 md:block">
              <Kbd>[</Kbd> <Kbd>]</Kbd> previous and next · <Kbd>esc</Kbd> close
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </Drawer>
  );
}
