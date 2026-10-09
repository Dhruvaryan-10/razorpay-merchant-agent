'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, type CustomerQuery, type OrderQuery, type ProductQuery } from '@/lib/api';
import type { PeriodKey } from '@/types';
import { useStore } from './useStore';

/**
 * Query hooks. Every key starts with the store id so switching stores never
 * shows another store's records. List queries keep the previous page visible
 * (dimmed by the view) while the next one loads, instead of blanking.
 */

export function useDashboard(period: PeriodKey) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'dashboard', period],
    queryFn: () => api.getDashboard(store.id, period),
    placeholderData: keepPreviousData,
  });
}

export function useOrders(params: OrderQuery, enabled = true) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'orders', params],
    queryFn: () => api.listOrders(store.id, params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOrder(orderId: number | null) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'order', orderId],
    queryFn: () => api.getOrder(store.id, orderId as number),
    enabled: orderId !== null,
  });
}

/** Per-status totals for the Orders tabs: one request per status, 1 row each. */
export function useOrderCounts(statuses: readonly string[]) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'order-counts', statuses],
    queryFn: async () => {
      const entries = await Promise.all(
        ['', ...statuses].map(async (status) => {
          const page = await api.listOrders(store.id, { status: status || undefined, per_page: 1 });
          return [status || 'all', page.total] as const;
        })
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });
}

export function useProducts(params: ProductQuery, enabled = true) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'products', params],
    queryFn: () => api.listProducts(store.id, params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProduct(productId: number | null) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'product', productId],
    queryFn: () => api.getProduct(store.id, productId as number),
    enabled: productId !== null,
  });
}

export function useInventory() {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'inventory'],
    queryFn: () => api.getInventory(store.id),
  });
}

export function useCustomers(params: CustomerQuery, enabled = true) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'customers', params],
    queryFn: () => api.listCustomers(store.id, params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCustomer(customerId: number | null) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'customer', customerId],
    queryFn: () => api.getCustomer(store.id, customerId as number),
    enabled: customerId !== null,
  });
}

export function useAgentExecutions(limit = 10) {
  const { store } = useStore();
  return useQuery({
    queryKey: [store.id, 'agent-executions', limit],
    queryFn: () => api.getAgentExecutions(store.id, limit),
  });
}
