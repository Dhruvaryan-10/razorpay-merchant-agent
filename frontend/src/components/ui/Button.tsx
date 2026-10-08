import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'quiet' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

/**
 * One state change per interaction: background on hover, a ring on focus,
 * a darker ink on press. Primary is ink, not colour: the accent is reserved
 * for links, focus and selection.
 */
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink/85 active:bg-ink disabled:bg-ink/30',
  quiet: 'bg-well text-ink hover:bg-line active:bg-line-strong disabled:text-ink-4',
  ghost: 'bg-transparent text-ink-2 hover:bg-well hover:text-ink active:bg-line disabled:text-ink-4',
  danger: 'bg-critical text-white hover:bg-critical/90 active:bg-critical disabled:bg-critical/40',
  link: 'bg-transparent text-accent hover:text-accent-strong underline-offset-4 hover:underline px-0',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-meta gap-1.5',
  md: 'h-8 px-3 text-cell gap-1.5',
  lg: 'h-11 px-4 text-body gap-2',
};

export function buttonClasses(variant: Variant = 'quiet', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium',
    'transition-colors duration-instant ease-out select-none',
    'disabled:cursor-default',
    sizes[size],
    variants[variant],
    variant === 'link' && 'h-auto',
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'quiet', size = 'md', className, type = 'button', ...props },
  ref
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});

export function ButtonLink({
  variant = 'quiet',
  size = 'md',
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

/** Inline text link in the accent colour. */
export function TextLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'text-accent hover:text-accent-strong underline-offset-4 hover:underline transition-colors duration-instant',
        className
      )}
      {...props}
    />
  );
}
