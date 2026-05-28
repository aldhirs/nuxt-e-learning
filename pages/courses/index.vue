<script setup lang="ts">
import { useCoursesApi, type CourseListFilters, type CourseSort } from '~/composables/api/useCoursesApi'
import { usePartnersApi } from '~/composables/api/usePartnersApi'
import type { Paginated, CourseListItem, Partner } from '~/types'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Course Catalog',
  description: 'Find hundreds of certified maritime courses from the best instructors.'
})

const route  = useRoute()
const router = useRouter()
const coursesApi  = useCoursesApi()
const partnersApi = usePartnersApi()

const PAGE_SIZE = 12

// ── Applied filters (from URL — these drive API calls) ────────────────────────
// `offset` is intentionally NOT URL-backed: pagination is "Load More" style,
// so refreshing the page should always restart from the first batch.
const filters = computed<Omit<CourseListFilters, 'limit' | 'offset'>>(() => {
  const q = route.query
  return {
    search:       (q.search as string) || undefined,
    difficulty:   (q.difficulty as CourseListFilters['difficulty']) || undefined,
    partner_slug: (q.partner_slug as string) || undefined,
    is_free:      q.is_free === 'true' ? true : undefined,
    sort:         (q.sort as CourseSort) || undefined,
  }
})

// ── Load More state ───────────────────────────────────────────────────────────
// Accumulated list of courses fetched so far. Reset whenever filters change.
const allCourses     = ref<CourseListItem[]>([])
const totalCount     = ref(0)
const isLoadingMore  = ref(false)
const loadMoreError  = ref('')

// Initial fetch — SSR-friendly via useAsyncData. Re-runs when filters change.
const queryKey = computed(() => `courses-catalog:${JSON.stringify(filters.value)}`)
const { data: page, pending, error, refresh } = await useAsyncData<Paginated<CourseListItem>>(
  queryKey.value,
  () => coursesApi.listCourses({ ...filters.value, limit: PAGE_SIZE, offset: 0 }),
  { watch: [filters] }
)

// Sync the accumulated list whenever the first-page fetch settles (initial
// load + every filter change resets back to offset=0).
watch(page, (p) => {
  allCourses.value = p?.data ?? []
  totalCount.value = p?.meta?.total ?? 0
  loadMoreError.value = ''
}, { immediate: true })

const courses = computed(() => allCourses.value)
const hasMore = computed(() => allCourses.value.length < totalCount.value)
const remainingCount = computed(() => Math.max(0, totalCount.value - allCourses.value.length))

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  loadMoreError.value = ''
  try {
    const next = await coursesApi.listCourses({
      ...filters.value,
      limit: PAGE_SIZE,
      offset: allCourses.value.length, // offset = how many we already have
    })
    // De-dupe by id in case of any backend race / overlap.
    const existing = new Set(allCourses.value.map(c => c.id))
    const fresh = (next.data ?? []).filter(c => !existing.has(c.id))
    allCourses.value = [...allCourses.value, ...fresh]
    // Refresh total in case it changed server-side mid-session.
    totalCount.value = next.meta?.total ?? totalCount.value
  } catch (err) {
    loadMoreError.value = (err as { message?: string }).message
      || 'Failed to load more courses. Please try again.'
  } finally {
    isLoadingMore.value = false
  }
}

// ── Partner options ───────────────────────────────────────────────────────────
const { data: partnersPage } = await useAsyncData<Paginated<Partner>>(
  'catalog-partners',
  () => partnersApi.listPartners({ limit: 100, sort: 'alphabetical' })
)
const partnerList = computed(() => partnersPage.value?.data ?? [])

// ── Sort (immediate, outside drawer) ─────────────────────────────────────────
const selectedSort = computed({
  get: () => filters.value.sort || '',
  set: (v: string) => updateQuery({ sort: v || undefined })
})

// ── Applied filter state (derived from URL) ───────────────────────────────────
const hasActiveFilter = computed(() =>
  Boolean(filters.value.search || filters.value.difficulty || filters.value.partner_slug || filters.value.is_free)
)
const activeFilterCount = computed(() => [
  filters.value.search,
  filters.value.difficulty,
  filters.value.partner_slug,
  filters.value.is_free,
].filter(Boolean).length)

