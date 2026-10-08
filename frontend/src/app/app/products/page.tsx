import type { Metadata } from 'next';
import { LegacyProducts } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Products' };

export default function Page() {
  return <LegacyProducts />;
}
