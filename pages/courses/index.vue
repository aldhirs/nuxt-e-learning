<script setup lang="ts">
import { useCoursesApi, type CourseListFilters, type CourseSort } from '~/composables/api/useCoursesApi'
import { usePartnersApi } from '~/composables/api/usePartnersApi'
import type { Paginated, CourseListItem, Partner } from '~/types'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Katalog Course',
  description: 'Temukan ratusan course maritim bersertifikat dari instruktur terbaik Indonesia.'
})

const route = useRoute()
const router = useRouter()
const coursesApi = useCoursesApi()
const partnersApi = usePartnersApi()

const PAGE_SIZE = 12

// ─── Filter state derived from URL query ────────────────────────────────────
const filters = computed<CourseListFilters>(() => {
  const q = route.query
  return {
    search: (q.search as string) || undefined,
    difficulty: (q.difficulty as CourseListFilters['difficulty']) || undefined,
    partner_slug: (q.partner_slug as string) || undefined,
    is_free: q.is_free === 'true' ? true : undefined,
    price_min: q.price_min ? Number(q.price_min) : undefined,
    price_max: q.price_max ? Number(q.price_max) : undefined,
    sort: (q.sort as CourseSort) || undefined,
    limit: PAGE_SIZE,
    offset: q.offset ? Number(q.offset) : 0
  }
})

const currentPage = computed(() => Math.floor((filters.value.offset ?? 0) / PAGE_SIZE) + 1)

// Debounced search input (300ms before push to URL)
const searchInput = ref((route.query.search as string) || '')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchInput, (v) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    updateQuery({ search: v || undefined, offset: undefined })
  }, 300)
})

// Sync when URL changes externally (back/forward)
watch(() => route.query.search, (v) => {
  if ((v as string | undefined) !== searchInput.value) searchInput.value = (v as string) || ''
})

// ─── Fetch ──────────────────────────────────────────────────────────────────
const queryKey = computed(() => `courses-catalog:${JSON.stringify(filters.value)}`)
const { data: page, pending, error, refresh } = await useAsyncData<Paginated<CourseListItem>>(
  () => queryKey.value,
  () => coursesApi.listCourses(filters.value),
  { watch: [filters] }
)

const courses = computed(() => page.value?.data ?? [])
const totalCount = computed(() => page.value?.meta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))
const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)

// ─── Partner options (loaded once) ─────────────────────────────────────────
const { data: partnersPage } = await useAsyncData<Paginated<Partner>>(
  'catalog-partners',
  () => partnersApi.listPartners({ limit: 100, sort: 'alphabetical' })
)
const partnerOptions = computed(() => {
  const list = partnersPage.value?.data ?? []
  return [
    { value: '', label: 'Semua Partner' },
    ...list.map(p => ({ value: p.slug, label: p.name }))
  ]
})

const difficultyOptions = [
  { value: '', label: 'Semua Level' },
  { value: 'beginner', label: 'Pemula' },
  { value: 'intermediate', label: 'Menengah' },
  { value: 'advanced', label: 'Mahir' }
]

const sortOptions = [
  { value: '', label: 'Urutan Default' },
  { value: 'newest', label: 'Terbaru' },
  { value: 'cheapest', label: 'Harga Terendah' },
  { value: 'most_expensive', label: 'Harga Tertinggi' },
  { value: 'alphabetical', label: 'A → Z' }
]

// ─── Filter handlers ────────────────────────────────────────────────────────
function updateQuery(partial: Record<string, string | number | boolean | undefined>) {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries(route.query)) {
    if (typeof v === 'string' && v) merged[k] = v
  }
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined || v === null || v === '' || v === false) {
      delete merged[k]
    } else {
      merged[k] = String(v)
    }
  }
  router.push({ query: merged })
}

const selectedDifficulty = computed({
  get: () => filters.value.difficulty || '',
  set: (v: string) => updateQuery({ difficulty: v || undefined, offset: undefined })
})
const selectedPartner = computed({
  get: () => filters.value.partner_slug || '',
  set: (v: string) => updateQuery({ partner_slug: v || undefined, offset: undefined })
})
const selectedSort = computed({
  get: () => filters.value.sort || '',
  set: (v: string) => updateQuery({ sort: v || undefined, offset: undefined })
})
const isFreeOnly = computed({
  get: () => filters.value.is_free === true,
  set: (v: boolean) => updateQuery({ is_free: v || undefined, offset: undefined })
})

