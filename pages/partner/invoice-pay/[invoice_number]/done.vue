<script setup lang="ts">
definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })

const route   = useRoute()
const partner = usePartnerStore()

const invoiceNumber = computed(() => route.params.invoice_number as string)

useSeoMeta({ title: 'Payment Successful — DrillSpace Partner' })

// Refresh subscription data so billing page shows updated status
onMounted(async () => {
  await partner.fetchSubscription()
})
</script>

<template>
  <PartnerInvoicePaymentStepper :step="4" />
  <div class="max-w-md mx-auto py-16 text-center mt-2 space-y-6 px-4">
    <!-- Success icon -->
    <div class="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-sm">
      <svg class="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <!-- Message -->
    <div>
      <h1 class="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
      <p class="text-slate-500 text-sm">
        Invoice <span class="font-mono font-semibold text-slate-700">{{ invoiceNumber }}</span> has been paid.
      </p>
      <p class="text-slate-400 text-xs mt-2">
        Your subscription will be updated automatically within a few minutes.
      </p>
    </div>

    <!-- Subscription status card -->
    <div v-if="partner.subscriptionStatus" class="bg-white rounded-2xl border border-slate-200 p-5 text-left space-y-3">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription Status</p>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-slate-700">{{ partner.plan?.name ?? '—' }}</span>
        <BaseBadge
          :label="partner.subscriptionStatus === 'active' ? 'Active' : partner.subscriptionStatus === 'past_due' ? 'Overdue' : partner.subscriptionStatus"
          :severity="partner.subscriptionStatus === 'active' ? 'success' : partner.subscriptionStatus === 'past_due' ? 'warn' : 'default'"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      <BaseButton variant="primary" size="lg" block to="/partner/dashboard">Go to Dashboard</BaseButton>
      <BaseButton variant="secondary" size="lg" block to="/partner/billing">View Invoice History</BaseButton>
    </div>
  </div>
</template>
