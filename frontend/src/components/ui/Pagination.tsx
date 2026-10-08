import { formatNumber } from '@/lib/format';
import { Button } from './Button';

/** "1–20 of 30" with Previous / Next. A merchant needs to know where they are. */
export function Pagination({
  page,
  perPage,
  total,
  onPage,
  noun = 'results',
  children,
}: {
  page: number;
  perPage: number;
  total: number;
  onPage: (page: number) => void;
  noun?: string;
  /** Extra footer content, such as keyboard hints. */
  children?: React.ReactNode;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-3">
      <p className="tnum text-meta text-ink-3" aria-live="polite">
        {total === 0 ? `No ${noun}` : `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} ${noun}`}
      </p>
      {children}
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next
        </Button>
      </div>
    </nav>
  );
}
