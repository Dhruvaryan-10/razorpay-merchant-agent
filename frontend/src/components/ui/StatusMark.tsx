import { cn } from '@/lib/cn';
import type { MarkKind } from '@/lib/status';

/**
 * 6px marks. Shapes differ as well as colour: hollow (needs action), solid
 * (moving or done), dash (out of play), diamond (a problem).
 */
const marks: Record<MarkKind, string> = {
  'hollow-caution': 'h-1.5 w-1.5 rounded-full border-[1.5px] border-caution',
  'hollow-neutral': 'h-1.5 w-1.5 rounded-full border-[1.5px] border-ink-3',
  'solid-accent': 'h-1.5 w-1.5 rounded-full bg-accent',
  'solid-positive': 'h-1.5 w-1.5 rounded-full bg-positive',
  dash: 'h-[1.5px] w-1.5 bg-ink-4',
  diamond: 'h-1.5 w-1.5 rotate-45 bg-critical',
};

export function Mark({ kind, className }: { kind: MarkKind; className?: string }) {
  return <span aria-hidden className={cn('inline-block shrink-0', marks[kind], className)} />;
}

/** Mark plus word: status is never communicated by colour alone. */
export function StatusMark({
  kind,
  label,
  className,
  muted,
}: {
  kind: MarkKind;
  label: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', muted ? 'text-ink-3' : 'text-ink', className)}>
      <Mark kind={kind} />
      {label}
    </span>
  );
}
