<script setup lang="ts">
definePageMeta({ layout: 'partner', middleware: 'partner-auth' })
useSeoMeta({ title: 'Partner Dashboard — DrillSpace' })

const partner = usePartnerStore()
const { openLmsAdmin, isRedirecting: lmsRedirecting } = usePartnerLmsRedirect()

// Use reactive store state directly — avoids useLazyAsyncData key caching
// which prevents refresh when navigating to the same route after switchClient.
const stats = computed(() => partner.stats)
const isLoadingStats = computed(() => partner.isLoadingStats || partner.isSwitchingClient)

onMounted(async () => {
  await partner.fetchStats()
})

const route = useRoute()
const showOnboarding = ref(false)
const showUpgradeModal = ref(false)

onMounted(() => {
  showOnboarding.value = route.query.onboarding === 'true' || !localStorage.getItem('ds_onboarding_dismissed')
})

function dismissOnboarding() {
  localStorage.setItem('ds_onboarding_dismissed', '1')
  showOnboarding.value = false
}

const onboardingSteps = computed(() => {
  const p = partner.profile
  const s = stats.value
  return [
    { key: 'logo', label: 'Upload organization logo', completed: !!p?.logo, cta_label: 'Upload Logo', cta_href: '/partner/profile' },
    { key: 'profile', label: 'Complete profile (name, contact)', completed: !!(p?.name && p?.phone && p?.address), cta_label: 'Complete Profile', cta_href: '/partner/profile' },
    { key: 'course', label: 'Create your first course', completed: (s?.courses_published ?? 0) > 0, cta_label: 'Create Course in LMS', cta_lms: true },
    { key: 'student', label: 'Invite your first student', completed: (s?.students_active ?? 0) > 0, cta_label: 'Invite Students in LMS', cta_lms: true },
    { key: 'plan', label: 'Choose a paid plan', completed: partner.subscription?.plan?.code !== 'trial', cta_label: 'View Plans', cta_modal: true, cta_lms: false },
  ] satisfies { key: string; label: string; completed: boolean; cta_label: string; cta_href?: string; cta_lms?: boolean; cta_modal?: boolean }[]
})
const onboardingCompleted = computed(() => onboardingSteps.value.filter(s => s.completed).length)
const allDone = computed(() => onboardingCompleted.value === onboardingSteps.value.length)
watch(allDone, (v) => { if (v) dismissOnboarding() })

const renewalLabel = computed(() => {
  const sub = partner.subscription
  if (!sub) return '—'
  const d = new Date(sub.current_period_end)
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  if (diff <= 0) return `${dateStr} (today)`
  if (diff <= 7) return `${dateStr} (${diff}d left)`
  return dateStr
})

const planHighlight = computed(() => {
  if (partner.isSuspended || partner.isCancelled) return 'error' as const
  if (partner.isPastDue) return 'warning' as const
  return null
})
</script>

