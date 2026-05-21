export default defineNuxtPlugin(async () => {
  const tokenCookie = useAuthCookie()
  if (!tokenCookie.value) return

  const auth = useAuthStore()
  if (auth.user) return

  await auth.fetchMe()
})
