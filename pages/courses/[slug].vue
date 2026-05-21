<script setup lang="ts">
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import { useEnrollmentApi } from '~/composables/api/useEnrollmentApi'
import { useAuthStore } from '~/stores/auth'
import type { Course } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const coursesApi = useCoursesApi()
const enrollmentApi = useEnrollmentApi()
const { formatCurrency, formatDuration } = useFormatters()

const slug = computed(() => route.params.slug as string)

const { data: course, pending, error, refresh } = await useAsyncData<Course | null>(
  () => `course-detail:${slug.value}`,
  async () => {
    try {
      return await coursesApi.getCourseBySlug(slug.value)
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 404) return null
      throw err
    }
  },
  { watch: [slug] }
)

// 404 — handled inline (lihat template) untuk hindari throw saat SSR
useSeoMeta({
  title: () => course.value?.title ?? 'Course tidak ditemukan',
  description: () => course.value?.description?.slice(0, 160) ?? ''
})

// ─── Syllabus accordion state ───────────────────────────────────────────────
const openChapters = ref<Set<number>>(new Set())
function toggleChapter(id: number) {
  if (openChapters.value.has(id)) openChapters.value.delete(id)
  else openChapters.value.add(id)
  openChapters.value = new Set(openChapters.value)
}

// ─── Computed totals from chapters/lessons ──────────────────────────────────
const chapters = computed(() => course.value?.chapters ?? [])
const totalLessons = computed(() => chapters.value.reduce((sum, ch) => sum + (ch.lessons?.length ?? 0), 0))
const totalDuration = computed(() =>
  chapters.value.reduce((sum, ch) => sum + (ch.lessons?.reduce((acc, l) => acc + (l.duration_minutes ?? 0), 0) ?? 0), 0)
)

// ─── Partner card data (BE detail returns `client`, list endpoint returns `partner`) ─────
const partner = computed(() => {
  const c = course.value
  if (!c) return null
  if (c.partner) return { slug: c.partner.slug, name: c.partner.name, logo_url: c.partner.logo_url }
  if (c.client) return { slug: c.client.slug, name: c.client.name, logo_url: c.client.logo }
  return null
})

const difficultyLabel: Record<string, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir'
}

const isFree = computed(() => course.value?.is_free === true || (course.value?.price !== null && course.value?.price === 0))
const hasPriceSet = computed(() => course.value?.price !== null && course.value?.price !== undefined)

// ─── Free enrollment flow ───────────────────────────────────────────────────
const enrollLoading = ref(false)
const enrollSuccess = ref('')
const enrollError = ref('')

async function handleFreeEnroll() {
  if (!course.value) return
  enrollError.value = ''
  enrollSuccess.value = ''

  // Kalau belum login dan course gratis, BE tetap support hybrid auth (auto-create user).
  // Untuk UX yang lebih bersih, prompt login dulu kalau guest agar mereka mengisi profil.
  if (!auth.isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  enrollLoading.value = true
  try {
    await enrollmentApi.enrollFree(course.value.id)
    enrollSuccess.value = 'Anda berhasil terdaftar ke course ini. Selamat belajar!'
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; message?: string }
    const reason = (e.reason || '').toLowerCase()
    if (reason.includes('already') || reason.includes('sudah enrolled') || e.status === 409) {
      enrollSuccess.value = 'Anda sudah terdaftar di course ini.'
    } else if (e.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    } else if (e.status === 422) {
      enrollError.value = e.message || 'Course tidak bisa di-enroll. Periksa status course.'
    } else {
      enrollError.value = e.message || 'Gagal mendaftar course. Coba lagi.'
    }
  } finally {
    enrollLoading.value = false
  }
}

