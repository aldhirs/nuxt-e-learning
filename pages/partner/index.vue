<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/partner'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Become a Partner — Sell Courses on DrillSpace',
  description: 'Launch your own branded course platform on DrillSpace. 14-day free trial, no credit card required.'
})

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (auth.isAuthenticated && !!auth.user?.active_client_id &&
      (auth.user?.roles ?? []).some(r => r.role_name === 'ADMIN' && r.client_id != null)) {
    await router.replace('/partner/dashboard')
  }
})

// ── Pricing ───────────────────────────────────────────────────────────────────
const cycle = ref<'monthly' | 'yearly'>('monthly')
const { data: plans, status: planStatus, refresh: refreshPlans } = await useFetch<SubscriptionPlan[]>(
  '/public/subscription/plans',
  {
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    transform: (res: unknown) => (res as { data?: SubscriptionPlan[] })?.data ?? [],
  }
)
const plansLoading = computed(() => planStatus.value === 'pending')

// ── Stats count-up ────────────────────────────────────────────────────────────
const statsData = [
  { end: 50,   suffix: '+', label: 'Active Partners',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { end: 1200, suffix: '+', label: 'Enrolled Students',    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { end: 2400, suffix: 'K+', label: 'Revenue Generated',   icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { end: 14,   suffix: ' days', label: 'Free Trial',        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
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

// ── Benefits ──────────────────────────────────────────────────────────────────
const benefits = [
  { num: '01', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', title: 'Your Own Subdomain', desc: 'Launch a branded course platform under your own subdomain. Fully customizable with your logo and theme.' },
  { num: '02', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', title: 'Secure Payments', desc: 'Accept VA bank transfers, QRIS, and e-Wallet payments. Funds go directly to your virtual balance.' },
  { num: '03', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Full Analytics Dashboard', desc: 'Track revenue, student enrollments, and course performance from a single, intuitive dashboard.' },
  { num: '04', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Transparent Commission', desc: 'Commission starts at just 5% on Enterprise. The more you grow, the less you pay — keep more of your revenue.' },
  { num: '05', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Ready-Made LMS', desc: 'Upload content, create quizzes, manage certificates, and track student progress — everything built in.' },
  { num: '06', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: '24/7 Support', desc: 'Our dedicated support team is always ready to help with onboarding, technical issues, and growth strategy.' },
]

// ── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Sign Up & Verify', desc: 'Fill in your organization details and choose a subdomain. Your 14-day free trial activates the moment you verify your email.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { num: '02', title: 'Build Your Courses', desc: 'Use the LMS to upload video content, create assessments, and publish courses under your brand — all in minutes.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { num: '03', title: 'Grow & Earn', desc: 'Students discover and enroll in your courses. Payments are automatically credited to your balance — withdraw whenever you want.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────
const openFaq = ref<number | null>(null)
const faqs = [
  { q: 'Do I need to pay to start a trial?', a: 'No. Your 14-day trial is completely free — no credit card required. Just sign up, verify your email, and start building your courses.' },
  { q: 'How does the commission work?', a: 'Each time a student purchases your course, DrillSpace deducts a commission based on your plan (10% Starter, 7% Pro, 5% Enterprise). The rest is credited to your virtual balance and can be withdrawn any time.' },
  { q: 'Can I cancel at any time?', a: 'Yes. Cancel your subscription from the Partner Portal at any time. Access remains active until the end of your paid billing period.' },
  { q: 'What payment methods do students use?', a: 'Students can pay via VA bank transfers (BCA, Mandiri, BRI, BNI, CIMB), QRIS, and popular e-Wallets (DANA, ShopeePay, OVO).' },
  { q: 'Can I use DrillSpace for any type of training?', a: 'Yes — while DrillSpace was built for maritime training, any professional training organization is welcome. From safety courses to corporate upskilling.' },
]

// ── Scroll reveal ─────────────────────────────────────────────────────────────
const revealed = reactive<Record<string, boolean>>({})
const statsRef    = ref<HTMLElement | null>(null)
const benefitsRef = ref<HTMLElement | null>(null)
const stepsRef    = ref<HTMLElement | null>(null)
const pricingRef  = ref<HTMLElement | null>(null)
const faqRef      = ref<HTMLElement | null>(null)
const ctaRef      = ref<HTMLElement | null>(null)

onMounted(() => {
  const sections: Array<{ ref: Ref<HTMLElement | null>; key: string; cb?: () => void }> = [
    { ref: statsRef,    key: 'stats',    cb: animateCounters },
    { ref: benefitsRef, key: 'benefits' },
    { ref: stepsRef,    key: 'steps' },
    { ref: pricingRef,  key: 'pricing' },
    { ref: faqRef,      key: 'faq' },
    { ref: ctaRef,      key: 'cta' },
  ]
  sections.forEach(({ ref: sRef, key, cb }) => {
    if (!sRef.value) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { revealed[key] = true; cb?.(); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(sRef.value)
  })
})
</script>

<template>
  <div class="overflow-x-hidden">

    <!-- ═══════════════════════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════════════════════ -->
    <section class="bg-[var(--color-bg)] pt-5 pb-2 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="relative bg-slate-100 rounded-3xl overflow-hidden min-h-[520px] lg:min-h-[480px] flex items-center">

          <!-- Background decoration -->
          <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary-100/60 blur-3xl -translate-y-1/3 translate-x-1/4"></div>
            <div class="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-accent/10 blur-2xl translate-y-1/2"></div>
          </div>

          <!-- Left content -->
          <div class="relative z-10 px-8 sm:px-12 lg:px-16 py-12 lg:py-14 w-full lg:w-[58%]">

            <!-- Eyebrow badge -->
            <div class="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-primary-600 text-xs font-bold px-4 py-2 rounded-full mb-6 animate-fade-in-up">
              <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse-dot"></span>
              Sell Courses on DrillSpace
            </div>

            <!-- Headline -->
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] text-slate-900 mb-5 animate-fade-in-up stagger-1">
              Launch Your<br>
              <span class="text-primary-500">Course Platform</span><br>
              in Minutes!
            </h1>

            <!-- Subtitle -->
            <p class="text-slate-500 text-base sm:text-lg mb-10 max-w-md leading-relaxed animate-fade-in-up stagger-2">
              Get your own branded subdomain, upload courses, and start accepting payments — all with a ready-made LMS.
            </p>

            <!-- Promo cards -->
            <div class="flex flex-wrap gap-4 animate-fade-in-up stagger-3">
              <!-- Card 1: Free trial -->
              <div class="bg-accent rounded-2xl p-5 w-48 flex-shrink-0 shadow-md shadow-amber-200/50 relative overflow-hidden">
                <div class="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/20"></div>
                <p class="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Start Free</p>
                <p class="text-sm font-black text-slate-900 leading-snug mb-1">14-Day Free Trial</p>
                <p class="text-xs text-slate-700 mb-4">No credit card needed</p>
                <NuxtLink to="/partner/register"
                  class="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95">
                  Get Started
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>

              <!-- Card 2: Commission -->
              <div class="bg-white rounded-2xl p-5 w-48 flex-shrink-0 shadow-md shadow-slate-200/80">
                <span class="inline-block bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-md mb-3 uppercase tracking-wide">Low Commission</span>
                <p class="text-sm font-black text-primary-600 leading-snug mb-4">From 5% per Transaction</p>
                <NuxtLink to="#pricing"
                  class="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors active:scale-95">
                  View Plans
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Right: floating mockup (desktop) -->
          <div class="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%] overflow-visible" aria-hidden="true">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="absolute right-12 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-200/40"></div>
              <div class="absolute right-20 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-primary-300/30"></div>

              <!-- Partner dashboard mockup -->
              <div class="absolute right-8 top-1/2 -translate-y-1/2 w-72 bg-white rounded-2xl shadow-2xl shadow-primary-200/50 p-5 animate-float">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium">Partner Dashboard</p>
                    <p class="text-sm font-bold text-slate-800">Revenue Overview</p>
                  </div>
                  <span class="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+24%</span>
                </div>

                <!-- Revenue bar chart mockup -->
                <div class="mb-4">
                  <div class="flex justify-between text-xs text-slate-500 mb-2">
                    <span>This Month</span>
                    <span class="font-bold text-primary-500">Rp 2.4M</span>
                  </div>
                  <div class="flex items-end gap-1 h-10">
                    <div v-for="(h, i) in [40, 65, 45, 80, 55, 90, 75]" :key="i"
                      :style="{ height: `${h}%` }"
                      :class="['flex-1 rounded-sm transition-colors', i === 5 ? 'bg-primary-500' : 'bg-primary-100']">
                    </div>
                  </div>
                </div>

                <!-- Stats row -->
                <div class="grid grid-cols-3 gap-2">
                  <div v-for="s in [{label:'Students', val:'124'},{label:'Courses', val:'8'},{label:'Reviews', val:'4.9★'}]" :key="s.label"
                    class="bg-slate-50 rounded-xl p-2 text-center">
                    <p class="text-xs font-black text-slate-800">{{ s.val }}</p>
                    <p class="text-[10px] text-slate-400">{{ s.label }}</p>
                  </div>
                </div>
              </div>

              <!-- Floating badge: revenue -->
              <div class="absolute right-72 top-16 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2 animate-float-delayed">
                <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-black text-slate-800">Rp 348K</p>
                  <p class="text-[10px] text-slate-400 leading-none">Today</p>
                </div>
              </div>

              <!-- Floating badge: new student -->
              <div class="absolute right-4 bottom-12 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2.5 animate-float">
                <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-black text-slate-800">New Enrollment</p>
                  <p class="text-[10px] text-blue-500 font-semibold">Just now</p>
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
        <div :class="['grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 transition-all duration-700', revealed.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <div
            v-for="(stat, i) in displayStats" :key="stat.label"
            :class="['bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300', revealed.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
            :style="{ transitionDelay: `${i * 80}ms` }"
          >
            <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
         BENEFITS
    ═══════════════════════════════════════════════════════════ -->
    <section ref="benefitsRef" class="py-20 bg-[var(--color-bg)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['text-center mb-16 transition-all duration-700', revealed.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Everything You Need</p>
          <h2 class="text-3xl font-extrabold text-slate-800">Why Partner With <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">DrillSpace?</span></h2>
          <p class="text-slate-500 mt-3 max-w-xl mx-auto">Everything you need to launch, sell, and scale your training business — in one place</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(item, i) in benefits" :key="item.num"
            :class="[
              'group relative bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
              revealed.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            ]"
            :style="{ transitionDelay: `${i * 80}ms` }"
          >
            <span class="absolute top-4 right-5 text-5xl font-black text-slate-100 group-hover:text-primary-100 transition-colors select-none leading-none">{{ item.num }}</span>
            <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors duration-300">
              <svg class="w-6 h-6 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
         HOW IT WORKS
    ═══════════════════════════════════════════════════════════ -->
    <section ref="stepsRef" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['text-center mb-16 transition-all duration-700', revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Simple Onboarding</p>
          <h2 class="text-3xl font-extrabold text-slate-800">Get Started in <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">3 Simple Steps</span></h2>
          <p class="text-slate-500 mt-3 max-w-lg mx-auto">From zero to your first course sale in less than a day</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="(step, i) in steps" :key="step.num"
            :class="[
              'relative flex flex-col items-center text-center transition-all duration-700',
              revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            ]"
            :style="{ transitionDelay: `${i * 120}ms` }"
          >
            <!-- Connector line -->
            <div v-if="i < steps.length - 1" class="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-primary-100 -z-0"></div>

            <div class="relative z-10 w-20 h-20 rounded-2xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors">
              <svg class="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="step.icon"/>
              </svg>
              <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-black flex items-center justify-center">{{ step.num }}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-3">{{ step.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed max-w-xs">{{ step.desc }}</p>
          </div>
        </div>

        <div :class="['text-center mt-12 transition-all duration-700', revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <NuxtLink to="/partner/register"
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-primary-200/50 hover:shadow-primary-300/50 transition-all active:scale-95">
            Start Your Free Trial
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         PRICING
    ═══════════════════════════════════════════════════════════ -->
    <section id="pricing" ref="pricingRef" class="py-20 bg-[var(--color-bg)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['text-center mb-10 transition-all duration-700', revealed.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">Flexible Plans</p>
          <h2 class="text-3xl font-extrabold text-slate-800">Choose Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Plan</span></h2>
          <p class="text-slate-500 mt-3">All plans start with a 14-day free trial. *Prices exclude 11% VAT.</p>

          <div class="inline-flex bg-white border border-slate-200 p-1 rounded-xl gap-1 mt-5 shadow-sm">
            <button :class="['px-5 py-2 rounded-lg text-sm font-semibold transition-colors', cycle === 'monthly' ? 'bg-primary-500 text-white shadow' : 'text-slate-500 hover:text-slate-700']" @click="cycle = 'monthly'">Monthly</button>
            <button :class="['px-5 py-2 rounded-lg text-sm font-semibold transition-colors', cycle === 'yearly' ? 'bg-primary-500 text-white shadow' : 'text-slate-500 hover:text-slate-700']" @click="cycle = 'yearly'">
              Yearly
              <span :class="['text-xs font-black ml-1.5', cycle === 'yearly' ? 'text-accent' : 'text-green-500']">save ~17%</span>
            </button>
          </div>
        </div>

        <div v-if="plansLoading" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="i in 4" :key="i" class="h-80 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
        <div v-else-if="!plans?.length" class="text-center py-12">
          <p class="text-sm text-slate-500 mb-3">Failed to load plans.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshPlans()">Try Again</BaseButton>
        </div>
        <div
          v-else
          :class="['grid sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700', revealed.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <PartnerPlanCard
            v-for="plan in plans" :key="plan.id"
            :plan="plan" :cycle="cycle" :highlighted="plan.code === 'pro'"
          />
        </div>
        <p :class="['text-center text-xs text-slate-400 mt-5 transition-all duration-700', revealed.pricing ? 'opacity-100' : 'opacity-0']">
          <NuxtLink to="/partner/pricing" class="text-primary-600 hover:underline">View full plan comparison →</NuxtLink>
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FAQ
    ═══════════════════════════════════════════════════════════ -->
    <section ref="faqRef" class="py-20 bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['text-center mb-10 transition-all duration-700', revealed.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-semibold tracking-widest text-primary-500 uppercase mb-2">FAQ</p>
          <h2 class="text-3xl font-extrabold text-slate-800">Frequently Asked <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">Questions</span></h2>
        </div>

        <div :class="['space-y-2 transition-all duration-700', revealed.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <div v-for="(f, i) in faqs" :key="i" class="bg-[var(--color-bg)] rounded-2xl border border-slate-100 overflow-hidden hover:border-primary-200 transition-colors">
            <button
              type="button"
              class="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-800 hover:text-primary-600 transition-colors text-left"
              @click="openFaq = openFaq === i ? null : i"
            >
              {{ f.q }}
              <svg :class="['w-5 h-5 text-slate-400 flex-shrink-0 ml-3 transition-transform duration-200', openFaq === i ? 'rotate-180 text-primary-500' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="faq-expand">
              <div v-if="openFaq === i" class="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {{ f.a }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         CTA BANNER
    ═══════════════════════════════════════════════════════════ -->
    <section ref="ctaRef" class="relative py-24 bg-slate-900 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl"></div>
        <svg class="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      <div :class="['relative max-w-3xl mx-auto px-4 text-center transition-all duration-700', revealed.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
        <div class="inline-flex w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 items-center justify-center mb-6">
          <svg class="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>

        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          Ready to Start<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent">Selling Courses?</span>
        </h2>
        <p class="text-slate-400 text-lg mb-10 leading-relaxed">
          Join 50+ active partners already earning on DrillSpace. 14-day free trial, no credit card required.
        </p>
        <div class="flex flex-wrap gap-4 justify-center">
          <BaseButton variant="primary" size="lg" to="/partner/register"
            class="!bg-accent hover:!bg-amber-400 !text-slate-900 !font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">
            Start Free Trial
          </BaseButton>
          <BaseButton variant="ghost" size="lg" to="/partner/pricing"
            class="!text-white !border !border-white/20 hover:!bg-white/10">
            View Pricing
          </BaseButton>
        </div>

        <div class="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <div v-for="p in ['14-day free trial', 'No credit card', 'Cancel anytime']" :key="p" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            {{ p }}
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(-50%) translateY(0); }
  50% { transform: translateY(-50%) translateY(-8px); }
}
@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-float { animation: float 3.5s ease-in-out infinite; }
.animate-float-delayed { animation: float-delayed 3.5s 1.75s ease-in-out infinite; }

.faq-expand-enter-active { transition: all 0.25s ease-out; }
.faq-expand-leave-active { transition: all 0.2s ease-in; }
.faq-expand-enter-from, .faq-expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.faq-expand-enter-to, .faq-expand-leave-from { opacity: 1; max-height: 200px; }
</style>
