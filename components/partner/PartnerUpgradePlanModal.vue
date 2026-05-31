<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/partner'

const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ 'update:open': [boolean]; changed: [] }>()

const partner = usePartnerStore()
const api     = useApi()
const router  = useRouter()
const toast   = useToast()

// ─── Plans ────────────────────────────────────────────────────────────────────

const plans   = ref<SubscriptionPlan[]>([])
const loading = ref(false)

async function fetchPlans() {
  if (plans.value.length) return
  loading.value = true
  try {
    const res = await api.get<SubscriptionPlan[]>('/public/subscription/plans')
    // Public endpoint already returns only active plans (is_active stripped per §2.11).
    plans.value = (res ?? []).filter(p => p.code !== 'trial')
  } catch { /* non-fatal */ }
  finally { loading.value = false }
}

watch(() => props.open, (v) => { if (v) fetchPlans() })

// ─── State ────────────────────────────────────────────────────────────────────

type Step = 'select' | 'confirm' | 'success'
const step        = ref<Step>('select')
const cycle       = ref<'monthly' | 'yearly'>(
  (partner.subscription?.billing_cycle as 'monthly' | 'yearly') ?? 'monthly'
)
const selected    = ref<SubscriptionPlan | null>(null)
const submitting  = ref(false)
const serverError = ref('')

function resetState() {
  step.value = 'select'; selected.value = null; serverError.value = ''
  cycle.value = (partner.subscription?.billing_cycle as 'monthly' | 'yearly') ?? 'monthly'
}

function close() {
  if (submitting.value) return
  emit('update:open', false)
  setTimeout(resetState, 200)
}

watch(() => props.open, (v) => { if (!v) setTimeout(resetState, 200) })

// ─── Plan helpers ─────────────────────────────────────────────────────────────

const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, enterprise: 3 }

function isCurrentPlan(plan: SubscriptionPlan) {
  return partner.plan?.code === plan.code && partner.subscription?.billing_cycle === cycle.value
}
function isSamePlanDifferentCycle(plan: SubscriptionPlan) {
  return partner.plan?.code === plan.code && partner.subscription?.billing_cycle !== cycle.value
}

function price(plan: SubscriptionPlan) {
  return cycle.value === 'yearly' ? plan.yearly_fee : plan.monthly_fee
}

function changeLabel(plan: SubscriptionPlan): { text: string; cls: string } | null {
  if (isCurrentPlan(plan)) return { text: 'Current Plan', cls: 'text-primary-600 bg-primary-50 border-primary-200' }
  if (isSamePlanDifferentCycle(plan)) {
    return cycle.value === 'yearly'
      ? { text: 'Switch to Yearly', cls: 'text-green-600 bg-green-50 border-green-200' }
      : { text: 'Switch to Monthly', cls: 'text-amber-600 bg-amber-50 border-amber-200' }
  }
  const currentRank = PLAN_RANK[partner.plan?.code ?? ''] ?? 0
  const newRank     = PLAN_RANK[plan.code] ?? 0
  if (newRank > currentRank) return { text: 'Upgrade', cls: 'text-green-600 bg-green-50 border-green-200' }
  if (newRank < currentRank) return { text: 'Downgrade', cls: 'text-amber-600 bg-amber-50 border-amber-200' }
  return null
}

function effective(plan: SubscriptionPlan): 'immediate' | 'next_cycle' {
  const currentRank = PLAN_RANK[partner.plan?.code ?? ''] ?? 0
  const newRank     = PLAN_RANK[plan.code] ?? 0
  // Downgrades must be next_cycle (server rejects immediate downgrades)
  return newRank >= currentRank ? 'immediate' : 'next_cycle'
}

// Plans the user can actually select (not the exact current plan+cycle combo)
const selectablePlans = computed(() => plans.value.filter(p => !isCurrentPlan(p)))

// ─── Submit ───────────────────────────────────────────────────────────────────

interface ChangePlanResponse {
  subscription: unknown
  new_plan: SubscriptionPlan
  prorate_invoice?: { invoice_number: string; status: string; amount: number } | null
  plan_change: unknown
}

