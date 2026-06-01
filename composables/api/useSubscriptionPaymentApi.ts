import type { SubscriptionInvoice, SubscriptionPaymentMethod, InvoicePaymentSession } from '~/types/partner'

export function useSubscriptionPaymentApi() {
  const api = useApi()
  const partner = usePartnerStore()

  function clientHeaders(): Record<string, string> {
    const id = partner.activeClient?.id
    return id ? { 'X-Client-ID': String(id) } : {}
  }

  function fetchInvoice(invoiceNumber: string) {
    return api.get<{
      invoice: SubscriptionInvoice
      active_payment_session: {
        payment_method: string
        expires_at: string | null
        is_expired: boolean
      } | null
    }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}`,
      { headers: clientHeaders() },
    )
  }

  function initiate(invoiceNumber: string, method: SubscriptionPaymentMethod) {
    // API wraps response in { data: { payment_session: {...} } }.
    // useApi unwraps the outer data envelope → we receive { payment_session: {...} }.
    return api.post<{ payment_session: InvoicePaymentSession }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/pay`,
      { payment_method: method },
      { headers: clientHeaders() },
    ).then(r => r.payment_session)
  }

  function getStatus(invoiceNumber: string) {
    return api.get<{
      invoice_number: string
      invoice_status: string
      amount: number
      has_payment_session?: boolean
      payment_method?: string
      is_expired?: boolean
      expires_at?: string
      va_number?: string
      qris_string?: string
      qris_url?: string
    }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/payment/status`,
      { headers: clientHeaders() },
    ).then(r => ({
      // Normalised field used by polling code
      status: r.invoice_status,
      // Full fields for session hydration on hard refresh
      amount: r.amount,
      has_payment_session: r.has_payment_session ?? false,
      payment_method: r.payment_method,
      is_expired: r.is_expired ?? false,
      expires_at: r.expires_at,
      va_number: r.va_number,
      qris_string: r.qris_string,
      qris_url: r.qris_url,
    }))
  }

  function cancel(invoiceNumber: string) {
    return api.post<{ message: string }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/payment/cancel`,
      {},
      { headers: clientHeaders() },
    )
  }

  return { fetchInvoice, initiate, getStatus, cancel }
}
