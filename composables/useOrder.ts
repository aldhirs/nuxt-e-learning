import { useOrderStore } from '~/stores/order'
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import type { Order } from '~/types'

const STORAGE_KEY = 'ds_current_order'

/**
 * useOrder — composable yang dipakai halaman /orders/[n]/payment/* untuk
 * mengakses order yang sedang dibayar. Strategi:
 *   1) Pakai snapshot di Pinia store (`orderStore.currentOrder`) kalau slug
 *      cocok dengan order_number param. Snapshot ini di-stamp oleh
 *      /checkout setelah createOrder sukses.
 *   2) Fallback re-hydrate dari localStorage (Pinia hilang setelah refresh).
 *   3) Kalau keduanya miss, lazy-fetch via ordersApi.getMyOrder() dan
 *      simpan ke store agar pages payment berikutnya tidak refetch.
 *
 * Note: payment subpages (PRD #3) hanya butuh metadata order — bukan
 * source-of-truth. Untuk detail authoritative pakai /orders/[n]
 * (pages/orders/[order_number]/index.vue) yang fetch langsung dari BE.
 */
export function useOrder(orderNumber: Ref<string> | ComputedRef<string>) {
  const orderStore = useOrderStore()
  const ordersApi = useOrdersApi()

  // Re-sync dari localStorage saat client mount (Pinia kosong setelah refresh).
  if (import.meta.client && !orderStore.currentOrder) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Order
        if (saved?.order_number) orderStore.setOrder(saved)
      }
    } catch {}
  }

  // Lazy-fetch trigger: kalau store empty/mismatch dan kita di client, fire
  // satu request ke /orders/{n} dan stamp ke store. Tidak diblokir suspense.
  if (import.meta.client) {
    const num = unref(orderNumber)
    const cached = orderStore.currentOrder
    if (num && (!cached || cached.order_number !== num)) {
      ordersApi.getMyOrder(num).then(order => {
        if (order) orderStore.setOrder(order)
      }).catch(() => { /* 401/404 ditangani caller via watch */ })
    }
  }

  return computed<Order | null>(() => {
    const num = unref(orderNumber)
    const cached = orderStore.currentOrder
    return cached?.order_number === num ? cached : null
  })
}
