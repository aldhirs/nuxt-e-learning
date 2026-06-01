<script setup lang="ts">
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import { useEnrollmentApi } from '~/composables/api/useEnrollmentApi'
import { useAuthStore } from '~/stores/auth'
import type { Course, EnrollmentCheckResponse } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const coursesApi = useCoursesApi()
const enrollmentApi = useEnrollmentApi()
const { formatCurrency, formatDuration } = useFormatters()
const { startSsoRedirect, isLoading: ssoLoading } = useSsoRedirect()

const slug = computed(() => route.params.slug as string)

const { data: course, pending, error, refresh } = await useAsyncData<Course | null>(
  () => `course-detail:${slug.value}`,
  async () => {
    try { return await coursesApi.getCourseBySlug(slug.value) }
    catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 404) return null
      throw err
    }
  },
  { watch: [slug] }
)

useSeoMeta({
  title: () => course.value?.title ?? 'Course not found',
  description: () => course.value?.description?.slice(0, 160) ?? ''
})

// ─── Accordion ──────────────────────────────────────────────────────────────
const openChapters = ref<Set<number>>(new Set())
function toggleChapter(id: number) {
  if (openChapters.value.has(id)) openChapters.value.delete(id)
  else openChapters.value.add(id)
  openChapters.value = new Set(openChapters.value)
}

// ─── Computed ───────────────────────────────────────────────────────────────
const chapters = computed(() => course.value?.chapters ?? [])
const totalLessons = computed(() => chapters.value.reduce((sum, ch) => sum + (ch.lessons?.length ?? 0), 0))
const totalDuration = computed(() =>
  chapters.value.reduce((sum, ch) => sum + (ch.lessons?.reduce((acc, l) => acc + (l.duration_minutes ?? 0), 0) ?? 0), 0)
)

const partner = computed(() => {
  const c = course.value
  if (!c) return null
  if (c.partner) return { slug: c.partner.slug, name: c.partner.name, logo_url: c.partner.logo_url }
  if (c.client) return { slug: c.client.slug, name: c.client.name, logo_url: c.client.logo }
  return null
})

const learningObjectives = computed(() => chapters.value.slice(0, 8).map(ch => ch.title).filter(Boolean))

const discountPct = computed(() => {
  const p = course.value?.price
  const cp = course.value?.compare_at_price
  if (!p || !cp || cp <= p) return 0
  return Math.round((1 - p / cp) * 100)
})

const difficultyLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700'
}

const isFree = computed(() => course.value?.is_free === true || (course.value?.price !== null && course.value?.price === 0))
const hasPriceSet = computed(() => course.value?.price !== null && course.value?.price !== undefined)

// ─── Enrollment check (purchased?) ──────────────────────────────────────────
// Only run when authenticated — guests never have enrollment
const { data: enrollmentCheck, refresh: refreshEnrollment } = await useAsyncData<EnrollmentCheckResponse | null>(
  () => `enrollment-check:${slug.value}:${auth.isAuthenticated}`,
  async () => {
    if (!auth.isAuthenticated || !course.value?.id) return null
    try { return await enrollmentApi.checkEnrollment(course.value.id) }
    catch { return null }
  },
  { watch: [slug] }
)

const isPurchased = computed(() => enrollmentCheck.value?.enrolled === true)
const enrolledClientSlug = computed(() => enrollmentCheck.value?.client?.slug ?? null)

const canStartLearning = computed(() =>
  !!enrolledClientSlug.value && !!course.value?.id && !!enrollmentCheck.value?.enrollment_id
)

async function handleStartLearning() {
  if (!canStartLearning.value || !auth.user?.id) return
  await startSsoRedirect(
    enrolledClientSlug.value!,
    course.value!.id,
    enrollmentCheck.value!.enrollment_id!,
    auth.user.id
  )
}

// ─── Image lightbox ─────────────────────────────────────────────────────────
const lightboxOpen = ref(false)
function openLightbox() {
  if (course.value?.thumbnail_url) lightboxOpen.value = true
}
function closeLightbox() { lightboxOpen.value = false }

// Close on Esc key — only bound on client when modal is open.
watch(lightboxOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.body.style.overflow = 'hidden' // prevent background scroll
    document.addEventListener('keydown', onLightboxKey)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onLightboxKey)
  }
})
function onLightboxKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
}
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onLightboxKey)
  }
})

