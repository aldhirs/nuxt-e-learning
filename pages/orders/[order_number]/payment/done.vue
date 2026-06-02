<script setup lang="ts">
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { useEnrollmentApi } from '~/composables/api/useEnrollmentApi'
import { useAuthStore } from '~/stores/auth'
import type { Order, EnrollmentCheckResponse } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const { formatCurrency } = useFormatters()
const auth = useAuthStore()
const ordersApi = useOrdersApi()
const enrollmentApi = useEnrollmentApi()
const { startSsoRedirect, isLoading: ssoLoading } = useSsoRedirect()

const orderNumber = computed(() => route.params.order_number as string)
useSeoMeta({ title: () => `Payment Successful — ${orderNumber.value}` })

const { data: order } = await useAsyncData<Order | null>(
  () => `payment-done-order:${orderNumber.value}`,
  () => ordersApi.getMyOrder(orderNumber.value).catch(() => null),
)

// Check enrollment to get client slug for the LMS URL
const { data: enrollment } = await useAsyncData<EnrollmentCheckResponse | null>(
  () => `payment-done-enrollment:${orderNumber.value}`,
  async () => {
    const courseId = order.value?.course_id
    if (!courseId) return null
    try { return await enrollmentApi.checkEnrollment(courseId) }
    catch { return null }
  },
  { watch: [] } // run once after order is loaded
)

const clientSlug = computed(() => enrollment.value?.client?.slug ?? null)
const courseSlug = computed(() => order.value?.course?.slug ?? null)

const canStartLearning = computed(() =>
  !!clientSlug.value && !!order.value?.course_id && !!enrollment.value?.enrollment_id
)

const fallbackHref = computed(() =>
  courseSlug.value ? `/courses/${courseSlug.value}` : '/courses'
)

async function handleStartLearning() {
  if (canStartLearning.value && auth.user?.id) {
    await startSsoRedirect(
      clientSlug.value!,
      order.value!.course_id!,
      enrollment.value!.enrollment_id!,
      auth.user.id
    )
  } else {
    navigateTo(fallbackHref.value)
  }
}
</script>

<template>
  <!-- Step Progress Bar — Step 4 Done active -->
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Detail Course</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Checkout</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Payment</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Done</span>
      </div>
    </div>
  </div>

  <!-- Main content -->
  <div class="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-white px-4 py-12">

    <!-- Confetti dots -->
    <div class="confetti-container absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <span v-for="i in 40" :key="i" :class="`confetti confetti-${(i % 8) + 1}`" :style="{ left: `${(i * 7 + 3) % 100}%`, animationDelay: `${(i * 0.13) % 3}s`, animationDuration: `${2.5 + (i % 4) * 0.4}s` }"></span>
    </div>

    <div class="relative z-10 w-full max-w-md">

      <!-- Success icon -->
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
          🎉 Payment Successful!
        </h1>
        <p class="text-slate-500 text-base">
          Your course is now active. Start learning at your own pace!
        </p>
      </div>

      <!-- Order summary card -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-6">
        <!-- Course thumbnail + info -->
        <div v-if="order?.course" class="flex gap-4 p-5 border-b border-slate-100">
          <div class="w-16 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
            <BaseImage
              type="course"
              :src="order.course.thumbnail_url"
              :alt="order.course.title"
              img-class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-slate-400 mb-0.5">Course Purchased</p>
            <p class="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{{ order.course.title }}</p>
          </div>
        </div>

        <!-- Order details -->
        <div class="p-5 space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Order Number</span>
            <span class="font-mono font-bold text-slate-700">{{ orderNumber }}</span>
          </div>
          <div v-if="order" class="flex justify-between text-sm">
            <span class="text-slate-500">Amount Paid</span>
            <span class="font-black text-emerald-600 text-base">
              {{ order.total_amount === 0 ? 'Free' : formatCurrency(order.total_amount) }}
            </span>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Paid
            </span>
            <span class="text-xs text-slate-400">Access activated successfully</span>
          </div>
        </div>
      </div>

      <!-- CTAs -->
      <div class="space-y-3">
        <!-- Start Learning — SSO redirect or storefront fallback -->
        <button
          type="button"
          :disabled="ssoLoading"
          class="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
          @click="handleStartLearning"
        >
          <template v-if="ssoLoading">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Opening your course...
          </template>
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Learning Now
          </template>
        </button>

        <!-- View Order Details — secondary -->
        <NuxtLink
          :to="`/orders/${orderNumber}`"
          class="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-700 font-semibold text-sm transition-all duration-200 active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Order Details
        </NuxtLink>

        <!-- My Courses -->
        <NuxtLink
          to="/my/courses"
          class="flex items-center justify-center gap-2 w-full py-2.5 px-6 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          My Courses
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

.confetti-1  { background: #22c55e; border-radius: 50%; }
.confetti-2  { background: #3b82f6; }
.confetti-3  { background: #f59e0b; border-radius: 50%; }
.confetti-4  { background: #ec4899; }
.confetti-5  { background: #8b5cf6; border-radius: 50%; }
.confetti-6  { background: #06b6d4; }
.confetti-7  { background: #f97316; border-radius: 50%; }
.confetti-8  { background: #ef4444; }

@keyframes confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
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
  0%   { transform: scale(1); opacity: 0.3; }
  75%, 100% { transform: scale(1.6); opacity: 0; }
}
</style>
