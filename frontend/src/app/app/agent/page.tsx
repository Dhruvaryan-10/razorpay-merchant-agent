import type { Metadata } from 'next';
import { LegacyAgent } from '@/components/legacy/LegacyRoutes';

export const metadata: Metadata = { title: 'Agent' };

export default function Page() {
  return <LegacyAgent />;
}
