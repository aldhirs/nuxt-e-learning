import type { PurchasedCourseItem, PagedPaging } from '~/types'
import { useAuthCookie } from '~/composables/useApi'

export interface PurchasedCoursesPage {
  data: PurchasedCourseItem[]
  paging: PagedPaging
}

export function useMyCoursesApi() {
  const config = useRuntimeConfig()
  const tokenCookie = useAuthCookie()

  // Uses $fetch directly (not useApi) to capture the top-level `paging` field
  // that useApi would drop when unwrapping `env.data`.
  async function getMyPurchasedCourses(
    page = 1,
    limit = 10,
    status = '',
    search = ''
  ): Promise<PurchasedCoursesPage> {
    const headers: Record<string, string> = {}
    if (tokenCookie.value) {
      headers.Authorization = `Bearer ${tokenCookie.value}`
    }

    const query: Record<string, string | number> = { page, limit }
    if (status) query.status = status
    if (search) query.search = search

    const res = await $fetch<{
      success: boolean
      data: PurchasedCourseItem[]
      paging: PagedPaging
    }>('/my/purchased-courses', {
      baseURL: config.public.apiBaseUrl as string,
      query,
      headers
    })

    return {
      data: res.data ?? [],
      paging: res.paging ?? { page: 1, page_size: limit, total_items: 0, total_pages: 1 }
    }
  }

  return { getMyPurchasedCourses }
}
