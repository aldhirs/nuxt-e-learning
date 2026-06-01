<script setup lang="ts">
import { usePartnersApi, type PartnerListFilters, type PartnerSort } from '~/composables/api/usePartnersApi'
import type { Paginated, Partner } from '~/types'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Training Partners',
  description: 'Find trusted maritime training institutions partnering with DrillSpace.'
})

const route  = useRoute()
const router = useRouter()
const partnersApi = usePartnersApi()

const PAGE_SIZE = 16

// `offset` is NOT URL-backed — Load More manages it internally.
// Refreshing the page always restarts from the first batch.
const filters = computed<Omit<PartnerListFilters, 'limit' | 'offset'>>(() => ({
  search: (route.query.search as string) || undefined,
  sort:   (route.query.sort as PartnerSort) || undefined,
}))

// ── Load More state ───────────────────────────────────────────────────────────
const allPartners    = ref<Partner[]>([])
const totalCount     = ref(0)
const isLoadingMore  = ref(false)
const loadMoreError  = ref('')

const queryKey = computed(() => `partners-list:${JSON.stringify(filters.value)}`)
const { data: page, pending, error, refresh } = await useAsyncData<Paginated<Partner>>(
  queryKey.value,
  () => partnersApi.listPartners({ ...filters.value, limit: PAGE_SIZE, offset: 0 }),
  { watch: [filters] }
)

// Sync accumulated list on first-page fetch (initial load + every filter change).
watch(page, (p) => {
  allPartners.value  = p?.data ?? []
  totalCount.value   = p?.meta?.total ?? 0
  loadMoreError.value = ''
}, { immediate: true })

const partners       = computed(() => allPartners.value)
const hasMore        = computed(() => allPartners.value.length < totalCount.value)
const remainingCount = computed(() => Math.max(0, totalCount.value - allPartners.value.length))

async function loadMore() {
  if (!hasMore.value || isLoadingMore.value) return
  isLoadingMore.value = true
  loadMoreError.value = ''
  try {
    const next = await partnersApi.listPartners({
      ...filters.value,
      limit:  PAGE_SIZE,
      offset: allPartners.value.length,
    })
    const existing = new Set(allPartners.value.map(p => p.slug))
    const fresh = (next.data ?? []).filter(p => !existing.has(p.slug))
    allPartners.value = [...allPartners.value, ...fresh]
    totalCount.value  = next.meta?.total ?? totalCount.value
  } catch (err) {
    loadMoreError.value = (err as { message?: string }).message
      || 'Failed to load more partners. Please try again.'
  } finally {
    isLoadingMore.value = false
  }
}

const sortOptions = [
  { value: '',             label: 'Default' },
  { value: 'course_count', label: 'Most Courses' },
  { value: 'alphabetical', label: 'A → Z' },
]

const hasActiveFilter   = computed(() => Boolean(filters.value.search || filters.value.sort))
const activeFilterCount = computed(() => [filters.value.search, filters.value.sort].filter(Boolean).length)

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

// ── Filter drawer — local buffered state ──────────────────────────────────────
const filterOpen  = ref(false)
const localSearch = ref('')
const localSort   = ref('')

function openFilter() {
  localSearch.value = filters.value.search || ''
  localSort.value   = filters.value.sort   || ''
  filterOpen.value  = true
}

function closeFilter() { filterOpen.value = false }

function applyFilters() {
  updateQuery({
    search: localSearch.value || undefined,
    sort:   localSort.value   || undefined,
  })
  filterOpen.value = false
}

function resetDrawer() {
  localSearch.value = ''
  localSort.value   = ''
  clearFilters()
  filterOpen.value = false
}

const localHasChanges = computed(() =>
  localSearch.value !== (filters.value.search || '') ||
  localSort.value   !== (filters.value.sort   || '')
)

