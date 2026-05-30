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
    return api.post<InvoicePaymentSession>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/pay`,
      { payment_method: method },
      { headers: clientHeaders() },
    )
  }

  function getStatus(invoiceNumber: string) {
    return api.get<{ status: string }>(
      `/clients/subscription/invoices/${encodeURIComponent(invoiceNumber)}/status`,
      { headers: clientHeaders() },
    )
  }

  return { fetchInvoice, initiate, getStatus }
}