async function submit() {
  if (!selected.value) return
  submitting.value = true
  serverError.value = ''
  try {
    const clientId = partner.activeClient?.id
    const res = await api.post<ChangePlanResponse>(
      '/clients/subscription/change-plan',
      {
        target_plan_code: selected.value.code,
        billing_cycle:    cycle.value,
        effective:        effective(selected.value),
      },
      { headers: clientId ? { 'X-Client-ID': String(clientId) } : {} },
    )

    await partner.fetchSubscription()
    emit('changed')

    // If an upgrade prorate invoice was generated, redirect to pay it
    if (res?.prorate_invoice?.invoice_number && res.prorate_invoice.status === 'pending') {
      close()
      toast.info('Plan upgraded — please pay the prorated invoice to activate.')
      await router.push(`/partner/invoice-pay/${res.prorate_invoice.invoice_number}`)
      return
    }

    step.value = 'success'
  } catch (err: unknown) {
    serverError.value = (err as { message?: string }).message || 'Failed to change plan. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="open" title="Change Subscription Plan" size="lg" @update:model-value="close">

    <!-- ── Step: select ──────────────────────────────────────────────────── -->
    <template v-if="step === 'select'">
      <div class="space-y-5">

        <!-- Current Plan card -->
        <div v-if="partner.plan" class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-base font-bold text-slate-800">{{ partner.plan.name }}</p>
              <p class="text-sm text-slate-500 mt-0.5 capitalize">{{ partner.subscription?.billing_cycle ?? '—' }} billing</p>
            </div>
            <div class="text-right">
              <p class="text-base font-bold text-primary-600">
                Rp {{ (partner.subscription?.billing_cycle === 'yearly' ? partner.plan.yearly_fee : partner.plan.monthly_fee).toLocaleString('id-ID') }}
              </p>
              <p class="text-xs text-slate-400">/ {{ partner.subscription?.billing_cycle === 'yearly' ? 'year' : 'month' }}</p>
            </div>
          </div>
          <div class="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>{{ partner.plan.max_courses === -1 ? '∞' : partner.plan.max_courses }} courses</span>
            <span>·</span>
            <span>{{ partner.plan.max_students === -1 ? '∞' : partner.plan.max_students }} students</span>
          </div>
        </div>

        <!-- Billing cycle toggle -->
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-700">Choose a new plan</p>
          <div class="inline-flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
            <button
              type="button"
              :class="['px-3 py-1 rounded-md text-xs font-medium transition-colors', cycle === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700']"
              @click="cycle = 'monthly'"
            >Monthly</button>
            <button
              type="button"
              :class="['px-3 py-1 rounded-md text-xs font-medium transition-colors', cycle === 'yearly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700']"
              @click="cycle = 'yearly'"
            >
              Yearly
              <span class="text-green-600 font-semibold ml-1">−17%</span>
            </button>
          </div>
        </div>

        <!-- Plan list -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-[72px] bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="plan in plans"
            :key="plan.id"
            type="button"
            :disabled="isCurrentPlan(plan)"
            :class="[
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left',
              isCurrentPlan(plan)
                ? 'border-primary-200 bg-primary-50/50 cursor-not-allowed'
                : selected?.id === plan.id
                  ? 'border-primary-400 bg-primary-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            ]"
            @click="selected = plan"
          >
            <!-- Radio indicator -->
            <div :class="[
              'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
              isCurrentPlan(plan) ? 'border-primary-300 bg-primary-100' :
              selected?.id === plan.id ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
            ]">
              <div v-if="selected?.id === plan.id" class="w-2 h-2 rounded-full bg-white" />
              <svg v-else-if="isCurrentPlan(plan)" class="w-2.5 h-2.5 text-primary-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
            </div>

            <!-- Plan info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span :class="['text-sm font-semibold', isCurrentPlan(plan) ? 'text-primary-700' : 'text-slate-800']">
                  {{ plan.name }}
                </span>
                <span
                  v-if="changeLabel(plan)"
                  :class="['text-xs font-medium px-2 py-0.5 rounded-full border', changeLabel(plan)!.cls]"
                >
                  {{ changeLabel(plan)!.text }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ plan.max_courses === -1 ? 'Unlimited' : plan.max_courses }} courses ·
                {{ plan.max_students === -1 ? 'Unlimited' : plan.max_students }} students
              </p>
            </div>

            <!-- Price -->
            <div class="text-right flex-shrink-0">
              <p :class="['text-sm font-bold', isCurrentPlan(plan) ? 'text-primary-700' : 'text-slate-900']">
                {{ price(plan) === 0 ? 'Free' : `Rp ${price(plan).toLocaleString('id-ID')}` }}
              </p>
              <p class="text-xs text-slate-400">{{ cycle === 'yearly' ? '/year' : '/month' }}</p>
            </div>
          </button>
        </div>

      </div>
    </template>

    <!-- ── Step: confirm ─────────────────────────────────────────────────── -->
    <template v-else-if="step === 'confirm' && selected">
      <div class="space-y-4">

        <!-- Summary -->
        <div class="bg-slate-50 rounded-xl divide-y divide-slate-200 overflow-hidden border border-slate-200">
          <div class="flex justify-between px-4 py-3 text-sm">
            <span class="text-slate-500">Current plan</span>
            <span class="font-medium text-slate-700">{{ partner.plan?.name ?? '—' }} · {{ partner.subscription?.billing_cycle }}</span>
          </div>
          <div class="flex justify-between px-4 py-3 text-sm">
            <span class="text-slate-500">New plan</span>
            <span class="font-semibold text-primary-600">{{ selected.name }} · {{ cycle }}</span>
          </div>
          <div class="flex justify-between px-4 py-3 text-sm">
            <span class="text-slate-500">New price</span>
            <span class="font-bold text-slate-900">
              Rp {{ price(selected).toLocaleString('id-ID') }}/{{ cycle === 'yearly' ? 'year' : 'month' }}
            </span>
          </div>
          <div class="flex justify-between px-4 py-3 text-sm">
            <span class="text-slate-500">Effective</span>
            <span :class="['font-medium', effective(selected) === 'immediate' ? 'text-green-600' : 'text-amber-600']">
              {{ effective(selected) === 'immediate' ? 'Immediately' : 'Next billing cycle' }}
            </span>
          </div>
        </div>

        <!-- Upgrade notice (prorate) -->
        <div v-if="effective(selected) === 'immediate'" class="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upgrading immediately may generate a prorated invoice for the remainder of your current billing period. You'll be redirected to pay it.
        </div>

        <!-- Downgrade notice -->
        <div v-else class="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Downgrades take effect at the start of your next billing period. You'll continue on your current plan until then.
        </div>

        <div v-if="serverError" class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ serverError }}
        </div>
      </div>
    </template>

    <!-- ── Step: success ─────────────────────────────────────────────────── -->
    <template v-else-if="step === 'success'">
      <div class="flex flex-col items-center text-center py-4 gap-4">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900">Plan Changed!</p>
          <p class="text-sm text-slate-500 mt-1">
            Your subscription has been updated to
            <strong class="text-slate-700">{{ selected?.name }}</strong>.
          </p>
          <p v-if="effective(selected!) === 'next_cycle'" class="text-xs text-amber-600 mt-2">
            The new plan will activate at the start of your next billing period.
          </p>
        </div>
      </div>
    </template>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <template #footer>
      <template v-if="step === 'select'">
        <BaseButton variant="secondary" @click="close">Cancel</BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!selected"
          @click="step = 'confirm'"
        >
          Review Change
        </BaseButton>
      </template>

      <template v-else-if="step === 'confirm'">
        <BaseButton variant="secondary" :disabled="submitting" @click="step = 'select'">Back</BaseButton>
        <BaseButton variant="primary" :loading="submitting" :disabled="submitting" @click="submit">
          Confirm
        </BaseButton>
      </template>

      <template v-else-if="step === 'success'">
        <BaseButton variant="primary" @click="close">Done</BaseButton>
      </template>
    </template>

  </BaseModal>
</template>
