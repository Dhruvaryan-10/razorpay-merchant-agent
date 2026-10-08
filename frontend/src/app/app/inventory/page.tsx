import type { Metadata } from 'next';
import { LegacyInventory } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Inventory' };

export default function Page() {
  return <LegacyInventory />;
}
