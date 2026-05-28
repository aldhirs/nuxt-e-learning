<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment'
import type { PaymentMethodEwallet, PaymentSessionEwallet } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const { formatCurrency } = useFormatters()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

const session = computed<PaymentSessionEwallet | null>(() => {
  const s = paymentStore.getSession(orderNumber.value)
  if (!s) return null
  if (s.payment_method.startsWith('ewallet_')) return s as PaymentSessionEwallet
  return null
})

// Visual styling per provider — fallback ke generic primary kalau provider
// di luar map (mis. BE return provider baru di kemudian hari).
const walletStyles: Record<PaymentMethodEwallet, { label: string; color: string }> = {
  ewallet_ovo:   { label: 'OVO',    color: '#4C3494' },
  ewallet_dana:  { label: 'DANA',   color: '#118EEA' },
  ewallet_gopay: { label: 'GoPay',  color: '#00AED6' }
}
const walletStyle = computed(() => {
  const m = session.value?.payment_method
  return m ? (walletStyles[m] ?? { label: session.value?.provider_name ?? 'E-Wallet', color: '#2F80D2' })
           : { label: 'E-Wallet', color: '#2F80D2' }
})

useSeoMeta({ title: () => `${walletStyle.value.label} — ${orderNumber.value}` })

const isRedirecting = ref(false)

const steps = computed(() => {
  if (session.value?.instructions?.length) return session.value.instructions
  const name = walletStyle.value.label
  return [
    `Tap the "Open ${name}" button below.`,
    `You will be redirected to the ${name} app.`,
    `Confirm the payment in the ${name} app.`,
    'Return to this page and tap "I\'ve Already Paid".'
  ]
})

async function openWallet() {
  const s = session.value
  if (!s) return
  isRedirecting.value = true
  try {
    // Prefer deeplink kalau ada (mobile); fallback ke redirect_url universal.
    const target = s.deeplink_url || s.redirect_url
    if (target) {
      // Open in new tab so this page stays open for the "I've Already Paid" button.
      window.open(target, '_blank', 'noopener,noreferrer')
    }
  } finally {
    setTimeout(() => { isRedirecting.value = false }, 600)
  }
}
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
      title="E-wallet session not found"
      description="Please select a payment method first."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else class="max-w-sm mx-auto px-4 py-10 flex flex-col items-center text-center">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="self-start inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Change method
    </NuxtLink>

    <div
      class="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl font-black"
      :style="{ background: walletStyle.color }"
    >
      {{ walletStyle.label[0] }}
    </div>

    <h1 class="text-xl font-bold text-slate-800 mb-1">Pay with {{ walletStyle.label }}</h1>
    <p class="text-sm text-slate-500 mb-2">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>
    <p class="text-2xl font-bold text-primary-600 mb-2">{{ formatCurrency(session.amount) }}</p>
    <OrderCountdownTimer :expires-at="session.expires_at" class="mb-6" />

    <BaseCard shadow="sm" padding="md" class="border border-slate-200 w-full mb-6 text-left">
      <p class="text-xs font-semibold text-slate-700 mb-3">How to pay:</p>
      <ol class="space-y-2">
        <li v-for="(step, i) in steps" :key="i" class="flex gap-2.5 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{{ i + 1 }}</span>
          {{ step }}
        </li>
      </ol>
    </BaseCard>

    <div class="w-full space-y-2">
      <BaseButton variant="primary" size="lg" block :loading="isRedirecting" :disabled="!session.redirect_url" @click="openWallet">
        Open {{ walletStyle.label }}
      </BaseButton>
      <BaseButton variant="secondary" size="lg" block :to="`/orders/${orderNumber}/payment/status`">
        I've Already Paid
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Back to Order Details
      </BaseButton>
    </div>
  </div>
</template>
