<script setup lang="ts">
import { dummyCourses } from '~/data/dummy'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const route = useRoute()
const auth = useAuthStore()
const { formatCurrency, formatDuration } = useFormatters()

const course = computed(() => dummyCourses.find(c => c.slug === route.params.slug))

if (!course.value) {
  throw createError({ statusCode: 404, message: 'Course tidak ditemukan' })
}

useSeoMeta({
  title: course.value?.title,
  description: course.value?.description.slice(0, 160)
})

const openChapters = ref<string[]>([])

function toggleChapter(id: string) {
  if (openChapters.value.includes(id)) {
    openChapters.value = openChapters.value.filter(c => c !== id)
  } else {
    openChapters.value.push(id)
  }
}

const totalLessons = computed(() => course.value?.chapters.reduce((a, c) => a + c.lessons.length, 0) ?? 0)
const totalDuration = computed(() => course.value?.chapters.reduce((a, c) => a + c.lessons.reduce((b, l) => b + l.duration_minutes, 0), 0) ?? 0)
</script>

<template>
  <div v-if="course">
    <!-- Breadcrumb -->
    <div class="bg-white border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-slate-500 flex items-center gap-2">
        <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Beranda</NuxtLink>
        <span>/</span>
        <NuxtLink to="/courses" class="hover:text-primary-600 transition-colors">Course</NuxtLink>
        <span>/</span>
        <span class="text-slate-700 line-clamp-1">{{ course.title }}</span>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Title & meta -->
          <div>
            <NuxtLink :to="`/partners/${course.partner?.slug}`" class="text-sm text-primary-600 font-medium hover:underline">{{ course.partner?.name }}</NuxtLink>
            <h1 class="text-2xl font-bold text-slate-800 mt-2 mb-3">{{ course.title }}</h1>
            <p class="text-slate-600 leading-relaxed">{{ course.description.split('\n\n')[0] }}</p>

            <div class="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ formatDuration(totalDuration) }}
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {{ totalLessons }} pelajaran
              </span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                {{ course.language === 'id' ? 'Bahasa Indonesia' : 'English' }}
              </span>
              <BaseBadge severity="info">{{ course.difficulty === 'beginner' ? 'Pemula' : course.difficulty === 'intermediate' ? 'Menengah' : 'Lanjutan' }}</BaseBadge>
            </div>
          </div>

          <!-- Thumbnail -->
          <div class="rounded-xl overflow-hidden bg-slate-200 aspect-video">
            <img v-if="course.thumbnail_url" :src="course.thumbnail_url" :alt="course.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h2 class="text-lg font-bold text-slate-800 mb-3">Tentang Course</h2>
            <div class="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{{ course.description }}</div>
          </div>

          <!-- Syllabus -->
          <div>
            <h2 class="text-lg font-bold text-slate-800 mb-4">Silabus Course</h2>
            <div class="space-y-2">
              <div v-for="chapter in course.chapters" :key="chapter.id" class="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  class="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  :aria-expanded="openChapters.includes(chapter.id)"
                  @click="toggleChapter(chapter.id)"
                >
                  <div>
                    <span class="font-medium text-slate-800 text-sm">{{ chapter.title }}</span>
                    <span class="text-xs text-slate-500 ml-2">{{ chapter.lessons.length }} pelajaran</span>
                  </div>
                  <svg
                    class="w-4 h-4 text-slate-400 transition-transform"
                    :class="{ 'rotate-180': openChapters.includes(chapter.id) }"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <Transition name="accordion">
                  <ul v-if="openChapters.includes(chapter.id)" class="border-t border-slate-100 divide-y divide-slate-100">
                    <li v-for="lesson in chapter.lessons" :key="lesson.id" class="flex items-center gap-3 px-4 py-3 text-sm text-slate-600">
                      <svg class="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="flex-1">{{ lesson.title }}</span>
                      <span class="text-xs text-slate-400">{{ lesson.duration_minutes }}m</span>
                      <BaseBadge v-if="lesson.is_preview" severity="success" class="text-xs">Preview</BaseBadge>
                    </li>
                  </ul>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Purchase card -->
        <div class="lg:col-span-1">
          <div class="sticky top-20">
            <BaseCard shadow="lg" padding="lg" class="border border-slate-200">
              <!-- Price -->
              <div class="mb-4">
                <div v-if="course.price === 0" class="text-2xl font-bold text-green-600">Gratis</div>
                <div v-else>
                  <div class="text-2xl font-bold text-primary-600">{{ formatCurrency(course.price) }}</div>
                  <div v-if="course.compare_at_price && course.compare_at_price > course.price" class="text-slate-400 line-through text-sm">
                    {{ formatCurrency(course.compare_at_price) }}
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div class="space-y-2">
                <BaseButton variant="primary" size="lg" block :to="`/checkout?course=${course.slug}`">
                  {{ course.price === 0 ? 'Daftar Gratis' : 'Beli Sekarang' }}
                </BaseButton>
                <BaseButton v-if="!auth.isAuthenticated" variant="secondary" size="lg" block to="/login">
                  Masuk untuk Beli
                </BaseButton>
              </div>

              <p class="text-xs text-slate-400 text-center mt-3">Akses seumur hidup · Sertifikat digital</p>

              <!-- What you get -->
              <div class="mt-5 pt-5 border-t border-slate-100 space-y-2">
                <p class="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Anda mendapatkan:</p>
                <div v-for="item in [
                  { icon: 'M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', text: `${totalLessons} video HD` },
                  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', text: `${formatDuration(totalDuration)} konten` },
                  { icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', text: 'Sertifikat penyelesaian' },
                  { icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', text: 'Akses di semua perangkat' },
                ]" :key="item.text" class="flex items-center gap-2.5 text-sm text-slate-600">
                  <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                  </svg>
                  {{ item.text }}
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-enter-active, .accordion-leave-active { transition: all 0.2s ease; overflow: hidden; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; max-height: 0; }
.accordion-enter-to, .accordion-leave-from { max-height: 1000px; }
</style>
