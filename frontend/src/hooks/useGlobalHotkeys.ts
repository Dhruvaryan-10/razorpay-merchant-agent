'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_NAV_ITEMS } from '@/components/shell/nav';

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/** ⌘K / Ctrl+K opens the palette; "g" then a letter jumps to a page (g o → Orders). */
export function useGlobalHotkeys(openPalette: () => void) {
  const router = useRouter();
  useEffect(() => {
    let pendingG = 0;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'g') {
        pendingG = Date.now();
        return;
      }
      if (pendingG && Date.now() - pendingG < 1000) {
        const target = ALL_NAV_ITEMS.find((n) => n.keys === `g ${event.key}`);
        pendingG = 0;
        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette, router]);
}
