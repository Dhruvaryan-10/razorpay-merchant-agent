'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { rememberStore, rememberedStore } from '@/lib/store-memory';
import type { Store } from '@/types';

interface StoreContextValue {
  store: Store;
  stores: Store[];
  selectStore: (id: string) => void;
  disconnect: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const storesKey = ['stores'] as const;

export function useStoresQuery() {
  return useQuery({ queryKey: storesKey, queryFn: api.listStores, staleTime: 60_000 });
}

/**
 * Resolves which store the workspace is scoped to: the one this browser last
 * chose, else the first. With no stores at all, sends the merchant to /connect.
 */
export function StoreProvider({
  children,
  fallback,
  error,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  error: (retry: () => void, message: string) => React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storesQuery = useStoresQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(rememberedStore());
  }, []);

  const stores = storesQuery.data;
  const store = useMemo(
    () => stores?.find((s) => s.id === selectedId) ?? stores?.[0] ?? null,
    [stores, selectedId]
  );

  useEffect(() => {
    if (stores && stores.length === 0) router.replace('/connect');
  }, [stores, router]);

  const selectStore = useCallback(
    (id: string) => {
      rememberStore(id);
      setSelectedId(id);
      // Every cached record belongs to the previous store.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== storesKey[0] });
    },
    [queryClient]
  );

  const disconnect = useCallback(async () => {
    if (!store) return;
    await api.deleteStore(store.id);
    rememberStore(null);
    queryClient.clear();
    const remaining = await queryClient.fetchQuery({ queryKey: storesKey, queryFn: api.listStores });
    router.replace(remaining.length ? '/app' : '/connect');
  }, [store, queryClient, router]);

  if (storesQuery.isError) {
    return <>{error(() => storesQuery.refetch(), (storesQuery.error as Error).message)}</>;
  }
  if (!store || !stores) return <>{fallback}</>;

  return (
    <StoreContext.Provider value={{ store, stores, selectStore, disconnect }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}
