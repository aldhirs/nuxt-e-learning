<script setup lang="ts">
import { usePartnersApi, type PartnerListFilters, type PartnerSort } from '~/composables/api/usePartnersApi'
import type { Paginated, Partner } from '~/types'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Partner Pelatihan',
  description: 'Temukan lembaga pelatihan maritim terpercaya yang bermitra dengan DrillSpace.'
})

const route = useRoute()
const router = useRouter()
const partnersApi = usePartnersApi()

const PAGE_SIZE = 16

const filters = computed<PartnerListFilters>(() => ({
  search: (route.query.search as string) || undefined,
  sort: (route.query.sort as PartnerSort) || undefined,
  limit: PAGE_SIZE,
  offset: route.query.offset ? Number(route.query.offset) : 0
}))

const currentPage = computed(() => Math.floor((filters.value.offset ?? 0) / PAGE_SIZE) + 1)

// Debounced search input
const searchInput = ref((route.query.search as string) || '')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchInput, (v) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => updateQuery({ search: v || undefined, offset: undefined }), 300)
})
watch(() => route.query.search, (v) => {
  if ((v as string | undefined) !== searchInput.value) searchInput.value = (v as string) || ''
})

const queryKey = computed(() => `partners-list:${JSON.stringify(filters.value)}`)
const { data: page, pending, error, refresh } = await useAsyncData<Paginated<Partner>>(
  () => queryKey.value,
  () => partnersApi.listPartners(filters.value),
  { watch: [filters] }
)

const partners = computed(() => page.value?.data ?? [])
const totalCount = computed(() => page.value?.meta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))
const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)

const sortOptions = [
  { value: '', label: 'Urutan Default' },
  { value: 'course_count', label: 'Banyak Course' },
  { value: 'alphabetical', label: 'A → Z' }
]

const selectedSort = computed({
  get: () => filters.value.sort || '',
  set: (v: string) => updateQuery({ sort: v || undefined, offset: undefined })
})

const hasActiveFilter = computed(() => Boolean(filters.value.search || filters.value.sort))

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
    <div class="mb-8 flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Partner Pelatihan</h1>
        <p class="text-slate-500 text-sm mt-1">
          <span v-if="pending && !page">Memuat partner...</span>
          <span v-else-if="totalCount > 0">{{ totalCount }} lembaga terpercaya bermitra dengan DrillSpace</span>
          <span v-else>Belum ada partner</span>
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
            placeholder="Cari nama partner..."
            class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
            aria-label="Cari partner"
          />
          <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <BaseSelect
        v-model="selectedSort"
        :options="sortOptions"
        class="min-w-[170px]"
        aria-label="Urutkan partner"
      />

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
    <div v-if="pending && !page" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Memuat partner">
      <BaseSkeleton v-for="i in 8" :key="i" class="aspect-square rounded-xl" />
    </div>

    <!-- Error -->
    <BaseCard v-else-if="error" padding="lg" class="border border-red-200 bg-red-50">
      <p class="text-sm text-red-700 mb-3">Gagal memuat partner. {{ (error as { message?: string }).message ?? '' }}</p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refresh()">Coba lagi</BaseButton>
        <BaseButton v-if="hasActiveFilter" variant="ghost" size="sm" @click="clearFilters">Reset filter</BaseButton>
      </div>
    </BaseCard>

    <!-- Empty (no filter) -->
    <BaseEmptyState
      v-else-if="partners.length === 0 && !hasActiveFilter"
      icon="building"
      title="Belum ada partner"
      description="Partner akan ditampilkan ketika mereka publikasikan course."
    />

    <!-- Empty (filtered) -->
    <BaseEmptyState
      v-else-if="partners.length === 0 && hasActiveFilter"
      icon="search"
      title="Partner tidak ditemukan"
      description="Coba kata kunci lain atau hapus filter."
      cta-label="Reset Filter"
      @cta-click="clearFilters"
    />

    <!-- Success -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <PartnerCard v-for="partner in partners" :key="partner.slug" :partner="partner" />
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between mt-10 gap-4 flex-wrap">
        <p class="text-sm text-slate-500">
          Halaman {{ currentPage }} dari {{ totalPages }} · {{ partners.length }} dari {{ totalCount }} partner
        </p>
        <div class="flex items-center gap-2">
          <BaseButton variant="ghost" size="sm" :disabled="!hasPrev || pending" @click="goPage(currentPage - 1)">← Sebelumnya</BaseButton>
          <BaseButton variant="ghost" size="sm" :disabled="!hasNext || pending" @click="goPage(currentPage + 1)">Berikutnya →</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
