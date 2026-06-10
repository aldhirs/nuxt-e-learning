<script setup lang="ts">
import { useMyCoursesApi } from '~/composables/api/useMyCoursesApi'
import type { PurchasedCoursesPage } from '~/composables/api/useMyCoursesApi'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'profile', middleware: 'auth' })
useSeoMeta({ title: 'My Courses' })

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const myCoursesApi = useMyCoursesApi()
const { startSsoRedirect, isLoadingFor } = useSsoRedirect()
const { formatDate } = useFormatters()

const PAGE_SIZE = 10

// ── Query state (synced to URL) ────────────────────────────────────────────
const currentPage   = computed(() => Number(route.query.page  ?? 1))
const activeStatus  = computed(() => (route.query.status as string) ?? '')
const activeSource  = computed(() => (route.query.source as string) ?? '')
const searchQuery   = computed(() => (route.query.search as string) ?? '')

// Local draft for the search input (committed on submit / clear)
const searchDraft = ref(searchQuery.value)
watch(searchQuery, v => { searchDraft.value = v })

function applySearch() {
  const q = searchDraft.value.trim()
  navigate({ search: q || undefined, page: undefined })
}
function clearSearch() {
  searchDraft.value = ''
  navigate({ search: undefined, page: undefined })
}

function setStatus(val: string) {
  navigate({ status: val || undefined, page: undefined, search: searchQuery.value || undefined })
}

function setSource(val: string) {
  navigate({ source: val || undefined, page: undefined })
}

function goPage(p: number) {
  const clamped = Math.max(1, Math.min(totalPages.value, p))
  navigate({ page: clamped > 1 ? String(clamped) : undefined })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function navigate(patch: Record<string, string | undefined>) {
  const current: Record<string, string> = {}
  if (activeStatus.value)    current.status = activeStatus.value
  if (activeSource.value)    current.source = activeSource.value
  if (searchQuery.value)     current.search = searchQuery.value
  if (currentPage.value > 1) current.page = String(currentPage.value)
  const merged: Record<string, string> = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete merged[k]
    else merged[k] = v
  }
  router.push({ query: Object.keys(merged).length ? merged : undefined })
}

// ── Data fetching ──────────────────────────────────────────────────────────
const queryKey = computed(() =>
  `my-courses:${currentPage.value}:${activeStatus.value}:${activeSource.value}:${searchQuery.value}`
)

const { data: page, pending, error, refresh } = await useAsyncData<PurchasedCoursesPage>(
  queryKey.value,
  () => myCoursesApi.getMyPurchasedCourses(
    currentPage.value, PAGE_SIZE, activeStatus.value, activeSource.value, searchQuery.value
  ),
  { watch: [currentPage, activeStatus, activeSource, searchQuery] }
)

const courses    = computed(() => page.value?.data ?? [])
const paging     = computed(() => page.value?.paging)
const totalItems = computed(() => paging.value?.total_items ?? 0)
const totalPages = computed(() => paging.value?.total_pages ?? 1)
const hasPrev    = computed(() => currentPage.value > 1)
const hasNext    = computed(() => currentPage.value < totalPages.value)

