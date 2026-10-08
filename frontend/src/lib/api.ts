import { Store } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || error.message || 'API call failed');
  }

  return response.json();
}

function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

// Create endpoints return { store_id, ... }; resolve the full store record so
// every later call is scoped to this store rather than the backend's default.
async function resolveCreatedStore(created: Promise<{ store_id: string }>) {
  const { store_id } = await created;
  return apiCall<Store>(`/api/stores/${store_id}`);
}

export const api = {
  // Stores
  createDemoStore: () =>
    resolveCreatedStore(apiCall<{ store_id: string }>('/api/stores/demo', { method: 'POST' })),

  // Credentials travel in the JSON body only, never in the URL.
  connectWooCommerce: (store_url: string, consumer_key: string, consumer_secret: string) =>
    resolveCreatedStore(
      apiCall<{ store_id: string }>('/api/stores/connect', {
        method: 'POST',
        body: JSON.stringify({ store_url, consumer_key, consumer_secret }),
      })
    ),

  listStores: () =>
    apiCall<{ stores: Store[] }>('/api/stores'),

  getStore: (storeId: string) =>
    apiCall<Store>(`/api/stores/${storeId}`),

  deleteStore: (storeId: string) =>
    apiCall<void>(`/api/stores/${storeId}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: (storeId?: string) =>
    apiCall<any>(withQuery('/api/dashboard', { store_id: storeId })),

  // Orders
  listOrders: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }) => apiCall<any>(withQuery('/api/orders', params)),

  getOrder: (orderId: number, storeId?: string) =>
    apiCall<any>(withQuery(`/api/orders/${orderId}`, { store_id: storeId })),

  // Products
  listProducts: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    stock_status?: string;
    search?: string;
  }) => apiCall<any>(withQuery('/api/products', params)),

  getProduct: (productId: number, storeId?: string) =>
    apiCall<any>(withQuery(`/api/products/${productId}`, { store_id: storeId })),

  // Inventory
  getInventory: (storeId?: string) =>
    apiCall<any>(withQuery('/api/inventory', { store_id: storeId })),

  // Customers
  listCustomers: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    search?: string;
  }) => apiCall<any>(withQuery('/api/customers', params)),

  getCustomer: (customerId: number, storeId?: string) =>
    apiCall<any>(withQuery(`/api/customers/${customerId}`, { store_id: storeId })),

  // Agent: store_id is sent with the request so the query runs against this store.
  agentQuery: (query: string, storeId?: string) =>
    apiCall<any>(withQuery('/api/agent/query', { store_id: storeId }), {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getAgentExecutions: (storeId?: string, limit?: number) =>
    apiCall<any>(withQuery('/api/agent/executions', { store_id: storeId, limit })),
};
