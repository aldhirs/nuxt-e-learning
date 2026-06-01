<script setup lang="ts">
definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })

const route   = useRoute()
const partner = usePartnerStore()
const { openLmsAdmin, isRedirecting: lmsRedirecting } = usePartnerLmsRedirect()

const invoiceNumber = computed(() => route.params.invoice_number as string)

useSeoMeta({ title: 'Payment Successful — DrillSpace Partner' })

onMounted(async () => {
  await partner.fetchSubscription()
})
</script>

<template>
  <PartnerInvoicePaymentStepper :step="4" />

  <!-- Main content -->
  <div class="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-white px-4 py-12">

    <!-- Confetti -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <span
        v-for="i in 40"
        :key="i"
        :class="`confetti confetti-${(i % 8) + 1}`"
        :style="{ left: `${(i * 7 + 3) % 100}%`, animationDelay: `${(i * 0.13) % 3}s`, animationDuration: `${2.5 + (i % 4) * 0.4}s` }"
      ></span>
    </div>

    <div class="relative z-10 w-full max-w-md">

      <!-- Animated checkmark -->
      <div class="flex justify-center mb-6">
        <div class="relative">
          <div class="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200 animate-bounce-slow">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <!-- Glow ring -->
          <div class="absolute inset-0 rounded-full bg-emerald-400 opacity-20 scale-125 animate-ping-slow"></div>
        </div>
      </div>

      <!-- Headline -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-black text-slate-800 mb-2">
          🎉 Subscription Activated!
        </h1>
        <p class="text-slate-500 text-base">
          Your plan is now active. Time to build and launch your courses!
        </p>
      </div>

      <!-- Summary card -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-6">

        <!-- Plan header -->
        <div class="flex items-center gap-4 p-5 border-b border-slate-100 bg-emerald-50/50">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-slate-400 mb-0.5">Plan Activated</p>
            <p class="text-sm font-bold text-slate-800">{{ partner.plan?.name ?? 'Subscription Plan' }}</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Paid
          </span>
        </div>

        <!-- Details -->
        <div class="p-5 space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Invoice Number</span>
            <span class="font-mono font-bold text-slate-700">{{ invoiceNumber }}</span>
          </div>
          <div v-if="partner.subscription?.billing_cycle" class="flex justify-between text-sm">
            <span class="text-slate-500">Billing Cycle</span>
            <span class="font-semibold text-slate-700 capitalize">{{ partner.subscription.billing_cycle }}</span>
          </div>
          <div v-if="partner.subscriptionStatus" class="flex justify-between text-sm items-center">
            <span class="text-slate-500">Subscription Status</span>
            <BaseBadge
              :label="partner.subscriptionStatus === 'active' ? 'Active' : partner.subscriptionStatus === 'trial' ? 'Trial' : partner.subscriptionStatus"
              :severity="partner.subscriptionStatus === 'active' || partner.subscriptionStatus === 'trial' ? 'success' : 'warn'"
            />
          </div>
        </div>
      </div>

      <!-- CTAs -->
      <div class="space-y-3">
        <!-- Primary: Dashboard -->
        <NuxtLink
          to="/partner/dashboard"
          class="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-95"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go to Dashboard
        </NuxtLink>

        <!-- Secondary: Manage Courses LMS -->
        <button
          type="button"
          :disabled="lmsRedirecting"
          class="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-700 font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
          @click="openLmsAdmin"
        >
          <template v-if="lmsRedirecting">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Opening LMS...
          </template>
          <template v-else>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Manage Courses in LMS
          </template>
        </button>

        <!-- Ghost: View Invoice History -->
        <NuxtLink
          to="/partner/billing"
          class="flex items-center justify-center gap-2 w-full py-2.5 px-6 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Invoice History
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Confetti ──────────────────────────────────────────────────────────────── */
.confetti {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall linear infinite;
  opacity: 0.85;
}

.confetti-1 { background: #22c55e; border-radius: 50%; }
.confetti-2 { background: #3b82f6; }
.confetti-3 { background: #f59e0b; border-radius: 50%; }
.confetti-4 { background: #ec4899; }
.confetti-5 { background: #8b5cf6; border-radius: 50%; }
.confetti-6 { background: #06b6d4; }
.confetti-7 { background: #f97316; border-radius: 50%; }
.confetti-8 { background: #ef4444; }

@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg);  opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}

/* ── Icon animations ───────────────────────────────────────────────────────── */
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping-slow {
  0%        { transform: scale(1);   opacity: 0.3; }
  75%, 100% { transform: scale(1.6); opacity: 0; }
}
</style>
