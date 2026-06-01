import { ssoOpen } from '~/composables/useSsoRedirect'

export function usePartnerLmsRedirect() {
  const auth    = useAuthStore()
  const partner = usePartnerStore()
  const { error: toastError } = useToast()

  const isRedirecting = ref(false)

  async function openLmsAdmin() {
    if (isRedirecting.value) return
    isRedirecting.value = true

    try {
      if (!partner.activeClient) await partner.fetchClients()

      const userId     = auth.user?.id
      const clientSlug = partner.activeClient?.slug

      if (!userId || !clientSlug) {
        toastError('Failed to open the LMS: incomplete account data. Please reload the page.')
        return
      }

      await ssoOpen(clientSlug, userId, '/client')
    } catch {
      toastError('Failed to open the LMS admin page. Please try again.')
    } finally {
      isRedirecting.value = false
    }
  }

  return { openLmsAdmin, isRedirecting }
}
