import { Store } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || error.message || 'API call failed');
  }

  return response.json();
}

export const api = {
  // Stores
  createDemoStore: () =>
    apiCall<Store>('/api/stores/demo', { method: 'POST' }),

  connectWooCommerce: (store_url: string, consumer_key: string, consumer_secret: string) =>
    apiCall<Store>('/api/stores/connect', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch(() =>
      // Fallback to query params
      apiCall<Store>(`/api/stores/connect?store_url=${encodeURIComponent(store_url)}&consumer_key=${encodeURIComponent(consumer_key)}&consumer_secret=${encodeURIComponent(consumer_secret)}`, {
        method: 'POST',
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
    apiCall<any>(`/api/dashboard${storeId ? `?store_id=${storeId}` : ''}`),

  // Orders
  listOrders: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return apiCall<any>(`/api/orders?${query.toString()}`);
  },

  getOrder: (orderId: number, storeId?: string) =>
    apiCall<any>(`/api/orders/${orderId}${storeId ? `?store_id=${storeId}` : ''}`),

  // Products
  listProducts: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    stock_status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return apiCall<any>(`/api/products?${query.toString()}`);
  },

  getProduct: (productId: number, storeId?: string) =>
    apiCall<any>(`/api/products/${productId}${storeId ? `?store_id=${storeId}` : ''}`),

  // Inventory
  getInventory: (storeId?: string) =>
    apiCall<any>(`/api/inventory${storeId ? `?store_id=${storeId}` : ''}`),

  // Customers
  listCustomers: (params: {
    store_id?: string;
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return apiCall<any>(`/api/customers?${query.toString()}`);
  },

  getCustomer: (customerId: number, storeId?: string) =>
    apiCall<any>(`/api/customers/${customerId}${storeId ? `?store_id=${storeId}` : ''}`),

  // Agent
  agentQuery: (query: string, storeId?: string) =>
    apiCall<any>('/api/agent/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }).then(res => storeId ? { ...res, store_id: storeId } : res),

  getAgentExecutions: (storeId?: string, limit?: number) =>
    apiCall<any>(`/api/agent/executions${storeId ? `?store_id=${storeId}${limit ? `&limit=${limit}` : ''}` : ''}`),
};
