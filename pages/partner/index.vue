<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/partner'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Become a Partner — Sell Courses on DrillSpace',
  description: 'Launch your own branded course platform on DrillSpace. 14-day free trial, no credit card required.'
})

// ── Pricing ──────────────────────────────────────────────────────────────────
const cycle = ref<'monthly' | 'yearly'>('monthly')
const { data: plans, status: planStatus, refresh: refreshPlans } = await useFetch<SubscriptionPlan[]>(
  '/public/subscription/plans',
  {
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    transform: (res: unknown) => (res as { data?: SubscriptionPlan[] })?.data ?? [],
  }
)
const plansLoading = computed(() => planStatus.value === 'pending')

// ── Benefits ─────────────────────────────────────────────────────────────────
const benefits = [
  { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', title: 'Your Own Subdomain', desc: 'Branded platform under your own subdomain.' },
  { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', title: 'Secure Payments', desc: 'VA, QRIS, and e-Wallet — fully automated.' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: 'Revenue Analytics', desc: 'Track income, students, and course performance.' },
  { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Commission from 5%', desc: 'Keep more revenue as you grow.' },
  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Ready-Made LMS', desc: 'Quizzes, certificates, and student tracking built in.' },
  { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: '24/7 Support', desc: 'Dedicated team for onboarding and growth.' },
]

// ── Steps ────────────────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Sign Up & Verify', desc: 'Fill in your organization details and pick a subdomain. 14-day free trial starts the moment you verify your email.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { num: '02', title: 'Build Your Courses', desc: 'Upload videos, create assessments, and publish courses under your brand — using the full-featured LMS, in minutes.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { num: '03', title: 'Grow & Earn', desc: 'Students discover and enroll. Payments are automatically credited to your virtual balance — withdraw whenever you want.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

// ── FAQ ──────────────────────────────────────────────────────────────────────
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
const benefitsRef = ref<HTMLElement | null>(null)
const stepsRef    = ref<HTMLElement | null>(null)
const pricingRef  = ref<HTMLElement | null>(null)
const faqRef      = ref<HTMLElement | null>(null)
const ctaRef      = ref<HTMLElement | null>(null)

onMounted(() => {
  const sections: Array<{ ref: Ref<HTMLElement | null>; key: string }> = [
    { ref: benefitsRef, key: 'benefits' },
    { ref: stepsRef,    key: 'steps' },
    { ref: pricingRef,  key: 'pricing' },
    { ref: faqRef,      key: 'faq' },
    { ref: ctaRef,      key: 'cta' },
  ]
  sections.forEach(({ ref: sRef, key }) => {
    if (!sRef.value) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { revealed[key] = true; obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(sRef.value)
  })
})
</script>

<template>
  <div class="overflow-x-hidden">

    <!-- ═══════════════════════════════════════════════════════════
         HERO — dark navy gradient, centered, B2B SaaS feel
         Deliberately different from homepage's light slate-100 card
    ═══════════════════════════════════════════════════════════ -->
    <section class="relative bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-900 overflow-hidden">

      <!-- Subtle grid overlay -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg class="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="partner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partner-grid)"/>
        </svg>
        <div class="absolute top-0 left-1/3 w-[480px] h-[480px] rounded-full bg-primary-600/10 blur-3xl -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-1/4 w-[360px] h-[360px] rounded-full bg-primary-500/8 blur-3xl translate-y-1/3"></div>
      </div>

      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 lg:pt-28 lg:pb-36 text-center">

        <!-- Eyebrow badge -->
        <div class="inline-flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] text-primary-300 text-xs font-bold px-4 py-2 rounded-full mb-8 animate-fade-in-up">
          <span class="w-2 h-2 rounded-full bg-primary-400 animate-pulse-dot"></span>
          Partner Program · 14-Day Free Trial
        </div>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-5xl lg:text-[3.6rem] font-black leading-[1.07] text-white mb-6 animate-fade-in-up stagger-1">
          Launch Your Course Platform<br class="hidden sm:block"/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-sky-300">
            Without the Overhead
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-slate-400 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto animate-fade-in-up stagger-2">
          Your own branded subdomain, full LMS, and payment gateway — ready in minutes. Start free, grow on your terms.
        </p>

        <!-- CTAs -->
        <div class="flex flex-wrap gap-3 justify-center mb-12 animate-fade-in-up stagger-3">
          <NuxtLink
            to="/partner/register"
            class="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-400/30 transition-all duration-200 active:scale-95 text-sm"
          >
            Start Free Trial
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          <a
            href="#pricing"
            class="inline-flex items-center gap-2 border border-white/[0.18] text-slate-300 hover:text-white hover:bg-white/[0.06] font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm"
          >
            View Plans
          </a>
        </div>

        <!-- Social proof row -->
        <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 animate-fade-in-up stagger-3">
          <div v-for="p in ['No credit card required', '14-day free trial', 'Cancel anytime']" :key="p" class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            {{ p }}
          </div>
        </div>

        <!-- Plan tier preview — mini badges, gives a taste of pricing before scroll -->
        <div class="mt-14 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up stagger-3">
          <span class="text-xs text-slate-600 mr-1">Plans:</span>
          <span v-for="(tier, i) in [
            { label: 'Trial', sub: 'Free 14 days', color: 'bg-slate-800 border-slate-700 text-slate-300' },
            { label: 'Starter', sub: 'Rp 299K/mo', color: 'bg-slate-800 border-slate-700 text-slate-300' },
            { label: 'Pro', sub: 'Rp 599K/mo', color: 'bg-primary-500/15 border-primary-500/30 text-primary-300' },
            { label: 'Enterprise', sub: 'Rp 1.499K/mo', color: 'bg-slate-800 border-slate-700 text-slate-300' },
          ]" :key="i"
            :class="['inline-flex flex-col items-center px-3.5 py-2 rounded-xl border text-center transition-all duration-200', tier.color]"
          >
            <span class="text-xs font-bold leading-none">{{ tier.label }}</span>
            <span class="text-[10px] mt-0.5 opacity-70 leading-none">{{ tier.sub }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         PRICING — immediately after hero, white, clean
    ═══════════════════════════════════════════════════════════ -->
    <section id="pricing" ref="pricingRef" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div :class="['text-center mb-10 transition-all duration-700', revealed.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-bold tracking-widest text-primary-500 uppercase mb-2">Transparent Pricing</p>
          <h2 class="text-3xl font-extrabold text-slate-900">Choose Your Plan</h2>
          <p class="text-slate-500 mt-2 text-sm">All plans include the full LMS. *Prices exclude 11% VAT.</p>

          <!-- Monthly / Yearly toggle -->
          <div class="inline-flex bg-slate-100 border border-slate-200 p-1 rounded-xl gap-1 mt-5 shadow-sm">
            <button
              :class="['px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200', cycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
              @click="cycle = 'monthly'"
            >Monthly</button>
            <button
              :class="['inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200', cycle === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
              @click="cycle = 'yearly'"
            >
              Yearly
              <span :class="['text-xs font-black px-1.5 py-0.5 rounded-md transition-colors', cycle === 'yearly' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500']">−17%</span>
            </button>
          </div>
        </div>

        <!-- Skeleton -->
        <div v-if="plansLoading" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-busy="true">
          <div v-for="i in 4" :key="i" class="h-80 bg-slate-100 rounded-2xl animate-pulse"/>
        </div>

        <!-- Error -->
        <div v-else-if="!plans?.length" class="text-center py-12">
          <p class="text-sm text-slate-500 mb-3">Failed to load plans.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshPlans()">Try Again</BaseButton>
        </div>

        <!-- Plan cards -->
        <div
          v-else
          :class="['grid sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700', revealed.pricing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']"
        >
          <PartnerPlanCard
            v-for="plan in plans"
            :key="plan.id"
            :plan="plan"
            :cycle="cycle"
            :highlighted="plan.code === 'pro'"
          />
        </div>

        <p :class="['text-center text-xs text-slate-400 mt-5 transition-opacity duration-700', revealed.pricing ? 'opacity-100' : 'opacity-0']">
          <NuxtLink to="/partner/pricing" class="text-primary-600 hover:underline font-medium">
            View full plan comparison →
          </NuxtLink>
        </p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         BENEFITS STRIP — dark bg, compact horizontal grid
         Different from homepage's 6-white-card grid on light bg
    ═══════════════════════════════════════════════════════════ -->
    <section ref="benefitsRef" class="py-16 bg-slate-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div :class="['transition-all duration-700', revealed.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-center text-xs font-bold tracking-widest text-slate-500 uppercase mb-8">
            Everything included in every plan
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div
              v-for="(item, i) in benefits"
              :key="item.title"
              :class="[
                'flex flex-col items-center gap-3 px-5 py-7 text-center bg-slate-900/60 hover:bg-slate-800/70 transition-colors duration-200',
                revealed.benefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              ]"
              :style="{ transitionDelay: `${i * 60}ms` }"
            >
              <div class="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-white leading-snug">{{ item.title }}</p>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed hidden lg:block">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         HOW IT WORKS — white bg, horizontal timeline with dark numbers
    ═══════════════════════════════════════════════════════════ -->
    <section ref="stepsRef" class="py-20 bg-white">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div :class="['text-center mb-14 transition-all duration-700', revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-bold tracking-widest text-primary-500 uppercase mb-2">Quick Setup</p>
          <h2 class="text-3xl font-extrabold text-slate-900">Up & Running in 3 Steps</h2>
          <p class="text-slate-500 mt-2 text-sm">From sign-up to your first course sale in under a day</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <!-- Connecting line on desktop -->
          <div
            class="hidden md:block absolute top-8 left-[calc(16.67%+1.25rem)] right-[calc(16.67%+1.25rem)] h-px z-0"
            style="background: repeating-linear-gradient(90deg, #e2e8f0 0, #e2e8f0 6px, transparent 6px, transparent 14px)"
          ></div>

          <div
            v-for="(step, i) in steps"
            :key="step.num"
            :class="[
              'relative z-10 flex flex-col items-center text-center transition-all duration-700',
              revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            ]"
            :style="{ transitionDelay: `${i * 120}ms` }"
          >
            <!-- Step number badge -->
            <div class="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-5 flex-shrink-0 shadow-lg shadow-slate-200">
              <span class="text-xl font-black text-white tabular-nums">{{ step.num }}</span>
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed max-w-xs">{{ step.desc }}</p>
          </div>
        </div>

        <div :class="['text-center mt-12 transition-all duration-700', revealed.steps ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <NuxtLink
            to="/partner/register"
            class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl shadow-md shadow-slate-900/20 transition-all duration-200 active:scale-95 text-sm"
          >
            Start Your Free Trial
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FAQ — light slate bg, clean accordion
    ═══════════════════════════════════════════════════════════ -->
    <section ref="faqRef" class="py-20 bg-slate-50">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        <div :class="['text-center mb-10 transition-all duration-700', revealed.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <p class="text-xs font-bold tracking-widest text-primary-500 uppercase mb-2">FAQ</p>
          <h2 class="text-3xl font-extrabold text-slate-900">Common Questions</h2>
        </div>

        <div :class="['space-y-1.5 transition-all duration-700', revealed.faq ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">
          <div
            v-for="(f, i) in faqs"
            :key="i"
            class="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors"
          >
            <button
              type="button"
              class="w-full flex items-start gap-3 px-5 py-4 text-sm font-semibold text-slate-800 hover:text-primary-600 transition-colors text-left"
              :aria-expanded="openFaq === i"
              @click="openFaq = openFaq === i ? null : i"
            >
              <span class="flex-1 leading-snug">{{ f.q }}</span>
              <svg
                :class="['w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200', openFaq === i ? 'rotate-180 text-primary-500' : '']"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <Transition name="faq-expand">
              <div v-if="openFaq === i" class="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {{ f.a }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         CTA — dark navy, minimal, no dot pattern (different from homepage)
    ═══════════════════════════════════════════════════════════ -->
    <section ref="ctaRef" class="relative py-24 bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-900 overflow-hidden">
      <!-- Single centered glow, no dot grid -->
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div class="w-[700px] h-[300px] rounded-full bg-primary-600/[0.07] blur-3xl"></div>
      </div>

      <div :class="['relative max-w-xl mx-auto px-4 text-center transition-all duration-700', revealed.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8']">

        <!-- Live badge -->
        <div class="inline-flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] text-slate-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot"></span>
          50+ partners already earning on DrillSpace
        </div>

        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          Ready to Start<br>Selling Courses?
        </h2>
        <p class="text-slate-400 text-base mb-10 leading-relaxed">
          14-day free trial. No credit card. Cancel anytime.
        </p>

        <div class="flex flex-wrap gap-3 justify-center">
          <NuxtLink
            to="/partner/register"
            class="inline-flex items-center gap-2 bg-accent hover:bg-amber-400 text-slate-900 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95 text-sm"
          >
            Start Free Trial
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </NuxtLink>
          <NuxtLink
            to="/partner/pricing"
            class="inline-flex items-center gap-2 border border-white/[0.18] text-slate-300 hover:text-white hover:bg-white/[0.06] font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm"
          >
            Compare Plans
          </NuxtLink>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.faq-expand-enter-active { transition: all 0.25s ease-out; }
.faq-expand-leave-active { transition: all 0.2s ease-in; }
.faq-expand-enter-from,
.faq-expand-leave-to    { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.faq-expand-enter-to,
.faq-expand-leave-from  { opacity: 1; max-height: 200px; }
</style>
