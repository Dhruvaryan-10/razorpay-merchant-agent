'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import type { Store } from '@/types';

function Monogram({ store, muted }: { store: Store; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[5px] text-meta font-heavy',
        muted ? 'bg-mute text-ink' : 'bg-ink text-on-ink'
      )}
    >
      {initials(store.name).slice(0, 1)}
    </span>
  );
}

export function storeSubtitle(store: Store) {
  return `WooCommerce · ${store.mode === 'demo' ? 'Demo' : 'Live'}`;
}

/** Store identity and switcher. Built for several stores; shows what exists. */
export function StoreMenu() {
  const { store, stores, selectStore } = useStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left hover:bg-well"
      >
        <Monogram store={store} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-cell font-heavy leading-4 text-ink">{store.name}</span>
          <span className="truncate text-[11.5px] leading-[15px] text-ink-3">{storeSubtitle(store)}</span>
        </span>
        <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" className="shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Stores"
            className="absolute left-0 right-0 top-full z-40 mt-1 rounded-md bg-sheet p-1.5 text-cell shadow-e1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.quick, ease: ease.out }}
          >
            {stores.map((s, index) => (
              <button
                key={s.id}
                ref={index === 0 ? (el) => { firstItemRef.current = el; } : undefined}
                role="menuitemradio"
                aria-checked={s.id === store.id}
                type="button"
                onClick={() => {
                  if (s.id !== store.id) selectStore(s.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-sm p-2 text-left hover:bg-well',
                  s.id === store.id && 'bg-well'
                )}
              >
                <Monogram store={s} muted={s.id !== store.id} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="text-meta text-ink-3">{s.mode === 'demo' ? 'Demo' : 'Live'}</span>
              </button>
            ))}
            <div className="my-1.5 h-px bg-line" />
            <Link role="menuitem" href="/connect" onClick={() => setOpen(false)} className="block rounded-sm px-2 py-1.5 text-ink-2 hover:bg-well hover:text-ink">
              Connect another store
            </Link>
            <Link role="menuitem" href="/app/settings" onClick={() => setOpen(false)} className="block rounded-sm px-2 py-1.5 text-ink-2 hover:bg-well hover:text-ink">
              Connection settings
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
