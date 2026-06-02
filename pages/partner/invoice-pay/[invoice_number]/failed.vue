<script setup lang="ts">
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'

definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })
useSeoMeta({ title: 'Subscription Payment Failed' })

const route     = useRoute()
const subPayApi = useSubscriptionPaymentApi()

const invoiceNumber = computed(() => route.params.invoice_number as string)
const reason        = computed(() =>
  (route.query.reason as string) || 'Your payment could not be completed. Please try again or choose another method.'
)

const { data: invoiceData } = await useAsyncData(
  () => `failed-invoice:${invoiceNumber.value}`,
  () => subPayApi.fetchInvoice(invoiceNumber.value).catch(() => null),
  { watch: [invoiceNumber] }
)

const invoice = computed(() => invoiceData.value?.invoice ?? null)
const { formatCurrency } = useFormatters()
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="max-w-sm w-full">

      <!-- Failed banner -->
      <div class="rounded-2xl overflow-hidden mb-6" style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%);">
        <div class="p-8 text-center text-white">
          <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-2xl font-black mb-1">Payment Failed</h1>
          <p class="text-red-200 text-xs font-mono font-bold">{{ invoiceNumber }}</p>
        </div>
      </div>

      <!-- Reason + invoice info -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-5 space-y-3">
        <div class="flex items-start gap-2.5 text-sm text-red-600">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{{ reason }}</p>
        </div>

        <template v-if="invoice">
          <div class="flex justify-between text-sm border-t border-slate-100 pt-3">
            <span class="text-slate-400">Invoice</span>
            <span class="font-mono font-semibold text-slate-700">{{ invoice.invoice_number }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Amount</span>
            <span class="font-bold text-slate-900">{{ formatCurrency(invoice.amount) }}</span>
          </div>
        </template>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <BaseButton variant="primary" size="lg" block :to="`/partner/invoice-pay/${invoiceNumber}`">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Another Method
        </BaseButton>
        <BaseButton variant="secondary" size="lg" block to="/partner/billing">
          View Billing
        </BaseButton>
        <BaseButton variant="ghost" size="lg" block to="/partner/dashboard">
          Go to Dashboard
        </BaseButton>
      </div>

      <p class="text-xs text-slate-400 text-center mt-6">
        Need help?
        <NuxtLink to="/contact-us" class="text-primary-600 hover:underline">Contact our support</NuxtLink>
      </p>

    </div>
  </div>
</template>