// ── Status tabs ────────────────────────────────────────────────────────────
const statusTabs = [
  { value: '',           label: 'All' },
  { value: 'active',     label: 'Active' },
  { value: 'completed',  label: 'Completed' },
  { value: 'cancelled',  label: 'Cancelled' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const difficultyConfig: Record<string, { label: string; cls: string }> = {
  beginner:     { label: 'Beginner',     cls: 'bg-emerald-100 text-emerald-700' },
  intermediate: { label: 'Intermediate', cls: 'bg-amber-100 text-amber-700' },
  advanced:     { label: 'Advanced',     cls: 'bg-red-100 text-red-700' },
}

const enrollmentStatusConfig: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
}

</script>

<template>
  <div class="flex-1 min-w-0">

    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-xl font-bold text-slate-800">My Courses</h2>
        <p class="text-sm text-slate-400 mt-0.5">
          <template v-if="pending && !page">Loading courses...</template>
          <template v-else-if="totalItems > 0">{{ totalItems }} course{{ totalItems !== 1 ? 's' : '' }} found</template>
          <template v-else>No courses found</template>
        </p>
      </div>
    </div>

    <!-- Search + Filter card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">

      <!-- Search bar -->
      <div class="px-4 pt-4 pb-3 border-b border-slate-100">
        <form class="relative" @submit.prevent="applySearch">
          <svg
            class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchDraft"
            type="search"
            placeholder="Search by course name..."
            class="w-full pl-10 pr-20 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 outline-none transition-all"
          />
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              v-if="searchDraft"
              type="button"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Clear search"
              @click="clearSearch"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="submit"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <!-- Source filter chips -->
      <div class="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <span class="text-xs text-slate-400 font-medium flex-shrink-0">Type:</span>
        <button
          v-for="chip in [{ value: '', label: 'All' }, { value: 'purchased', label: 'Purchased' }, { value: 'free', label: 'Free' }]"
          :key="chip.value"
          type="button"
          :class="[
            'px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0',
            activeSource === chip.value
              ? 'bg-primary-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          ]"
          @click="setSource(chip.value)"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Status tabs -->
      <div class="flex overflow-x-auto" style="scrollbar-width:none">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          :class="[
            'flex-shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap',
            activeStatus === tab.value
              ? 'text-primary-600 border-primary-500 bg-primary-50/40'
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/80'
          ]"
          @click="setStatus(tab.value)"
        >
          {{ tab.label }}
          <span
            v-if="activeStatus === tab.value && totalItems > 0"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-500 text-white tabular-nums"
          >
            {{ totalItems > 99 ? '99+' : totalItems }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="pending && !page" class="space-y-4" aria-busy="true">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 animate-pulse"
        :style="{ animationDelay: `${(i - 1) * 70}ms` }"
      >
        <BaseSkeleton class="w-24 h-[72px] rounded-xl flex-shrink-0" />
        <div class="flex-1 space-y-2.5 py-1">
          <BaseSkeleton class="h-3 w-28" />
          <BaseSkeleton class="h-5 w-3/4" />
          <BaseSkeleton class="h-3 w-1/4" />
        </div>
        <div class="flex-shrink-0 flex flex-col gap-2 items-end py-1">
          <BaseSkeleton class="h-5 w-16 rounded-full" />
          <BaseSkeleton class="h-9 w-36 rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4"
    >
      <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold text-red-700 mb-1">Failed to load courses</p>
        <p class="text-xs text-red-600">{{ (error as { message?: string }).message ?? 'Something went wrong. Please try again.' }}</p>
        <BaseButton variant="primary" size="sm" class="mt-3" @click="refresh()">Try Again</BaseButton>
      </div>
    </div>

    <!-- Empty: no purchases at all -->
    <BaseEmptyState
      v-else-if="!pending && courses.length === 0 && !activeStatus && !searchQuery"
      icon="book-open"
      title="No courses yet"
      description="You haven't purchased any courses yet. Browse our catalog to find the right one."
      cta-label="Browse Courses"
      cta-to="/courses"
    />

    <!-- Empty: filtered -->
    <BaseEmptyState
      v-else-if="!pending && courses.length === 0"
      icon="search"
      title="No courses found"
      :description="searchQuery ? `No courses matching &quot;${searchQuery}&quot;.` : `No ${activeStatus} courses.`"
      cta-label="Clear Filters"
      @cta-click="navigate({ status: undefined, source: undefined, search: undefined, page: undefined })"
    />

    <!-- Course list -->
    <Transition name="fade-list" mode="out-in">
      <div v-if="!pending && courses.length > 0" :key="`${activeStatus}-${searchQuery}-${currentPage}`" class="space-y-4">
        <div
          v-for="(item, i) in courses"
          :key="item.enrollment_id"
          class="animate-fade-in-up"
          :style="{ animationDelay: `${i * 55}ms` }"
        >
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div class="p-4 flex gap-4 items-start">

              <!-- Thumbnail -->
               <NuxtLink
                v-if="item.course?.slug"
                :to="`/courses/${item.course.slug}`"
                class="w-24 h-[72px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0"
              >
                <div class="w-24 h-[72px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <BaseImage
                    type="course"
                    :src="item.course?.thumbnail_url"
                    :alt="item.course?.title"
                    img-class="w-full h-full object-cover"
                  />
                </div>
              </NuxtLink>
              <div v-else class="w-24 h-[72px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0" />

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <!-- Provider -->
                <div class="flex items-center gap-1.5 mb-1">
                  <BaseImage
                    v-if="item.course?.client?.logo"
                    type="partner"
                    :src="item.course.client.logo"
                    :alt="item.course.client.name"
                    :initial="item.course.client.name?.charAt(0)"
                    img-class="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  />
                  <p class="text-xs text-slate-400 truncate">
                    {{ item.course?.client?.name ?? 'DrillSpace' }}
                  </p>
                </div>

                <!-- Title -->
                <p class="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2">
                  <NuxtLink v-if="item.course?.slug" :to="`/courses/${item.course.slug}`">
                    {{ item.course?.title ?? 'Course unavailable' }}
                  </NuxtLink>
                  <span v-else>
                    {{ item.course?.title ?? 'Course unavailable' }}
                  </span>
                </p>

                <!-- Meta chips -->
                <div class="flex items-center flex-wrap gap-2">
                  <span
                    v-if="item.course?.difficulty && difficultyConfig[item.course.difficulty]"
                    :class="['text-xs font-medium px-2 py-0.5 rounded-full', difficultyConfig[item.course.difficulty].cls]"
                  >
                    {{ difficultyConfig[item.course.difficulty].label }}
                  </span>
                  <span class="text-xs text-slate-400">
                    Enrolled {{ formatDate(item.enrolled_at) }}
                  </span>
                  <span v-if="item.completed_at" class="text-xs text-emerald-600">
                    · Completed {{ formatDate(item.completed_at) }}
                  </span>
                </div>
              </div>

              <!-- Right: status badge + CTA -->
              <div class="flex-shrink-0 flex flex-col items-end gap-3">
                <!-- Enrollment status badge -->
                <span
                  v-if="enrollmentStatusConfig[item.status]"
                  :class="['text-xs font-semibold px-2.5 py-1 rounded-full', enrollmentStatusConfig[item.status].cls]"
                >
                  {{ enrollmentStatusConfig[item.status].label }}
                </span>

                <!-- CTA: active / completed → SSO redirect to LMS -->
                <button
                  v-if="item.course?.client?.slug && item.status !== 'cancelled'"
                  type="button"
                  :disabled="isLoadingFor(item.enrollment_id)"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait"
                  @click="startSsoRedirect(item.course.client.slug, item.course.id, item.enrollment_id, auth.user!.id)"
                >
                  <template v-if="isLoadingFor(item.enrollment_id)">
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening...
                  </template>
                  <template v-else>
                    {{ item.status === 'completed' ? 'View Course' : 'Continue Learning' }}
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </template>
                </button>

                <!-- CTA: no client slug fallback → storefront course page -->
                <BaseButton
                  v-else-if="item.course?.slug && item.status !== 'cancelled'"
                  variant="primary"
                  size="sm"
                  :to="`/courses/${item.course.slug}`"
                >
                  {{ item.status === 'completed' ? 'View Course' : 'Continue Learning' }}
                </BaseButton>

                <!-- Cancelled -->
                <BaseButton
                  v-else-if="item.status === 'cancelled'"
                  variant="ghost"
                  size="sm"
                  to="/orders"
                >
                  View Orders
                </BaseButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-2 gap-4 flex-wrap">
          <p class="text-sm text-slate-400 tabular-nums">
            Page {{ currentPage }} / {{ totalPages }} · {{ totalItems }} total
          </p>
          <div class="flex items-center gap-2">
            <BaseButton variant="secondary" size="sm" :disabled="!hasPrev || pending" @click="goPage(currentPage - 1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </BaseButton>
            <BaseButton variant="secondary" size="sm" :disabled="!hasNext || pending" @click="goPage(currentPage + 1)">
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-list-enter-active,
.fade-list-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
