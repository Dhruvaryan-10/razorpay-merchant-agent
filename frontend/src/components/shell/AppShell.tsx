'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { duration, ease } from '@/lib/motion';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';
import { CommandPalette } from './CommandPalette';
import { isActive } from './nav';
import { ShellContext } from './ShellContext';
import { Sidebar } from './Sidebar';

/** Tablet and phone: the full navigation as a sheet from the left. */
function NavSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 lg:hidden"
                style={{ backgroundColor: 'rgb(var(--scrim) / var(--scrim-opacity))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.quick }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-e1 focus:outline-none lg:hidden"
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ duration: duration.move, ease: ease.out }}
              >
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Sidebar layoutGroup="sheet" onNavigate={() => onOpenChange(false)} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

const TAB_ITEMS = [
  { href: '/app', label: 'Overview' },
  { href: '/app/orders', label: 'Orders' },
  { href: '/app/agent', label: 'Agent' },
];

/** Phones: four text tabs. No icons; the words are short enough. */
function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const inTabs = TAB_ITEMS.some((t) => isActive(pathname, t.href));
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-rail pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TAB_ITEMS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-14 items-center justify-center text-cell',
              active ? 'font-strong text-ink' : 'text-ink-2'
            )}
          >
            {active ? <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 bg-ink" /> : null}
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        className={cn('relative flex h-14 items-center justify-center text-cell', !inTabs ? 'font-strong text-ink' : 'text-ink-2')}
      >
        {!inTabs ? <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 bg-ink" /> : null}
        More
      </button>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteState, setPaletteState] = useState({ open: false, query: '' });

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const openPalette = useCallback((query = '') => setPaletteState({ open: true, query }), []);
  const context = useMemo(() => ({ openNav: () => setNavOpen(true), openPalette }), [openPalette]);
  useGlobalHotkeys(openPalette);

  return (
    <ShellContext.Provider value={context}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-sm focus:bg-sheet focus:px-3 focus:py-2 focus:shadow-e1"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside aria-label="Workspace navigation" className="hidden border-r border-line bg-rail lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </aside>
        <main id="main" className="min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <NavSheet open={navOpen} onOpenChange={setNavOpen} />
      <MobileTabBar onMore={() => setNavOpen(true)} />
      <CommandPalette
        open={paletteState.open}
        initialQuery={paletteState.query}
        onOpenChange={(open) => setPaletteState((s) => ({ ...s, open }))}
      />
    </ShellContext.Provider>
  );
}