// ─── Enrollment ─────────────────────────────────────────────────────────────
const enrollLoading = ref(false)
const enrollSuccess = ref('')
const enrollError = ref('')

async function handleFreeEnroll() {
  if (!course.value) return
  enrollError.value = ''
  enrollSuccess.value = ''
  if (!auth.isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`); return }
  enrollLoading.value = true
  try {
    await enrollmentApi.enrollFree(course.value.id)
    enrollSuccess.value = 'You have successfully enrolled in this course. Enjoy learning!'
    // Re-fetch enrollment so the button switches immediately to "Start Learning"
    await refreshEnrollment()
  } catch (err: unknown) {
    const e = err as { status?: number; reason?: string; message?: string }
    const reason = (e.reason || '').toLowerCase()
    if (reason.includes('already') || reason.includes('sudah enrolled') || e.status === 409) {
      enrollSuccess.value = 'You are already enrolled in this course.'
    } else if (e.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    } else if (e.status === 422) {
      enrollError.value = e.message || 'Cannot enroll in this course. Check the course status.'
    } else {
      enrollError.value = e.message || 'Failed to enroll in course. Please try again.'
    }
  } finally {
    enrollLoading.value = false
  }
}

function handlePurchase() {
  if (!course.value) return
  if (!auth.isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent('/checkout?course=' + course.value.slug)}`); return }
  router.push(`/checkout?course=${course.value.slug}`)
}

// ─── Scroll reveal ──────────────────────────────────────────────────────────
onMounted(() => {
  if (!import.meta.client) return
  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target) } }),
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  )
  document.querySelectorAll('.reveal-section').forEach(el => { el.classList.add('observe-pending'); obs.observe(el) })
  return () => obs.disconnect()
})
</script>

