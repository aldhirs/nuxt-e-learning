<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

useSeoMeta({ title: computed(() => `QRIS — ${orderNumber.value}`) })

const isRefreshing = ref(false)
const refreshCount = ref(0)

async function refreshQR() {
  isRefreshing.value = true
  await new Promise(r => setTimeout(r, 800))
  refreshCount.value++
  isRefreshing.value = false
}

// QRIS expires in 30 minutes from page load
const qrisExpiresAt = ref(new Date(Date.now() + 30 * 60 * 1000).toISOString())
</script>

<template>
  <!-- Order not found -->
  <div v-if="!order" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Order tidak ditemukan"
      description="Silakan kembali dan ulangi dari pilih metode pembayaran."
      cta-label="Pilih Metode Bayar"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else class="max-w-sm mx-auto px-4 py-10">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Ganti metode
    </NuxtLink>

    <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Bayar dengan QRIS</h1>
    <p class="text-sm text-slate-500 mb-6 text-center">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- QR Card -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6 flex flex-col items-center gap-4">
      <!-- QR Code area -->
      <div class="w-52 h-52 bg-white rounded-xl border-2 border-slate-200 flex items-center justify-center relative p-2">
        <div v-if="isRefreshing" class="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center z-10">
          <BaseSpinner size="md" />
        </div>
        <!-- QR placeholder SVG -->
        <svg class="w-full h-full text-slate-800" viewBox="0 0 200 200" aria-label="QR Code — scan untuk bayar">
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
          <rect x="90" y="5" width="10" height="10" fill="currentColor"/>
          <rect x="110" y="0" width="10" height="10" fill="currentColor"/>
          <rect x="75" y="20" width="20" height="10" fill="currentColor"/>
          <rect x="80" y="75" width="15" height="15" fill="currentColor"/>
          <rect x="105" y="75" width="15" height="15" fill="currentColor"/>
          <rect x="130" y="80" width="10" height="10" fill="currentColor"/>
          <rect x="80" y="100" width="30" height="10" fill="currentColor"/>
          <rect x="120" y="95" width="20" height="10" fill="currentColor"/>
          <rect x="80" y="120" width="10" height="10" fill="currentColor"/>
          <rect x="100" y="115" width="20" height="15" fill="currentColor"/>
          <rect x="130" y="120" width="10" height="10" fill="currentColor"/>
          <rect x="75" y="145" width="10" height="15" fill="currentColor"/>
          <rect x="90" y="155" width="20" height="10" fill="currentColor"/>
          <rect x="120" y="140" width="15" height="20" fill="currentColor"/>
          <rect x="145" y="75" width="15" height="10" fill="currentColor"/>
          <rect x="170" y="75" width="10" height="10" fill="currentColor"/>
          <rect x="145" y="95" width="10" height="30" fill="currentColor"/>
          <rect x="165" y="105" width="25" height="15" fill="currentColor"/>
          <rect x="150" y="145" width="20" height="10" fill="currentColor"/>
          <rect x="175" y="140" width="15" height="30" fill="currentColor"/>
          <!-- QRIS logo indicator -->
          <rect x="85" y="85" width="30" height="30" fill="white" rx="4"/>
          <text x="100" y="106" text-anchor="middle" font-size="14" font-weight="bold" fill="#2F80D2">QR</text>
        </svg>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500">Total Bayar</p>
        <p class="text-2xl font-bold text-primary-600">{{ formatCurrency(order.total_amount) }}</p>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500 mb-1">QR berlaku selama</p>
        <OrderCountdownTimer :expires-at="qrisExpiresAt" @expired="refreshQR" />
      </div>

      <button
        type="button"
        class="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
        :disabled="isRefreshing"
        @click="refreshQR"
      >
        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ isRefreshing ? 'Memperbarui...' : 'Perbarui QR' }}
      </button>
    </BaseCard>

    <!-- Instructions -->
    <div class="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-1.5">
      <p class="font-semibold text-slate-700 mb-2">Cara bayar:</p>
      <p>1. Buka aplikasi e-wallet (OVO, DANA, ShopeePay, GoPay, dll.)</p>
      <p>2. Pilih menu <strong>Scan QR</strong> atau <strong>QRIS</strong></p>
      <p>3. Arahkan kamera ke QR di atas</p>
      <p>4. Konfirmasi pembayaran di aplikasi Anda</p>
    </div>

    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :to="`/orders/${orderNumber}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
