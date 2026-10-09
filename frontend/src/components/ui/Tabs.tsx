'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { duration, ease } from '@/lib/motion';

export interface TabItem {
  value: string;
  label: string;
  count?: number | null;
}

/**
 * Underline tabs with counts. The underline glides between tabs. Arrow keys
 * move between tabs (roving focus), per the ARIA tabs pattern.
 */
export function Tabs({
  items,
  value,
  onChange,
  label,
  controls,
  id,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** id of the region the tabs filter. */
  controls?: string;
  /** Unique per page, used for the shared-layout underline. */
  id: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  };

  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mb-px flex gap-6 overflow-x-auto">
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'relative flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap text-cell transition-colors duration-instant',
              selected ? 'font-strong text-ink' : 'text-ink-2 hover:text-ink'
            )}
          >
            {item.label}
            {item.count !== undefined && item.count !== null ? (
              <span className={cn('tnum text-meta', selected ? 'text-ink-2' : 'text-ink-3')}>{item.count}</span>
            ) : null}
            {selected ? (
              <motion.span
                layoutId={`${id}-underline`}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                transition={{ duration: duration.quick, ease: ease.inOut }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