onMounted(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFilter() }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <div id="main-content">

    <!-- ── Hero (page header + sell CTA unified) ─────────────────────────────── -->
    <div class="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 overflow-hidden border-b border-primary-100">
      <!-- Background decorations -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-200/40 blur-3xl"></div>
        <div class="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-primary-100/60 blur-3xl"></div>
        <svg class="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="partner-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#2f7ed0"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#partner-dots)"/>
        </svg>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-slate-400 mb-5" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span aria-hidden="true">/</span>
          <span class="text-slate-600 font-medium">Training Partners</span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">

          <!-- Left: title + description -->
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              Training <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Partners</span>
            </h1>
            <p class="text-slate-500 text-sm max-w-md">
              Trusted maritime education & training institutions partnering with DrillSpace
            </p>
          </div>

          <!-- Right: sell CTA card -->
          <div class="flex-shrink-0 bg-white border border-primary-100 shadow-sm rounded-2xl px-6 py-5 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-3 lg:w-80">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1.5">For Training Organizations</p>
              <p class="text-sm font-semibold text-slate-800 leading-snug mb-1">Have expertise to share?</p>
              <p class="text-xs text-slate-500 leading-relaxed">Launch your branded platform, reach maritime professionals, earn revenue.</p>
            </div>
            <div class="flex flex-row gap-2 flex-shrink-0 items-start sm:items-center lg:items-start">
              <NuxtLink
                to="/partner/register"
                class="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white font-bold px-4 py-2 rounded-xl shadow-sm shadow-primary-500/20 transition-all active:scale-95 text-xs whitespace-nowrap"
              >
                Start Free Trial
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/partner"
                class="inline-flex items-center border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 font-medium px-4 py-2 rounded-xl transition-all text-xs whitespace-nowrap"
              >
                Learn More
              </NuxtLink>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Toolbar ──────────────────────────────────────────────────────────── -->
    <!-- top-16: category bar is hidden on partner pages, navbar is single-row (64px) -->
    <div class="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

        <div class="flex items-center gap-3">
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
            <span v-if="activeFilterCount > 0" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-primary-600 text-xs font-bold">{{ activeFilterCount }}</span>
          </button>
        </div>

        <!-- Total count (right side) -->
        <p class="text-sm text-slate-500 hidden sm:block">
          <template v-if="pending && !page">Loading...</template>
          <template v-else>
            <span class="font-semibold text-slate-700">{{ totalCount }}</span> partners
            <span v-if="hasActiveFilter" class="text-primary-500"> · filter active</span>
          </template>
        </p>
      </div>
    </div>

    <!-- ── Main content ─────────────────────────────────────────────────────── -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Active chips -->
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
        <button type="button" class="text-xs text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2" @click="clearFilters">
          Reset all
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pending && !page" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5" aria-busy="true">
        <div v-for="i in 8" :key="i" class="bg-white rounded-2xl border border-slate-100 p-6 animate-fade-in-up" :style="{ animationDelay: `${(i-1)*50}ms` }">
          <BaseSkeleton class="w-16 h-16 rounded-xl mx-auto mb-4"/>
          <BaseSkeleton class="h-4 w-3/4 mx-auto mb-2"/>
          <BaseSkeleton class="h-3 w-1/2 mx-auto"/>
        </div>
      </div>

      <!-- Error -->
      <BaseCard v-else-if="error" padding="lg" class="border border-red-200 bg-red-50">
        <p class="text-sm text-red-700 mb-3">Failed to load partners. {{ (error as { message?: string }).message ?? '' }}</p>
        <div class="flex gap-2">
          <BaseButton variant="primary" size="sm" @click="refresh()">Try Again</BaseButton>
          <BaseButton v-if="hasActiveFilter" variant="ghost" size="sm" @click="clearFilters">Reset filter</BaseButton>
        </div>
      </BaseCard>

      <!-- Empty no filter -->
      <BaseEmptyState
        v-else-if="partners.length === 0 && !hasActiveFilter"
        icon="building"
        title="No partners yet"
        description="Partners will appear once they publish courses."
      />

      <!-- Empty filtered -->
      <BaseEmptyState
        v-else-if="partners.length === 0"
        icon="search"
        title="No partners found"
        description="Try a different search term."
        cta-label="Reset Filter"
        @cta-click="clearFilters"
      />

      <!-- Grid -->
      <div v-else>
        <Transition name="grid-fade" mode="out-in">
          <div :key="JSON.stringify(filters)" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <NuxtLink
              v-for="(partner, i) in partners"
              :key="partner.slug"
              :to="`/partners/${partner.slug}`"
              class="animate-fade-in-up group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl"
              :style="{ animationDelay: `${i * 45}ms` }"
            >
              <div class="bg-white rounded-2xl border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-center gap-3 h-full">
                <!-- Logo -->
                <div
                  class="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                  :style="{ background: partner.theme_primary ?? '#EFF6FF' }"
                >
                  <img
                    v-if="partner.logo_url"
                    :src="partner.logo_url"
                    :alt="partner.name"
                    class="w-full h-full object-contain"
                    loading="lazy"
                  />
                  <span v-else class="text-2xl font-black" :style="{ color: partner.theme_primary ? '#fff' : '#2f7ed0' }">
                    {{ partner.name.charAt(0) }}
                  </span>
                </div>

                <!-- Name -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                    {{ partner.name }}
                  </h3>
                </div>

                <!-- Course count badge -->
                <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full">
                  <svg class="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span class="text-xs font-semibold text-primary-600">{{ partner.course_count ?? 0 }} course</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </Transition>

        <!-- Load More -->
        <div v-if="totalCount > 0" class="mt-12 flex flex-col items-center gap-3">
          <p class="text-sm text-slate-400">
            Showing <span class="font-semibold text-slate-700">{{ partners.length }}</span>
            of <span class="font-semibold text-slate-700">{{ totalCount }}</span> partners
          </p>

          <p v-if="loadMoreError" class="text-xs text-red-600">{{ loadMoreError }}</p>

          <button
            v-if="hasMore"
            type="button"
            :disabled="isLoadingMore"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-primary-200 text-primary-700 text-sm font-bold hover:border-primary-400 hover:bg-primary-50 hover:shadow-lg hover:shadow-primary-100 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            @click="loadMore"
          >
            <svg
              v-if="!isLoadingMore"
              class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
            <span v-else class="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
            {{ isLoadingMore ? 'Loading...' : `Load ${Math.min(PAGE_SIZE, remainingCount)} more` }}
          </button>

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
      <Transition name="backdrop">
        <div
          v-if="filterOpen"
          class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          aria-hidden="true"
          @click="closeFilter"
        ></div>
      </Transition>

      <Transition name="drawer">
        <div
          v-if="filterOpen"
          class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Filter partner"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                </svg>
              </div>
              <h2 class="text-base font-bold text-slate-800">Filter</h2>
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
                  placeholder="Search partner name..."
                  class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-colors"
                  aria-label="Search partners"
                />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            <!-- Sort -->
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Sort</label>
              <div class="space-y-2">
                <label
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none',
                    localSort === opt.value ? 'border-primary-300 bg-primary-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50']"
                >
                  <div :class="['w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    localSort === opt.value ? 'border-primary-500 bg-primary-500' : 'border-slate-300']">
                    <div v-if="localSort === opt.value" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <span class="text-sm font-medium text-slate-700">{{ opt.label }}</span>
                  <input type="radio" :value="opt.value" :checked="localSort === opt.value" class="sr-only" @change="localSort = opt.value"/>
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
              class="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 active:scale-95"
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

.backdrop-enter-active { transition: opacity 0.2s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.grid-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.grid-fade-leave-active { transition: opacity 0.15s ease; }
.grid-fade-enter-from   { opacity: 0; transform: translateY(4px); }
.grid-fade-leave-to     { opacity: 0; }
</style>
