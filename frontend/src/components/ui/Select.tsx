import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { inputClasses } from './Input';

/** Native select for full keyboard and mobile support, styled as a control. */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }
>(function Select({ label, className, children, ...props }, ref) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        aria-label={label}
        className={cn(inputClasses, 'h-8 appearance-none pl-3 pr-8 text-cell')}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        width="12"
        height="12"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
});
