import type { Metadata } from 'next';
import { LegacyOverview } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Overview' };

export default function Page() {
  return <LegacyOverview />;
}
