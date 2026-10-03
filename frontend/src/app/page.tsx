'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Store } from '@/types';
import ConnectionScreen from '@/components/ConnectionScreen';
import AppLayout from '@/components/AppLayout';

export default function Home() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('overview');

  useEffect(() => {
    const loadStore = async () => {
      try {
        const stores = await api.listStores();
        if (stores.stores && stores.stores.length > 0) {
          setStore(stores.stores[0]);
        }
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, []);

  const handleStoreConnect = (newStore: Store) => {
    setStore(newStore);
    setCurrentPage('overview');
  };

  const handleDisconnect = () => {
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
    return <ConnectionScreen onStoreConnect={handleStoreConnect} />;
  }

  return (
    <AppLayout
      store={store}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onDisconnect={handleDisconnect}
    />
  );
}
