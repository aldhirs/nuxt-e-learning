<script setup lang="ts">
import { usePartnersApi } from '~/composables/api/usePartnersApi'
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import type { Partner, Paginated, CourseListItem } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const partnersApi = usePartnersApi()
const coursesApi = useCoursesApi()

const slug = computed(() => route.params.slug as string)
const COURSES_PER_PAGE = 12

const { data: partner, pending: partnerPending, error: partnerError, refresh: refreshPartner } =
  await useAsyncData<Partner | null>(
    () => `partner-detail:${slug.value}`,
    async () => {
      try {
        return await partnersApi.getPartnerBySlug(slug.value)
      } catch (err: unknown) {
        if ((err as { status?: number }).status === 404) return null
        throw err
      }
    },
    { watch: [slug] }
  )

useSeoMeta({
  title: () => partner.value?.name ?? 'Partner not found',
  description: () => partner.value?.name ? `Courses from ${partner.value.name} on DrillSpace` : ''
})

const offset = computed(() => (route.query.offset ? Number(route.query.offset) : 0))
const currentPage = computed(() => Math.floor(offset.value / COURSES_PER_PAGE) + 1)

const { data: coursesPage, pending: coursesPending, error: coursesError, refresh: refreshCourses } =
  await useAsyncData<Paginated<CourseListItem>>(
    () => `partner-courses:${slug.value}:${offset.value}`,
    () => coursesApi.listCourses({ partner_slug: slug.value, limit: COURSES_PER_PAGE, offset: offset.value }),
    { watch: [slug, offset] }
  )

const courses = computed(() => coursesPage.value?.data ?? [])
const totalCourses = computed(() => coursesPage.value?.meta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCourses.value / COURSES_PER_PAGE)))
const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)

function goPage(p: number) {
  const clamped = Math.max(1, Math.min(totalPages.value, p))
  const newOffset = (clamped - 1) * COURSES_PER_PAGE
  const query: Record<string, string> = {}
  if (newOffset > 0) query.offset = String(newOffset)
  router.push({ query })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const bannerStyle = computed(() => {
  const primary = partner.value?.theme_primary ?? '#2F80D2'
  const secondary = partner.value?.theme_secondary ?? '#1a5fa0'
  return { background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }
})
</script>

<template>
  <div>
    <!-- Suspended notice — shown when partner subscription is suspended -->
    <div
      v-if="partner && (partner as any).subscription_status === 'suspended'"
      class="bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2"
      role="alert"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      This platform is temporarily unavailable. Course enrollment is not available at this time.
    </div>

    <!-- Loading -->
    <div v-if="partnerPending && !partner" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <BaseSkeleton class="h-48 w-full rounded-xl mb-10" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <BaseSkeleton v-for="i in 6" :key="i" class="aspect-[4/5] rounded-xl" />
      </div>
    </div>

    <!-- Error -->
    <BaseCard
      v-else-if="partnerError"
      padding="lg"
      class="max-w-2xl mx-auto my-10 border border-red-200 bg-red-50"
    >
      <p class="text-sm text-red-700 mb-3">
        Failed to load partner. {{ (partnerError as { message?: string }).message ?? '' }}
      </p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refreshPartner()">Try Again</BaseButton>
        <BaseButton variant="ghost" size="sm" to="/partners">Back to partner list</BaseButton>
      </div>
    </BaseCard>

    <!-- 404 -->
    <div v-else-if="!partner" class="max-w-md mx-auto py-20 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">Partner not found</h1>
      <p class="text-sm text-slate-500 mb-6">This partner is no longer available.</p>
      <BaseButton variant="primary" to="/partners">View all partners</BaseButton>
    </div>

    <!-- Success -->
    <div v-else>
      <!-- Banner -->
      <div class="py-16" :style="bannerStyle">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <NuxtLink to="/partners" class="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-4">
            ← All partners
          </NuxtLink>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold bg-white/20 flex-shrink-0 overflow-hidden">
              <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="w-full h-full object-contain" />
              <span v-else>{{ partner.name[0] }}</span>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-bold">{{ partner.name }}</h1>
              <p class="text-white/70 text-xs mt-2">{{ partner.course_count }} courses available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Courses section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 class="text-lg font-bold text-slate-800 mb-6">Courses from {{ partner.name }}</h2>

        <!-- Courses loading -->
        <div v-if="coursesPending && !coursesPage" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          <BaseSkeleton v-for="i in 6" :key="i" class="aspect-[4/5] rounded-xl" />
        </div>

        <!-- Courses error -->
        <BaseCard v-else-if="coursesError" padding="lg" class="border border-red-200 bg-red-50">
          <p class="text-sm text-red-700 mb-3">Failed to load partner courses.</p>
          <BaseButton variant="primary" size="sm" @click="refreshCourses()">Try Again</BaseButton>
        </BaseCard>

        <!-- Courses empty -->
        <BaseEmptyState
          v-else-if="courses.length === 0"
          icon="inbox"
          title="No courses yet"
          description="This partner has not published any courses yet."
          cta-label="View other partners"
          cta-to="/partners"
        />

        <!-- Courses success -->
        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard v-for="course in courses" :key="course.id" :course="course" />
          </div>

          <div v-if="totalPages > 1" class="flex items-center justify-between mt-10 gap-4 flex-wrap">
            <p class="text-sm text-slate-500">
              Page {{ currentPage }} of {{ totalPages }} · {{ courses.length }} of {{ totalCourses }} courses
            </p>
            <div class="flex items-center gap-2">
              <BaseButton variant="ghost" size="sm" :disabled="!hasPrev || coursesPending" @click="goPage(currentPage - 1)">← Previous</BaseButton>
              <BaseButton variant="ghost" size="sm" :disabled="!hasNext || coursesPending" @click="goPage(currentPage + 1)">Next →</BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
