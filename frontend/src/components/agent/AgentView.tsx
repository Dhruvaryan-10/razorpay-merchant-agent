'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerDrawer } from '@/components/customers/CustomerDrawer';
import { OrderDrawer } from '@/components/orders/OrderDrawer';
import { ProductDrawer } from '@/components/products/ProductDrawer';
import { PageBody, PageHeader } from '@/components/shell/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/ui/EmptyState';
import { useAgentExecutions } from '@/hooks/queries';
import { useStore } from '@/hooks/useStore';
import { useUrlState } from '@/hooks/useUrlState';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/format';
import { CAPABILITIES, parseIntent } from '@/lib/intents';
import { duration, ease } from '@/lib/motion';
import type { AgentResponse } from '@/types';
import { AgentRecords } from './AgentRecords';

interface Run {
  id: number;
  query: string;
  at: string;
  response?: AgentResponse;
  error?: string;
}

function describeTool(t: AgentResponse['tools'][number]) {
  const input = Object.entries(t.input ?? {})
    .map(([k, v]) => (k === 'amount_threshold' ? `amount ≥ ${v}` : `${k}=${v}`))
    .join(', ');
  const out = t.output ?? {};
  const result = 'count' in out ? `→ ${out.count}` : 'found' in out ? `→ ${out.found ? 'found' : 'not found'}` : '';
  return { call: `${t.name}(${input})`, result };
}

function Provenance({ response }: { response: AgentResponse }) {
  if (!response.tools.length) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[11.5px] text-ink-3" aria-label="Calls made">
      {response.tools.map((t, i) => {
        const { call, result } = describeTool(t);
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>·</span> : null}
            <span className="rounded-sm bg-well px-1.5 text-ink-2">{call}</span>
            <span>{result}</span>
          </span>
        );
      })}
      <span aria-hidden>·</span>
      <span className="tnum">{response.total_duration_ms} ms</span>
    </p>
  );
}

