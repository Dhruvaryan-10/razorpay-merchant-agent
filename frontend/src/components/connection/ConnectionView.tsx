'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Field, inputClasses } from '@/components/ui/Input';
import { useEnterStore } from '@/hooks/useConnectStore';
import { useStoresQuery } from '@/hooks/useStore';

// The visual loads after the form so it never delays the first paint.
const LedgerFlow = dynamic(() => import('./LedgerFlow').then((m) => m.LedgerFlow), {
  ssr: false,
  loading: () => null,
});

type Errors = Partial<Record<'storeUrl' | 'consumerKey' | 'consumerSecret', string>>;

function validate(storeUrl: string, consumerKey: string, consumerSecret: string): Errors {
  const errors: Errors = {};
  if (!storeUrl.trim()) errors.storeUrl = 'Enter your store’s address.';
  else if (!/^https?:\/\/\S+\.\S+/.test(storeUrl.trim()))
    errors.storeUrl = 'Use the full address, starting with https://';
  if (!consumerKey.trim()) errors.consumerKey = 'Enter the consumer key.';
  else if (!consumerKey.trim().startsWith('ck_')) errors.consumerKey = 'WooCommerce consumer keys start with ck_';
  if (!consumerSecret.trim()) errors.consumerSecret = 'Enter the consumer secret.';
  else if (!consumerSecret.trim().startsWith('cs_')) errors.consumerSecret = 'WooCommerce consumer secrets start with cs_';
  return errors;
}

/** Turn backend failures into what the merchant should check next. */
function explain(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (error instanceof ApiError && error.status === 0) return message;
  if (/authentication|401|rejected/i.test(message))
    return 'WooCommerce rejected these keys. Check the consumer key and secret, and that the key has Read access.';
  if (/forbidden|403|permission/i.test(message))
    return 'These keys don’t have permission to read the store. Give the key Read access in WooCommerce.';
  if (/timeout/i.test(message)) return 'The store took too long to respond. Try again in a moment.';
  if (/could not connect|connect/i.test(message))
    return 'Couldn’t reach WooCommerce at that address. Check the store URL and that the REST API is enabled.';
  return message || 'Something went wrong while connecting. Try again.';
}

type Phase = { kind: 'idle' } | { kind: 'connecting' } | { kind: 'demo' } | { kind: 'entering'; name: string };

export function ConnectionView() {
  const enterStore = useEnterStore();
  const { data: stores } = useStoresQuery();
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const busy = phase.kind !== 'idle';

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(storeUrl, consumerKey, consumerSecret);
    setErrors(found);
    setFailure('');
    if (Object.keys(found).length) return;

    setPhase({ kind: 'connecting' });
    try {
      const store = await api.connectWooCommerce(storeUrl.trim(), consumerKey.trim(), consumerSecret.trim());
      // The secret has done its job; don't keep it in component state.
      setConsumerSecret('');
      setPhase({ kind: 'entering', name: store.name });
      await enterStore(store);
    } catch (error) {
      setFailure(explain(error));
      setPhase({ kind: 'idle' });
    }
  };

  const exploreDemo = async () => {
    setFailure('');
    setPhase({ kind: 'demo' });
    try {
      const store = await api.createDemoStore();
      setPhase({ kind: 'entering', name: store.name });
      await enterStore(store);
    } catch (error) {
      setFailure(explain(error));
      setPhase({ kind: 'idle' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Visual: a compact band on phones, a full column from tablet up. Always dark. */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-[#0E1014] md:sticky md:top-0 md:h-screen">
        <LedgerFlow className="absolute inset-0 h-full w-full" />
        <p className="absolute bottom-8 left-6 right-6 hidden max-w-sm text-cell leading-5 text-[#A7ADB8] md:block">
          Every order, product and customer in your WooCommerce store, kept in one calm ledger.
        </p>
      </div>

      <main className="flex flex-1 flex-col px-5 py-8 sm:px-10 md:py-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between gap-4">
          <span className="text-cell font-heavy text-ink">Merchant Agent</span>
          {stores && stores.length > 0 ? (
            <Link href="/app" className="text-cell text-accent hover:text-accent-strong hover:underline">
              Back to workspace
            </Link>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-center py-10 md:py-12">
          <div className="w-full max-w-[400px]">
            <h1 className="text-figure-l text-ink">Connect your store.</h1>
            <p className="mt-3 max-w-measure text-body text-ink-2">
              Bring orders, products, inventory and customers in from WooCommerce. The workspace only reads; nothing in
              your store changes.
            </p>

            <form onSubmit={connect} noValidate className="mt-9 flex flex-col gap-5" aria-describedby={failure ? 'connect-failure' : undefined}>
              <Field label="Store URL" error={errors.storeUrl}>
                {(props) => (
                  <input
                    {...props}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder="https://yourstore.com"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    disabled={busy}
                    className={cn(inputClasses, 'h-11 px-3.5 text-body')}
                  />
                )}
              </Field>

              <Field label="Consumer key" error={errors.consumerKey}>
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="ck_…"
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    disabled={busy}
                    className={cn(inputClasses, 'h-11 px-3.5 font-mono text-code')}
                  />
                )}
              </Field>

              <Field
                label="Consumer secret"
                error={errors.consumerSecret}
                hint="Create keys in WooCommerce under Settings › Advanced › REST API. Read access is enough."
              >
                {(props) => (
                  <div className="relative">
                    <input
                      {...props}
                      type={showSecret ? 'text' : 'password'}
                      autoComplete="off"
                      spellCheck={false}
                      autoCapitalize="none"
                      placeholder="cs_…"
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      disabled={busy}
                      className={cn(inputClasses, 'h-11 pl-3.5 pr-16 font-mono text-code')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      aria-pressed={showSecret}
                      className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-sm px-2.5 text-meta text-ink-2 hover:bg-line hover:text-ink"
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                )}
              </Field>

              {failure ? (
                <p id="connect-failure" role="alert" className="flex gap-2.5 text-cell text-critical">
                  <span aria-hidden className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-critical" />
                  {failure}
                </p>
              ) : null}

              <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-1 w-full">
                {phase.kind === 'connecting' ? 'Checking your store…' : 'Connect WooCommerce'}
              </Button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <p className="max-w-[230px] text-cell text-ink-2">
                  No store handy? Try the workspace with a built-in sample store.
                </p>
                <Button variant="quiet" size="lg" onClick={exploreDemo} disabled={busy}>
                  {phase.kind === 'demo' ? 'Preparing demo…' : 'Explore demo'}
                </Button>
              </div>
            </div>

            <p aria-live="polite" className="mt-6 min-h-5 text-meta text-ink-3">
              {phase.kind === 'entering' ? `Connected to ${phase.name}. Opening your workspace…` : ''}
            </p>
          </div>
        </div>

        <p className="max-w-measure text-meta text-ink-3">
          Your consumer secret is sent once in the request body and stored encrypted. It never appears in a URL or in
          this browser’s storage.
        </p>
      </main>
    </div>
  );
}
