'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { useUrlState } from './useUrlState';

/**
 * Search box state that follows the URL (?q=). Typing updates local state
 * immediately; the URL, and therefore the request, follows 250ms later and
 * resets pagination.
 */
export function useUrlSearch() {
  const url = useUrlState();
  const urlQuery = url.get('q');
  const [search, setSearch] = useState(urlQuery);
  const debounced = useDebouncedValue(search, 250);

  useEffect(() => {
    if (debounced !== urlQuery) url.set({ q: debounced || null, page: null }, { replace: true });
    // Only the debounced value should push to the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => setSearch(urlQuery), [urlQuery]);

  return { search, setSearch, query: urlQuery };
}

/** "/" focuses the page's search field, as in most record tools. */
export function useSlashToFocus() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return ref;
}
