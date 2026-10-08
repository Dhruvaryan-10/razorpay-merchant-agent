'use client';

import { StoreProvider } from '@/hooks/useStore';
import { AppShell } from '@/components/shell/AppShell';
import { WorkspaceError, WorkspaceSkeleton } from '@/components/shell/WorkspaceStates';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider
      fallback={<WorkspaceSkeleton />}
      error={(retry, message) => <WorkspaceError message={message} onRetry={retry} />}
    >
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
