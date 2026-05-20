import type { Order } from '~/types'

const STORAGE_KEY = 'ds_current_order'

function loadFromStorage(): Order | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order) : null
  } catch {
    return null
  }
}

export const useOrderStore = defineStore('order', () => {
  const currentOrder = ref<Order | null>(loadFromStorage())

  function setOrder(order: Order) {
    currentOrder.value = order
    if (import.meta.client) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)) } catch {}
    }
  }

  function clearOrder() {
    currentOrder.value = null
    if (import.meta.client) {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }

  return { currentOrder, setOrder, clearOrder }
})
