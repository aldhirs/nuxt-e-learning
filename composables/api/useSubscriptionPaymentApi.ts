import type { SubscriptionInvoice, SubscriptionPaymentMethod, InvoicePaymentSession } from '~/types/partner'

export function useSubscriptionPaymentApi() {
  const api = useApi()
  const partner = usePartnerStore()

  function clientHeaders(): Record<string, string> {
    const id = partner.activeClient?.id
    return id ? { 'X-Client-ID': String(id) } : {}
  }

  function fetchInvoice(invoiceNumber: string) {
    return api.get<SubscriptionInvoice>(
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
    // Correct path is /payment/status (not /status).
    // API returns { invoice_status: 'paid' | 'pending' | ... }.
    // Normalise to { status } so polling code stays unchanged.
    return api.get<{ invoice_status: string }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/payment/status`,
      { headers: clientHeaders() },
    ).then(r => ({ status: r.invoice_status }))
  }

  return { fetchInvoice, initiate, getStatus }
}
