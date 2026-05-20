<script setup lang="ts">
import { dummyCourseList } from '~/data/dummy'
import type { CourseListItem } from '~/types'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Katalog Course',
  description: 'Temukan ratusan course maritim bersertifikat dari instruktur terbaik Indonesia.'
})

const route = useRoute()
const router = useRouter()

const searchQuery = ref((route.query.search as string) ?? '')
const selectedDifficulty = ref((route.query.difficulty as string) ?? '')
const selectedPartner = ref((route.query.partner as string) ?? '')

const isLoading = ref(false)

const difficulties = [
  { value: '', label: 'Semua Level' },
  { value: 'beginner', label: 'Pemula' },
  { value: 'intermediate', label: 'Menengah' },
  { value: 'advanced', label: 'Lanjutan' }
]

const partnerOptions = computed(() => {
  const unique = [...new Set(dummyCourseList.map(c => c.partner.name))]
  return [{ value: '', label: 'Semua Partner' }, ...unique.map(p => ({ value: p, label: p }))]
})

const filtered = computed<CourseListItem[]>(() => {
  let list = dummyCourseList
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.title.toLowerCase().includes(q) || c.partner_name.toLowerCase().includes(q))
  }
  if (selectedDifficulty.value) {
    list = list.filter(c => c.difficulty === selectedDifficulty.value)
  }
  if (selectedPartner.value) {
    list = list.filter(c => c.partner.name === selectedPartner.value)
  }
  return list
})

function doSearch() {
  router.push({ query: { ...(searchQuery.value ? { search: searchQuery.value } : {}), ...(selectedDifficulty.value ? { difficulty: selectedDifficulty.value } : {}), ...(selectedPartner.value ? { partner: selectedPartner.value } : {}) } })
}

function clearFilters() {
  searchQuery.value = ''
  selectedDifficulty.value = ''
  selectedPartner.value = ''
  router.push({ query: {} })
}

watch([selectedDifficulty, selectedPartner], doSearch)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Katalog Course</h1>
      <p class="text-slate-500 text-sm mt-1">{{ dummyCourseList.length }} course tersedia dari partner terpercaya</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-8">
      <form class="flex-1 min-w-[200px] max-w-sm" @submit.prevent="doSearch">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari course atau partner..."
            class="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
            aria-label="Cari course"
          />
          <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      <BaseSelect
        v-model="selectedDifficulty"
        :options="difficulties"
        class="min-w-[140px]"
        aria-label="Filter level"
      />

      <BaseSelect
        v-model="selectedPartner"
        :options="partnerOptions"
        class="min-w-[180px]"
        aria-label="Filter partner"
      />

      <button
        v-if="searchQuery || selectedDifficulty || selectedPartner"
        type="button"
        class="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
        @click="clearFilters"
      >
        Reset filter
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-xl overflow-hidden">
        <BaseSkeleton height="h-44" class="rounded-none" />
        <div class="p-4 bg-white space-y-2">
          <BaseSkeleton height="h-3" width="w-1/3" />
          <BaseSkeleton height="h-4" />
          <BaseSkeleton height="h-4" width="w-3/4" />
          <BaseSkeleton height="h-5" width="w-1/4" class="mt-2" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <BaseEmptyState
      v-else-if="filtered.length === 0"
      icon="search"
      title="Course tidak ditemukan"
      description="Coba kata kunci lain atau reset filter pencarian."
      cta-label="Reset Filter"
      @cta-click="clearFilters"
    />

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <CourseCard v-for="course in filtered" :key="course.id" :course="course" />
    </div>
  </div>
</template>
