'use client';

import { useState, useEffect } from 'react';
import { Order, Product, Customer, Dashboard as DashboardType, InventoryStatus, AgentResponse } from '@/types';
import { legacyApi as api } from './legacyApi';
import { formatCurrency, formatDate, getStatusBadgeColor, getStatusText } from '@/lib/utils';
import {
  Package, ShoppingCart, Users, Search, ChevronRight, Loader, Eye, ChevronLeft
} from 'lucide-react';


// Dashboard page
export function OverviewPage({ store }: any) {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await api.getDashboard(store.id);
        setDashboard(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [store.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-4 text-center text-secondary">Failed to load dashboard</div>;
  }

  const metrics = [
    { label: 'Revenue', value: formatCurrency(dashboard.metrics.total_revenue), icon: '💰' },
    { label: 'Orders', value: dashboard.metrics.total_orders.toString(), icon: '📦' },
    { label: 'Pending', value: dashboard.metrics.pending_orders.toString(), icon: '⏳' },
    { label: 'Low Stock', value: dashboard.metrics.low_stock_count.toString(), icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">{store.name}</h1>
        <p className="text-secondary mt-1">
          {store.mode === 'demo' ? 'Demo Environment' : 'WooCommerce'} • <span className="text-success">● Connected</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="card">
            <p className="text-label mb-2">{metric.label}</p>
            <p className="text-2xl font-bold text-primary">{metric.value}</p>
            <p className="text-3xl mt-2">{metric.icon}</p>
          </div>
        ))}
      </div>

      {dashboard.insights && dashboard.insights.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-primary mb-2">Insights</h3>
          <ul className="space-y-1">
            {dashboard.insights.map((insight, idx) => insight && (
              <li key={idx} className="text-sm text-secondary flex items-center gap-2">
                <span>•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dashboard.recent_orders && dashboard.recent_orders.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {dashboard.recent_orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 hover:bg-surface rounded">
                <div>
                  <p className="font-medium text-primary">#{order.order_number}</p>
                  <p className="text-sm text-secondary">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{formatCurrency(order.total, order.currency)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Orders page
export function OrdersPage({ store }: any) {
  const [orders, setOrders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await api.listOrders({
          store_id: store.id,
          page,
          per_page: 20,
          status: status || undefined,
          search: search || undefined,
        });
        setOrders(data);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [store.id, page, status, search]);

  if (selectedOrder) {
    return (
      <div className="card max-w-2xl">
        <button
          onClick={() => setSelectedOrder(null)}
          className="flex items-center gap-1 text-accent hover:text-red-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <div className="space-y-4">
          <div className="border-b border-border pb-4">
            <p className="text-label">Order Number</p>
            <p className="text-2xl font-bold text-primary">#{selectedOrder.order_number}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-label">Status</p>
              <span className={`text-sm px-2 py-1 rounded inline-block ${getStatusBadgeColor(selectedOrder.status)}`}>
                {getStatusText(selectedOrder.status)}
              </span>
            </div>
            <div>
              <p className="text-label">Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
            </div>
            <div>
              <p className="text-label">Customer</p>
              <p className="text-primary font-medium">{selectedOrder.customer_name || 'N/A'}</p>
              <p className="text-sm text-secondary">{selectedOrder.customer_email}</p>
            </div>
            <div>
              <p className="text-label">Payment Method</p>
              <p className="text-primary">{selectedOrder.payment_method || 'N/A'}</p>
            </div>
          </div>
          {(selectedOrder as any).line_items && (selectedOrder as any).line_items.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-label mb-2">Items</p>
              <div className="space-y-2">
                {(selectedOrder as any).line_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-surface rounded">
                    <div>
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-sm text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-primary">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-sm text-secondary">
            <p>Created: {formatDate(selectedOrder.created_at ?? '')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-border rounded-lg"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : orders && orders.orders.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-semibold">Order</th>
                  <th className="text-left p-3 text-label font-semibold">Customer</th>
                  <th className="text-left p-3 text-label font-semibold">Status</th>
                  <th className="text-right p-3 text-label font-semibold">Total</th>
                  <th className="text-center p-3 text-label font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium text-primary">#{order.order_number}</td>
                    <td className="p-3 text-secondary">{order.customer_name || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-primary">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-accent hover:text-red-600 transition-colors"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.total_pages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} of {orders.total_pages}
              </span>
              <button
                onClick={() => setPage(Math.min(orders.total_pages, page + 1))}
                disabled={page === orders.total_pages}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12 text-secondary">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
}

// Products page
export function ProductsPage({ store }: any) {
  const [products, setProducts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [stockStatus, setStockStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await api.listProducts({
          store_id: store.id,
          page,
          per_page: 20,
          stock_status: stockStatus || undefined,
          search: search || undefined,
        });
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [store.id, page, stockStatus, search]);

  if (selectedProduct) {
    return (
      <div className="card max-w-2xl">
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-1 text-accent hover:text-red-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">{selectedProduct.name}</h2>
            <p className="text-secondary text-sm">SKU: {selectedProduct.sku || 'N/A'}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-label">Price</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(selectedProduct.price)}</p>
            </div>
            <div>
              <p className="text-label">Stock</p>
              <p className="text-2xl font-bold text-primary">{selectedProduct.stock_quantity}</p>
              <span className={`text-xs px-2 py-1 rounded inline-block ${getStatusBadgeColor(selectedProduct.stock_status)}`}>
                {getStatusText(selectedProduct.stock_status)}
              </span>
            </div>
          </div>
          {selectedProduct.description && (
            <div className="border-t border-border pt-4">
              <p className="text-label mb-2">Description</p>
              <p className="text-secondary text-sm">{selectedProduct.description}</p>
            </div>
          )}
          <div className="text-sm text-secondary">
            <p>Created: {formatDate(selectedProduct.created_at ?? '')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
          />
        </div>
        <select
          value={stockStatus}
          onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-border rounded-lg"
        >
          <option value="">All Stock</option>
          <option value="instock">In Stock</option>
          <option value="lowstock">Low Stock</option>
          <option value="outofstock">Out of Stock</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : products && products.products.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-semibold">Product</th>
                  <th className="text-left p-3 text-label font-semibold">SKU</th>
                  <th className="text-right p-3 text-label font-semibold">Price</th>
                  <th className="text-right p-3 text-label font-semibold">Stock</th>
                  <th className="text-left p-3 text-label font-semibold">Status</th>
                  <th className="text-center p-3 text-label font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.products.map((product: Product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium text-primary">{product.name}</td>
                    <td className="p-3 text-secondary text-xs">{product.sku || '-'}</td>
                    <td className="p-3 text-right font-medium text-primary">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="p-3 text-right font-medium text-primary">
                      {product.stock_quantity}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(product.stock_status)}`}>
                        {getStatusText(product.stock_status)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-accent hover:text-red-600 transition-colors"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.total_pages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} of {products.total_pages}
              </span>
              <button
                onClick={() => setPage(Math.min(products.total_pages, page + 1))}
                disabled={page === products.total_pages}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12 text-secondary">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No products found</p>
        </div>
      )}
    </div>
  );
}

// Inventory page
export function InventoryPage({ store }: any) {
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await api.getInventory(store.id);
        setInventory(data);
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [store.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!inventory) {
    return <div className="card text-center py-12 text-secondary">Failed to load inventory</div>;
  }

  const statusCards = [
    { label: 'Healthy Stock', count: inventory.summary.healthy_stock, color: 'bg-green-100 text-green-800' },
    { label: 'Low Stock', count: inventory.summary.low_stock, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Out of Stock', count: inventory.summary.out_of_stock, color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Inventory</h1>
        <p className="text-secondary mt-1">
          Total: {inventory.summary.total_products} products • Low stock threshold: {inventory.low_stock_threshold}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {statusCards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-label mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-primary">{card.count}</p>
          </div>
        ))}
      </div>

      {inventory.by_status.low_stock.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Low Stock Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-semibold">Product</th>
                  <th className="text-left p-3 text-label font-semibold">SKU</th>
                  <th className="text-right p-3 text-label font-semibold">Stock</th>
                  <th className="text-right p-3 text-label font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {inventory.by_status.low_stock.slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium text-primary">{product.name}</td>
                    <td className="p-3 text-secondary text-xs">{product.sku || '-'}</td>
                    <td className="p-3 text-right text-yellow-600 font-semibold">{product.stock_quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inventory.by_status.out_of_stock.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-primary mb-4">Out of Stock</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-semibold">Product</th>
                  <th className="text-left p-3 text-label font-semibold">SKU</th>
                  <th className="text-right p-3 text-label font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {inventory.by_status.out_of_stock.slice(0, 10).map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium text-primary">{product.name}</td>
                    <td className="p-3 text-secondary text-xs">{product.sku || '-'}</td>
                    <td className="p-3 text-right">{formatCurrency(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Customers page
export function CustomersPage({ store }: any) {
  const [customers, setCustomers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        const data = await api.listCustomers({
          store_id: store.id,
          page,
          per_page: 20,
          search: search || undefined,
        });
        setCustomers(data);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [store.id, page, search]);

  if (selectedCustomer) {
    return (
      <div className="card max-w-2xl">
        <button
          onClick={() => setSelectedCustomer(null)}
          className="flex items-center gap-1 text-accent hover:text-red-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-primary">{selectedCustomer.name}</h2>
            <p className="text-secondary text-sm">{selectedCustomer.email || 'No email'}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-label">Total Orders</p>
              <p className="text-2xl font-bold text-primary">{selectedCustomer.order_count}</p>
            </div>
            <div>
              <p className="text-label">Total Spent</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(selectedCustomer.total_spent)}</p>
            </div>
          </div>
          {selectedCustomer.phone && (
            <div className="border-t border-border pt-4">
              <p className="text-label mb-2">Contact</p>
              <p className="text-secondary text-sm">{selectedCustomer.phone}</p>
            </div>
          )}
          <div className="text-sm text-secondary">
            <p>Member since: {formatDate(selectedCustomer.created_at ?? '')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : customers && customers.customers.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-semibold">Customer</th>
                  <th className="text-left p-3 text-label font-semibold">Email</th>
                  <th className="text-right p-3 text-label font-semibold">Orders</th>
                  <th className="text-right p-3 text-label font-semibold">Total Spent</th>
                  <th className="text-center p-3 text-label font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.customers.map((customer: Customer) => (
                  <tr key={customer.id} className="border-b border-border hover:bg-surface">
                    <td className="p-3 font-medium text-primary">{customer.name}</td>
                    <td className="p-3 text-secondary text-xs">{customer.email || '-'}</td>
                    <td className="p-3 text-right font-medium text-primary">{customer.order_count}</td>
                    <td className="p-3 text-right font-medium text-primary">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-accent hover:text-red-600 transition-colors"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customers.total_pages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} of {customers.total_pages}
              </span>
              <button
                onClick={() => setPage(Math.min(customers.total_pages, page + 1))}
                disabled={page === customers.total_pages}
                className="px-3 py-1 rounded border border-border hover:bg-surface disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12 text-secondary">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No customers found</p>
        </div>
      )}
    </div>
  );
}

// Agent page
export function AgentPage({ store }: any) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const suggestedQueries = [
    "Today's sales",
    "Find pending orders",
    "Show low-stock products",
    "Find orders above ₹2,000",
    "Show recent customers",
  ];

  const handleQuery = async (q: string) => {
    setQuery(q);
    setLoading(true);
    setResponse(null);
    try {
      const result = await api.agentQuery(q, store.id);
      setResponse(result);
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-primary">Merchant Agent</h1>
        <p className="text-secondary mt-1">Ask questions about your store</p>
      </div>

      <div className="card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) handleQuery(query);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about orders, products, inventory or customers..."
            className="flex-1"
          />
          <button type="submit" className="button button-primary">
            Send
          </button>
        </form>
      </div>

      {!response && (
        <div className="card">
          <p className="text-label mb-3">Suggested prompts:</p>
          <div className="grid md:grid-cols-2 gap-2">
            {suggestedQueries.map((sq) => (
              <button
                key={sq}
                onClick={() => handleQuery(sq)}
                className="text-left px-3 py-2 bg-surface hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 text-accent animate-spin" />
        </div>
      )}

      {response && (
        <div className="card space-y-4">
          <div>
            <p className="text-label mb-1">Query</p>
            <p className="text-primary font-medium">{response.query}</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-primary font-medium">{response.result}</p>
          </div>

          {response.tools && response.tools.length > 0 && (
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-accent hover:text-red-600"
              >
                <span className="font-medium">Execution</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {response.tools.map((tool, idx) => (
                    <div key={idx} className="p-2 bg-surface rounded-lg text-sm">
                      <div className="flex items-center gap-2 font-medium text-primary mb-1">
                        <span className="text-success">✓</span>
                        {tool.name}
                      </div>
                      {tool.input && (
                        <p className="text-xs text-secondary ml-5">
                          {Object.entries(tool.input).map(([k, v]) => `${k}=${v}`).join(' • ')}
                        </p>
                      )}
                      <p className="text-xs text-secondary ml-5">~{tool.duration_ms}ms</p>
                    </div>
                  ))}
                  <p className="text-xs text-secondary mt-2">
                    Total: {response.total_duration_ms}ms
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

