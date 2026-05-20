import { dummyOrders } from '~/data/dummy'
import { useOrderStore } from '~/stores/order'
import type { Order } from '~/types'

const STORAGE_KEY = 'ds_current_order'

export function useOrder(orderNumber: Ref<string> | ComputedRef<string>) {
  const orderStore = useOrderStore()

  // After SSR hydration the Pinia state starts from the server snapshot (null).
  // Re-sync from localStorage so orders created at checkout survive a refresh.
  if (import.meta.client && !orderStore.currentOrder) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Order
        if (saved?.order_number) orderStore.setOrder(saved)
      }
    } catch {}
  }

  return computed<Order | null>(() => {
    const num = unref(orderNumber)
    return (
      dummyOrders.find(o => o.order_number === num) ??
      (orderStore.currentOrder?.order_number === num ? orderStore.currentOrder : null)
    )
  })
}
