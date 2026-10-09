'use client';

import { useCallback } from 'react';
import { useUrlState } from './useUrlState';

/**
 * A record drawer driven by the URL (?order=1027, ?product=4, ?customer=7),
 * so any drawer can open over any page and survives refresh and sharing.
 */
export function useRecordParam(key: 'order' | 'product' | 'customer') {
  const url = useUrlState();
  const id = url.getNumber(key);
  const open = useCallback((value: number) => url.set({ [key]: value }), [url, key]);
  const close = useCallback(() => url.set({ [key]: null }), [url, key]);
  // Stepping between records replaces history so Back still leaves the drawer.
  const replace = useCallback((value: number) => url.set({ [key]: value }, { replace: true }), [url, key]);
  return { id, open, close, replace };
}
