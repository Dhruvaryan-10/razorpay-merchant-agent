'use client';

import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { ErrorNotice } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDashboard } from '@/hooks/queries';
import { useRecordParam } from '@/hooks/useRecordParam';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { useUrlState } from '@/hooks/useUrlState';
import { PERIODS, parsePeriod } from '@/lib/dashboard';
import { formatToday } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PeriodKey } from '@/types';
import { AskField } from './AskField';
import { AttentionQueue } from './AttentionQueue';
import { FigureStrip } from './FigureStrip';
import { InventoryHealth } from './InventoryHealth';
import { LatestOrders } from './LatestOrders';
import { OrderPipeline } from './OrderPipeline';
import { RevenuePanel } from './RevenuePanel';

function OverviewSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-14">
      <div className="grid gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-12 w-64" />
          <Skeleton className="mt-3 h-3 w-80" />
          <Skeleton className="mt-8 h-[200px] w-full" />
        </div>
        <div className="border-t-2 border-line pt-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="mt-5 h-8 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function OverviewView() {
  const orderDrawer = useRecordParam('order');
  const url = useUrlState();
  const period = parsePeriod(url.get('period'));
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useDashboard(period);

  return (
    <>
      <PageHeader
        title="Overview"
        meta={formatToday()}
        actions={
          <Segmented<PeriodKey>
            label="Period"
            options={PERIODS.map(({ value, label }) => ({ value, label }))}
            value={period}
            onChange={(value) => url.set({ period: value === '30d' ? null : value }, { replace: true })}
          />
        }
      />
      <PageBody>
        {isError ? (
          <ErrorNotice
            className="mb-8"
            message={`Couldn’t load the overview. ${(error as Error).message}`}
            onRetry={() => refetch()}
          />
        ) : null}

        {isPending ? (
          <OverviewSkeleton />
        ) : data ? (
          <div className={cn('flex flex-col gap-14 transition-opacity duration-quick', isPlaceholderData && 'opacity-60')}>
            {/* Band 1: revenue (2/3) and attention (1/3). Below xl attention leads. */}
            <div className="grid gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-14">
              <div className="order-2 xl:order-1">
                <RevenuePanel data={data} />
              </div>
              <div className="order-1 xl:order-2">
                <AttentionQueue data={data} />
              </div>
            </div>

            <FigureStrip data={data} />

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
              <OrderPipeline data={data} />
              <InventoryHealth data={data} />
            </div>

            <div className="grid gap-12 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-14">
              <LatestOrders
                orders={data.recent_orders}
                onOpen={(order) => orderDrawer.open(order.external_id)}
                selectedId={orderDrawer.id !== null ? String(orderDrawer.id) : null}
              />
              <AskField />
            </div>
          </div>
        ) : null}
      </PageBody>
      <OrderDrawer siblings={data?.recent_orders} />
    </>
  );
}
