// Redirect authenticated users away from guest-only pages (register, login).
export default defineNuxtRouteMiddleware(() => {
  const tokenCookie = useAuthCookie()
  const auth = useAuthStore()

  if (tokenCookie.value || auth.isAuthenticated) {
    return navigateTo('/')
  }
})
