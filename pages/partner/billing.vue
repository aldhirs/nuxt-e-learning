<script setup lang="ts">
import type { SubscriptionInvoice, SubscriptionPaymentMethod } from '~/types/partner'
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'

definePageMeta({ layout: 'partner', middleware: 'partner-auth' })
useSeoMeta({ title: 'Billing & Subscription — DrillSpace' })

const partner      = usePartnerStore()
const paymentStore = usePartnerPaymentStore()
const subPayApi    = useSubscriptionPaymentApi()
const route  = useRoute()
const router = useRouter()

const isLoadingInvoices = ref(true)
const invoices = ref<SubscriptionInvoice[]>([])
const invoiceTotal = ref(0)

async function loadData() {
  await partner.fetchSubscription()
  isLoadingInvoices.value = true
  try {
    const res = await partner.fetchInvoiceHistory({ limit: 25 })
    invoices.value = res.invoices
    invoiceTotal.value = res.total
  } finally {
    isLoadingInvoices.value = false
  }
}

onMounted(loadData)

const highlightInvoice = computed(() => route.query.invoice as string | null)

function paymentPageForMethod(method: string): string {
  if (method.startsWith('va_'))  return 'va'
  if (method === 'qris')          return 'qris'
  return 'ewallet'
}

async function openPayment(inv: SubscriptionInvoice) {
  const base = `/partner/invoice-pay/${inv.invoice_number}`

  // If invoice already has a payment method, skip method-selection and resume session.
  if (inv.payment_method && (inv.status === 'pending' || inv.status === 'past_due')) {
    const method = inv.payment_method as SubscriptionPaymentMethod

    // Check localStorage first (same device/session).
    if (paymentStore.getSession(inv.invoice_number)) {
      return router.push(`${base}/${paymentPageForMethod(method)}`)
    }

    // No stored session — re-initiate (idempotent: API returns existing active session).
    try {
      const session = await subPayApi.initiate(inv.invoice_number, method)
      paymentStore.setSession({
        invoice_number: inv.invoice_number,
        invoice_amount: inv.amount,
        payment_method: method,
        expires_at:     session.expired_at ?? '',
        va_number:      session.va_number,
        bank_code:      session.bank_code,
        qr_url:         session.qris_url,
        qr_string:      session.qris_string,
        redirect_url:   session.ewallet_redirect_url,
      })
      return router.push(`${base}/${paymentPageForMethod(method)}`)
    } catch {
      // Session expired or error — fall through to method selection.
    }
  }

  router.push(base)
}

const renewalDate = computed(() => {
  const sub = partner.subscription
  if (!sub) return '—'
  return new Date(sub.current_period_end).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
})

const showUpgradeModal = ref(false)
const showCancelModal  = ref(false)

const planStatusLabel = computed(() => {
  if (partner.isScheduledToCancel) return 'Cancels ' + renewalDate.value
  const m: Record<string, string> = { trial: 'Trial', active: 'Active', past_due: 'Overdue', suspended: 'Suspended', cancelled: 'Cancelled' }
  return m[partner.subscriptionStatus ?? ''] ?? '—'
})
const planStatusClass = computed(() => {
  if (partner.isScheduledToCancel) return 'bg-amber-100 text-amber-700'
  const m: Record<string, string> = {
    trial: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-red-100 text-red-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-600',
  }
  return m[partner.subscriptionStatus ?? ''] ?? ''
})
</script>