const hasActiveFilter = computed(() =>
  Boolean(filters.value.search || filters.value.difficulty || filters.value.partner_slug || filters.value.sort || filters.value.is_free)
)

function clearFilters() {
  searchInput.value = ''
  router.push({ query: {} })
}

function goPage(p: number) {
  const clamped = Math.max(1, Math.min(totalPages.value, p))
  updateQuery({ offset: (clamped - 1) * PAGE_SIZE })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Katalog Course</h1>
        <p class="text-slate-500 text-sm mt-1">
          <span v-if="pending && !page">Memuat course...</span>
          <span v-else-if="totalCount > 0">{{ totalCount }} course tersedia</span>
          <span v-else>Belum ada course</span>
          <span v-if="hasActiveFilter"> · filter aktif</span>
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-8">
      <div class="flex-1 min-w-[200px] max-w-sm">
        <div class="relative">
          <input
            v-model="searchInput"
            type="search"
            placeholder="Cari course..."
            class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
            aria-label="Cari course"
          />
          <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <BaseSelect
        v-model="selectedDifficulty"
        :options="difficultyOptions"
        class="min-w-[150px]"
        aria-label="Filter level"
      />

      <BaseSelect
        v-model="selectedPartner"
        :options="partnerOptions"
        class="min-w-[200px]"
        aria-label="Filter partner"
      />

      <BaseSelect
        v-model="selectedSort"
        :options="sortOptions"
        class="min-w-[170px]"
        aria-label="Urutkan"
      />

      <label class="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
        <input v-model="isFreeOnly" type="checkbox" class="rounded border-slate-300 text-primary-600 focus:ring-primary-400" />
        Gratis saja
      </label>

      <button
        v-if="hasActiveFilter"
        type="button"
        class="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
        @click="clearFilters"
      >
        Reset filter
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending && !page" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Memuat course">
      <div v-for="i in 6" :key="i" class="rounded-xl overflow-hidden">
        <BaseSkeleton class="h-44 rounded-none" />
        <div class="p-4 bg-white space-y-2">
          <BaseSkeleton class="h-3 w-1/3" />
          <BaseSkeleton class="h-4" />
          <BaseSkeleton class="h-4 w-3/4" />
          <BaseSkeleton class="h-5 w-1/4 mt-2" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <BaseCard v-else-if="error" padding="lg" class="border border-red-200 bg-red-50">
      <p class="text-sm text-red-700 mb-3">
        Gagal memuat course. {{ (error as { message?: string }).message ?? '' }}
      </p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refresh()">Coba lagi</BaseButton>
        <BaseButton v-if="hasActiveFilter" variant="ghost" size="sm" @click="clearFilters">Reset filter</BaseButton>
      </div>
    </BaseCard>

    <!-- Empty (no filter) -->
    <BaseEmptyState
      v-else-if="courses.length === 0 && !hasActiveFilter"
      icon="inbox"
      title="Belum ada course"
      description="Course akan ditampilkan ketika partner mempublikasikan materi."
    />

    <!-- Empty (filtered) -->
    <BaseEmptyState
      v-else-if="courses.length === 0 && hasActiveFilter"
      icon="search"
      title="Course tidak ditemukan"
      description="Coba kata kunci lain atau ubah filter."
      cta-label="Reset Filter"
      @cta-click="clearFilters"
    />

    <!-- Success -->
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-10 gap-4 flex-wrap">
        <p class="text-sm text-slate-500">
          Halaman {{ currentPage }} dari {{ totalPages }} · {{ courses.length }} dari {{ totalCount }} course
        </p>
        <div class="flex items-center gap-2">
          <BaseButton variant="ghost" size="sm" :disabled="!hasPrev || pending" @click="goPage(currentPage - 1)">← Sebelumnya</BaseButton>
          <BaseButton variant="ghost" size="sm" :disabled="!hasNext || pending" @click="goPage(currentPage + 1)">Berikutnya →</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
