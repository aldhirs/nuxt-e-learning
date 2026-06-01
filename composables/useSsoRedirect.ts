// Shared core: POST to /api/sso/generate then open the exchange URL in a new tab.
// Used by both student (learn path) and partner (admin path) flows.
export async function ssoOpen(
  clientSlug: string,
  userId: number,
  redirectPath: string
): Promise<void> {
  const result = await $fetch<{ exchange_url: string }>('/api/sso/generate', {
    method: 'POST',
    body: { user_id: userId, client_slug: clientSlug, redirect_path: redirectPath },
  })
  window.open(result.exchange_url, '_blank', 'noopener,noreferrer')
}

export function useSsoRedirect() {
  const { error: toastError } = useToast()

  const isLoading = ref(false)
  const loadingEnrollmentId = ref<number | null>(null)

  async function startSsoRedirect(
    clientSlug: string,
    courseId: number,
    enrollmentId: number,
    userId: number
  ): Promise<void> {
    if (isLoading.value) return
    isLoading.value = true
    loadingEnrollmentId.value = enrollmentId

    try {
      await ssoOpen(clientSlug, userId, `/${clientSlug}/learn/${courseId}/${enrollmentId}`)
    } catch {
      toastError('Failed to open the learning page. Please try again.')
    } finally {
      isLoading.value = false
      loadingEnrollmentId.value = null
    }
  }

  // For pages with multiple courses (my/courses.vue) — track per enrollment
  const isLoadingFor = (enrollmentId: number) =>
    loadingEnrollmentId.value === enrollmentId

  return { startSsoRedirect, isLoading, isLoadingFor }
}
