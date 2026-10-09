import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

/** Shown while the workspace resolves which store it belongs to. */
export function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[232px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading workspace">
      <div className="hidden flex-col gap-3 border-r border-line bg-rail px-5 py-5 lg:flex">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-6 h-3 w-24" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="px-4 py-6 md:px-8 xl:px-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-10 h-12 w-64" />
        <Skeleton className="mt-4 h-40 w-full max-w-3xl" />
      </div>
    </div>
  );
}

export function WorkspaceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="flex max-w-md flex-col items-start gap-3">
        <h1 className="text-heading text-ink">The workspace couldn&apos;t load your stores.</h1>
        <p className="text-cell text-ink-2">{message}</p>
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
