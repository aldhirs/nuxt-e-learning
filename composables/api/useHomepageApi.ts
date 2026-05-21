import type { FeaturedHomepage, SearchResponse, Testimonial } from '~/types'

export function useHomepageApi() {
  const api = useApi()

  return {
    getFeatured() {
      return api.get<FeaturedHomepage>('/public/featured')
    },
    // BE response shape: { data: Testimonial[] } — no pagination meta saat ini.
    getTestimonials() {
      return api.get<{ data: Testimonial[] }>('/public/testimonials')
    },
    globalSearch(query: string, limit = 10) {
      return api.get<SearchResponse>('/public/search', { query: { q: query, limit } })
    }
  }
}
