import { cn } from '@/lib/cn';

/** Placeholder at the exact size of what it stands for, so nothing shifts. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton-pulse block rounded-sm bg-well', className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </span>
  );
}
