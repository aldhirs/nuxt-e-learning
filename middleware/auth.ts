export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const tokenCookie = useAuthCookie()

  // Allow render if either a session token cookie is present (SSR/initial nav
  // before /me lands) or the user is already hydrated in the store.
  if (tokenCookie.value || auth.isAuthenticated) return

  return navigateTo({
    path: '/login',
    query: { redirect: to.fullPath }
  })
})
