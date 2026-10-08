'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { rememberStore } from '@/lib/store-memory';
import type { Store } from '@/types';
import { storesKey } from './useStore';

/** After a store is created: remember it, refresh the list, enter the workspace. */
export function useEnterStore() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useCallback(
    async (store: Store) => {
      rememberStore(store.id);
      await queryClient.invalidateQueries({ queryKey: storesKey });
      router.push('/app');
    },
    [queryClient, router]
  );
}
