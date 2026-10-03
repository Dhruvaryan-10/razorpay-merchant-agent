export interface Store {
  id: string;
  name: string;
  store_url?: string;
  provider: string;
  mode: "live" | "demo";
  status: "connected" | "disconnected" | "error";
  last_synced_at?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  external_id: number;
  status: string;
  total: number;
  currency: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  payment_method?: string;
  line_items?: LineItem[];
  billing_address?: any;
  shipping_address?: any;
  created_at: string;
}

export interface LineItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

export interface Product {
  id: string;
  external_id: number;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  stock_quantity: number;
  stock_status: string;
  status: string;
  categories?: any[];
  created_at: string;
}

export interface Customer {
  id: string;
  external_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: any;
  total_spent: number;
  order_count: number;
  created_at: string;
}

export interface ToolExecution {
  name: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  duration_ms: number;
}

export interface AgentResponse {
  query: string;
  result: string;
  tools: ToolExecution[];
  total_duration_ms: number;
  created_at: string;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  pending_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_products: number;
  total_customers: number;
}

export interface Dashboard {
  store: Store;
  metrics: DashboardMetrics;
  recent_orders: Order[];
  insights: string[];
}

export interface InventorySummary {
  total_products: number;
  healthy_stock: number;
  low_stock: number;
  out_of_stock: number;
}

export interface InventoryStatus {
  summary: InventorySummary;
  by_status: {
    healthy: Product[];
    low_stock: Product[];
    out_of_stock: Product[];
  };
  low_stock_threshold: number;
}
