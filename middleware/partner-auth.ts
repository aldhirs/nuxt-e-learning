export default defineNuxtRouteMiddleware(async (to) => {
  const tokenCookie = useAuthCookie()
  const auth = useAuthStore()

  // No token → redirect to login
  if (!tokenCookie.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const isOnboarding = to.query.onboarding === 'true'

  // Always re-fetch /me after onboarding so active_client_id + roles are current.
  // On normal navigations, skip if user is already hydrated.
  if (!auth.user || isOnboarding) {
    await auth.fetchMe()
  }

  // Not authenticated after fetchMe → go to login
  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Partner = user has an active_client_id (owns a client) with ADMIN role scoped to that client
  const hasPartnerRole =
    !!auth.user?.active_client_id &&
    (auth.user?.roles ?? []).some(r =>
      r.role_name === 'CLIENT_OWNER' && r.client_id != null
    )

  if (!hasPartnerRole) {
    // Authenticated but no partner role → redirect to landing to prompt upgrade
    return navigateTo('/partner')
  }

  // Ensure client list is loaded before pages mount.
  // On onboarding, refreshForNewClient already ran in register.vue — the list is
  // fresh and activeClient points to the new client. Skip re-fetch to avoid a
  // redundant round-trip that could briefly flip activeClient back to an old value.
  const partner = usePartnerStore()
  if (!partner.clients.length) {
    await partner.fetchClients()
  }
})
