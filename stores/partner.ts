import { defineStore } from 'pinia'
import type {
  ClientSummary,
  CurrentSubscriptionView,
  SubscriptionInvoice,
  InvoiceHistoryResponse,
  PartnerDashboardStats,
  PartnerProfile,
} from '~/types/partner'

export const usePartnerStore = defineStore('partner', () => {
  const api = useApi()

  // Single useCookie instance created in setup (where composables are safe to
  // call). Reused by switchClient, fetchClients, and reset so all writes/reads
  // go through the same reactive ref — avoids the stale-ref bug that occurs
  // when useCookie is re-instantiated inside store actions.
  const _clientIdCookie = useCookie<number | null>('ds_active_client_id', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
  })

  // ─── State ────────────────────────────────────────────────────────────────

  const clients = ref<ClientSummary[]>([])
  const activeClient = ref<ClientSummary | null>(null)
  const subscriptionView = ref<CurrentSubscriptionView | null>(null)
  const profile = ref<PartnerProfile | null>(null)
  const stats = ref<PartnerDashboardStats | null>(null)

  const isLoadingClients = ref(false)
  const isLoadingSubscription = ref(false)
  const isLoadingProfile = ref(false)
  const isLoadingStats = ref(false)
  const isSwitchingClient = ref(false)

  // ─── Computed ─────────────────────────────────────────────────────────────

  const subscription = computed(() => subscriptionView.value?.subscription ?? null)
  // When suspended, GET /clients/subscription returns 404 → subscriptionView is null.
  // Fall back to subscription_status on the ClientSummary (set by fetchClients) so
  // isSuspended / isPastDue / canAccessLms remain correct without hitting the endpoint.
  const subscriptionStatus = computed(() =>
    subscription.value?.status ?? activeClient.value?.subscription_status ?? null
  )
  const plan = computed(() => subscriptionView.value?.plan ?? null)
  const usage = computed(() => subscriptionView.value?.usage ?? null)

  const isActive = computed(() =>
    subscriptionStatus.value === 'active' ||
    subscriptionStatus.value === 'past_due' ||
    subscriptionStatus.value === 'trial'
  )
  const isSuspended = computed(() => subscriptionStatus.value === 'suspended')
  const isCancelled = computed(() => subscriptionStatus.value === 'cancelled')
  const isPastDue = computed(() => subscriptionStatus.value === 'past_due')
  const isTrialActive = computed(() => {
    if (subscriptionStatus.value !== 'trial') return false
    const sub = subscription.value
    if (!sub?.trial_ends_at) return true
    return new Date(sub.trial_ends_at) > new Date()
  })
  const trialDaysLeft = computed(() => {
    const sub = subscription.value
    if (subscriptionStatus.value !== 'trial' || !sub?.trial_ends_at) return 0
    const ms = new Date(sub.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  })
  const canAccessLms = computed(() =>
    subscriptionStatus.value === 'active' ||
    subscriptionStatus.value === 'past_due' ||
    isTrialActive.value
  )
  const pendingInvoiceNumber = computed(() => subscriptionView.value?.pending_invoice_number ?? null)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Prefer the in-memory activeClient (guaranteed fresh after switchClient).
  // Fall back to the persisted cookie on hard refresh, before fetchClients()
  // has run and populated activeClient.
  function clientHeaders(): Record<string, string> {
    const id = activeClient.value?.id ?? _clientIdCookie.value
    return id ? { 'X-Client-ID': String(id) } : {}
  }

  // ─── Clients ──────────────────────────────────────────────────────────────

  async function fetchClients(): Promise<ClientSummary[]> {
    isLoadingClients.value = true
    try {
      const list = await api.get<ClientSummary[]>('/auth/storefront/me/clients')
      clients.value = list ?? []

      // Restore last-selected client from cookie, fallback to first
      const savedId = _clientIdCookie.value
      const restored = savedId ? clients.value.find(c => c.id === savedId) : null
      activeClient.value = restored ?? clients.value[0] ?? null

      // Persist whichever client ended up active so future reloads restore it
      if (activeClient.value) {
        _clientIdCookie.value = activeClient.value.id
      }

      return clients.value
    } catch {
      return []
    } finally {
      isLoadingClients.value = false
    }
  }

  async function switchClient(clientId: number): Promise<void> {
    isSwitchingClient.value = true
    try {
      // JWT only contains user_id — no client_id embedded. Switching context
      // only requires updating X-Client-ID source.

      // 1. Update in-memory state FIRST so clientHeaders() immediately returns
      //    the new value for all subsequent fetch calls in this action.
      const found = clients.value.find(c => c.id === clientId)
      if (found) activeClient.value = found

      // 2. Persist to cookie so hard refreshes restore the correct client.
      _clientIdCookie.value = clientId

      // 3. Reset all stale client-scoped data
      subscriptionView.value = null
      stats.value = null
      profile.value = null

      // 4. Reload with new X-Client-ID (activeClient already updated above)
      await Promise.all([
        fetchSubscription(),
        fetchProfile(),
        fetchStats(),
        useAuthStore().fetchMe(),
      ])
    } finally {
      isSwitchingClient.value = false
    }
    // Navigation is handled by the caller (PartnerClientSwitcher)
  }

  // ─── Subscription ─────────────────────────────────────────────────────────

  async function fetchSubscription(): Promise<CurrentSubscriptionView | null> {
    isLoadingSubscription.value = true
    try {
      const data = await api.get<CurrentSubscriptionView>('/clients/subscription', { headers: clientHeaders() })
      subscriptionView.value = data
      return data
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 404) subscriptionView.value = null
      return null
    } finally {
      isLoadingSubscription.value = false
    }
  }

  async function fetchInvoiceHistory(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<InvoiceHistoryResponse> {
    const data = await api.get<InvoiceHistoryResponse>('/clients/subscription/history', {
      headers: clientHeaders(),
      query: {
        status: params?.status,
        limit: params?.limit ?? 25,
        offset: params?.offset ?? 0,
      },
    })
    return data
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async function fetchProfile(): Promise<PartnerProfile | null> {
    isLoadingProfile.value = true
    try {
      const data = await api.get<PartnerProfile>('/clients/profile', { headers: clientHeaders() })
      profile.value = data
      return data
    } catch {
      return null
    } finally {
      isLoadingProfile.value = false
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async function fetchStats(): Promise<PartnerDashboardStats | null> {
    isLoadingStats.value = true
    try {
      const data = await api.get<PartnerDashboardStats>('/clients/dashboard/stats', { headers: clientHeaders() })
      stats.value = data
      return data
    } catch {
      return null
    } finally {
      isLoadingStats.value = false
    }
  }

  // ─── Refresh after new registration ──────────────────────────────────────
  // Force-clear ALL cached data and re-fetch everything for the newly created
  // client. Mirrors switchClient's full reset so the dashboard never shows
  // stale subscription/stats/profile from a previous client session.
  async function refreshForNewClient(newActiveClientId?: number): Promise<void> {
    if (newActiveClientId) {
      _clientIdCookie.value = newActiveClientId
    }
    // Reset everything — same fields switchClient resets
    clients.value = []
    subscriptionView.value = null
    stats.value = null
    profile.value = null

    // Re-fetch client list first so activeClient + clientHeaders() are correct
    await fetchClients()

    // Eagerly reload all client-scoped data for the new client so the dashboard
    // renders correct content immediately without waiting for layout onMounted
    await Promise.all([
      fetchSubscription(),
      fetchStats(),
      fetchProfile(),
    ])
  }

  // Keep old name as alias so verify.vue still compiles without changes
  async function refreshClients(newActiveClientId?: number): Promise<void> {
    return refreshForNewClient(newActiveClientId)
  }

  // ─── Cancel Subscription ──────────────────────────────────────────────────

  async function cancelSubscription(reason: string, effective: 'end_of_period' | 'immediate' = 'end_of_period'): Promise<void> {
    await api.post(
      '/clients/subscription/cancel',
      { reason, effective },
      { headers: clientHeaders() },
    )
    await fetchSubscription()
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    clients.value = []
    activeClient.value = null
    subscriptionView.value = null
    profile.value = null
    stats.value = null
    _clientIdCookie.value = null
  }

  return {
    // state
    clients, activeClient, subscriptionView, profile, stats,
    isLoadingClients, isLoadingSubscription, isLoadingProfile, isLoadingStats, isSwitchingClient,
    // computed
    subscription, subscriptionStatus, plan, usage,
    isActive, isSuspended, isCancelled, isPastDue, isTrialActive, trialDaysLeft, canAccessLms, pendingInvoiceNumber,
    // actions
    fetchClients, switchClient, refreshClients, refreshForNewClient, fetchSubscription, fetchInvoiceHistory, fetchProfile, fetchStats, cancelSubscription, reset,
  }
})
