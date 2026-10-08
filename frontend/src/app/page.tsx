'use client';

import { useState, useEffect } from 'react';
import { legacyApi as api } from '@/components/legacy/legacyApi';
import { Store } from '@/types';
import ConnectionScreen from '@/components/legacy/ConnectionScreen';
import AppLayout from '@/components/legacy/AppLayout';

const STORE_KEY = 'rma.store';

function rememberStore(id: string | null) {
  try {
    if (id) localStorage.setItem(STORE_KEY, id);
    else localStorage.removeItem(STORE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session still works.
  }
}

function rememberedStore(): string | null {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

export default function Home() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('overview');

  useEffect(() => {
    const loadStore = async () => {
      try {
        const { stores } = await api.listStores();
        const savedId = rememberedStore();
        setStore(stores.find((s) => s.id === savedId) ?? stores[0] ?? null);
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, []);

  const handleStoreConnect = (newStore: Store) => {
    rememberStore(newStore.id);
    setStore(newStore);
    setCurrentPage('overview');
  };

  const handleDisconnect = async () => {
    if (store) {
      try {
        await api.deleteStore(store.id);
      } catch (error) {
        console.error('Error disconnecting store:', error);
      }
    }
    rememberStore(null);
    setStore(null);
    setCurrentPage('overview');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-secondary">Loading merchant workspace...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="legacy">
        <ConnectionScreen onStoreConnect={handleStoreConnect} />
      </div>
    );
  }

  return (
    <div className="legacy">
    <AppLayout
      store={store}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onDisconnect={handleDisconnect}
    />
    </div>
  );
}
