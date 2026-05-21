import type { CourseListItem, Paginated, Partner } from '~/types'
import { useCoursesApi } from '~/composables/api/useCoursesApi'

export type PartnerSort = 'course_count' | 'alphabetical'

export interface PartnerListFilters {
  search?: string
  sort?: PartnerSort
  limit?: number
  offset?: number
}

function cleanQuery(filters: PartnerListFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v as string | number
  }
  return out
}

export function usePartnersApi() {
  const api = useApi()

  return {
    listPartners(filters: PartnerListFilters = {}) {
      return api.get<Paginated<Partner>>('/public/partners', { query: cleanQuery(filters) })
    },
    getPartnerBySlug(slug: string) {
      return api.get<Partner>(`/public/partners/${encodeURIComponent(slug)}`)
    },
    // BE belum punya GET /public/partners/{slug}/courses (probe 404).
    // Workaround sementara: pakai /public/courses?partner_slug=...
    // Lihat BE-FEEDBACK.md issue #1A endpoint gap.
    listCoursesForPartner(slug: string, opts: { limit?: number; offset?: number } = {}) {
      const courses = useCoursesApi()
      return courses.listCourses({ partner_slug: slug, ...opts })
    }
  }
}

// Re-export for ergonomics where pages only need a single composable.
export type { CourseListItem }
