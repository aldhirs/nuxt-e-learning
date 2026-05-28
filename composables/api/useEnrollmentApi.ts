import type { EnrollFreeRequest, EnrollFreeResponse } from '~/types'

export function useEnrollmentApi() {
  const api = useApi()

  return {
    // Hybrid auth: kalau cookie token ada, BE pakai user; tanpa token, BE auto-create
    // pending_activation user dari body. PRD #1A Phase E.
    enrollFree(courseId: number, body: EnrollFreeRequest = {}) {
      return api.post<EnrollFreeResponse>(`/public/courses/${courseId}/enroll-free`, body)
    }
  }
}
