'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Kbd } from '@/components/ui/Kbd';
import { Mark } from '@/components/ui/StatusMark';
import { Glyph } from '@/components/ui/glyphs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useStore } from '@/hooks/useStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { agentHref, parseIntent } from '@/lib/intents';
import { duration, ease } from '@/lib/motion';
import { ORDER_STATUS_TABS, orderStatus, stockStatus } from '@/lib/status';
import { applyThemePreference } from '@/lib/theme';
import { ALL_NAV_ITEMS } from './nav';

interface Item {
  id: string;
  group: string;
  label: React.ReactNode;
  text: string; // plain text for matching and screen readers
  hint?: React.ReactNode;
  run: () => void;
}

const SUGGESTED = ['Find pending orders', 'Today’s sales', 'Show low-stock products'];

/** "⌘" on Apple platforms, "Ctrl" elsewhere; resolved after mount to avoid a hydration mismatch. */
export function useModKey() {
  const [mod, setMod] = useState('Ctrl ');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setMod('⌘');
  }, []);
  return mod;
}

function useRecordSearch(q: string) {
  const { store } = useStore();
  const enabled = q.length >= 2;
  const opts = { staleTime: 30_000, enabled };
  const orders = useQuery({
    queryKey: [store.id, 'palette', 'orders', q],
    queryFn: () => api.listOrders(store.id, { search: q.replace(/^#/, ''), per_page: 4 }),
    ...opts,
  });
  const products = useQuery({
    queryKey: [store.id, 'palette', 'products', q],
    queryFn: () => api.listProducts(store.id, { search: q, per_page: 4 }),
    ...opts,
  });
  const customers = useQuery({
    queryKey: [store.id, 'palette', 'customers', q],
    queryFn: () => api.listCustomers(store.id, { search: q, per_page: 4 }),
    ...opts,
  });
  const loading = enabled && (orders.isFetching || products.isFetching || customers.isFetching);
  return { orders: orders.data?.items, products: products.data?.items, customers: customers.data?.items, loading };
}

/**
 * ⌘K: one field that navigates, finds records and asks the Agent. Pages
 * match locally on the first keystroke; records query the existing search
 * endpoints after a short debounce. Rows never reorder under the cursor
 * because each group keeps a fixed position.
 */
export function CommandPalette({
  open,
  initialQuery,
  onOpenChange,
}: {
  open: boolean;
  initialQuery: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const debounced = useDebouncedValue(q.trim(), 150);
  const records = useRecordSearch(debounced);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ(initialQuery);
      setActive(0);
    }
  }, [open, initialQuery]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const items = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    const parsed = parseIntent(query);
    const list: Item[] = [];
    const ask = (text: string, group = 'Ask the agent') => ({
      id: `ask-${text}`,
      group,
      text: `Ask the agent: ${text}`,
      label: <span className={parsed || group !== 'Ask the agent' ? 'text-accent' : 'text-ink'}>{text}</span>,
      hint: <span className="text-meta text-ink-3">Agent</span>,
      run: () => go(agentHref(text)),
    });

    if (query && parsed) list.push({ ...ask(q.trim()), label: (
      <span className="flex flex-col gap-1">
        <span>{q.trim()}</span>
        <span className="flex flex-wrap gap-1.5">
          {parsed.chips.map((c, i) => (
            <span key={i} className="rounded-sm bg-well px-1.5 text-meta text-ink-2">
              {c.v ? <><span className="text-ink-3">{c.k}</span> {c.v}</> : c.k}
            </span>
          ))}
        </span>
      </span>
    ) });

    ALL_NAV_ITEMS.filter((n) => !query || n.label.toLowerCase().includes(query)).forEach((n) =>
      list.push({ id: `nav-${n.href}`, group: 'Go to', text: n.label, label: n.label, hint: <Kbd>{n.keys}</Kbd>, run: () => go(n.href) })
    );

    // Filtered views: "pending" → Pending orders, "low" → Low stock products.
    if (query.length >= 2) {
      const views = [
        ...ORDER_STATUS_TABS.map((s) => ({ label: `${orderStatus(s).label} orders`, href: `/app/orders?status=${s}` })),
        { label: 'Low stock products', href: '/app/products?stock=low' },
        { label: 'Out of stock products', href: '/app/products?stock=out' },
      ];
      views
        .filter((v) => v.label.toLowerCase().split(' ').some((w) => w.startsWith(query)) || v.label.toLowerCase().startsWith(query))
        .forEach((v) => list.push({ id: `view-${v.href}`, group: 'Go to', text: v.label, label: v.label, run: () => go(v.href) }));
    }

    if (query.length >= 2) {
      records.orders?.forEach((o) => {
        const m = orderStatus(o.status);
        list.push({
          id: `order-${o.id}`,
          group: 'Orders',
          text: `Order ${o.order_number} ${o.customer_name}`,
          label: (
            <span>
              <span className="font-mono text-code">#{o.order_number}</span> {o.customer_name || 'Guest'}
            </span>
          ),
          hint: (
            <span className="tnum inline-flex items-center gap-1.5 text-meta text-ink-2">
              <Mark kind={m.mark} />
              {m.label} · {formatMoney(o.total, o.currency)}
            </span>
          ),
          run: () => go(`/app/orders?order=${o.external_id}`),
        });
      });
      records.products?.forEach((p) =>
        list.push({
          id: `product-${p.id}`,
          group: 'Products',
          text: `Product ${p.name} ${p.sku}`,
          label: (
            <span>
              {p.name} {p.sku ? <span className="font-mono text-[11.5px] text-ink-3">{p.sku}</span> : null}
            </span>
          ),
          hint: (
            <span className="tnum text-meta text-ink-2">
              {formatMoney(p.price)}
              {p.stock_level === 'out' || p.stock_level === 'low' ? ` · ${stockStatus(p.stock_level).label}` : ''}
            </span>
          ),
          run: () => go(`/app/products?product=${p.external_id}`),
        })
      );
      records.customers?.forEach((c) =>
        list.push({
          id: `customer-${c.id}`,
          group: 'Customers',
          text: `Customer ${c.name}`,
          label: (
            <span>
              {c.name} {c.address?.city ? <span className="text-ink-3">· {c.address.city}</span> : null}
            </span>
          ),
          hint: <span className="tnum text-meta text-ink-2">{c.order_count} orders · {formatMoney(c.total_spent)}</span>,
          run: () => go(`/app/customers?customer=${c.external_id}`),
        })
      );
    }

    if (query && !parsed) list.push(ask(q.trim()));
    if (!query) SUGGESTED.forEach((s) => list.push(ask(s, 'Try asking')));

    const actions: Item[] = [
      { id: 'theme-light', group: 'Actions', text: 'Use light theme', label: 'Use light theme', run: () => (applyThemePreference('light'), window.dispatchEvent(new Event('rma-theme')), onOpenChange(false)) },
      { id: 'theme-dark', group: 'Actions', text: 'Use dark theme', label: 'Use dark theme', run: () => (applyThemePreference('dark'), window.dispatchEvent(new Event('rma-theme')), onOpenChange(false)) },
      { id: 'theme-auto', group: 'Actions', text: 'Match system theme', label: 'Match system theme', run: () => (applyThemePreference('system'), window.dispatchEvent(new Event('rma-theme')), onOpenChange(false)) },
      { id: 'connect', group: 'Actions', text: 'Connect another store', label: 'Connect another store', run: () => go('/connect') },
    ];
    actions.filter((a) => (query ? a.text.toLowerCase().includes(query) : a.id === 'connect')).forEach((a) => list.push(a));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, records.orders, records.products, records.customers]);

  useEffect(() => setActive((i) => Math.min(i, Math.max(0, items.length - 1))), [items.length]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (items.length ? (i + delta + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[active]?.run();
    }
  };

  let lastGroup = '';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'rgb(var(--scrim) / var(--scrim-opacity))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.quick }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex justify-center md:pt-[18vh]">
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  className="pointer-events-auto flex h-full w-full flex-col overflow-hidden bg-sheet shadow-e2 focus:outline-none md:h-auto md:max-h-[480px] md:w-palette md:rounded-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: duration.quick, ease: ease.out }}
                >
                  <Dialog.Title className="sr-only">Search or ask</Dialog.Title>
                  <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line px-4">
                    <Glyph name="search" size={15} className="text-ink-3" />
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onKeyDown}
                      placeholder="Search or ask…"
                      role="combobox"
                      aria-expanded="true"
                      aria-controls={listId}
                      aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
                      aria-autocomplete="list"
                      className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
                    />
                    {records.loading ? <span className="text-meta text-ink-3">Searching…</span> : null}
                    <Dialog.Close className="text-meta text-ink-3 hover:text-ink md:hidden">Close</Dialog.Close>
                  </div>
                  <div ref={listRef} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
                    {items.map((item, index) => {
                      const header = item.group !== lastGroup ? item.group : null;
                      lastGroup = item.group;
                      return (
                        <div key={item.id}>
                          {header ? <div className="px-3 pb-1 pt-2.5 text-[11.5px] text-ink-3">{header}</div> : null}
                          <div
                            id={`${listId}-${index}`}
                            data-index={index}
                            role="option"
                            aria-selected={index === active}
                            aria-label={item.text}
                            onMouseMove={() => setActive(index)}
                            onClick={() => item.run()}
                            className={cn(
                              'grid min-h-9 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-sm px-3 py-1.5 text-cell text-ink',
                              index === active && 'bg-accent-tint shadow-[inset_2px_0_0_rgb(var(--accent))]'
                            )}
                          >
                            <span className="min-w-0 truncate">{item.label}</span>
                            {item.hint}
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 ? <p className="px-3 py-6 text-cell text-ink-3">No matches.</p> : null}
                  </div>
                  <div className="hidden shrink-0 gap-4 border-t border-line px-4 py-2 text-[11.5px] text-ink-3 md:flex">
                    <span>
                      <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
                    </span>
                    <span>
                      <Kbd>↵</Kbd> open
                    </span>
                    <span>
                      <Kbd>esc</Kbd> close
                    </span>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