function handlePurchase() {
  if (!course.value) return
  if (!auth.isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent('/checkout?course=' + course.value.slug)}`)
    return
  }
  router.push(`/checkout?course=${course.value.slug}`)
}
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="pending && !course" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <BaseSkeleton class="h-6 w-1/3" />
          <BaseSkeleton class="h-8 w-3/4" />
          <BaseSkeleton class="h-4" />
          <BaseSkeleton class="aspect-video w-full" />
          <BaseSkeleton class="h-4" />
          <BaseSkeleton class="h-4 w-2/3" />
        </div>
        <div class="lg:col-span-1">
          <BaseSkeleton class="h-64 rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <BaseCard
      v-else-if="error"
      padding="lg"
      class="max-w-2xl mx-auto my-10 border border-red-200 bg-red-50"
    >
      <p class="text-sm text-red-700 mb-3">
        Gagal memuat course. {{ (error as { message?: string }).message ?? '' }}
      </p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refresh()">Coba lagi</BaseButton>
        <BaseButton variant="ghost" size="sm" to="/courses">Kembali ke katalog</BaseButton>
      </div>
    </BaseCard>

    <!-- 404 -->
    <div v-else-if="!course" class="max-w-md mx-auto py-20 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">Course tidak ditemukan</h1>
      <p class="text-sm text-slate-500 mb-6">Course dengan link ini sudah tidak tersedia atau belum dipublikasikan.</p>
      <BaseButton variant="primary" to="/courses">Jelajahi Katalog</BaseButton>
    </div>

    <!-- Success -->
    <div v-else>
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
              <NuxtLink
                v-if="partner"
                :to="`/partners/${partner.slug}`"
                class="text-sm text-primary-600 font-medium hover:underline"
              >
                {{ partner.name }}
              </NuxtLink>
              <h1 class="text-2xl font-bold text-slate-800 mt-2 mb-3">{{ course.title }}</h1>
              <p v-if="course.description" class="text-slate-600 leading-relaxed">
                {{ course.description.split('\n\n')[0] }}
              </p>

              <div class="flex flex-wrap items-center gap-3 mt-4 text-sm text-slate-500">
                <span v-if="totalDuration > 0" class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ formatDuration(totalDuration) }}
                </span>
                <span v-if="totalLessons > 0" class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {{ totalLessons }} pelajaran
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
                </span>
                <span v-if="course.published_at" class="text-xs text-slate-400">
                  Dipublikasikan {{ new Date(course.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </span>
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
            <div v-if="course.description">
              <h2 class="text-lg font-bold text-slate-800 mb-3">Tentang Course</h2>
              <div class="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{{ course.description }}</div>
            </div>

            <!-- Syllabus -->
            <div v-if="chapters.length > 0">
              <h2 class="text-lg font-bold text-slate-800 mb-4">Silabus Course</h2>
              <div class="space-y-2">
                <div v-for="chapter in chapters" :key="chapter.id" class="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    :aria-expanded="openChapters.has(chapter.id)"
                    @click="toggleChapter(chapter.id)"
                  >
                    <div class="flex-1 min-w-0">
                      <span class="font-medium text-slate-800 text-sm">{{ chapter.title }}</span>
                      <span class="text-xs text-slate-500 ml-2">{{ chapter.lessons?.length ?? 0 }} pelajaran</span>
                    </div>
                    <svg
                      class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0"
                      :class="{ 'rotate-180': openChapters.has(chapter.id) }"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <Transition name="accordion">
                    <ul v-if="openChapters.has(chapter.id) && chapter.lessons?.length" class="border-t border-slate-100 divide-y divide-slate-100">
                      <li v-for="lesson in chapter.lessons" :key="lesson.id" class="flex items-center gap-3 px-4 py-3 text-sm text-slate-600">
                        <svg class="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="flex-1 min-w-0">{{ lesson.title }}</span>
                        <span v-if="lesson.duration_minutes" class="text-xs text-slate-400 flex-shrink-0">{{ lesson.duration_minutes }}m</span>
                        <BaseBadge v-if="lesson.is_preview" label="Preview" severity="success" />
                      </li>
                    </ul>
                  </Transition>
                </div>
              </div>
            </div>

            <BaseEmptyState
              v-else
              icon="inbox"
              title="Silabus belum tersedia"
              description="Partner belum melengkapi materi course ini."
            />
          </div>

          <!-- Sidebar / Purchase card -->
          <div class="lg:col-span-1">
            <div class="sticky top-20">
              <BaseCard shadow="lg" padding="lg" class="border border-slate-200">
                <!-- Success / error banner -->
                <div v-if="enrollSuccess" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {{ enrollSuccess }}
                </div>
                <div v-if="enrollError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {{ enrollError }}
                </div>

                <!-- Price -->
                <div class="mb-4">
                  <div v-if="isFree" class="text-2xl font-bold text-green-600">Gratis</div>
                  <div v-else-if="hasPriceSet">
                    <div class="text-2xl font-bold text-primary-600">{{ formatCurrency(course.price ?? 0) }}</div>
                    <div v-if="course.compare_at_price && course.price !== null && course.compare_at_price > course.price" class="text-slate-400 line-through text-sm">
                      {{ formatCurrency(course.compare_at_price) }}
                    </div>
                  </div>
                  <div v-else class="text-slate-400 text-sm italic">Harga belum diset</div>
                </div>

                <!-- CTA -->
                <div class="space-y-2">
                  <BaseButton
                    v-if="isFree"
                    variant="primary"
                    size="lg"
                    block
                    :loading="enrollLoading"
                    :disabled="enrollLoading || !!enrollSuccess"
                    @click="handleFreeEnroll"
                  >
                    {{ enrollSuccess ? 'Sudah Terdaftar' : 'Daftar Gratis' }}
                  </BaseButton>
                  <BaseButton
                    v-else-if="hasPriceSet"
                    variant="primary"
                    size="lg"
                    block
                    @click="handlePurchase"
                  >
                    Beli Sekarang
                  </BaseButton>
                  <BaseButton
                    v-else
                    variant="ghost"
                    size="lg"
                    block
                    disabled
                  >
                    Harga belum tersedia
                  </BaseButton>

                  <BaseButton v-if="!auth.isAuthenticated" variant="ghost" size="md" block to="/login">
                    Sudah punya akun? Masuk
                  </BaseButton>
                </div>

                <p class="text-xs text-slate-400 text-center mt-3">Akses seumur hidup · Sertifikat digital</p>

                <!-- What you get -->
                <div class="mt-5 pt-5 border-t border-slate-100 space-y-2">
                  <p class="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Anda mendapatkan:</p>
                  <div v-if="totalLessons > 0" class="flex items-center gap-2.5 text-sm text-slate-600">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    {{ totalLessons }} pelajaran
                  </div>
                  <div v-if="totalDuration > 0" class="flex items-center gap-2.5 text-sm text-slate-600">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatDuration(totalDuration) }} konten
                  </div>
                  <div v-if="course.enable_completion_cert" class="flex items-center gap-2.5 text-sm text-slate-600">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Sertifikat penyelesaian
                  </div>
                  <div class="flex items-center gap-2.5 text-sm text-slate-600">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Akses di semua perangkat
                  </div>
                </div>
              </BaseCard>
            </div>
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
