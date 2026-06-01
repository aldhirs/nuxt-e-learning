<script setup lang="ts">
import { useHomepageApi } from '~/composables/api/useHomepageApi'
import type { FeaturedHomepage, Testimonial } from '~/types'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Trusted Maritime Training Platform',
  description: 'DrillSpace — enhance your maritime competency with STCW-certified instructors and industry experts.'
})

const homepage = useHomepageApi()

const { data: featured, pending: featuredPending, error: featuredError, refresh: refreshFeatured } =
  await useAsyncData<FeaturedHomepage>('featured-homepage', () => homepage.getFeatured())

const { data: testimonialsEnvelope, pending: testimonialsPending, error: testimonialsError, refresh: refreshTestimonials } =
  await useAsyncData('homepage-testimonials', () => homepage.getTestimonials())

const featuredCourses = computed(() => featured.value?.courses?.slice(0, 8) ?? [])
const featuredPartners = computed(() => featured.value?.partners ?? [])
const testimonials = computed<Testimonial[]>(() => testimonialsEnvelope.value?.data ?? [])

async function refreshAll() {
  await Promise.all([refreshFeatured(), refreshTestimonials()])
}

// ── Scroll-reveal ─────────────────────────────────────────────────────────────
const revealed = reactive<Record<string, boolean>>({})

