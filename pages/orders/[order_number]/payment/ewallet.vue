<script setup lang="ts">
import { dummyOrders, dummyPaymentSessions } from '~/data/dummy'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))
const session = computed(() => dummyPaymentSessions.ewallet_dana)

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

const walletLabel = computed(() => {
  const method = route.query.method as string
  const labels: Record<string, string> = { ewallet_ovo: 'OVO', ewallet_dana: 'DANA', ewallet_shopeepay: 'ShopeePay', ewallet_gopay: 'GoPay' }
  return labels[method] ?? 'E-Wallet'
})

useSeoMeta({ title: `${walletLabel.value} — ${order.value?.order_number}` })

const isRedirecting = ref(false)

async function openWallet() {
  isRedirecting.value = true
  await new Promise(r => setTimeout(r, 800))
  window.open(session.value?.redirect_url ?? '#', '_blank')
  isRedirecting.value = false
}
</script>

<template>
  <div v-if="order" class="max-w-sm mx-auto px-4 py-10 flex flex-col items-center text-center">
    <div class="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
      <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    </div>

    <h1 class="text-xl font-bold text-slate-800 mb-1">Bayar dengan {{ walletLabel }}</h1>
    <p class="text-sm text-slate-500 mb-2">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>
    <p class="text-2xl font-bold text-primary-600 mb-4">{{ formatCurrency(order.total_amount) }}</p>

    <CountdownTimer v-if="order.expires_at" :expires-at="order.expires_at" class="mb-6" />

    <BaseCard shadow="sm" padding="md" class="border border-slate-200 w-full mb-6 text-left">
      <p class="text-xs text-slate-500 mb-2">Cara bayar:</p>
      <ol class="space-y-2">
        <li class="flex gap-2 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
          Klik tombol "Buka {{ walletLabel }}" di bawah.
        </li>
        <li class="flex gap-2 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
          Anda akan diarahkan ke aplikasi {{ walletLabel }}.
        </li>
        <li class="flex gap-2 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
          Konfirmasi pembayaran di aplikasi {{ walletLabel }}.
        </li>
        <li class="flex gap-2 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
          Kembali ke halaman ini setelah pembayaran selesai.
        </li>
      </ol>
    </BaseCard>

    <div class="w-full space-y-2">
      <BaseButton variant="primary" size="lg" block :loading="isRedirecting" @click="openWallet">
        Buka {{ walletLabel }}
      </BaseButton>
      <BaseButton variant="secondary" size="lg" block :to="`/orders/${order.order_number}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${order.order_number}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
