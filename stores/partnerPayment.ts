import { defineStore } from 'pinia'
import type { SubscriptionInvoice, SubscriptionPaymentMethod } from '~/types/partner'

const STORAGE_KEY = 'ds_sub_payment'

export interface StoredSubPaymentSession {
  invoice_number: string
  invoice_amount: number
  payment_method: SubscriptionPaymentMethod
  expires_at: string
  va_number?: string | null
  bank_code?: string | null
  qr_url?: string | null
  qr_string?: string | null
  redirect_url?: string | null
}

interface StoreShape { sessions: Record<string, StoredSubPaymentSession> }

function load(): StoreShape {
  if (!import.meta.client) return { sessions: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const p = raw ? JSON.parse(raw) as StoreShape : null
    return p?.sessions ? p : { sessions: {} }
  } catch { return { sessions: {} } }
}

export const usePartnerPaymentStore = defineStore('partnerPayment', () => {
  const sessions = ref<Record<string, StoredSubPaymentSession>>(load().sessions)

  // Invoice data staged before payment initiation so method-select page
  // can display amount/number without a separate API call.
  const pendingInvoice = ref<SubscriptionInvoice | null>(null)

  function persist() {
    if (!import.meta.client) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: sessions.value })) }
    catch { /* quota / private mode */ }
  }

  function getSession(invoiceNumber: string) { return sessions.value[invoiceNumber] ?? null }

  function setSession(session: StoredSubPaymentSession) {
    sessions.value = { ...sessions.value, [session.invoice_number]: session }
    persist()
  }

  function clearSession(invoiceNumber: string) {
    const next = { ...sessions.value }
    delete next[invoiceNumber]
    sessions.value = next
    persist()
  }

  function stage(invoice: SubscriptionInvoice) { pendingInvoice.value = invoice }
  function clearPending() { pendingInvoice.value = null }

  return { sessions, pendingInvoice, getSession, setSession, clearSession, stage, clearPending }
})
