import type { Metadata } from 'next';
import { LegacyOrders } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Orders' };

export default function Page() {
  return <LegacyOrders />;
}
