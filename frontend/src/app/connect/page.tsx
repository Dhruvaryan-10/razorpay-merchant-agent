import type { Metadata } from 'next';
import { ConnectionView } from '@/components/connection/ConnectionView';

export const metadata: Metadata = { title: 'Connect your store' };

export default function ConnectPage() {
  return <ConnectionView />;
}
