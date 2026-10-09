'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Patch = Record<string, string | number | null | undefined>;

/**
 * URL search params as page state: filters, page and the open drawer
 * (?order=1027) survive refresh, back/forward and sharing a link.
 */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback((key: string) => params.get(key) ?? '', [params]);

  const getNumber = useCallback(
    (key: string) => {
      const raw = params.get(key);
      const value = raw === null ? NaN : Number(raw);
      return Number.isFinite(value) ? value : null;
    },
    [params]
  );

  /** Merge a patch into the URL. Empty values remove the key. */
  const set = useCallback(
    (patch: Patch, options: { replace?: boolean } = {}) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') next.delete(key);
        else next.set(key, String(value));
      });
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [params, pathname, router]
  );

  return { get, getNumber, set, params };
}
