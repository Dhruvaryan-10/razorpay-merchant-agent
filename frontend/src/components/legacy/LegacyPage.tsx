'use client';

// Transitional: hosts a pre-Ledger page body inside the new shell until that
// page is rebuilt. Delete with AppLayout.tsx.
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { useStore } from '@/hooks/useStore';
import type { Store } from '@/types';

export function LegacyPage({ title, render }: { title: string; render: (store: Store) => React.ReactNode }) {
  const { store } = useStore();
  return (
    <>
      <PageHeader title={title} />
      <PageBody className="legacy">{render(store)}</PageBody>
    </>
  );
}