// ── Stats count-up ────────────────────────────────────────────────────────────
const statsData = [
  { end: 200,   suffix: '+',  label: 'Courses Available',  icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { end: 50,    suffix: '+',  label: 'Expert Instructors', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { end: 15000, suffix: '+',  label: 'Active Learners',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { end: 98,    suffix: '%',  label: 'Satisfaction Rate',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
]
const displayStats = ref(statsData.map(s => ({ ...s, current: 0 })))
let countersStarted = false

function animateCounters() {
  if (countersStarted) return
  countersStarted = true
  displayStats.value.forEach((stat) => {
    const duration = 1800
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      stat.current = Math.round(eased * stat.end)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

// ── Testimonial carousel ──────────────────────────────────────────────────────
const activeSlide = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | null = null

const totalSlides = computed(() => Math.max(1, Math.ceil(testimonials.value.length / 3)))
const visibleTestimonials = computed(() => {
  const start = activeSlide.value * 3
  return testimonials.value.slice(start, start + 3)
})

function nextSlide() { activeSlide.value = (activeSlide.value + 1) % totalSlides.value }
function prevSlide() { activeSlide.value = (activeSlide.value - 1 + totalSlides.value) % totalSlides.value }
function goSlide(n: number) {
  activeSlide.value = n
  if (carouselTimer) { clearInterval(carouselTimer); startCarousel() }
}

function startCarousel() {
  carouselTimer = setInterval(() => { if (totalSlides.value > 1) nextSlide() }, 5000)
}

// ── Feature items ─────────────────────────────────────────────────────────────
const features = [
  { num: '01', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'STCW Certified', desc: 'All courses meet international STCW standards recognized globally.' },
  { num: '02', icon: 'M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', title: 'Premium HD Video', desc: 'High-quality video content, replayable anytime and downloadable.' },
  { num: '03', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Flexible Learning', desc: 'Lifetime access with no time limit. Learn at your own pace and schedule.' },
  { num: '04', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Active Community', desc: 'Join thousands of maritime professionals and build your career connections.' },
]

// ── Section refs ──────────────────────────────────────────────────────────────
const statsRef    = ref<HTMLElement | null>(null)
const coursesRef  = ref<HTMLElement | null>(null)
const whyRef      = ref<HTMLElement | null>(null)
const testimRef   = ref<HTMLElement | null>(null)
const partnersRef = ref<HTMLElement | null>(null)
const ctaRef      = ref<HTMLElement | null>(null)

onMounted(() => {
  startCarousel()

  const sections: Array<{ ref: Ref<HTMLElement | null>; key: string; cb?: () => void }> = [
    { ref: statsRef,    key: 'stats',    cb: animateCounters },
    { ref: coursesRef,  key: 'courses' },
    { ref: whyRef,      key: 'why' },
    { ref: testimRef,   key: 'testimonials' },
    { ref: partnersRef, key: 'partners' },
    { ref: ctaRef,      key: 'cta' },
  ]

  sections.forEach(({ ref: sRef, key, cb }) => {
    if (!sRef.value) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { revealed[key] = true; cb?.(); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(sRef.value)
  })
})

onUnmounted(() => { if (carouselTimer) clearInterval(carouselTimer) })
</script>

<template>
  <div class="overflow-x-hidden">

    <!-- ═══════════════════════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════════════════════ -->
    <section class="bg-[var(--color-bg)] pt-5 pb-2 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Hero card — light rounded container like reference -->
        <div class="relative bg-slate-100 rounded-3xl overflow-hidden min-h-[520px] lg:min-h-[480px] flex items-center">

          <!-- Subtle background decoration -->
          <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary-100/60 blur-3xl -translate-y-1/3 translate-x-1/4"></div>
            <div class="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/10 blur-2xl translate-y-1/2"></div>
          </div>

          <!-- Left content -->
          <div class="relative z-10 px-8 sm:px-12 lg:px-16 py-12 lg:py-14 w-full lg:w-[58%]">

            <!-- Eyebrow badge -->
            <div class="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-primary-600 text-xs font-bold px-4 py-2 rounded-full mb-6 animate-fade-in-up">
              <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse-dot"></span>
              #1 Maritime Training Platform in Indonesia
            </div>

            <!-- Headline -->
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] text-slate-900 mb-5 animate-fade-in-up stagger-1">
              Master Your<br>
              <span class="text-primary-500">Maritime Skills</span><br>
              With Industry Experts!
            </h1>

            <!-- Subtitle -->
            <p class="text-slate-500 text-base sm:text-lg mb-10 max-w-md leading-relaxed animate-fade-in-up stagger-2">
              Access hundreds of STCW-certified courses from experienced instructors and prove your expertise.
            </p>

            <!-- Promo cards row (like reference) -->
            <div class="flex flex-wrap gap-4 animate-fade-in-up stagger-3">

              <!-- Card 1: STCW featured -->
              <div class="bg-accent rounded-2xl p-5 w-48 flex-shrink-0 shadow-md shadow-amber-200/50 relative overflow-hidden">
                <div class="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/20"></div>
                <p class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Popular</p>
                <p class="text-sm font-black text-slate-900 leading-snug mb-1">Basic Safety Training</p>
                <p class="text-xs text-slate-700 mb-4">STCW VI/1 certified</p>
                <NuxtLink to="/courses"
                  class="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95">
                  Start Learning
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>

              <!-- Card 2: Free courses -->
              <div class="bg-white rounded-2xl p-5 w-48 flex-shrink-0 shadow-md shadow-slate-200/80">
                <span class="inline-block bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-md mb-3 uppercase tracking-wide">100+ Free</span>
                <p class="text-sm font-black text-primary-600 leading-snug mb-4">Access Free Courses Now</p>
                <NuxtLink to="/courses?is_free=true"
                  class="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95">
                  View Now
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Right: illustration (desktop only) -->
          <div class="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%] overflow-visible" aria-hidden="true">
            <!-- Decorative abstract element -->
            <div class="absolute inset-0 flex items-center justify-center">
              <!-- Large primary circle -->
              <div class="absolute right-12 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-200/40"></div>
              <div class="absolute right-20 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-primary-300/30"></div>

              <!-- Course card mockup -->
              <div class="absolute right-8 top-1/2 -translate-y-1/2 w-72 bg-white rounded-2xl shadow-2xl shadow-primary-200/50 p-5 animate-float">
                <!-- Header -->
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium">Currently Learning</p>
                    <p class="text-sm font-bold text-slate-800">Basic Safety Training</p>
                  </div>
                  <span class="ml-auto text-xs font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">STCW</span>
                </div>
                <!-- Progress -->
                <div class="mb-3">
                  <div class="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span class="font-bold text-primary-500">72%</span>
                  </div>
                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 animate-progress-grow"></div>
                  </div>
                </div>
                <!-- Modules -->
                <div class="space-y-2">
                  <div v-for="(m, idx) in ['Personal Survival Techniques', 'Fire Prevention & Firefighting', 'First Aid']" :key="m"
                    class="flex items-center gap-2 text-xs">
                    <div :class="['w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                      idx < 2 ? 'bg-green-400' : 'bg-slate-100']">
                      <svg v-if="idx < 2" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <span :class="['truncate', idx < 2 ? 'line-through text-slate-400' : 'text-slate-600 font-medium']">{{ m }}</span>
                  </div>
                </div>
              </div>

              <!-- Floating badge: students -->
              <div class="absolute right-72 top-16 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2 animate-float-delayed">
                <div class="flex -space-x-1.5">
                  <div v-for="(bg, i) in ['bg-blue-400','bg-purple-400','bg-pink-400']" :key="i"
                    :class="['w-6 h-6 rounded-full border-2 border-white', bg]">
                  </div>
                </div>
                <div>
                  <p class="text-xs font-black text-slate-800">15,000+</p>
                  <p class="text-[10px] text-slate-400 leading-none">Learners</p>
                </div>
              </div>

              <!-- Floating badge: certificate -->
              <div class="absolute right-4 bottom-12 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2.5 animate-float">
                <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-black text-slate-800">STCW Certificate</p>
                  <p class="text-[10px] text-green-500 font-semibold">Internationally Recognized</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         STATS
    ═══════════════════════════════════════════════════════════ -->
    <section ref="statsRef" class="bg-[var(--color-bg)] py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          :class="['grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 transition-all duration-700', revealed.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <div
            v-for="(stat, i) in displayStats"
            :key="stat.label"
            :class="['bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300', revealed.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 80}ms` }"
          >
            <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stat.icon"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-slate-800 tabular-nums leading-none">
                {{ stat.current.toLocaleString('en-US') }}<span class="text-primary-500">{{ stat.suffix }}</span>
              </p>
              <p class="text-xs text-slate-500 mt-1">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FEATURED COURSES
    ═══════════════════════════════════════════════════════════ -->
    <section ref="coursesRef" class="py-20 bg-[var(--color-bg)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div
          :class="['flex items-end justify-between mb-4 transition-all duration-700', revealed.courses ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <div>
            <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Best Curriculum</p>
            <h2 class="text-3xl font-extrabold text-slate-800">Featured <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Courses</span></h2>
            <p class="text-slate-500 text-sm mt-1.5">Most popular courses this week, curated by expert instructors</p>
          </div>
          <BaseButton variant="ghost" to="/courses" size="sm" class="hidden sm:flex !text-primary-600 !font-semibold gap-1">
            View all
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </BaseButton>
        </div>

        <!-- Loading -->
        <div v-if="featuredPending && !featured" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          <BaseSkeleton v-for="i in 6" :key="i" class="aspect-[4/5] rounded-2xl"/>
        </div>

        <!-- Error -->
        <BaseCard v-else-if="featuredError" padding="lg" class="border border-red-200 bg-red-50">
          <p class="text-sm text-red-700 mb-3">Failed to load featured courses.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshFeatured()">Try Again</BaseButton>
        </BaseCard>

        <!-- Empty -->
        <BaseEmptyState
          v-else-if="featuredCourses.length === 0"
          title="No featured courses yet"
          description="Courses will be displayed here soon."
          cta-label="Explore all courses"
          cta-to="/courses"
        />

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(course, i) in featuredCourses"
            :key="course.id"
            class="h-full"
            :class="['transition-all duration-700', revealed.courses ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10']"
            :style="{ transitionDelay: `${80 + i * 70}ms` }"
          >
            <CourseCard :course="course"/>
          </div>
        </div>

        <!-- Mobile see all -->
        <div class="mt-8 flex justify-center sm:hidden">
          <BaseButton variant="secondary" to="/courses">View All Courses</BaseButton>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         WHY DRILLSPACE
    ═══════════════════════════════════════════════════════════ -->
    <section ref="whyRef" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div
          :class="['text-center mb-16 transition-all duration-700', revealed.why ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Why Choose Us</p>
          <h2 class="text-3xl font-extrabold text-slate-800">Why <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">DrillSpace?</span></h2>
          <p class="text-slate-500 mt-3 max-w-xl mx-auto">Designed specifically for maritime professionals who want to excel in the global industry</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(item, i) in features"
            :key="item.num"
            :class="[
              'group relative bg-[var(--color-bg)] rounded-2xl p-6 border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
              revealed.why ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            ]"
            :style="{ transitionDelay: `${i * 100}ms` }"
          >
            <!-- Number watermark -->
            <span class="absolute top-4 right-5 text-5xl font-black text-slate-100 group-hover:text-primary-100 transition-colors select-none leading-none">{{ item.num }}</span>
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors duration-300">
              <svg :class="['w-6 h-6 text-primary-600 group-hover:text-white transition-colors duration-300']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"/>
              </svg>
            </div>
            <h3 class="font-bold text-slate-800 mb-2">{{ item.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         TESTIMONIALS
    ═══════════════════════════════════════════════════════════ -->
    <section
      v-if="testimonials.length > 0 || testimonialsPending"
      ref="testimRef"
      class="py-20 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden"
    >
      <!-- Decorative circles -->
      <div class="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" aria-hidden="true"></div>
      <div class="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-white/5 pointer-events-none" aria-hidden="true"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div :class="['text-center mb-12 transition-all duration-700', revealed.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-semibold tracking-widest text-primary-200 uppercase mb-2">Success Stories</p>
          <h2 class="text-3xl font-extrabold text-white">What They Say</h2>
          <p class="text-primary-200 mt-2">Thousands of maritime professionals have proven it</p>
        </div>

        <!-- Loading -->
        <div v-if="testimonialsPending && testimonials.length === 0" class="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
          <BaseSkeleton v-for="i in 3" :key="i" class="h-48 rounded-2xl"/>
        </div>

        <!-- Error -->
        <div v-else-if="testimonialsError" class="text-center">
          <p class="text-sm text-primary-200 mb-3">Failed to load testimonials.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshTestimonials()">Try Again</BaseButton>
        </div>

        <!-- Carousel -->
        <template v-else>
          <Transition name="slide-fade" mode="out-in">
            <div :key="activeSlide" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div
                v-for="(t, i) in visibleTestimonials"
                :key="t.id"
                :class="['bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500', revealed.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
                :style="{ transitionDelay: `${i * 100}ms` }"
              >
                <!-- Quote icon -->
                <svg class="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>

                <!-- Stars -->
                <div v-if="t.rating" class="flex gap-1" :aria-label="`Rating ${t.rating} out of 5`">
                  <svg v-for="n in 5" :key="n" :class="['w-4 h-4', n <= t.rating ? 'text-accent' : 'text-white/20']" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>

                <p class="text-white/85 text-sm leading-relaxed flex-1">"{{ t.content }}"</p>

                <div class="flex items-center gap-3 pt-3 border-t border-white/10">
                  <div class="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                    <img v-if="t.author_avatar_url" :src="t.author_avatar_url" :alt="t.author_name" class="w-full h-full object-cover"/>
                    <span v-else>{{ t.author_name.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-white truncate">{{ t.author_name }}</p>
                    <p v-if="t.author_role" class="text-xs text-primary-200 truncate">{{ t.author_role }}</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Controls -->
          <div v-if="totalSlides > 1" class="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              class="w-9 h-9 rounded-full border border-white/30 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Previous"
              @click="prevSlide"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="flex gap-2">
              <button
                v-for="n in totalSlides"
                :key="n"
                type="button"
                :class="['transition-all duration-300 rounded-full', activeSlide === n - 1 ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60']"
                :aria-label="`Slide ${n}`"
                @click="goSlide(n - 1)"
              ></button>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-full border border-white/30 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Next"
              @click="nextSlide"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         PARTNERS
    ═══════════════════════════════════════════════════════════ -->
    <section ref="partnersRef" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          :class="['flex items-end justify-between mb-4 transition-all duration-700', revealed.partners ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <div>
            <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Trusted Partners</p>
            <h2 class="text-3xl font-extrabold text-slate-800">Training <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Partners</span></h2>
            <p class="text-slate-500 text-sm mt-1.5">Leading maritime education and training institutions</p>
          </div>
          <BaseButton variant="ghost" to="/partners" size="sm" class="hidden sm:flex !text-primary-600 !font-semibold gap-1">
            View all
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </BaseButton>
        </div>

        <!-- Loading -->
        <div v-if="featuredPending && !featured" class="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-busy="true">
          <BaseSkeleton v-for="i in 8" :key="i" class="h-24 rounded-2xl"/>
        </div>

        <!-- Error -->
        <BaseCard v-else-if="featuredError" padding="lg" class="border border-red-200 bg-red-50">
          <p class="text-sm text-red-700 mb-3">Failed to load partners.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshFeatured()">Try Again</BaseButton>
        </BaseCard>

        <!-- Marquee for many partners -->
        <div
          v-else-if="featuredPartners.length > 4"
          class="relative overflow-hidden"
          :class="revealed.partners ? 'opacity-100' : 'opacity-0'"
        >
          <!-- Fade edges -->
          <div class="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          <div class="flex gap-6 partner-marquee my-10">
            <NuxtLink
              v-for="(partner, idx) in [...featuredPartners, ...featuredPartners]"
              :key="`${partner.slug}-${idx}`"
              :to="`/partners/${partner.slug}`"
              class="flex-shrink-0 w-44 h-30 bg-[var(--color-bg)] rounded-2xl border border-slate-100 flex items-center justify-center p-4 hover:border-primary-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="max-h-20 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"/>
              <span v-else class="text-sm font-semibold text-slate-500 text-center leading-tight group-hover:text-primary-600 transition-colors">{{ partner.name }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Grid for few partners -->
        <div v-else-if="featuredPartners.length > 0"
          :class="['grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700', revealed.partners ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <PartnerCard v-for="partner in featuredPartners" :key="partner.slug" :partner="partner"/>
        </div>

        <!-- Empty -->
        <BaseEmptyState
          v-else
          title="No partners yet"
          description="Partners will appear here when they publish their courses."
        />
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         CTA BANNER
    ═══════════════════════════════════════════════════════════ -->
    <section ref="ctaRef" class="relative py-24 bg-slate-900 overflow-hidden">
      <!-- Background decorations -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl"></div>
        <!-- Dot grid -->
        <svg class="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      <div
        :class="['relative max-w-3xl mx-auto px-4 text-center transition-all duration-700', revealed.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
      >
        <!-- Icon -->
        <div class="inline-flex w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 items-center justify-center mb-6">
          <svg class="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>

        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          Ready to Advance Your<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent">Maritime</span> Career?
        </h2>
        <p class="text-slate-400 text-lg mb-10 leading-relaxed">
          Join 15,000+ maritime professionals who already trust DrillSpace as their primary training platform.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <BaseButton variant="primary" size="lg" to="/register"
            class="!bg-accent hover:!bg-amber-400 !text-slate-900 !font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">
            Register for Free
          </BaseButton>
          <BaseButton variant="ghost" size="lg" to="/courses"
            class="!text-white !border !border-white/20 hover:!bg-white/10">
            Explore Courses
          </BaseButton>
        </div>

        <!-- Social proof mini -->
        <div class="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            No registration fee
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Cancel anytime
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Lifetime access
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* Testimonial slide transition */
.slide-fade-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.slide-fade-leave-active  { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-fade-enter-from    { opacity: 0; transform: translateX(30px); }
.slide-fade-leave-to      { opacity: 0; transform: translateX(-30px); }

/* Progress bar grow animation */
@keyframes progress-grow {
  from { width: 0; }
  to   { width: 72%; }
}
.animate-progress-grow {
  animation: progress-grow 1.5s 0.8s ease-out forwards;
  width: 0;
}

/* Floating badges in hero */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
.animate-float         { animation: float 3.5s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 3.5s 1.75s ease-in-out infinite; }

/* Partner marquee */
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.partner-marquee {
  animation: marquee 28s linear infinite;
  width: max-content;
}
.partner-marquee:hover { animation-play-state: paused; }
</style>
