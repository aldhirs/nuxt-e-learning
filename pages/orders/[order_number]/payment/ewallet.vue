<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

const walletMap: Record<string, { label: string; color: string }> = {
  ewallet_ovo:       { label: 'OVO',        color: '#4C3494' },
  ewallet_dana:      { label: 'DANA',        color: '#118EEA' },
  ewallet_shopeepay: { label: 'ShopeePay',  color: '#EE4D2D' },
  ewallet_gopay:     { label: 'GoPay',       color: '#00880A' },
}

const method = computed(() => route.query.method as string || 'ewallet_dana')
const wallet = computed(() => walletMap[method.value] ?? walletMap.ewallet_dana)

useSeoMeta({ title: computed(() => `${wallet.value.label} — ${orderNumber.value}`) })

const isRedirecting = ref(false)

const steps = computed(() => [
  `Klik tombol "Buka ${wallet.value.label}" di bawah.`,
  `Anda akan diarahkan ke ${wallet.value.label}.`,
  `Ikuti instruksi di aplikasi ${wallet.value.label}.`,
  'Klik "Saya Sudah Bayar" setelah selesai.'
])

async function openWallet() {
  isRedirecting.value = true
  await new Promise(r => setTimeout(r, 800))
  // Dalam produksi: window.location.href = session.redirect_url
  window.open('#', '_blank')
  isRedirecting.value = false
}
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

  <div v-else class="max-w-sm mx-auto px-4 py-10 flex flex-col items-center text-center">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="self-start inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Ganti metode
    </NuxtLink>

    <!-- Wallet logo area -->
    <div
      class="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 text-white text-2xl font-black"
      :style="{ background: wallet.color }"
    >
      {{ wallet.label[0] }}
    </div>

    <h1 class="text-xl font-bold text-slate-800 mb-1">Bayar dengan {{ wallet.label }}</h1>
    <p class="text-sm text-slate-500 mb-2">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>
    <p class="text-2xl font-bold text-primary-600 mb-2">{{ formatCurrency(order.total_amount) }}</p>
    <OrderCountdownTimer :expires-at="order.expires_at" class="mb-6" />

    <!-- Instructions -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200 w-full mb-6 text-left">
      <p class="text-xs font-semibold text-slate-700 mb-3">Cara pembayaran:</p>
      <ol class="space-y-2">
        <li v-for="(step, i) in steps" :key="i" class="flex gap-2.5 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{{ i + 1 }}</span>
          {{ step }}
        </li>
      </ol>
    </BaseCard>

    <div class="w-full space-y-2">
      <BaseButton variant="primary" size="lg" block :loading="isRedirecting" @click="openWallet">
        Buka {{ wallet.label }}
      </BaseButton>
      <BaseButton variant="secondary" size="lg" block :to="`/orders/${orderNumber}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
