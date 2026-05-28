export function useLearningUrl() {
  const config = useRuntimeConfig()

  // Build the direct LMS login URL for a client course.
  // Pattern: {clientBaseUrl}/{client_slug}/login?redirect_to=/{client_slug}/my-courses
  // After login the LMS redirects the student to their enrolled course list.
  function learningUrl(clientSlug: string): string {
    const base = (config.public.clientBaseUrl as string).replace(/\/$/, '')
    return `${base}/${clientSlug}/login?redirect_to=/${clientSlug}/my-courses`
  }

  return { learningUrl }
}