<template>
  <div>
    <!-- ── Loading ─────────────────────────────────────────────────────────── -->
    <div v-if="pending && !course" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="h-5 w-40 bg-slate-200 rounded animate-pulse mb-8" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div class="lg:col-span-2 space-y-5">
          <div class="h-10 bg-slate-200 rounded-xl w-3/4 animate-pulse" />
          <div class="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div class="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
          <div class="h-5 w-48 bg-slate-100 rounded-full animate-pulse" />
          <div class="h-56 bg-slate-200 rounded-2xl animate-pulse" />
          <div class="h-56 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
        <div class="lg:col-span-1">
          <div class="h-[420px] bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>

    <!-- ── Error ───────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="max-w-xl mx-auto px-4 py-24 text-center">
      <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <p class="text-slate-700 font-semibold mb-2">Failed to load course</p>
      <p class="text-sm text-slate-500 mb-6">{{ (error as { message?: string }).message ?? '' }}</p>
      <div class="flex justify-center gap-3">
        <BaseButton variant="primary" size="sm" @click="refresh()">Try Again</BaseButton>
        <BaseButton variant="ghost" size="sm" to="/courses">Back to catalog</BaseButton>
      </div>
    </div>

    <!-- ── 404 ─────────────────────────────────────────────────────────────── -->
    <div v-else-if="!course" class="max-w-md mx-auto py-24 text-center px-4">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
        <svg class="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-800 mb-3">Course not found</h1>
      <p class="text-sm text-slate-500 mb-8">This course is no longer available or has not been published.</p>
      <BaseButton variant="primary" to="/courses">Browse Catalog</BaseButton>
    </div>

    <!-- ── Main ────────────────────────────────────────────────────────────── -->
    <div v-else class="page-enter">

      <!-- ── Hero Header ────────────────────────────────────────────────────── -->
      <div class="relative bg-gradient-to-b from-primary-50/70 via-slate-50/40 to-white border-b border-slate-100 overflow-hidden">
        <div class="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-primary-100/25 -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden="true" />
        <div class="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-primary-50/60 translate-y-1/2 pointer-events-none" aria-hidden="true" />

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap" aria-label="Breadcrumb">
            <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            <NuxtLink to="/courses" class="hover:text-primary-600 transition-colors">Course</NuxtLink>
            <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            <span class="text-slate-700 truncate max-w-[200px] sm:max-w-xs">{{ course.title }}</span>
          </nav>

          <!-- Partner badge -->
          <NuxtLink
            v-if="partner"
            :to="`/partners/${partner.slug}`"
            class="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white border border-primary-200 text-sm font-medium text-primary-700 hover:border-primary-400 hover:shadow-sm transition-all"
          >
            <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="w-5 h-5 object-contain rounded" />
            <div v-else class="w-5 h-5 rounded bg-primary-100 text-primary-600 text-[10px] font-bold flex items-center justify-center">{{ partner.name.charAt(0) }}</div>
            <span>{{ partner.name }}</span>
            <svg class="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl lg:text-[2.5rem] font-extrabold text-slate-900 leading-tight mb-5 max-w-3xl">{{ course.title }}</h1>

          <!-- Description preview -->
          <p v-if="course.description" class="text-base text-slate-600 max-w-2xl leading-relaxed mb-7">
            {{ course.description.split('\n')[0] }}
          </p>

          <!-- Meta badges -->
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" :class="difficultyColor[course.difficulty] ?? 'bg-slate-100 text-slate-600'">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
            </span>
            <span v-if="totalLessons > 0" class="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {{ totalLessons }} lessons
            </span>
            <span v-if="totalDuration > 0" class="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ formatDuration(totalDuration) }}
            </span>
            <span v-if="isFree" class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Free
            </span>
            <span v-if="course.published_at" class="text-xs text-slate-400">
              {{ new Date(course.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────────── -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">

          <!-- ── Left: Content ────────────────────────────────────────────────── -->
          <div class="lg:col-span-2 space-y-12">

            <!-- About -->
            <section v-if="course.description" class="reveal-section" style="transition-delay:0ms">
              <h2 class="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                About this Course
              </h2>
              <div class="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <!-- Decorative gradient accent -->
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
                <!-- Soft corner gradient -->
                <div class="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br from-primary-50 to-transparent opacity-60 pointer-events-none"></div>

                <div class="relative p-6 sm:p-7">
                  <div class="text-slate-700 leading-relaxed text-[15px] whitespace-pre-line">
                    {{ course.description }}
                  </div>

                  <!-- Footer chip row — meta cues -->
                  <div v-if="course.difficulty || totalLessons > 0 || totalDuration > 0" class="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <span
                      v-if="course.difficulty"
                      :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', difficultyColor[course.difficulty] ?? 'bg-slate-100 text-slate-600']"
                    >
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
                    </span>
                    <span v-if="totalLessons > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      {{ totalLessons }} lessons
                    </span>
                    <span v-if="totalDuration > 0" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ formatDuration(totalDuration) }}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <!-- What You'll Learn -->
            <section v-if="learningObjectives.length > 0" class="reveal-section" style="transition-delay:60ms">
              <h2 class="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                What You'll Learn
              </h2>
              <div class="bg-gradient-to-br from-primary-50/60 to-slate-50 rounded-2xl p-6 border border-primary-100/70">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8">
                  <div v-for="(obj, i) in learningObjectives" :key="i" class="flex items-start gap-3">
                    <div class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span class="text-sm text-slate-700 leading-snug">{{ obj }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Partner / Penyelenggara -->
            <section v-if="partner" class="reveal-section" style="transition-delay:120ms">
              <h2 class="text-xl font-bold text-slate-800 mb-5 flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                </span>
                Provider
              </h2>
              <NuxtLink
                :to="`/partners/${partner.slug}`"
                class="flex items-center gap-5 p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 group"
              >
                <div class="w-20 h-20 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="w-full h-full object-contain p-2" />
                  <span v-else class="text-3xl font-bold text-slate-200">{{ partner.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{{ partner.name }}</p>
                  <p class="text-sm text-slate-500 mt-1">Professional maritime training provider</p>
                  <p class="text-xs text-primary-600 font-semibold mt-2.5 flex items-center gap-1">
                    View all courses
                    <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                  </p>
                </div>
                <svg class="w-5 h-5 text-slate-200 group-hover:text-primary-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </NuxtLink>
            </section>

            <!-- Curriculum -->
            <section class="reveal-section" style="transition-delay:180ms">
              <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h2 class="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <span class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                  </span>
                  Course Syllabus
                </h2>
                <div v-if="totalLessons > 0" class="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  {{ chapters.length }} chapters &middot; {{ totalLessons }} lessons
                  <span v-if="totalDuration > 0"> &middot; {{ formatDuration(totalDuration) }}</span>
                </div>
              </div>

              <div v-if="chapters.length > 0" class="space-y-3">
                <div
                  v-for="(chapter, ci) in chapters"
                  :key="chapter.id"
                  class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    class="w-full flex items-center gap-4 p-4 sm:p-5 text-left transition-colors"
                    :class="openChapters.has(chapter.id) ? 'bg-primary-50' : 'hover:bg-slate-50'"
                    :aria-expanded="openChapters.has(chapter.id)"
                    @click="toggleChapter(chapter.id)"
                  >
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all duration-200"
                      :class="openChapters.has(chapter.id) ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ ci + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="font-semibold text-slate-800 text-sm sm:text-base">{{ chapter.title }}</span>
                      <span class="text-xs text-slate-400 ml-2">{{ chapter.lessons?.length ?? 0 }} lessons</span>
                    </div>
                    <svg
                      class="w-4 h-4 transition-transform duration-200 flex-shrink-0"
                      :class="openChapters.has(chapter.id) ? 'rotate-180 text-primary-500' : 'text-slate-400'"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <Transition name="accordion">
                    <ul v-if="openChapters.has(chapter.id) && chapter.lessons?.length" class="border-t border-slate-100 divide-y divide-slate-50">
                      <li
                        v-for="lesson in chapter.lessons"
                        :key="lesson.id"
                        class="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span class="flex-1 min-w-0 text-sm text-slate-700">{{ lesson.title }}</span>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <BaseBadge v-if="lesson.is_preview" label="Preview" severity="success" />
                          <span v-if="lesson.duration_minutes" class="text-xs text-slate-400">{{ lesson.duration_minutes }}m</span>
                        </div>
                      </li>
                    </ul>
                  </Transition>
                </div>
              </div>

              <BaseEmptyState
                v-else
                icon="inbox"
                title="Syllabus not yet available"
                description="The partner has not completed this course content yet."
              />
            </section>
          </div>

          <!-- ── Right: Sidebar ────────────────────────────────────────────────── -->
          <div class="lg:col-span-1 order-first lg:order-last">
            <div class="sticky top-28 space-y-5">

              <!-- Purchase card -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

                <!-- Thumbnail -->
                <button
                  v-if="course.thumbnail_url"
                  type="button"
                  class="relative aspect-video bg-slate-200 overflow-hidden group cursor-zoom-in w-full block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
                  aria-label="Preview course image"
                  @click="openLightbox"
                >
                  <img
                    :src="course.thumbnail_url"
                    :alt="course.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <div class="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg class="w-6 h-6 text-primary-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </button>
                <div v-else class="relative aspect-video bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <svg class="w-16 h-16 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                  </svg>
                </div>

                <div class="p-5">
                  <!-- Banners -->
                  <Transition name="banner">
                    <div v-if="enrollSuccess" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-start gap-2">
                      <svg class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      {{ enrollSuccess }}
                    </div>
                  </Transition>
                  <div v-if="enrollError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ enrollError }}</div>

                  <!-- Price -->
                  <div class="mb-5">
                    <div v-if="isFree" class="flex items-center gap-2">
                      <span class="text-3xl font-extrabold text-green-600">Free</span>
                      <span class="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">No charge</span>
                    </div>
                    <div v-else-if="hasPriceSet">
                      <span class="text-3xl font-extrabold text-primary-600">{{ formatCurrency(course.price ?? 0) }}</span>
                      <div v-if="discountPct > 0" class="flex items-center gap-2 mt-1.5">
                        <span class="text-slate-400 line-through text-sm">{{ formatCurrency(course.compare_at_price ?? 0) }}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">Save {{ discountPct }}%</span>
                      </div>
                    </div>
                    <div v-else class="text-slate-400 text-sm italic">Price not set</div>
                  </div>

                  <!-- CTA -->
                  <div class="space-y-2">
                    <!-- Already purchased → Start Learning via SSO -->
                    <template v-if="isPurchased">
                      <button
                        v-if="canStartLearning"
                        type="button"
                        :disabled="ssoLoading"
                        class="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                        @click="handleStartLearning"
                      >
                        <template v-if="ssoLoading">
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Opening...
                        </template>
                        <template v-else>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Learning
                        </template>
                      </button>
                      <div v-else class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        You are enrolled in this course
                      </div>
                    </template>

                    <!-- Not purchased: free or paid flow -->
                    <template v-else>
                      <BaseButton
                        v-if="isFree"
                        variant="primary"
                        size="lg"
                        block
                        :loading="enrollLoading"
                        :disabled="enrollLoading || !!enrollSuccess"
                        @click="handleFreeEnroll"
                      >
                        {{ enrollSuccess ? 'Enrolled' : 'Enroll for Free' }}
                      </BaseButton>
                      <BaseButton v-else-if="hasPriceSet" variant="primary" size="lg" block @click="handlePurchase">
                        Buy Now
                      </BaseButton>
                      <BaseButton v-else variant="ghost" size="lg" block disabled>
                        Price not available
                      </BaseButton>
                      <BaseButton v-if="!auth.isAuthenticated" variant="ghost" size="md" block to="/login">
                        Already have an account? Sign In
                      </BaseButton>
                    </template>
                  </div>

                  <p class="text-xs text-slate-400 text-center mt-3">Lifetime access · Digital certificate</p>

                  <!-- Course includes -->
                  <div class="mt-5 pt-5 border-t border-slate-100">
                    <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">This course includes:</p>
                    <div class="space-y-3">
                      <div v-if="totalLessons > 0" class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                        </div>
                        <span class="text-sm text-slate-600">{{ totalLessons }} video lessons</span>
                      </div>
                      <div v-if="totalDuration > 0" class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <span class="text-sm text-slate-600">{{ formatDuration(totalDuration) }} of content</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        </div>
                        <span class="text-sm text-slate-600">Access on all devices</span>
                      </div>
                      <div v-if="course.enable_completion_cert" class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                        </div>
                        <span class="text-sm text-slate-600">Completion certificate</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                        </div>
                        <span class="text-sm text-slate-600">Lifetime access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Support card -->
              <div class="rounded-2xl p-5 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden="true" />
                <div class="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3 pointer-events-none" aria-hidden="true" />
                <h3 class="font-bold text-lg mb-1.5 relative">Have Questions?</h3>
                <p class="text-sm text-primary-100 mb-4 relative">Our team is ready to help you find the right course.</p>
                <a
                  href="mailto:support@drillspace.id"
                  class="relative flex items-center gap-2.5 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  support@drillspace.id
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Image lightbox (Teleport so it escapes any overflow clipping) ── -->
    <Teleport to="body">
      <Transition name="lb-fade">
        <div
          v-if="lightboxOpen && course?.thumbnail_url"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
          role="dialog"
          aria-modal="true"
          aria-label="Course image preview"
          @click.self="closeLightbox"
        >
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            aria-label="Close preview"
            @click="closeLightbox"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Image — clicking inside should NOT close -->
          <Transition name="lb-zoom" appear>
            <figure
              v-if="lightboxOpen"
              class="relative max-w-5xl max-h-[88vh] cursor-default"
              @click.stop
            >
              <img
                :src="course.thumbnail_url"
                :alt="course.title"
                class="block max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain"
              />
              <figcaption class="mt-3 text-center text-sm text-white/80 font-medium px-4 line-clamp-2">
                {{ course.title }}
              </figcaption>
            </figure>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Scroll reveal */
.reveal-section {
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal-section.observe-pending {
  opacity: 0;
  transform: translateY(28px);
}
.reveal-section.revealed {
  opacity: 1 !important;
  transform: translateY(0) !important;
}


/* Accordion */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to { opacity: 0; max-height: 0; }
.accordion-enter-to,
.accordion-leave-from { max-height: 2000px; }

/* Banner */
.banner-enter-active,
.banner-leave-active { transition: all 0.2s ease; }
.banner-enter-from,
.banner-leave-to { opacity: 0; transform: translateY(-6px); }

/* Page entrance */
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: pageEnter 0.35s ease both;
}

/* Lightbox backdrop fade */
.lb-fade-enter-active, .lb-fade-leave-active {
  transition: opacity 0.2s ease;
}
.lb-fade-enter-from, .lb-fade-leave-to {
  opacity: 0;
}

/* Lightbox image zoom-in */
.lb-zoom-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.lb-zoom-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease-in;
}
.lb-zoom-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.lb-zoom-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
