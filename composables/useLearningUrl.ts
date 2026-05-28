export function useLearningUrl() {
  const config = useRuntimeConfig()

  // Build the direct LMS login URL for a client course.
  // Pattern: {clientBaseUrl}/{client_slug}/learn/{courseID}/{enrollmentID}
  // After login the LMS redirects the student to their enrolled course list.
  function learningUrl(clientSlug: string, courseID: number, enrollmentID: number): string {
    const base = (config.public.clientBaseUrl as string).replace(/\/$/, '')
    return `${base}/${clientSlug}/learn/${courseID}/${enrollmentID}`
  }

  return { learningUrl }
}
