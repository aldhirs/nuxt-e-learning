export function usePartnerLmsRedirect() {
  const auth = useAuthStore()
  const partner = usePartnerStore()
  const { error: toastError } = useToast()

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
        toastError('Failed to open the LMS: incomplete account data. Please reload the page.')
        return
      }

      const result = await $fetch<{ exchange_url: string }>('/api/sso/generate', {
        method: 'POST',
        body: { user_id: userId, client_slug: clientSlug, redirect_path: '/client' },
      })
      window.open(result.exchange_url, '_blank')
    } catch {
      toastError('Failed to open the LMS admin page. Please try again.')
    } finally {
      isRedirecting.value = false
    }
  }

  return { openLmsAdmin, isRedirecting }
}
