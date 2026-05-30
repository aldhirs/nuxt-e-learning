export function usePartnerLmsRedirect() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const partner = usePartnerStore()
  const lmsBase = (config.public.clientBaseUrl as string).replace(/\/$/, '')

  const isRedirecting = ref(false)

  async function openLmsAdmin() {
    if (isRedirecting.value) return
    isRedirecting.value = true

    try {
      // Ensure activeClient is loaded before attempting SSO
      if (!partner.activeClient) {
        await partner.fetchClients()
      }

      const userId = auth.user?.id
      const clientSlug = partner.activeClient?.slug

      if (!userId || !clientSlug) {
        // Slug unavailable — open LMS directly (user may need to log in manually)
        window.open(`${lmsBase}/client`, '_blank')
        return
      }

      const result = await $fetch<{ exchange_url: string }>('/api/sso/generate', {
        method: 'POST',
        body: { user_id: userId, client_slug: clientSlug, redirect_path: '/client' },
      })
      window.open(result.exchange_url, '_blank')
    } catch {
      // SSO failed — graceful fallback to direct link
      window.open(`${lmsBase}/client`, '_blank')
    } finally {
      isRedirecting.value = false
    }
  }

  return { openLmsAdmin, isRedirecting }
}
