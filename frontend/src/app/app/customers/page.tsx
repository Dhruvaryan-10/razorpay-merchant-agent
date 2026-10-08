import type { Metadata } from 'next';
import { LegacyCustomers } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Customers' };

export default function Page() {
  return <LegacyCustomers />;
}
