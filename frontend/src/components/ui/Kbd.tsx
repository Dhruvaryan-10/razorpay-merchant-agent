import { cn } from '@/lib/cn';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm px-1 font-mono text-[11px] leading-none text-ink-2',
        'shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]',
        className
      )}
    >
      {children}
    </kbd>
  );
}
