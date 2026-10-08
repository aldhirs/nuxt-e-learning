// Redirect authenticated users away from guest-only pages (register, login).
//
// Only a *verified* session counts (token + /me user, loaded by the auth-init
// plugin). A bare token cookie is not enough: it may be stale (user deleted,
// data reset, API down), and redirecting on it locks the visitor out of
// /login and /register entirely.
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (auth.isAuthenticated) {
    return navigateTo('/')
  }
})
