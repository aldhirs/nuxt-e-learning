export default defineNuxtRouteMiddleware(async (to) => {
  const tokenCookie = useAuthCookie()
  const auth = useAuthStore()

  // No token → redirect to login
  if (!tokenCookie.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Hydrate user if not yet loaded (SSR or hard refresh)
  if (!auth.user) {
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
      r.role_name === 'ADMIN' && r.client_id != null
    )

  if (!hasPartnerRole) {
    // Authenticated but no partner role → redirect to landing to prompt upgrade
    return navigateTo('/partner')
  }

  // Ensure client list is loaded before pages mount. Pages call clientHeaders()
  // in their onMounted hooks — which run BEFORE the layout's onMounted in Vue 3's
  // lifecycle order. Without this, pages fetch without X-Client-ID and get empty data.
  const partner = usePartnerStore()
  if (!partner.clients.length) {
    await partner.fetchClients()
  }
})
