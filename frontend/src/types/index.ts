// Shapes returned by the FastAPI backend (backend/app/api/routes.py).

export interface Store {
  id: string;
  name: string;
  store_url?: string | null;
  provider: string;
  mode: 'live' | 'demo';
  status: 'connected' | 'disconnected' | 'error';
  last_synced_at?: string | null;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed'
  | (string & {});

export interface Order {
  id: string;
  order_number: string;
  external_id: number;
  status: OrderStatus;
  total: number;
  currency: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  payment_method_title: string;
  item_count: number;
  created_at: string | null;
}

export interface LineItem {
  product_id: number | null;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  name: string;
}

export interface Address {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface OrderDetail extends Order {
  billing_address: Address;
  shipping_address: Address;
  line_items: LineItem[];
}

export type StockLevel = 'healthy' | 'low' | 'out' | 'untracked';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: string;
  external_id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number | null;
  stock_status: string;
  stock_level: StockLevel;
  status: string;
  categories: Category[];
  image: string | null;
  permalink?: string | null;
  created_at: string | null;
}

export interface ProductDetail extends Product {
  images: { src: string; alt?: string }[];
}

export interface Customer {
  id: string;
  external_id: number;
  name: string;
  email: string;
  phone: string;
  address: Address;
  total_spent: number;
  order_count: number;
  created_at: string | null;
}

export interface Page<T> {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  items: T[];
}

export interface PeriodSummary {
  net_revenue: number;
  orders: number;
  paid_orders: number;
  average_order: number;
  items_sold: number;
  unique_buyers: number;
}

export interface SeriesPoint {
  start: string;
  revenue: number;
  orders: number;
  prev_revenue: number;
}

export type PeriodKey = 'today' | '7d' | '30d' | '90d';

export interface AtRiskProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number | null;
  stock_level: StockLevel;
  pending_units: number;
  pending_orders: number;
}

export interface Dashboard {
  store: Pick<Store, 'id' | 'name' | 'mode' | 'status'>;
  metrics: {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    pending_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_products: number;
    total_customers: number;
  };
  period: {
    key: PeriodKey;
    start: string;
    end: string;
    current: PeriodSummary;
    previous: PeriodSummary;
    status_breakdown: { status: OrderStatus; count: number; value: number }[];
    series: SeriesPoint[];
  };
  pending: { count: number; value: number; oldest: Order | null };
  inventory: {
    threshold: number;
    total: number;
    low: number;
    out: number;
    at_risk: AtRiskProduct[];
  };
  coverage: { orders_scanned: number; orders_truncated: boolean; products_truncated: boolean };
  recent_orders: Order[];
  insights: string[];
}

export interface InventoryStatus {
  summary: {
    total_products: number;
    healthy_stock: number;
    low_stock: number;
    out_of_stock: number;
    untracked: number;
  };
  by_status: {
    healthy: Product[];
    low_stock: Product[];
    out_of_stock: Product[];
    untracked: Product[];
  };
  low_stock_threshold: number;
  truncated: boolean;
}

export interface ToolExecution {
  name: string;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  duration_ms: number;
}

export type AgentIntent =
  | 'high_value_pending_orders'
  | 'pending_orders'
  | 'low_stock_products'
  | 'out_of_stock'
  | 'recent_customers'
  | 'search_order_by_number'
  | 'search_product'
  | 'search_customer'
  | 'todays_sales';

export interface AgentResponse {
  query: string;
  intent: AgentIntent | null;
  params: Record<string, string | number>;
  result: string;
  tools: ToolExecution[];
  total_duration_ms: number;
}

export interface AgentExecution {
  id: string;
  query: string;
  status: string;
  duration_ms: number | null;
  created_at: string;
}
