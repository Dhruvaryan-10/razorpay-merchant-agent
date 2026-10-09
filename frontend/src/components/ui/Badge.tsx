import { cn } from '@/lib/cn';
import { Glyph } from './glyphs';

type Tone = 'neutral' | 'accent' | 'caution' | 'critical' | 'positive';

const tones: Record<Tone, string> = {
  neutral: 'bg-well text-ink-2',
  accent: 'bg-accent-tint text-accent',
  caution: 'bg-caution-tint text-caution',
  critical: 'bg-critical-tint text-critical',
  positive: 'bg-positive-tint text-positive',
};

/** A small rectangular tag. Used sparingly: applied filters, parse chips, mode. */
export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-meta', tones[tone], className)}>
      {children}
    </span>
  );
}

/** An applied filter that can be removed. */
export function FilterChip({
  children,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-sm bg-accent-tint pl-2.5 pr-1 text-meta text-accent">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="grid h-5 w-5 place-items-center rounded-sm hover:bg-accent/10"
      >
        <Glyph name="close" size={10} />
      </button>
    </span>
  );
}
