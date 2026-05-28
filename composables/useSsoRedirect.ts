export function useSsoRedirect() {
  const { learningUrl } = useLearningUrl()

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
      const redirectPath = `/${clientSlug}/learn/${courseId}/${enrollmentId}`
      const result = await $fetch<{ exchange_url: string }>('/api/sso/generate', {
        method: 'POST',
        body: { user_id: userId, client_slug: clientSlug, redirect_path: redirectPath }
      })
      window.location.href = result.exchange_url
    } catch {
      // Graceful degradation: direct link (user will need to login manually on LMS)
      window.location.href = learningUrl(clientSlug, courseId, enrollmentId)
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
