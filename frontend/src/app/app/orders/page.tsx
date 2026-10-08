import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OrdersView } from '@/components/orders/OrdersView';

export const metadata: Metadata = { title: 'Orders' };

export default function Page() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
