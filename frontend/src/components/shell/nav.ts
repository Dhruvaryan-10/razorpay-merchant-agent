export interface NavItem {
  href: string;
  label: string;
  /** Two-key shortcut shown in the command palette, e.g. "g o". */
  keys: string;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

/**
 * Overview stands alone as home; Operations holds the record-keeping work;
 * Intelligence holds the Agent. Settings lives in the sidebar footer.
 */
export const NAV: NavGroup[] = [
  { label: null, items: [{ href: '/app', label: 'Overview', keys: 'g h' }] },
  {
    label: 'Operations',
    items: [
      { href: '/app/orders', label: 'Orders', keys: 'g o' },
      { href: '/app/products', label: 'Products', keys: 'g p' },
      { href: '/app/inventory', label: 'Inventory', keys: 'g i' },
      { href: '/app/customers', label: 'Customers', keys: 'g c' },
    ],
  },
  { label: 'Intelligence', items: [{ href: '/app/agent', label: 'Agent', keys: 'g a' }] },
];

export const SETTINGS_ITEM: NavItem = { href: '/app/settings', label: 'Settings', keys: 'g s' };

export const ALL_NAV_ITEMS = [...NAV.flatMap((g) => g.items), SETTINGS_ITEM];

export function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(`${href}/`);
}
