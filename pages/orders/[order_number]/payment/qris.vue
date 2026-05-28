<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment'
import type { PaymentSessionQRIS } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const { formatCurrency } = useFormatters()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

const session = computed<PaymentSessionQRIS | null>(() => {
  const s = paymentStore.getSession(orderNumber.value)
  return s && s.payment_method === 'qris' ? (s as PaymentSessionQRIS) : null
})

useSeoMeta({ title: () => `QRIS — ${orderNumber.value}` })

// Render QR pakai goQR.me public API. Aman untuk QRIS string (plain text),
// tidak butuh dependency tambahan. Fallback ke server-rendered qr_image_url
// kalau BE menyediakan (mis. nanti dari MinIO cache).
const qrImageSrc = computed(() => {
  const s = session.value
  if (!s) return ''
  if (s.qr_image_url) return s.qr_image_url
  // qr_content kadang panjang — encode untuk URL.
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(s.qr_content)}`
})
</script>

<template>
  <div v-if="!order" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Order not found"
      description="Please go back and start again from the payment method selection."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else-if="!session" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="QRIS session not found"
      description="Please select a payment method first."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else class="max-w-sm mx-auto px-4 py-10">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Change method
    </NuxtLink>

    <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Pay with QRIS</h1>
    <p class="text-sm text-slate-500 mb-6 text-center">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6 flex flex-col items-center gap-4">
      <div class="w-60 h-60 bg-white rounded-xl border-2 border-slate-200 flex items-center justify-center p-2">
        <img :src="qrImageSrc" alt="QR code for payment" class="w-full h-full object-contain" loading="lazy" />
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500">Total Amount</p>
        <p class="text-2xl font-bold text-primary-600">{{ formatCurrency(session.amount) }}</p>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500 mb-1">QR valid for</p>
        <OrderCountdownTimer :expires-at="session.expires_at" />
      </div>
    </BaseCard>

    <div class="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-1.5">
      <p class="font-semibold text-slate-700 mb-2">How to pay:</p>
      <template v-if="session.instructions?.length">
        <p v-for="(step, i) in session.instructions" :key="i">{{ i + 1 }}. {{ step }}</p>
      </template>
      <template v-else>
        <p>1. Open your e-wallet app (OVO, DANA, ShopeePay, GoPay, etc.)</p>
        <p>2. Select <strong>Scan QR</strong> or <strong>QRIS</strong> menu</p>
        <p>3. Point your camera at the QR code above</p>
        <p>4. Confirm the payment in your app</p>
      </template>
    </div>

    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :to="`/orders/${orderNumber}/payment/status`">
        I've Already Paid
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Back to Order Details
      </BaseButton>
    </div>
  </div>
</template>
