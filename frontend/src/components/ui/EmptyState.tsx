import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Glyph } from './glyphs';

/** One sentence and one action. No illustration, no centred faded icon. */
export function EmptyState({
  title,
  detail,
  action,
  className,
}: {
  title: string;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-2 py-10', className)}>
      <p className="text-body text-ink">{title}</p>
      {detail ? <p className="max-w-measure text-cell text-ink-3">{detail}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Inline failure with a reason and a retry. Previous content stays visible. */
export function ErrorNotice({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-critical/30 bg-critical-tint px-4 py-2.5 text-cell', className)}
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-critical" aria-hidden />
      <span className="min-w-0 flex-1 text-ink">{message}</span>
      {onRetry ? (
        <Button size="sm" variant="ghost" onClick={onRetry} className="text-ink">
          <Glyph name="refresh" size={12} />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
