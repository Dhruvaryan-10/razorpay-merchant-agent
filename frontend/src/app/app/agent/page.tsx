import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AgentView } from '@/components/agent/AgentView';

export const metadata: Metadata = { title: 'Agent' };

export default function Page() {
  return (
    <Suspense>
      <AgentView />
    </Suspense>
  );
}
