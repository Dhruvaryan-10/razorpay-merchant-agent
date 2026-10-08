'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Drawer, DrawerSection } from '@/components/ui/Drawer';
import { StepButtons, useSiblingSteps } from '@/components/ui/DrawerStepper';
import { ErrorNotice } from '@/components/ui/EmptyState';
import { Kbd } from '@/components/ui/Kbd';
import { StockMeter } from '@/components/ui/Meter';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { StatusMark } from '@/components/ui/StatusMark';
import { Glyph } from '@/components/ui/glyphs';
import { useInventory, useProduct } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { useStore } from '@/hooks/useStore';
import { formatDate, formatMoney, formatNumber, stripHtml } from '@/lib/format';
import { duration } from '@/lib/motion';
import { stockStatus } from '@/lib/status';
import { adminProductUrl } from '@/lib/woocommerce';
import type { Product } from '@/types';
import { ProductImage } from './ProductImage';
import { PublishState } from './StockValue';

const productId = (p: Pick<Product, 'external_id'>) => p.external_id;

function stockSentence(product: Product, threshold: number) {
  const qty = product.stock_quantity ?? 0;
  switch (product.stock_level) {
    case 'out':
      return 'Out of stock. It can’t be sold until it’s restocked.';
    case 'low':
      return `${formatNumber(qty)} left, ${formatNumber(threshold - qty)} below the threshold of ${threshold}.`;
    case 'healthy':
      return `${formatNumber(qty)} in stock, at or above the threshold of ${threshold}.`;
    default:
      return 'Stock isn’t tracked for this product in WooCommerce.';
  }
}

/**
 * Read-only product detail driven by ?product=. Price, stock against the
 * shared threshold, categories, status and description. Edits happen in
 * WooCommerce, so the actions link there.
 */
export function ProductDrawer({ siblings = [] }: { siblings?: Product[] }) {
  const { store } = useStore();
  const { id, close, replace } = useRecordParam('product');
  const { data: detail, isPending, isError, error, refetch } = useProduct(id);
  const threshold = useInventory().data?.low_stock_threshold ?? 10;
  const steps = useSiblingSteps(siblings, id, productId, replace);
  const [copied, setCopied] = useState(false);

  const product: Product | undefined = detail ?? siblings.find((p) => p.external_id === id);
  const images = detail?.images ?? [];
  const heroSrc = images[0]?.src ?? product?.image ?? null;
  const wooUrl = id !== null ? adminProductUrl(store, id) : null;
  const storeUrl = store.mode === 'live' ? product?.permalink : null;
  const description = product?.description ? stripHtml(product.description) : '';

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
      label={product ? product.name : 'Product'}
      title={product ? <span className="truncate">{product.name}</span> : <Skeleton className="h-4 w-40" />}
      navigation={
        steps.active ? <StepButtons prev={steps.prev} next={steps.next} getId={productId} go={replace} noun="product" /> : null
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
              Edit in WooCommerce
              <Glyph name="external" size={12} />
            </a>
          ) : null}
          {storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-well px-3 text-cell font-medium text-ink hover:bg-line"
            >
              View in store
              <Glyph name="external" size={12} />
            </a>
          ) : null}
          <Button variant="quiet" onClick={copyLink}>
            <Glyph name="copy" size={12} />
            {copied ? 'Link copied' : 'Copy link'}
          </Button>
          {product ? (
            <Link
              href={`/app/agent?q=${encodeURIComponent(`Product ${product.name}`)}`}
              className="ml-auto text-cell text-accent hover:text-accent-strong"
            >
              Ask about this product
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
              <ErrorNotice message={`Couldn’t load this product. ${(error as Error).message}`} onRetry={() => refetch()} />
            </div>
          ) : null}

          <DrawerSection>
            {product ? (
              <>
                {heroSrc ? <ProductImage src={heroSrc} name={product.name} size="hero" className="mb-5" /> : null}
                {images.length > 1 ? (
                  <div className="-mt-3 mb-5 flex gap-2 overflow-x-auto">
                    {images.slice(1, 6).map((img) => (
                      <ProductImage key={img.src} src={img.src} name={product.name} size="thumb" className="h-12 w-12" />
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-4">
                  {/* Without a store image, a small neutral tile rather than a large empty frame. */}
                  {heroSrc ? null : <ProductImage src={null} name={product.name} size="thumb" className="h-14 w-14 text-[15px]" />}
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="tnum text-figure-l text-ink">{formatMoney(product.price)}</span>
                    {product.sku ? <span className="font-mono text-code text-ink-3">{product.sku}</span> : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14" />
                <Skeleton className="h-8 w-32" />
              </div>
            )}
          </DrawerSection>

          <DrawerSection title="Stock">
            {product ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <StatusMark kind={stockStatus(product.stock_level).mark} label={stockStatus(product.stock_level).label} />
                  {product.stock_level !== 'untracked' ? (
                    <span className="tnum text-figure-m text-ink">{formatNumber(product.stock_quantity ?? 0)}</span>
                  ) : null}
                </div>
                {product.stock_level !== 'untracked' ? (
                  <StockMeter
                    quantity={product.stock_quantity}
                    threshold={threshold}
                    level={product.stock_level}
                    className="mt-3"
                  />
                ) : null}
                <p className="mt-3 text-meta text-ink-3">{stockSentence(product, threshold)}</p>
              </>
            ) : (
              <SkeletonText lines={2} />
            )}
          </DrawerSection>

          <DrawerSection title="Details">
            {product ? (
              <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-2 text-cell">
                <dt className="text-ink-3">Status</dt>
                <dd>
                  <PublishState status={product.status} />
                </dd>
                <dt className="text-ink-3">Category</dt>
                <dd className="text-ink">{product.categories.length ? product.categories.map((c) => c.name).join(', ') : '—'}</dd>
                {product.created_at ? (
                  <>
                    <dt className="text-ink-3">Added</dt>
                    <dd className="tnum text-ink">{formatDate(product.created_at)}</dd>
                  </>
                ) : null}
              </dl>
            ) : isPending ? (
              <SkeletonText lines={3} />
            ) : null}
          </DrawerSection>

          {description ? (
            <DrawerSection title="Description">
              <p className="max-w-measure whitespace-pre-line text-cell text-ink-2">{description}</p>
            </DrawerSection>
          ) : null}

          <p className="px-5 py-4 text-meta text-ink-3">
            Prices and stock are edited in WooCommerce. This workspace reads your catalogue.
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
