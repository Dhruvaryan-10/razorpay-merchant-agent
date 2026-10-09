import type {
  AgentExecution,
  AgentResponse,
  Customer,
  Dashboard,
  InventoryStatus,
  Order,
  OrderDetail,
  Page,
  PeriodKey,
  Product,
  ProductDetail,
  Store,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError("Can't reach the merchant service. Check that the backend is running.", 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === 'string' ? body.detail : undefined;
    throw new ApiError(detail || body.message || `Request failed (${response.status})`, response.status);
  }

  return response.json();
}

type Params = Record<string, string | number | undefined | null>;

function withQuery(path: string, params: Params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
  });
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

interface RawPage {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function toPage<T>(raw: RawPage, items: T[]): Page<T> {
  return {
    total: raw.total,
    page: raw.page,
    per_page: raw.per_page,
    total_pages: raw.total_pages,
    items,
  };
}

// Create endpoints return { store_id, ... }; resolve the full store record so
// every later call is scoped to this store rather than the backend's default.
async function resolveCreatedStore(created: Promise<{ store_id: string }>) {
  const { store_id } = await created;
  return apiCall<Store>(`/api/stores/${store_id}`);
}

export interface OrderQuery {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  customer_id?: number;
  /** Orders worth at least this amount. */
  min_total?: number;
}

export interface ProductQuery {
  page?: number;
  per_page?: number;
  /** low | out | healthy: the shared stock definition */
  stock_status?: string;
  search?: string;
}

export interface CustomerQuery {
  page?: number;
  per_page?: number;
  search?: string;
}

export const api = {
  // Stores
  createDemoStore: () =>
    resolveCreatedStore(apiCall<{ store_id: string }>('/api/stores/demo', { method: 'POST' })),

  /** Credentials travel in the JSON body only, never in the URL. */
  connectWooCommerce: (store_url: string, consumer_key: string, consumer_secret: string) =>
    resolveCreatedStore(
      apiCall<{ store_id: string }>('/api/stores/connect', {
        method: 'POST',
        body: JSON.stringify({ store_url, consumer_key, consumer_secret }),
      })
    ),

  listStores: () => apiCall<{ stores: Store[] }>('/api/stores').then((r) => r.stores),

  getStore: (storeId: string) => apiCall<Store>(`/api/stores/${storeId}`),

  deleteStore: (storeId: string) =>
    apiCall<{ message: string }>(`/api/stores/${storeId}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: (storeId: string, period: PeriodKey) =>
    apiCall<Dashboard>(withQuery('/api/dashboard', { store_id: storeId, period })),

  // Orders
  listOrders: (storeId: string, params: OrderQuery) =>
    apiCall<RawPage & { orders: Order[] }>(
      withQuery('/api/orders', { store_id: storeId, ...params })
    ).then((r) => toPage(r, r.orders)),

  getOrder: (storeId: string, orderId: number) =>
    apiCall<OrderDetail>(withQuery(`/api/orders/${orderId}`, { store_id: storeId })),

  // Products
  listProducts: (storeId: string, params: ProductQuery) =>
    apiCall<RawPage & { products: Product[] }>(
      withQuery('/api/products', { store_id: storeId, ...params })
    ).then((r) => toPage(r, r.products)),

  getProduct: (storeId: string, productId: number) =>
    apiCall<ProductDetail>(withQuery(`/api/products/${productId}`, { store_id: storeId })),

  // Inventory
  getInventory: (storeId: string) =>
    apiCall<InventoryStatus>(withQuery('/api/inventory', { store_id: storeId })),

  // Customers
  listCustomers: (storeId: string, params: CustomerQuery) =>
    apiCall<RawPage & { customers: Customer[] }>(
      withQuery('/api/customers', { store_id: storeId, ...params })
    ).then((r) => toPage(r, r.customers)),

  getCustomer: (storeId: string, customerId: number) =>
    apiCall<Customer>(withQuery(`/api/customers/${customerId}`, { store_id: storeId })),

  // Agent: store_id is sent with the request so the query runs against this store.
  agentQuery: (storeId: string, query: string) =>
    apiCall<AgentResponse>(withQuery('/api/agent/query', { store_id: storeId }), {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getAgentExecutions: (storeId: string, limit = 10) =>
    apiCall<{ executions: AgentExecution[] }>(
      withQuery('/api/agent/executions', { store_id: storeId, limit })
    ).then((r) => r.executions),
};
