import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Hover and focus tooltip for short supplementary text. The trigger must be
 * focusable; the tip is linked with aria-describedby.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: React.ReactNode;
  children: (props: { 'aria-describedby': string }) => React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  const id = useId();
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children({ 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-30 w-max max-w-[240px] -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-meta text-on-ink',
          'opacity-0 transition-opacity duration-quick group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        )}
      >
        {content}
      </span>
    </span>
  );
}
