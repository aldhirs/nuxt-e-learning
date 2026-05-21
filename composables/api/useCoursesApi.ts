import type { Course, CourseListItem, Paginated } from '~/types'

export type CourseSort = 'newest' | 'cheapest' | 'most_expensive' | 'alphabetical'

export interface CourseListFilters {
  search?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  partner_slug?: string
  is_free?: boolean
  price_min?: number
  price_max?: number
  sort?: CourseSort
  limit?: number
  offset?: number
}

function cleanQuery(filters: CourseListFilters): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v as string | number | boolean
  }
  return out
}

export function useCoursesApi() {
  const api = useApi()

  return {
    listCourses(filters: CourseListFilters = {}) {
      return api.get<Paginated<CourseListItem>>('/public/courses', { query: cleanQuery(filters) })
    },
    getCourseBySlug(slug: string) {
      return api.get<Course>(`/public/courses/slug/${encodeURIComponent(slug)}`)
    }
  }
}
