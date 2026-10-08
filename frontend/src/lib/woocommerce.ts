import type { Store } from '@/types';

/**
 * Links into the store's own WooCommerce admin, where changes are made.
 * The workspace is read-only, so these are the honest "act" buttons.
 * Demo stores have no admin, so they return null.
 */
function adminBase(store: Store) {
  if (store.mode !== 'live' || !store.store_url) return null;
  return `${store.store_url.replace(/\/+$/, '')}/wp-admin`;
}

export function adminOrderUrl(store: Store, orderId: number) {
  const base = adminBase(store);
  return base ? `${base}/post.php?post=${orderId}&action=edit` : null;
}

export function adminProductUrl(store: Store, productId: number) {
  const base = adminBase(store);
  return base ? `${base}/post.php?post=${productId}&action=edit` : null;
}

export function adminCustomerUrl(store: Store, customerId: number) {
  const base = adminBase(store);
  return base ? `${base}/user-edit.php?user_id=${customerId}` : null;
}
