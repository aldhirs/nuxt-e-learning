export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // Allow render if a session token is present (SSR/initial nav before /me
  // lands) or the user is already hydrated in the store. hasToken turns false
  // once any request gets a 401 (see handleUnauthorized in useApi).
  if (auth.hasToken || auth.isAuthenticated) return

  return navigateTo({
    path: '/login',
    query: { redirect: to.fullPath }
  })
})