// ── URL helpers ───────────────────────────────────────────────────────────────
function updateQuery(partial: Record<string, string | number | boolean | undefined>) {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries(route.query)) {
    if (typeof v === 'string' && v) merged[k] = v
  }
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined || v === null || v === '' || v === false) delete merged[k]
    else merged[k] = String(v)
  }
  router.push({ query: merged })
}

function clearFilters() {
  router.push({ query: {} })
}

// ── Filter drawer local state (buffered — not applied until Terapkan) ─────────
const filterOpen = ref(false)

// Local copies — only written to URL on applyFilters()
const localSearch     = ref('')
const localDifficulty = ref('')
const localPartner    = ref('')
const localIsFree     = ref(false)

function openFilter() {
  // Snapshot current URL state into local state
  localSearch.value     = filters.value.search       || ''
  localDifficulty.value = filters.value.difficulty   || ''
  localPartner.value    = filters.value.partner_slug || ''
  localIsFree.value     = filters.value.is_free === true
  filterOpen.value = true
}

function closeFilter() {
  // Discard pending local changes (do NOT apply to URL)
  filterOpen.value = false
}

function applyFilters() {
  updateQuery({
    search:       localSearch.value     || undefined,
    difficulty:   localDifficulty.value || undefined,
    partner_slug: localPartner.value    || undefined,
    is_free:      localIsFree.value     || undefined,
  })
  filterOpen.value = false
}

function resetDrawer() {
  // Clear URL immediately and reset local state
  localSearch.value     = ''
  localDifficulty.value = ''
  localPartner.value    = ''
  localIsFree.value     = false
  clearFilters()
  filterOpen.value = false
}

// Local filter has unsaved changes compared to what's in the URL
const localHasChanges = computed(() =>
  localSearch.value     !== (filters.value.search       || '') ||
  localDifficulty.value !== (filters.value.difficulty   || '') ||
  localPartner.value    !== (filters.value.partner_slug || '') ||
  localIsFree.value     !== (filters.value.is_free === true)
)

onMounted(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFilter() }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

// Sort / difficulty label helpers
const sortOptions = [
  { value: '',               label: 'Default' },
  { value: 'newest',         label: 'Latest' },
  { value: 'cheapest',       label: 'Lowest Price' },
  { value: 'most_expensive', label: 'Highest Price' },
  { value: 'alphabetical',   label: 'A → Z' },
]

const difficultyOptions = [
  { value: 'beginner',     label: 'Beginner',      icon: '🟢' },
  { value: 'intermediate', label: 'Intermediate',  icon: '🟡' },
  { value: 'advanced',     label: 'Advanced',      icon: '🔴' },
]
</script>

