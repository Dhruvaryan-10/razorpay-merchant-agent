'use client';

import ConnectionScreen from '@/components/legacy/ConnectionScreen';
import { useEnterStore } from '@/hooks/useConnectStore';

export default function ConnectPage() {
  const enterStore = useEnterStore();
  return (
    <div className="legacy">
      <ConnectionScreen onStoreConnect={enterStore} />
    </div>
  );
}
