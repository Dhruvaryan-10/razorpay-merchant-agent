'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from './Skeleton';
import { Glyph } from './glyphs';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  /** Hide below this breakpoint: the least important columns go first. */
  hideBelow?: 'md' | 'lg' | 'xl';
  className?: string;
  /** Header is a sort control when set. */
  sort?: { active: boolean; direction: 'asc' | 'desc'; onSort: () => void };
  /** Width of the skeleton bar shown while loading. */
  skeletonWidth?: string;
}

const hide: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

/**
 * The record table used by every workspace. Rows open on click or Enter;
 * j/k move a keyboard cursor (distinct from selection). While new data loads
 * the old rows stay put, dimmed, instead of collapsing into a spinner.
 * Below md each row becomes a two-line summary via `mobileRow`.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onOpen,
  selectedId,
  loading,
  stale,
  skeletonRows = 8,
  caption,
  empty,
  mobileRow,
  rowMuted,
  keyboard = false,
  id,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  onOpen?: (row: T) => void;
  selectedId?: string | null;
  loading?: boolean;
  stale?: boolean;
  skeletonRows?: number;
  caption: string;
  empty?: React.ReactNode;
  mobileRow?: (row: T) => React.ReactNode;
  rowMuted?: (row: T) => boolean;
  /** Enable j/k/Enter row navigation for this page. */
  keyboard?: boolean;
  id?: string;
}) {
  const [cursor, setCursor] = useState(-1);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = rows?.length ?? 0;

  useEffect(() => {
    setCursor(-1);
  }, [rows]);

  useEffect(() => {
    if (!keyboard || !rows?.length) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        setCursor((current) => {
          const next =
            event.key === 'j' ? Math.min(count - 1, current + 1) : Math.max(0, current < 0 ? 0 : current - 1);
          rowRefs.current[next]?.focus({ preventScroll: false });
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, rows, count]);

  const showSkeleton = loading && !rows;
  const isEmpty = !showSkeleton && rows && rows.length === 0;

  return (
    <div id={id} className={cn('transition-opacity duration-quick', stale && 'opacity-60')} aria-busy={loading || stale}>
      {/* Phones: two-line rows */}
      {mobileRow ? (
        <ul className="md:hidden" aria-label={caption}>
          {showSkeleton
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <li key={i} className="flex flex-col gap-2 border-b border-line py-3">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </li>
              ))
            : rows?.map((row, index) => (
                <li key={getRowId(row)} className="border-b border-line">
                  <button
                    ref={(el) => {
                      mobileRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => onOpen?.(row)}
                    className={cn(
                      'block w-full py-3 text-left active:bg-well',
                      selectedId === getRowId(row) && 'bg-accent-tint'
                    )}
                  >
                    {mobileRow(row)}
                  </button>
                </li>
              ))}
        </ul>
      ) : null}

      <div className={cn('overflow-x-auto', mobileRow && 'hidden md:block')}>
        <table className="w-full border-collapse text-cell">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sort?.active ? (column.sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'h-9 whitespace-nowrap border-b border-line-strong px-3 text-meta font-medium text-ink-3 first:pl-0 last:pr-0',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.hideBelow && hide[column.hideBelow]
                  )}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      onClick={column.sort.onSort}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-ink',
                        column.sort.active && 'text-ink-2'
                      )}
                    >
                      {column.header}
                      {column.sort.active ? (
                        <span aria-hidden className="text-[10px]">
                          {column.sort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      ) : null}
                    </button>
                  ) : column.header ? (
                    column.header
                  ) : (
                    <span className="sr-only">Open</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} className="h-11 border-b border-line">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn('px-3 first:pl-0 last:pr-0', column.hideBelow && hide[column.hideBelow])}
                      >
                        <Skeleton
                          className={cn('h-3', column.align === 'right' && 'ml-auto', column.skeletonWidth ?? 'w-20')}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row, index) => {
                  const rowId = getRowId(row);
                  const selected = selectedId === rowId;
                  const muted = rowMuted?.(row);
                  return (
                    <tr
                      key={rowId}
                      ref={(el) => {
                        rowRefs.current[index] = el;
                      }}
                      tabIndex={onOpen ? (index === Math.max(cursor, 0) ? 0 : -1) : undefined}
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => onOpen?.(row)}
                      onFocus={() => setCursor(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && onOpen) {
                          event.preventDefault();
                          onOpen(row);
                        }
                      }}
                      className={cn(
                        'group h-11 border-b border-line transition-colors duration-instant',
                        onOpen && 'cursor-pointer hover:bg-well focus-visible:outline-none focus-visible:[box-shadow:inset_0_0_0_2px_rgb(var(--accent))]',
                        selected && 'bg-accent-tint hover:bg-accent-tint',
                        muted && 'text-ink-3'
                      )}
                    >
                      {columns.map((column, ci) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-3 first:pl-0 last:pr-0',
                            column.align === 'right' && 'text-right',
                            column.hideBelow && hide[column.hideBelow],
                            ci === 0 && selected && 'shadow-[inset_2px_0_0_rgb(var(--accent))] !pl-2.5',
                            column.className
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {isEmpty ? empty : null}
    </div>
  );
}

/** Small "open" affordance at the end of a row, for discoverability. */
export function RowChevron() {
  return (
    <Glyph
      name="chevron"
      size={12}
      className="inline-block text-ink-4 opacity-0 transition-opacity duration-instant group-hover:opacity-100 group-focus-visible:opacity-100"
    />
  );
}
