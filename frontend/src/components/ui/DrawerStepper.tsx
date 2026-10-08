'use client';

import { useEffect } from 'react';
import { Glyph } from './glyphs';

/**
 * Previous/next through the list a drawer was opened from. [ and ] step,
 * matching the hint shown in drawer footers.
 */
export function useSiblingSteps<T>(
  siblings: T[],
  id: number | null,
  getId: (item: T) => number,
  go: (id: number) => void
) {
  const index = siblings.findIndex((item) => getId(item) === id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  useEffect(() => {
    if (id === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === '[' && prev) go(getId(prev));
      if (event.key === ']' && next) go(getId(next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, prev, next, go, getId]);

  return { prev, next, active: siblings.length > 1 && index >= 0 };
}

export function StepButtons<T>({
  prev,
  next,
  getId,
  go,
  noun,
}: {
  prev: T | null;
  next: T | null;
  getId: (item: T) => number;
  go: (id: number) => void;
  noun: string;
}) {
  const button = (target: T | null, label: string, rotate: string, key: string) => (
    <button
      type="button"
      disabled={!target}
      onClick={() => target && go(getId(target))}
      aria-label={`${label} ${noun}`}
      title={`${label} (${key})`}
      className="grid h-8 w-8 place-items-center rounded-sm text-ink-2 hover:bg-well hover:text-ink disabled:text-ink-4 disabled:hover:bg-transparent"
    >
      <Glyph name="chevron" size={12} className={rotate} />
    </button>
  );
  return (
    <span className="flex">
      {button(prev, 'Previous', '-rotate-90', '[')}
      {button(next, 'Next', 'rotate-90', ']')}
    </span>
  );
}
