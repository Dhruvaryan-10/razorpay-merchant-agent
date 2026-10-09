'use client';

import { cn } from '@/lib/cn';
import { Glyph } from '@/components/ui/glyphs';
import { useShell } from './ShellContext';

/**
 * The top bar belongs to the page: its title and a quiet count or date on
 * the left, that page's controls on the right. On tablet it also carries the
 * text "Menu" button that opens navigation.
 */
export function PageHeader({
  title,
  meta,
  actions,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Secondary row, e.g. status tabs, sitting on the header rule. */
  children?: React.ReactNode;
}) {
  const { openNav, openPalette } = useShell();
  return (
    <header className="border-b border-line">
      <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-4 pt-5 md:px-6 lg:px-8 xl:px-10', children && 'pb-3')}>
        <button
          type="button"
          onClick={openNav}
          className="-ml-1 hidden h-8 items-center rounded-sm px-2 text-cell text-ink-2 hover:bg-well hover:text-ink md:inline-flex lg:hidden"
        >
          Menu
        </button>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-title text-ink">{title}</h1>
          {meta ? <p className="text-meta text-ink-3">{meta}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        <button
          type="button"
          onClick={() => openPalette()}
          aria-label="Search or ask"
          className="-mr-1 grid h-8 w-8 place-items-center rounded-sm text-ink-2 hover:bg-well hover:text-ink lg:hidden"
        >
          <Glyph name="search" size={15} />
        </button>
      </div>
      {children ? <div className="px-4 md:px-6 lg:px-8 xl:px-10">{children}</div> : null}
    </header>
  );
}

/** Page gutter: 16px phone, 24px tablet, 32px laptop, 40px desktop. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-4 py-6 md:px-6 lg:px-8 xl:px-10 xl:py-8', className)}>{children}</div>;
}
