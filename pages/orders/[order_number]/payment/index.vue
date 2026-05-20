<script setup lang="ts">
import { dummyOrders } from '~/data/dummy'
import type { PaymentMethod } from '~/types'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

useSeoMeta({ title: `Pilih Metode Bayar — ${order.value?.order_number}` })

const selectedMethod = ref<PaymentMethod | ''>('')
const isLoading = ref(false)

interface MethodGroup {
  label: string
  methods: { value: PaymentMethod; label: string; logo?: string; description?: string }[]
}

const methodGroups: MethodGroup[] = [
  {
    label: 'Virtual Account',
    methods: [
      { value: 'va_bca', label: 'BCA Virtual Account', description: 'Transfer via ATM / mobile banking BCA' },
      { value: 'va_mandiri', label: 'Mandiri Virtual Account', description: 'Transfer via ATM / mobile banking Mandiri' },
      { value: 'va_bri', label: 'BRI Virtual Account', description: 'Transfer via ATM / mobile banking BRI' },
      { value: 'va_bni', label: 'BNI Virtual Account', description: 'Transfer via ATM / mobile banking BNI' },
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
      { value: 'ewallet_ovo', label: 'OVO', description: 'Bayar dengan OVO' },
      { value: 'ewallet_dana', label: 'DANA', description: 'Bayar dengan DANA' },
      { value: 'ewallet_shopeepay', label: 'ShopeePay', description: 'Bayar dengan ShopeePay' },
    ]
  }
]

async function proceed() {
  if (!selectedMethod.value) return
  isLoading.value = true
  await new Promise(r => setTimeout(r, 600))

  const methodType = selectedMethod.value.startsWith('va_') ? 'va'
    : selectedMethod.value === 'qris' ? 'qris'
    : 'ewallet'

  router.push(`/orders/${route.params.order_number}/payment/${methodType}?method=${selectedMethod.value}`)
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-10" v-if="order">
    <h1 class="text-xl font-bold text-slate-800 mb-1">Pilih Metode Pembayaran</h1>
    <p class="text-sm text-slate-500 mb-6">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- Order summary pill -->
    <div class="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
      <div>
        <p class="text-xs text-slate-500">Total Pembayaran</p>
        <p class="text-xl font-bold text-primary-600">{{ formatCurrency(order.total_amount) }}</p>
      </div>
      <CountdownTimer v-if="order.expires_at" :expires-at="order.expires_at" />
    </div>

    <!-- Methods -->
    <div class="space-y-4">
      <div v-for="group in methodGroups" :key="group.label">
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{{ group.label }}</h2>
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
            <div
              :class="[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                selectedMethod === method.value ? 'border-primary-500' : 'border-slate-300'
              ]"
            >
              <div v-if="selectedMethod === method.value" class="w-2.5 h-2.5 rounded-full bg-primary-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-800">{{ method.label }}</p>
              <p v-if="method.description" class="text-xs text-slate-500">{{ method.description }}</p>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="mt-6">
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
      <p class="text-xs text-center text-slate-400 mt-3">
        <NuxtLink :to="`/orders/${order.order_number}`" class="hover:text-slate-600 transition-colors">Kembali ke detail order</NuxtLink>
      </p>
    </div>
  </div>
</template>
