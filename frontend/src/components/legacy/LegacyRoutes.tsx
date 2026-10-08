'use client';

// Transitional route bodies for pages not yet rebuilt. Each export is removed
// as its Ledger view lands.
import { AgentPage, CustomersPage, InventoryPage, OrdersPage, ProductsPage } from './AppLayout';
import { LegacyPage } from './LegacyPage';

export const LegacyOrders = () => <LegacyPage title="Orders" render={(store) => <OrdersPage store={store} />} />;
export const LegacyProducts = () => <LegacyPage title="Products" render={(store) => <ProductsPage store={store} />} />;
export const LegacyInventory = () => <LegacyPage title="Inventory" render={(store) => <InventoryPage store={store} />} />;
export const LegacyCustomers = () => <LegacyPage title="Customers" render={(store) => <CustomersPage store={store} />} />;
export const LegacyAgent = () => <LegacyPage title="Agent" render={(store) => <AgentPage store={store} />} />;
