'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/queries';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import { duration, ease } from '@/lib/motion';
import { Mark } from '@/components/ui/StatusMark';
import { NAV, SETTINGS_ITEM, isActive, type NavItem } from './nav';
import { StoreMenu } from './StoreMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useShell } from './ShellContext';
import { useModKey } from './CommandPalette';
import { Glyph } from '@/components/ui/glyphs';
import { Kbd } from '@/components/ui/Kbd';

/** Live, useful state instead of an icon. Empty when there's nothing to say. */
function useStateSlots(): Record<string, React.ReactNode> {
  const { data } = useDashboard('30d');
  if (!data) return {};
  const slots: Record<string, React.ReactNode> = {};
  if (data.pending.count > 0) {
    slots['/app/orders'] = <span className="tnum text-meta text-caution">{data.pending.count} pending</span>;
  }
  if (data.inventory.out > 0) {
    slots['/app/inventory'] = (
      <span className="tnum inline-flex items-center gap-1.5 text-meta text-critical">
        <Mark kind="diamond" />
        {data.inventory.out} out
      </span>
    );
  } else if (data.inventory.low > 0) {
    slots['/app/inventory'] = <span className="tnum text-meta text-caution">{data.inventory.low} low</span>;
  }
  return slots;
}

function NavLink({
  item,
  active,
  slot,
  layoutGroup,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  slot?: React.ReactNode;
  layoutGroup: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'relative flex h-[30px] items-center justify-between rounded-sm px-2.5 text-cell transition-colors duration-instant',
        active ? 'font-strong text-ink' : 'text-ink-2 hover:bg-well/70 hover:text-ink'
      )}
    >
      {active ? (
        <motion.span
          layoutId={`${layoutGroup}-active`}
          className="absolute inset-0 rounded-sm bg-sheet shadow-raise"
          transition={{ duration: duration.quick, ease: ease.inOut }}
        />
      ) : null}
      <span className="relative">{item.label}</span>
      {slot ? <span className="relative font-regular">{slot}</span> : null}
    </Link>
  );
}

/** Status lives once, here, instead of under every page title. */
function SyncStatus() {
  const { store } = useStore();
  const queryClient = useQueryClient();
  const fetching = useIsFetching({ queryKey: [store.id] }) > 0;
  const { dataUpdatedAt, isError } = useDashboard('30d');

  const refresh = () => queryClient.invalidateQueries({ queryKey: [store.id] });

  if (isError) {
    return (
      <span className="flex items-center gap-2 text-meta text-critical">
        <Mark kind="diamond" />
        Can&apos;t reach the store
        <button type="button" onClick={refresh} className="text-accent hover:underline">
          Retry
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-meta text-ink-3" aria-live="polite">
      {fetching ? (
        <span aria-hidden className="h-1.5 w-1.5 animate-spin rounded-full border-[1.5px] border-accent border-r-transparent motion-reduce:animate-none" />
      ) : (
        <Mark kind="solid-positive" />
      )}
      <span className="min-w-0 flex-1 truncate">
        {fetching
          ? 'Updating…'
          : dataUpdatedAt
            ? `Updated ${formatTime(new Date(dataUpdatedAt).toISOString())}`
            : 'Connected'}
      </span>
      {!fetching ? (
        <button type="button" onClick={refresh} className="text-ink-3 hover:text-ink" aria-label="Refresh store data">
          Refresh
        </button>
      ) : null}
    </span>
  );
}

export function Sidebar({
  onNavigate,
  layoutGroup = 'sidebar',
  className,
}: {
  onNavigate?: () => void;
  layoutGroup?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const slots = useStateSlots();
  const { openPalette } = useShell();
  const mod = useModKey();

  return (
    <nav aria-label="Primary" className={cn('flex h-full flex-col bg-rail px-3 py-3.5', className)}>
      <StoreMenu />

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openPalette();
        }}
        className="mt-3 flex h-8 items-center gap-2 rounded-sm bg-well px-2.5 text-cell text-ink-3 shadow-[inset_0_0_0_1px_rgb(var(--line))] hover:text-ink-2"
      >
        <Glyph name="search" size={13} />
        <span className="flex-1 text-left">Search or ask…</span>
        <Kbd>{mod}K</Kbd>
      </button>

      <div className="mt-3 flex flex-col">
        {NAV.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            {group.label ? (
              <div className="px-2.5 pb-1.5 pt-[18px] text-label uppercase text-ink-3">{group.label}</div>
            ) : null}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                slot={slots[item.href]}
                layoutGroup={layoutGroup}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-3">
        <SyncStatus />
        <NavLink
          item={SETTINGS_ITEM}
          active={isActive(pathname, SETTINGS_ITEM.href)}
          layoutGroup={layoutGroup}
          onNavigate={onNavigate}
        />
        <ThemeSwitcher className="self-start" />
      </div>
    </nav>
  );
}
