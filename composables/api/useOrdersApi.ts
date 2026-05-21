import type {
  CancelOrderRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderListItem,
  Paginated
} from '~/types'

export interface OrderListFilters {
  status?: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'
  limit?: number
  offset?: number
}

function cleanQuery(filters: OrderListFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v as string | number
  }
  return out
}

export function useOrdersApi() {
  const api = useApi()

  return {
    // POST /api/v1/public/orders — hybrid auth (JWT optional). Contract drift:
    // PRD #2 contract menyebut path /orders, BE deployed pakai /public/orders.
    createOrder(body: CreateOrderRequest) {
      return api.post<CreateOrderResponse>('/public/orders', body)
    },
    // GET /api/v1/orders (JWT required).
    listMyOrders(filters: OrderListFilters = {}) {
      return api.get<Paginated<OrderListItem>>('/orders', { query: cleanQuery(filters) })
    },
    getMyOrder(orderNumber: string) {
      return api.get<Order>(`/orders/${encodeURIComponent(orderNumber)}`)
    },
    cancelMyOrder(orderNumber: string, body: CancelOrderRequest = {}) {
      return api.post<Order>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, body)
    }
  }
}