<template>
  <div class="space-y-6 pb-20 md:pb-0">
    <h1 class="text-xl font-bold text-slate-900">Billing & Subscription</h1>

    <!-- Scheduled-to-cancel ticker -->
    <div
      v-if="partner.isScheduledToCancel"
      class="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium"
      role="alert"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="flex-1">
        Your subscription is scheduled to end on <strong>{{ renewalDate }}</strong>.
        Platform access remains active until then, but will not auto-renew.
        To continue, choose a new plan before that date.
      </p>
    </div>

    <!-- Suspended ticker -->
    <div
      v-if="partner.isSuspended"
      class="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium"
      role="alert"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="flex-1">
        <strong>Your account has been suspended.</strong>
        Pay the outstanding invoice below to immediately reactivate your platform.
      </p>
    </div>

    <!-- Cancelled ticker -->
    <div
      v-if="partner.isCancelled"
      class="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium"
      role="alert"
    >
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
      </svg>
      <p class="flex-1">
        Your subscription has been cancelled.
        <NuxtLink to="/contact-us" class="underline underline-offset-2 hover:no-underline font-semibold ml-1">Contact support</NuxtLink> to reactivate your account.
      </p>
    </div>

    <!-- Current plan -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 class="text-sm font-semibold text-slate-700 mb-4">Current Subscription</h2>
      <template v-if="partner.isLoadingSubscription">
        <div class="space-y-3">
          <div class="h-6 w-40 bg-slate-200 rounded animate-pulse" />
          <div class="h-4 w-56 bg-slate-100 rounded animate-pulse" />
        </div>
      </template>
      <template v-else-if="partner.subscription">
        <div class="grid sm:grid-cols-2 gap-5">
          <div class="space-y-2">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="text-lg font-bold text-slate-900">{{ partner.plan?.name ?? '—' }}</span>
              <span :class="['text-xs font-semibold px-2.5 py-0.5 rounded-full', planStatusClass]">{{ planStatusLabel }}</span>
            </div>
            <p class="text-sm text-slate-600">
              {{ partner.subscription.billing_cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing' }}
              <span v-if="partner.plan" class="font-semibold ml-1">
                — Rp {{ (partner.subscription.billing_cycle === 'monthly' ? partner.plan.monthly_fee : partner.plan.yearly_fee).toLocaleString('id-ID') }}
              </span>
            </p>
            <p class="text-xs text-slate-500">
              {{ partner.isSuspended ? 'Suspended since' : partner.isScheduledToCancel ? 'Access until' : 'Renews on' }}: {{ renewalDate }}
            </p>
          </div>
          <div class="space-y-3">
            <PartnerUsageBar label="Courses" :usage="partner.usage?.courses" />
            <PartnerUsageBar label="Students" :usage="partner.usage?.students" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 flex-wrap">
          <!-- Change Plan -->
          <button
            v-if="!partner.isCancelled"
            type="button"
            :disabled="partner.isSuspended"
            :title="partner.isSuspended ? 'Account suspended — contact support to reactivate' : undefined"
            :class="[
              'text-sm font-semibold px-4 py-2 rounded-xl transition-colors',
              partner.isSuspended
                ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
            ]"
            @click="!partner.isSuspended && (showUpgradeModal = true)"
          >
            Change Plan
          </button>

          <!-- Cancel Subscription — hidden when already scheduled to cancel -->
          <button
            v-if="partner.isActive && !partner.isCancelled && !partner.isScheduledToCancel"
            type="button"
            :disabled="partner.isSuspended"
            :title="partner.isSuspended ? 'Account suspended — contact support to reactivate' : undefined"
            :class="[
              'text-sm font-semibold px-4 py-2 rounded-xl transition-colors',
              partner.isSuspended
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
            ]"
            @click="!partner.isSuspended && (showCancelModal = true)"
          >
            Cancel Subscription
          </button>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-start gap-3">
          <template v-if="partner.isSuspended">
            <p class="text-sm text-slate-600">
              Your subscription is currently <strong class="text-red-600">suspended</strong>.
              Pay the outstanding invoice in the history below to reactivate your platform immediately.
            </p>
          </template>
          <template v-else-if="partner.isCancelled">
            <p class="text-sm text-slate-600">Your subscription has been cancelled.</p>
            <button
              type="button"
              class="text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors"
              @click="showUpgradeModal = true"
            >
              Resubscribe to a Plan →
            </button>
          </template>
          <template v-else>
            <p class="text-sm text-slate-600">No active subscription yet.</p>
            <button type="button" class="text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors" @click="showUpgradeModal = true">
              View Plans &amp; Start Trial →
            </button>
          </template>
        </div>
      </template>
    </div>

    <!-- Invoice history -->
    <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-slate-100">
        <h2 class="text-sm font-semibold text-slate-700">Invoice History</h2>
        <button type="button" class="text-xs text-slate-400 hover:text-slate-600 transition-colors" @click="loadData">↺ Refresh</button>
      </div>

      <div v-if="highlightInvoice" class="mx-5 mt-4 p-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-800 flex items-center justify-between gap-3">
        <span>📌 Invoice <strong>{{ highlightInvoice }}</strong> requires payment.</span>
        <button
          v-if="!partner.isCancelled"
          type="button"
          class="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          @click="() => { const inv = invoices.find(i => i.invoice_number === highlightInvoice); if (inv) openPayment(inv) }"
        >Pay →</button>
      </div>

      <!-- disabledPay: only for cancelled — suspended clients MUST be able to pay to reactivate -->
      <PartnerInvoiceTable :invoices="invoices" :loading="isLoadingInvoices" :highlight-invoice="highlightInvoice" :disabled-pay="partner.isCancelled" @pay="openPayment" />

      <div v-if="invoiceTotal > invoices.length" class="p-4 text-center text-xs text-slate-400">
        Showing {{ invoices.length }} of {{ invoiceTotal }} invoices
      </div>
    </div>
  </div>

  <PartnerUpgradePlanModal
    v-model:open="showUpgradeModal"
    @changed="loadData"
  />

  <PartnerCancelSubscriptionModal
    v-model:open="showCancelModal"
    @cancelled="loadData"
  />
</template>
