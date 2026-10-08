// Transitional adapter: the pre-Ledger screens call the old api shape.
// Delete together with AppLayout.tsx once every page is rebuilt.
import { api } from '@/lib/api';

type ListParams = { store_id?: string; page?: number; per_page?: number; status?: string; stock_status?: string; search?: string };

export const legacyApi = {
  createDemoStore: api.createDemoStore,
  connectWooCommerce: api.connectWooCommerce,
  listStores: () => api.listStores().then((stores) => ({ stores })),
  deleteStore: api.deleteStore,
  getDashboard: (storeId: string) => api.getDashboard(storeId, '30d'),
  listOrders: ({ store_id, ...params }: ListParams) =>
    api.listOrders(store_id as string, params).then((p) => ({ ...p, orders: p.items })),
  listProducts: ({ store_id, ...params }: ListParams) =>
    api.listProducts(store_id as string, params).then((p) => ({ ...p, products: p.items })),
  getInventory: (storeId: string) => api.getInventory(storeId),
  listCustomers: ({ store_id, ...params }: ListParams) =>
    api.listCustomers(store_id as string, params).then((p) => ({ ...p, customers: p.items })),
  agentQuery: (query: string, storeId: string) => api.agentQuery(storeId, query),
};
