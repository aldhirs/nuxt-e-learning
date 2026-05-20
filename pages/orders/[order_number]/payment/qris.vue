<script setup lang="ts">
import { dummyOrders, dummyPaymentSessions } from '~/data/dummy'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))
const session = computed(() => dummyPaymentSessions.qris)

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

useSeoMeta({ title: `QRIS — ${order.value?.order_number}` })

const isRefreshing = ref(false)

async function refreshQR() {
  isRefreshing.value = true
  await new Promise(r => setTimeout(r, 1000))
  isRefreshing.value = false
}
</script>

<template>
  <div v-if="order && session" class="max-w-sm mx-auto px-4 py-10">
    <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Bayar dengan QRIS</h1>
    <p class="text-sm text-slate-500 mb-6 text-center">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- QR Code -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6 flex flex-col items-center gap-4">
      <div class="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center relative">
        <div v-if="isRefreshing" class="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
          <BaseSpinner size="md" />
        </div>
        <!-- QR placeholder pattern -->
        <svg class="w-32 h-32 text-slate-800" viewBox="0 0 200 200" aria-label="QR Code placeholder">
          <rect x="0" y="0" width="60" height="60" fill="currentColor"/>
          <rect x="10" y="10" width="40" height="40" fill="white"/>
          <rect x="20" y="20" width="20" height="20" fill="currentColor"/>
          <rect x="140" y="0" width="60" height="60" fill="currentColor"/>
          <rect x="150" y="10" width="40" height="40" fill="white"/>
          <rect x="160" y="20" width="20" height="20" fill="currentColor"/>
          <rect x="0" y="140" width="60" height="60" fill="currentColor"/>
          <rect x="10" y="150" width="40" height="40" fill="white"/>
          <rect x="20" y="160" width="20" height="20" fill="currentColor"/>
          <rect x="75" y="0" width="10" height="10" fill="currentColor"/>
          <rect x="90" y="0" width="10" height="10" fill="currentColor"/>
          <rect x="115" y="0" width="10" height="10" fill="currentColor"/>
          <rect x="75" y="15" width="10" height="10" fill="currentColor"/>
          <rect x="100" y="15" width="10" height="10" fill="currentColor"/>
          <rect x="80" y="75" width="15" height="15" fill="currentColor"/>
          <rect x="105" y="75" width="15" height="15" fill="currentColor"/>
          <rect x="80" y="100" width="30" height="10" fill="currentColor"/>
          <rect x="120" y="95" width="20" height="10" fill="currentColor"/>
          <rect x="80" y="120" width="10" height="10" fill="currentColor"/>
          <rect x="100" y="120" width="20" height="10" fill="currentColor"/>
          <rect x="75" y="145" width="10" height="10" fill="currentColor"/>
          <rect x="90" y="155" width="20" height="15" fill="currentColor"/>
          <rect x="120" y="145" width="15" height="15" fill="currentColor"/>
          <rect x="145" y="75" width="15" height="15" fill="currentColor"/>
          <rect x="170" y="75" width="10" height="10" fill="currentColor"/>
          <rect x="145" y="100" width="10" height="30" fill="currentColor"/>
          <rect x="165" y="110" width="25" height="10" fill="currentColor"/>
          <rect x="150" y="150" width="20" height="10" fill="currentColor"/>
          <rect x="175" y="145" width="15" height="25" fill="currentColor"/>
        </svg>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500">Total Bayar</p>
        <p class="text-2xl font-bold text-primary-600">{{ formatCurrency(order.total_amount) }}</p>
      </div>

      <CountdownTimer v-if="order.expires_at" :expires-at="order.expires_at" />

      <button
        type="button"
        class="text-xs text-primary-600 hover:underline flex items-center gap-1"
        @click="refreshQR"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Perbarui QR
      </button>
    </BaseCard>

    <!-- Instructions -->
    <div class="text-sm text-slate-500 text-center mb-6 space-y-1">
      <p>Buka aplikasi e-wallet pilihan Anda</p>
      <p>(OVO, DANA, ShopeePay, GoPay, dll.)</p>
      <p>dan scan QR code di atas.</p>
    </div>

    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :to="`/orders/${order.order_number}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${order.order_number}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
