import type {
  SubscriptionInvoice,
  InvoicePaymentRequest,
  InvoicePaymentSession,
  SubscriptionPaymentMethod,
} from '~/types/partner'

const POLL_INTERVAL_MS = 10_000

export function useInvoicePayment() {
  const api = useApi()
  const partner = usePartnerStore()

  function clientHeaders(): Record<string, string> {
    const id = partner.activeClient?.id
    return id ? { 'X-Client-ID': String(id) } : {}
  }

  const session = ref<InvoicePaymentSession | null>(null)
  const isCreating = ref(false)
  const isPolling = ref(false)
  const isPaid = ref(false)
  const createError = ref('')

  let pollTimer: ReturnType<typeof setTimeout> | null = null

  function stopPolling() {
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
    isPolling.value = false
  }

  function startPolling(invoiceNumber: string, onPaid: () => void) {
    isPolling.value = true
    const tick = async () => {
      if (!isPolling.value) return
      try {
        const snap = await api.get<{ status: string }>(`/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/status`, { headers: clientHeaders() })
        if (snap.status === 'paid') {
          isPaid.value = true
          stopPolling()
          onPaid()
          return
        }
      } catch { /* non-fatal, keep polling */ }
      pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
    }
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }

  async function createSession(
    invoice: SubscriptionInvoice,
    method: SubscriptionPaymentMethod,
    onPaid: () => void,
  ): Promise<InvoicePaymentSession | null> {
    createError.value = ''
    isCreating.value = true
    isPaid.value = false
    stopPolling()
    try {
      const body: InvoicePaymentRequest = { payment_method: method }
      const data = await api.post<InvoicePaymentSession>(
        `/clients/subscription/invoices/${encodeURIComponent(invoice.invoice_number)}/pay`,
        body,
        { headers: clientHeaders() },
      )
      session.value = data
      startPolling(invoice.invoice_number, onPaid)
      return data
    } catch (err: unknown) {
      createError.value = (err as { message?: string }).message || 'Gagal membuat sesi pembayaran.'
      return null
    } finally {
      isCreating.value = false
    }
  }

  function reset() {
    stopPolling()
    session.value = null
    isPaid.value = false
    createError.value = ''
    isCreating.value = false
  }

  onUnmounted(stopPolling)

  return { session, isCreating, isPolling, isPaid, createError, createSession, reset, stopPolling }
}
