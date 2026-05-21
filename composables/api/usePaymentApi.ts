import type {
  InitiatePaymentRequest,
  PaymentSession,
  PaymentStatusSnapshot
} from '~/types'

export function usePaymentApi() {
  const api = useApi()

  return {
    // POST /api/v1/orders/{order_number}/payment/initiate.
    // BE return shape per contract: `data` berisi semua field channel
    // (VA / QRIS / e-wallet) — useApi sudah unwrap envelope, jadi return type
    // langsung PaymentSession (union). Caller discriminate via payment_method.
    initiate(orderNumber: string, body: InitiatePaymentRequest) {
      return api.post<PaymentSession>(
        `/orders/${encodeURIComponent(orderNumber)}/payment/initiate`,
        body
      )
    },
    // GET /api/v1/payments/{order_number}/status — polling fallback bila
    // webhook DOKU miss. BE return snapshot status + paid_at.
    getStatus(orderNumber: string) {
      return api.get<PaymentStatusSnapshot>(
        `/payments/${encodeURIComponent(orderNumber)}/status`
      )
    },
    // POST /api/v1/orders/{order_number}/payment/cancel — cancel payment
    // session yang masih `pending`. Order itself tidak di-cancel; cuma
    // session DOKU yang dibatalkan supaya user bisa pilih method lain.
    cancel(orderNumber: string) {
      return api.post<{ order_number: string; status: string }>(
        `/orders/${encodeURIComponent(orderNumber)}/payment/cancel`,
        {}
      )
    }
  }
}
