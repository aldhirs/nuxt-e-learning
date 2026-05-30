<script setup lang="ts">
import type { SubscriptionInvoice } from '~/types/partner'

definePageMeta({ layout: 'partner', middleware: 'partner-auth' })
useSeoMeta({ title: 'Billing & Subscription — DrillSpace' })

const partner = usePartnerStore()
const route = useRoute()

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

const drawerOpen = ref(false)
const selectedInvoice = ref<SubscriptionInvoice | null>(null)

function openDrawer(inv: SubscriptionInvoice) {
  selectedInvoice.value = inv
  drawerOpen.value = true
}
function onPaid() { loadData() }

const renewalDate = computed(() => {
  const sub = partner.subscription
  if (!sub) return '—'
  return new Date(sub.current_period_end).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
})

const planStatusLabel = computed(() => {
  const m: Record<string, string> = { trial: 'Trial', active: 'Active', past_due: 'Overdue', suspended: 'Suspended', cancelled: 'Cancelled' }
  return m[partner.subscriptionStatus ?? ''] ?? '—'
})
const planStatusClass = computed(() => {
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
              {{ partner.isSuspended ? 'Suspended since' : 'Renews on' }}: {{ renewalDate }}
            </p>
          </div>
          <div class="space-y-3">
            <PartnerUsageBar label="Courses" :usage="partner.usage?.courses" />
            <PartnerUsageBar label="Students" :usage="partner.usage?.students" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100">
          <NuxtLink v-if="!partner.isCancelled" to="/partner/pricing" class="text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors">
            Upgrade Plan
          </NuxtLink>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-start gap-3">
          <p class="text-sm text-slate-600">Belum ada subscription aktif.</p>
          <NuxtLink to="/partner/pricing" class="text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors">
            Lihat Plan &amp; Mulai Trial →
          </NuxtLink>
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
          type="button"
          class="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          @click="() => { const inv = invoices.find(i => i.invoice_number === highlightInvoice); if (inv) openDrawer(inv) }"
        >Pay →</button>
      </div>

      <PartnerInvoiceTable :invoices="invoices" :loading="isLoadingInvoices" :highlight-invoice="highlightInvoice" @pay="openDrawer" />

      <div v-if="invoiceTotal > invoices.length" class="p-4 text-center text-xs text-slate-400">
        Showing {{ invoices.length }} of {{ invoiceTotal }} invoices
      </div>
    </div>

    <PartnerPaymentDrawer :invoice="selectedInvoice" :open="drawerOpen" @close="drawerOpen = false" @paid="onPaid" />
  </div>
</template>
