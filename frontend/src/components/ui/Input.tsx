import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';
import { Glyph } from './glyphs';

/** Inputs rest on the well surface and lift to the sheet when focused. */
export const inputClasses = cn(
  'w-full rounded-sm bg-well text-ink placeholder:text-ink-3',
  'shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]',
  'transition-[background-color,box-shadow] duration-instant ease-out',
  'focus:bg-sheet focus:outline-none focus:shadow-[inset_0_0_0_1px_rgb(var(--accent)),0_0_0_3px_rgb(var(--accent)/0.15)]',
  'disabled:bg-transparent disabled:text-ink-3',
  'aria-[invalid=true]:shadow-[inset_0_0_0_1px_rgb(var(--critical))]'
);

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClasses, 'h-9 px-3 text-cell', className)} {...props} />;
  }
);

/** Label, control, then hint or error, wired together for assistive tech. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-meta font-medium text-ink-2">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-meta text-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const SearchInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; shortcut?: string }
>(function SearchInput({ label, shortcut, className, ...props }, ref) {
  return (
    <div className={cn('relative', className)}>
      <Glyph
        name="search"
        size={14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
      />
      <input
        ref={ref}
        type="search"
        aria-label={label}
        placeholder={label}
        className={cn(inputClasses, 'h-8 pl-8 pr-8 text-cell [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {shortcut ? (
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm px-1.5 font-mono text-[11px] text-ink-3 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))]">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
});
