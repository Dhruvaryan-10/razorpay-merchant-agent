'use client';

import { useState } from 'react';
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { ThemeSwitcher } from '@/components/shell/ThemeSwitcher';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { StatusMark } from '@/components/ui/StatusMark';
import { useStore } from '@/hooks/useStore';
import { formatDateTime } from '@/lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-meta text-ink-3 sm:text-cell">{label}</dt>
      <dd className="min-w-0 text-cell text-ink">{children}</dd>
    </div>
  );
}

export function SettingsView() {
  const { store, disconnect } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await disconnect();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" meta={store.name} />
      <PageBody className="flex max-w-3xl flex-col gap-14">
        <section aria-labelledby="store-heading">
          <h2 id="store-heading" className="text-heading text-ink">
            Store connection
          </h2>
          <dl className="mt-3 border-t border-line-strong">
            <Row label="Store">{store.name}</Row>
            <Row label="Platform">WooCommerce</Row>
            <Row label="Mode">
              {store.mode === 'demo' ? 'Demo, using a built-in synthetic store' : 'Live, reading your store over the WooCommerce REST API'}
            </Row>
            {store.store_url ? (
              <Row label="Store URL">
                <span className="break-all font-mono text-code">{store.store_url}</span>
              </Row>
            ) : null}
            <Row label="Status">
              <StatusMark
                kind={store.status === 'connected' ? 'solid-positive' : 'diamond'}
                label={store.status === 'connected' ? 'Connected' : store.status === 'error' ? 'Connection error' : 'Disconnected'}
              />
            </Row>
            <Row label="Connected">{formatDateTime(store.created_at)}</Row>
            <Row label="Access">Read-only. Orders, products and customers are changed in WooCommerce.</Row>
          </dl>
        </section>

        <section aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="text-heading text-ink">
            Appearance
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line-strong py-3">
            <p className="text-cell text-ink-2">Auto follows your system setting.</p>
            <ThemeSwitcher />
          </div>
        </section>

        <section aria-labelledby="disconnect-heading">
          <h2 id="disconnect-heading" className="text-heading text-ink">
            Disconnect
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-line-strong py-3">
            <p className="max-w-measure text-cell text-ink-2">
              Removes this store and its saved credentials from the workspace. Nothing in WooCommerce changes, and you can
              reconnect at any time.
            </p>
            <Button variant="quiet" className="text-critical" onClick={() => setConfirming(true)}>
              Disconnect store
            </Button>
          </div>
        </section>
      </PageBody>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) setError(undefined);
        }}
        title={`Disconnect ${store.name}?`}
        description="The store and its saved credentials are removed from this workspace. Your WooCommerce data is not affected."
        confirmLabel="Disconnect store"
        onConfirm={confirm}
        busy={busy}
        error={error}
      />
    </>
  );
}
