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
  const auth = useAuthStore()

  // Returns X-Client-ID header for all /clients/* requests.
  // Falls back to auth.user.active_client_id so calls that run before
  // fetchClients() resolves (e.g. parallel Promise.all) still work.
  function clientHeaders(): Record<string, string> {
    const id = activeClient.value?.id ?? auth.user?.active_client_id
    return id ? { 'X-Client-ID': String(id) } : {}
  }

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

  // ─── Computed ─────────────────────────────────────────────────────────────

  const subscription = computed(() => subscriptionView.value?.subscription ?? null)
  const subscriptionStatus = computed(() => subscription.value?.status ?? null)
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

  // ─── Active client cookie ─────────────────────────────────────────────────
  // Persists the last selected client across page refreshes.
  // Cleared on logout.
  function activeClientCookie() {
    return useCookie<number | null>('ds_active_client_id', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
    })
  }

  // ─── Clients ──────────────────────────────────────────────────────────────

  async function fetchClients(): Promise<ClientSummary[]> {
    isLoadingClients.value = true
    try {
      const list = await api.get<ClientSummary[]>('/auth/me/clients')
      clients.value = list ?? []

      // Restore last-selected client from cookie, fallback to first
      const savedId = activeClientCookie().value
      const restored = savedId ? clients.value.find(c => c.id === savedId) : null
      activeClient.value = restored ?? clients.value[0] ?? null

      return clients.value
    } catch {
      return []
    } finally {
      isLoadingClients.value = false
    }
  }

  async function switchClient(clientId: number): Promise<void> {
    const data = await api.post<{ access_token: string }>('/auth/switch-client', { client_id: clientId })
    if (data.access_token) {
      const authCookie = useAuthCookie()
      authCookie.value = data.access_token
    }
    const found = clients.value.find(c => c.id === clientId)
    if (found) activeClient.value = found
    // Persist selection in cookie
    activeClientCookie().value = clientId
    // Reset all client-scoped data
    subscriptionView.value = null
    stats.value = null
    profile.value = null
    // Refresh data for the new active client
    await Promise.all([
      fetchSubscription(),
      fetchProfile(),
      useAuthStore().fetchMe(),
    ])
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

  // ─── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    clients.value = []
    activeClient.value = null
    subscriptionView.value = null
    profile.value = null
    stats.value = null
    // Clear persisted client selection on logout
    activeClientCookie().value = null
  }

  return {
    // state
    clients, activeClient, subscriptionView, profile, stats,
    isLoadingClients, isLoadingSubscription, isLoadingProfile, isLoadingStats,
    // computed
    subscription, subscriptionStatus, plan, usage,
    isActive, isSuspended, isCancelled, isPastDue, isTrialActive, trialDaysLeft, canAccessLms,
    // actions
    fetchClients, switchClient, fetchSubscription, fetchInvoiceHistory, fetchProfile, fetchStats, reset,
  }
})
