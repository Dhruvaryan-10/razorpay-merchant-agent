import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CustomersView } from '@/components/customers/CustomersView';

export const metadata: Metadata = { title: 'Customers' };

export default function Page() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  );
}
