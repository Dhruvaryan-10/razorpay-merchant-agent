'use client';

// Transitional route bodies for pages not yet rebuilt. Each export is removed
// as its Ledger view lands.
import { AgentPage, CustomersPage, InventoryPage } from './AppLayout';
import { LegacyPage } from './LegacyPage';

export const LegacyInventory = () => <LegacyPage title="Inventory" render={(store) => <InventoryPage store={store} />} />;
export const LegacyCustomers = () => <LegacyPage title="Customers" render={(store) => <CustomersPage store={store} />} />;
export const LegacyAgent = () => <LegacyPage title="Agent" render={(store) => <AgentPage store={store} />} />;