function ResultBlock({ run, onAsk }: { run: Run; onAsk: (q: string) => void }) {
  const r = run.response;
  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.quick, ease: ease.out }}
      className="flex flex-col gap-3.5 border-t border-line pt-7 first:border-t-0 first:pt-0"
      aria-busy={!r && !run.error}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-heading text-ink">{run.query}</h2>
        <span className="tnum text-meta text-ink-3">{formatTime(run.at)}</span>
      </div>
      {run.error ? (
        <ErrorNotice message={`The question couldn’t run. ${run.error}`} onRetry={() => onAsk(run.query)} />
      ) : !r ? (
        <p className="text-cell text-ink-3">Running…</p>
      ) : r.intent ? (
        <>
          <p className="max-w-measure text-body text-ink">{r.result}</p>
          <AgentRecords response={r} />
          <Provenance response={r} />
        </>
      ) : (
        <>
          <p className="max-w-measure text-body text-ink-2">
            That isn’t a question I can answer yet. I read orders, products, stock and customers from your store. Closest
            things I can do:
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-cell">
            {['Find pending orders', 'Today’s sales', 'Out of stock items'].map((q) => (
              <button key={q} type="button" onClick={() => onAsk(q)} className="text-accent hover:text-accent-strong">
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </motion.article>
  );
}

export function AgentView() {
  const { store } = useStore();
  const url = useUrlState();
  const queryClient = useQueryClient();
  const history = useAgentExecutions(8);
  const [draft, setDraft] = useState('');
  const [runs, setRuns] = useState<Run[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const parsed = parseIntent(draft);

  const ask = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q) return;
      const id = ++counter.current;
      setRuns((rs) => [{ id, query: q, at: new Date().toISOString() }, ...rs]);
      setDraft('');
      try {
        const response = await api.agentQuery(store.id, q);
        setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, response } : r)));
      } catch (e) {
        setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, error: (e as Error).message } : r)));
      } finally {
        queryClient.invalidateQueries({ queryKey: [store.id, 'agent-executions'] });
      }
    },
    [store.id, queryClient]
  );

  // A question handed over from Overview, a drawer or the palette runs on arrival.
  const incoming = url.get('q');
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!incoming || handled.current === incoming) return;
    handled.current = incoming;
    ask(incoming);
    url.set({ q: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  useEffect(() => inputRef.current?.focus(), []);

  return (
    <>
      <PageHeader title="Agent" meta="Answers come from live store data, with the calls that produced them." />
      <PageBody>
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-14">
          <div className="flex min-w-0 flex-col gap-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
              className="rounded-md bg-sheet px-4 pb-3 pt-3.5 shadow-[inset_0_0_0_1px_rgb(var(--line-strong))] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--accent)),0_0_0_3px_rgb(var(--accent)/0.15)]"
            >
              <label htmlFor="agent-input" className="sr-only">
                Ask the agent
              </label>
              <input
                id="agent-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
                placeholder="Ask about orders, stock or customers"
                className="w-full bg-transparent text-[16px] leading-6 text-ink placeholder:text-ink-3 focus:outline-none"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5" aria-live="polite">
                <span className="text-meta text-ink-3">Will run as</span>
                {!draft.trim() ? (
                  <span className="text-meta text-ink-3">—</span>
                ) : parsed ? (
                  parsed.chips.map((c, i) => (
                    <Badge key={i}>
                      {c.v ? <span className="text-ink-3">{c.k}</span> : c.k}
                      {c.v ? <span className="text-ink">{c.v}</span> : null}
                    </Badge>
                  ))
                ) : (
                  <span className="text-meta text-caution">No supported question matches yet</span>
                )}
                <span className="flex-1" />
                <Button type="submit" variant="primary" size="sm" disabled={!draft.trim()}>
                  Run <span className="font-mono opacity-60">↵</span>
                </Button>
              </div>
            </form>

            {runs.length === 0 ? (
              <p className="max-w-measure text-cell text-ink-3">
                Each answer shows the records it found, the calls it made and a link to see them in their workspace. Start
                with one of the supported questions.
              </p>
            ) : (
              <div className="flex flex-col gap-7">
                {runs.map((run) => (
                  <ResultBlock key={run.id} run={run} onAsk={ask} />
                ))}
              </div>
            )}
          </div>

          <aside aria-label="Supported questions and history" className="flex min-w-0 flex-col gap-8">
            <section aria-labelledby="caps-heading">
              <h2 id="caps-heading" className="text-cell font-heavy text-ink">
                What I can answer
              </h2>
              <p className="mb-2 mt-0.5 text-meta text-ink-3">Select to run. Edit names and amounts in the box.</p>
              {CAPABILITIES.map((g) => (
                <div key={g.group} className="border-t border-line py-2.5">
                  <div className="mb-1 text-meta text-ink-3">{g.group}</div>
                  {g.items.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="block w-full py-1 text-left text-cell text-accent hover:text-accent-strong"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ))}
            </section>
            <section aria-labelledby="history-heading">
              <h2 id="history-heading" className="mb-2 text-cell font-heavy text-ink">
                Recent questions
              </h2>
              {history.isError ? (
                <p className="text-meta text-ink-3">History isn’t available right now.</p>
              ) : history.data?.length ? (
                <ul>
                  {history.data.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => ask(h.query)}
                        className="flex w-full justify-between gap-3 border-b border-line py-1.5 text-left text-cell text-ink hover:text-accent"
                      >
                        <span className="min-w-0 truncate">{h.query}</span>
                        <span className="tnum shrink-0 text-meta text-ink-3">{h.duration_ms ?? 0} ms</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : history.isPending ? null : (
                <p className="text-meta text-ink-3">Questions you ask appear here.</p>
              )}
            </section>
          </aside>
        </div>
      </PageBody>
      <OrderDrawer />
      <ProductDrawer />
      <CustomerDrawer />
    </>
  );
}
