'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { inputClasses } from '@/components/ui/Input';
import { Kbd } from '@/components/ui/Kbd';
import { cn } from '@/lib/cn';

const SUGGESTIONS = ['Today’s sales', 'Out of stock items', 'Recent customers'];

export function agentHref(query: string) {
  return `/app/agent?q=${encodeURIComponent(query)}`;
}

/** Sends the question to the Agent, which runs it on arrival. */
export function AskField() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <section aria-labelledby="ask-heading" className="min-w-0">
      <h2 id="ask-heading" className="text-heading text-ink">
        Ask about this store
      </h2>
      <form
        className="relative mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) router.push(agentHref(query.trim()));
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask the agent
        </label>
        <input
          id="ask-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pending orders above ₹2,000"
          className={cn(inputClasses, 'h-10 pl-3 pr-10 text-cell')}
        />
        <Kbd className="absolute right-2.5 top-1/2 -translate-y-1/2">↵</Kbd>
      </form>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {SUGGESTIONS.map((s) => (
          <Link key={s} href={agentHref(s)} className="text-cell text-accent hover:text-accent-strong">
            {s}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-meta text-ink-3">Answers open as tables of real records, with the calls that produced them.</p>
    </section>
  );
}
