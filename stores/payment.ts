import type { StoredPaymentSession } from '~/types'

const STORAGE_KEY = 'ds_payment_sessions'

interface PersistShape {
  // Map of order_number → session. Disimpan plain object agar JSON-friendly.
  sessions: Record<string, StoredPaymentSession>
}

function loadFromStorage(): PersistShape {
  if (!import.meta.client) return { sessions: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sessions: {} }
    const parsed = JSON.parse(raw) as PersistShape
    return parsed && typeof parsed === 'object' && parsed.sessions
      ? parsed
      : { sessions: {} }
  } catch {
    return { sessions: {} }
  }
}

export const usePaymentStore = defineStore('payment', () => {
  const sessions = ref<Record<string, StoredPaymentSession>>(loadFromStorage().sessions)

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: sessions.value }))
    } catch { /* quota / private mode — non-fatal */ }
  }

  function getSession(orderNumber: string): StoredPaymentSession | null {
    return sessions.value[orderNumber] ?? null
  }

  function setSession(session: StoredPaymentSession) {
    sessions.value = { ...sessions.value, [session.order_number]: session }
    persist()
  }

  function clearSession(orderNumber: string) {
    if (!sessions.value[orderNumber]) return
    const next = { ...sessions.value }
    delete next[orderNumber]
    sessions.value = next
    persist()
  }

  return { sessions, getSession, setSession, clearSession }
})