<template>
  <div id="main-content">

    <!-- ── Page header ──────────────────────────────────────────────────────── -->
    <div class="bg-white border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav class="flex items-center gap-2 text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-primary-500 transition-colors">Home</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-slate-600 font-medium">Course Catalog</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-slate-900">Course Catalog</h1>
        <p class="text-slate-500 mt-1.5 text-sm">Enhance your maritime skills with STCW-certified instructors</p>
      </div>
    </div>

    <!-- ── Sticky toolbar ───────────────────────────────────────────────────── -->
    <div class="sticky top-28 z-30 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

        <!-- Filter button + count -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-95',
              hasActiveFilter
                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:text-primary-600'
            ]"
            @click="openFilter"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            Filter
            <span v-if="activeFilterCount > 0"
              class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-primary-600 text-xs font-bold">
              {{ activeFilterCount }}
            </span>
          </button>

          <p class="text-sm text-slate-500 hidden sm:block">
            <template v-if="pending && !page">Loading...</template>
            <template v-else>
              <span class="font-semibold text-slate-700">{{ totalCount.toLocaleString('id-ID') }}</span> courses
              <span v-if="hasActiveFilter" class="text-primary-500"> · filter active</span>
            </template>
          </p>
        </div>

        <!-- Sort (immediate) -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500 hidden sm:block whitespace-nowrap">Sort:</span>
          <div class="relative">
            <select
              :value="selectedSort"
              class="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 cursor-pointer"
              @change="selectedSort = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main content ─────────────────────────────────────────────────────── -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Active filter chips (immediately removable) -->
      <div v-if="hasActiveFilter" class="flex flex-wrap gap-2 mb-6">
        <span v-if="filters.search"
          class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium">
          "{{ filters.search }}"
          <button type="button" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
            aria-label="Remove search filter"
            @click="updateQuery({ search: undefined })">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </span>
        <span v-if="filters.difficulty"
          class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium">
          {{ difficultyOptions.find(d => d.value === filters.difficulty)?.label }}
          <button type="button" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
            aria-label="Remove level filter"
            @click="updateQuery({ difficulty: undefined })">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </span>
        <span v-if="filters.partner_slug"
          class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-medium">
          {{ partnerList.find(p => p.slug === filters.partner_slug)?.name ?? filters.partner_slug }}
          <button type="button" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-colors"
            aria-label="Remove partner filter"
            @click="updateQuery({ partner_slug: undefined })">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </span>
        <span v-if="filters.is_free"
          class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium">
          Free only
          <button type="button" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-green-200 transition-colors"
            aria-label="Remove free filter"
            @click="updateQuery({ is_free: undefined })">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </span>
        <button type="button"
          class="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1 underline underline-offset-2"
          @click="clearFilters">
          Reset all
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pending && !page" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true">
        <div v-for="i in 8" :key="i" class="rounded-2xl overflow-hidden bg-white border border-slate-100 animate-fade-in-up" :style="{ animationDelay: `${(i-1)*50}ms` }">
          <BaseSkeleton class="aspect-video"/>
          <div class="p-4 space-y-2.5">
            <BaseSkeleton class="h-3 w-1/3"/>
            <BaseSkeleton class="h-4 w-full"/>
            <BaseSkeleton class="h-4 w-3/4"/>
            <BaseSkeleton class="h-5 w-1/3 mt-1"/>
          </div>
        </div>
      </div>

      <!-- Error -->
      <BaseCard v-else-if="error" padding="lg" class="border border-red-200 bg-red-50">
        <p class="text-sm text-red-700 mb-3">Failed to load courses. {{ (error as { message?: string }).message ?? '' }}</p>
        <div class="flex gap-2">
          <BaseButton variant="primary" size="sm" @click="refresh()">Try Again</BaseButton>
          <BaseButton v-if="hasActiveFilter" variant="ghost" size="sm" @click="clearFilters">Reset filter</BaseButton>
        </div>
      </BaseCard>

      <!-- Empty: no filter -->
      <BaseEmptyState
        v-else-if="courses.length === 0 && !hasActiveFilter"
        icon="inbox"
        title="No courses yet"
        description="Courses will appear once partners publish their content."
      />

      <!-- Empty: filtered -->
      <BaseEmptyState
        v-else-if="courses.length === 0"
        icon="search"
        title="No courses found"
        description="Try a different keyword or change filters."
        cta-label="Reset Filter"
        @cta-click="clearFilters"
      />

      <!-- Grid -->
      <div v-else>
        <Transition name="grid-fade" mode="out-in">
          <div :key="JSON.stringify(filters)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <div
              v-for="(course, i) in courses"
              :key="course.id"
              class="animate-fade-in-up h-full"
              :style="{ animationDelay: `${i * 45}ms` }"
            >
              <CourseCard :course="course"/>
            </div>
          </div>
        </Transition>

        <!-- Load More -->
        <div v-if="totalCount > 0" class="mt-12 flex flex-col items-center gap-3">
          <!-- Progress indicator -->
          <p class="text-sm text-slate-400">
            Showing <span class="font-semibold text-slate-700">{{ courses.length }}</span>
            of <span class="font-semibold text-slate-700">{{ totalCount }}</span> courses
          </p>

          <!-- Load more error -->
          <p v-if="loadMoreError" class="text-xs text-red-600">{{ loadMoreError }}</p>

          <!-- Button (only when more to load) -->
          <button
            v-if="hasMore"
            type="button"
            :disabled="isLoadingMore"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-primary-200 text-primary-700 text-sm font-bold hover:border-primary-400 hover:bg-primary-50 hover:shadow-lg hover:shadow-primary-100 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            @click="loadMore"
          >
            <svg
              v-if="!isLoadingMore"
              class="w-4 h-4"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span v-else class="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
            {{ isLoadingMore ? 'Loading...' : `Load ${Math.min(PAGE_SIZE, remainingCount)} more` }}
          </button>

          <!-- End-of-list indicator -->
          <div v-else-if="totalCount > PAGE_SIZE" class="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span class="h-px w-12 bg-slate-200"></span>
            You've reached the end
            <span class="h-px w-12 bg-slate-200"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         FILTER DRAWER
    ═══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- Backdrop -->
      <Transition name="backdrop">
        <div v-if="filterOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" aria-hidden="true" @click="closeFilter"/>
      </Transition>

      <!-- Drawer -->
      <Transition name="drawer">
        <div v-if="filterOpen"
          class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          role="dialog" aria-modal="true" aria-label="Filter course">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                </svg>
              </div>
              <h2 class="text-base font-bold text-slate-800">Filter</h2>
              <!-- Pending changes indicator -->
              <span v-if="localHasChanges" class="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Not applied yet
              </span>
            </div>
            <button type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close filter"
              @click="closeFilter">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-7">

            <!-- Search -->
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Search</label>
              <div class="relative">
                <input
                  v-model="localSearch"
                  type="text"
                  placeholder="Search course name..."
                  class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-colors"
                  aria-label="Search courses"
                />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            <!-- Level -->
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Level</label>
              <div class="space-y-2">
                <label
                  v-for="opt in difficultyOptions"
                  :key="opt.value"
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                    localDifficulty === opt.value ? 'border-primary-300 bg-primary-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50']"
                >
                  <div :class="['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    localDifficulty === opt.value ? 'border-primary-500 bg-primary-500' : 'border-slate-300']">
                    <div v-if="localDifficulty === opt.value" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <span class="text-sm font-medium text-slate-700">{{ opt.icon }} {{ opt.label }}</span>
                  <input type="radio" name="local-difficulty" :value="opt.value" :checked="localDifficulty === opt.value"
                    class="sr-only"
                    @change="localDifficulty = localDifficulty === opt.value ? '' : opt.value" />
                </label>
                <button v-if="localDifficulty" type="button"
                  class="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-1"
                  @click="localDifficulty = ''">
                  Clear selection
                </button>
              </div>
            </div>

            <!-- Free only -->
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Availability</label>
              <label
                :class="['flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none',
                  localIsFree ? 'border-green-300 bg-green-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50']"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg" aria-hidden="true">🎁</span>
                  <div>
                    <p class="text-sm font-medium text-slate-700">Free only</p>
                    <p class="text-xs text-slate-400">Only free courses</p>
                  </div>
                </div>
                <div :class="['relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0', localIsFree ? 'bg-green-500' : 'bg-slate-200']"
                  role="switch" :aria-checked="localIsFree">
                  <div :class="['absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200', localIsFree ? 'translate-x-4' : 'translate-x-0']"></div>
                  <input v-model="localIsFree" type="checkbox" class="sr-only"/>
                </div>
              </label>
            </div>

            <!-- Partner -->
            <div v-if="partnerList.length > 0">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Partner</label>
              <div class="space-y-1 max-h-52 overflow-y-auto pr-1">
                <label
                  v-for="partner in partnerList"
                  :key="partner.slug"
                  :class="['flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none',
                    localPartner === partner.slug ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700']"
                >
                  <div :class="['w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    localPartner === partner.slug ? 'border-primary-500 bg-primary-500' : 'border-slate-300']">
                    <svg v-if="localPartner === partner.slug" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <span class="text-sm truncate">{{ partner.name }}</span>
                  <span v-if="partner.course_count" class="ml-auto text-xs text-slate-400 flex-shrink-0">{{ partner.course_count }}</span>
                  <input type="radio" :value="partner.slug" :checked="localPartner === partner.slug"
                    class="sr-only"
                    @change="localPartner = localPartner === partner.slug ? '' : partner.slug"/>
                </label>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button type="button"
              class="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
              @click="resetDrawer">
              Reset All
            </button>
            <button type="button"
              :class="['flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95',
                localHasChanges
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20']"
              @click="applyFilters">
              Apply Filters
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.drawer-enter-active  { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-leave-active  { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.grid-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.grid-fade-leave-active { transition: opacity 0.15s ease; }
.grid-fade-enter-from   { opacity: 0; transform: translateY(4px); }
.grid-fade-leave-to     { opacity: 0; }
</style>
