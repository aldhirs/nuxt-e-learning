import type { EnrollFreeRequest, EnrollFreeResponse, EnrollmentCheckResponse } from '~/types'

export function useEnrollmentApi() {
  const api = useApi()

  return {
    // Hybrid auth: if cookie token exists, BE uses the authenticated user.
    // Without token, BE auto-creates a pending_activation user. PRD #1A Phase E.
    enrollFree(courseId: number, body: EnrollFreeRequest = {}) {
      return api.post<EnrollFreeResponse>(`/public/courses/${courseId}/enroll-free`, body)
    },

    // Check whether the logged-in user is enrolled in a specific course.
    // Returns { enrolled: false } when not enrolled — never 404.
    checkEnrollment(courseId: number) {
      return api.get<EnrollmentCheckResponse>(`/my/courses/${courseId}/enrollment`)
    },

    // Returns a Set of course IDs the authenticated user is actively enrolled in.
    // Calls the thin GET /my/enrolled-course-ids endpoint — single query, no pagination.
    // Fail-safe: returns empty Set on any error so the listing still renders.
    async getEnrolledCourseIds(): Promise<Set<number>> {
      try {
        const res = await api.get<{ course_ids: number[] }>('/my/enrolled-course-ids')
        return new Set(res.course_ids ?? [])
      } catch {
        return new Set()
      }
    },
  }
}
