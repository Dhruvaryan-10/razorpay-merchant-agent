'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { breakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { duration, ease } from '@/lib/motion';
import { Glyph } from './glyphs';

/**
 * Right-side record drawer. Slides 24px in from the side it lives on, so the
 * eye reads where the detail came from. On phones it becomes a full-screen
 * sheet that rises from the bottom. Focus is trapped and returned by Radix.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  label,
  navigation,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible header content. */
  title: React.ReactNode;
  /** Plain-text accessible name, e.g. "Order 1027". */
  label: string;
  /** Prev/next controls beside the close button. */
  navigation?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const wide = useMediaQuery(breakpoints.md);
  const docked = useMediaQuery(breakpoints.xl);
  const offset = wide ? { x: 24, y: 0 } : { x: 0, y: 24 };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40"
                style={{
                  backgroundColor: docked
                    ? 'rgb(var(--scrim) / 0.06)'
                    : 'rgb(var(--scrim) / var(--scrim-opacity))',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.quick }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.aside
                className="fixed inset-0 z-50 flex flex-col bg-sheet shadow-e1 focus:outline-none md:inset-y-0 md:left-auto md:right-0 md:w-[480px] lg:w-drawer"
                initial={{ opacity: 0, ...offset }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, ...offset }}
                transition={{ duration: duration.move, ease: ease.out }}
              >
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-5">
                  <Dialog.Title className="min-w-0 flex-1 truncate text-heading text-ink">
                    <span className="sr-only">{label}</span>
                    <span aria-hidden>{title}</span>
                  </Dialog.Title>
                  {navigation}
                  <Dialog.Close
                    className="grid h-8 w-8 place-items-center rounded-sm text-ink-2 hover:bg-well hover:text-ink"
                    aria-label="Close"
                  >
                    <Glyph name="close" size={14} />
                  </Dialog.Close>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer ? <footer className="shrink-0 border-t border-line px-5 py-3">{footer}</footer> : null}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** A labelled block inside a drawer, separated by a rule rather than a box. */
export function DrawerSection({
  title,
  aside,
  children,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-b-0">
      {title ? (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-heading text-ink">{title}</h3>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}