<template>
  <div class="space-y-6 pb-20 md:pb-0">
    <!-- Switching skeleton overlay -->
    <template v-if="partner.isSwitchingClient">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
      <div class="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      <div class="h-24 bg-slate-100 rounded-2xl animate-pulse" />
    </template>

    <template v-else>
    <h1 class="text-xl font-bold text-slate-900">Dashboard</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <PartnerStatsWidget label="Current Plan" :value="partner.plan?.name ?? '—'" :sub="partner.subscription?.billing_cycle === 'monthly' ? 'per month' : 'per year'" :loading="partner.isLoadingSubscription" :highlight="planHighlight" />
      <PartnerStatsWidget label="Renewal / Ends" :value="renewalLabel" :loading="partner.isLoadingSubscription" :highlight="partner.isPastDue || partner.isSuspended ? 'warning' : null" />
      <PartnerStatsWidget label="Published Courses" :value="stats?.courses_published ?? '—'" :sub="`of ${partner.plan?.max_courses === -1 ? '∞' : partner.plan?.max_courses ?? '—'} max`" :loading="isLoadingStats" />
      <PartnerStatsWidget label="Active Students" :value="stats?.students_active ?? '—'" :sub="`of ${partner.plan?.max_students === -1 ? '∞' : partner.plan?.max_students ?? '—'} max`" :loading="isLoadingStats" />
    </div>

    <!-- Usage bars -->
    <div v-if="partner.usage" class="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-slate-700">Plan Usage</h2>
      <PartnerUsageBar label="Courses" :usage="partner.usage.courses" />
      <PartnerUsageBar label="Students" :usage="partner.usage.students" />
    </div>

    <!-- Quick links -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 class="text-sm font-semibold text-slate-700 mb-3">Quick Access</h2>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :disabled="!partner.canAccessLms || lmsRedirecting"
          :class="[
            'flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors',
            partner.canAccessLms ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' : 'text-slate-400 bg-slate-100 cursor-not-allowed opacity-70'
          ]"
          :title="!partner.canAccessLms ? 'Platform suspended. Pay your invoice to reactivate.' : undefined"
          @click="openLmsAdmin"
        >
          <svg v-if="lmsRedirecting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Manage Courses (LMS)
        </button>
        <NuxtLink v-if="partner.activeClient?.slug" :to="`/partners/${partner.activeClient.slug}`" target="_blank" class="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
          View Partner Page
        </NuxtLink>
        <NuxtLink to="/partner/billing" class="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
          Manage Subscription
        </NuxtLink>
      </div>
    </div>

    <!-- Onboarding checklist -->
    <div v-if="showOnboarding && !allDone" class="bg-white rounded-2xl border border-primary-100 p-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-slate-800">Getting Started · {{ onboardingCompleted }}/{{ onboardingSteps.length }} completed</h2>
        <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="dismissOnboarding">Skip</button>
      </div>
      <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div class="h-full bg-primary-500 rounded-full transition-all duration-500" :style="{ width: `${(onboardingCompleted / onboardingSteps.length) * 100}%` }" />
      </div>
      <ul class="space-y-2.5">
        <li v-for="step in onboardingSteps" :key="step.key" class="flex items-center gap-3 text-sm">
          <span :class="['w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2', step.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-400']">
            {{ step.completed ? '✓' : '' }}
          </span>
          <span :class="['flex-1', step.completed ? 'text-slate-400 line-through' : 'text-slate-700']">{{ step.label }}</span>
          <template v-if="!step.completed">
            <button v-if="step.cta_lms" type="button" class="text-xs font-medium text-primary-600 hover:underline whitespace-nowrap" @click="openLmsAdmin">
              {{ step.cta_label }} →
            </button>
            <button v-else-if="step.cta_modal" type="button" class="text-xs font-medium text-primary-600 hover:underline whitespace-nowrap" @click="showUpgradeModal = true">
              {{ step.cta_label }} →
            </button>
            <NuxtLink v-else :to="step.cta_href ?? '/partner'" class="text-xs font-medium text-primary-600 hover:underline whitespace-nowrap">
              {{ step.cta_label }} →
            </NuxtLink>
          </template>
        </li>
      </ul>
    </div>

    <!-- Recent activity -->
    <div v-if="stats?.recent_activities?.length" class="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 class="text-sm font-semibold text-slate-700 mb-3">Recent Activity</h2>
      <ul class="space-y-2.5">
        <li v-for="a in stats.recent_activities.slice(0, 5)" :key="a.created_at" class="flex items-start gap-2.5 text-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-1.5" />
          <span class="flex-1 text-slate-700">{{ a.description }}</span>
          <span class="text-xs text-slate-400 flex-shrink-0">{{ new Date(a.created_at).toLocaleDateString('en-US') }}</span>
        </li>
      </ul>
    </div>

    </template><!-- end v-else switching -->
  </div>

  <PartnerUpgradePlanModal
    v-model:open="showUpgradeModal"
    @changed="partner.fetchStats()"
  />
</template>
