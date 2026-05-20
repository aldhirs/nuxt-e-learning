<script setup lang="ts">
import type { PaymentMethod } from '~/types'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

useSeoMeta({ title: computed(() => `Pilih Metode Bayar — ${orderNumber.value}`) })

const selectedMethod = ref<PaymentMethod | ''>('')
const isLoading = ref(false)

interface MethodGroup {
  label: string
  methods: { value: PaymentMethod; label: string; description: string }[]
}

const methodGroups: MethodGroup[] = [
  {
    label: 'Virtual Account',
    methods: [
      { value: 'va_bca',     label: 'BCA Virtual Account',     description: 'Transfer via ATM / mobile banking BCA' },
      { value: 'va_mandiri', label: 'Mandiri Virtual Account', description: 'Transfer via ATM / mobile banking Mandiri' },
      { value: 'va_bri',     label: 'BRI Virtual Account',     description: 'Transfer via ATM / mobile banking BRI' },
      { value: 'va_bni',     label: 'BNI Virtual Account',     description: 'Transfer via ATM / mobile banking BNI' },
    ]
  },
  {
    label: 'QRIS',
    methods: [
      { value: 'qris', label: 'QRIS', description: 'Scan QR dengan semua aplikasi e-wallet' },
    ]
  },
  {
    label: 'E-Wallet',
    methods: [
      { value: 'ewallet_ovo',       label: 'OVO',        description: 'Bayar dengan OVO' },
      { value: 'ewallet_dana',      label: 'DANA',       description: 'Bayar dengan DANA' },
      { value: 'ewallet_shopeepay', label: 'ShopeePay',  description: 'Bayar dengan ShopeePay' },
    ]
  }
]

async function proceed() {
  if (!selectedMethod.value || !order.value) return
  isLoading.value = true
  await new Promise(r => setTimeout(r, 500))

  const method = selectedMethod.value
  const base = `/orders/${orderNumber.value}/payment`

  if (method.startsWith('va_')) {
    router.push(`${base}/va?method=${method}`)
  } else if (method === 'qris') {
    router.push(`${base}/qris`)
  } else {
    router.push(`${base}/ewallet?method=${method}`)
  }
}
</script>

<template>
  <!-- Order not found -->
  <div v-if="!order" class="max-w-xl mx-auto px-4 py-20 text-center">
    <BaseEmptyState
      icon="alert"
      title="Order tidak ditemukan"
      description="Order ini tidak ada atau sudah kedaluwarsa. Silakan kembali ke daftar order."
      cta-label="Lihat Order Saya"
      cta-to="/orders"
    />
  </div>

  <!-- Already paid / expired -->
  <div v-else-if="order.status !== 'pending'" class="max-w-xl mx-auto px-4 py-20 text-center">
    <BaseEmptyState
      icon="alert"
      title="Tidak bisa membayar"
      :description="order.status === 'paid' ? 'Order ini sudah dibayar.' : 'Order ini sudah tidak aktif.'"
      cta-label="Lihat Detail Order"
      :cta-to="`/orders/${orderNumber}`"
    />
  </div>

  <!-- Payment method selection -->
  <div v-else class="max-w-xl mx-auto px-4 py-10">
    <h1 class="text-xl font-bold text-slate-800 mb-1">Pilih Metode Pembayaran</h1>
    <p class="text-sm text-slate-500 mb-6">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- Summary pill -->
    <div class="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 flex-wrap gap-3">
      <div>
        <p class="text-xs text-slate-500">Total Pembayaran</p>
        <p class="text-xl font-bold text-primary-600">{{ formatCurrency(order.total_amount) }}</p>
      </div>
      <OrderCountdownTimer :expires-at="order.expires_at" />
    </div>

    <!-- Method groups -->
    <div class="space-y-5">
      <div v-for="group in methodGroups" :key="group.label">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{{ group.label }}</h2>
        <div class="space-y-2">
          <label
            v-for="method in group.methods"
            :key="method.value"
            :class="[
              'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
              selectedMethod === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            ]"
          >
            <input type="radio" :value="method.value" v-model="selectedMethod" class="sr-only" />
            <div :class="['w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
              selectedMethod === method.value ? 'border-primary-500' : 'border-slate-300']">
              <div v-if="selectedMethod === method.value" class="w-2.5 h-2.5 rounded-full bg-primary-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-800">{{ method.label }}</p>
              <p class="text-xs text-slate-500">{{ method.description }}</p>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="mt-6 space-y-2">
      <BaseButton
        variant="primary"
        size="lg"
        block
        :loading="isLoading"
        :disabled="!selectedMethod || isLoading"
        @click="proceed"
      >
        Lanjutkan Pembayaran
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
