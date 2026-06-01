<script setup lang="ts">
definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })
useSeoMeta({ title: 'Subscription Payment Failed' })

const route = useRoute()
const invoiceNumber = computed(() => route.query.invoice_number as string)
const reason = computed(() =>
  (route.query.reason as string) || 'Payment was cancelled or could not be processed by the e-wallet provider.'
)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 class="text-xl font-bold text-slate-800 mb-2">Payment Failed</h1>
      <p class="text-slate-500 text-sm mb-6">{{ reason }}</p>

      <div class="flex flex-col gap-2">
        <BaseButton
          v-if="invoiceNumber"
          variant="primary"
          :to="`/partner/invoice-pay/${invoiceNumber}`"
        >
          Try Another Method
        </BaseButton>
        <BaseButton variant="secondary" to="/partner/billing">
          View Billing
        </BaseButton>
        <BaseButton variant="ghost" to="/partner/dashboard">Go to Dashboard</BaseButton>
      </div>

      <p class="text-xs text-slate-400 mt-6">
        Need help?
        <NuxtLink to="/contact-us" class="text-primary-600 hover:underline">Contact our support</NuxtLink>
      </p>

    </div>
  </div>
</template>
