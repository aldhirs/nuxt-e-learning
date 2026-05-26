<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { usePaymentStore } from '~/stores/payment'
import type { PaymentMethod, StoredPaymentSession } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()
const paymentApi = usePaymentApi()
const ordersApi = useOrdersApi()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)

useSeoMeta({ title: () => `Pilih Metode Bayar — ${orderNumber.value}` })

// Fetch order directly with useAsyncData for SSR-safe hydration
const { data: order, pending: orderPending } = await useAsyncData(
  () => `payment-index-order:${orderNumber.value}`,
  () => ordersApi.getMyOrder(orderNumber.value).catch((e: { status?: number }) => {
    if (e.status === 404) return null
    throw e
  }),
  { watch: [orderNumber] }
)

// Tab state
const activeTab = ref<'va' | 'qris' | 'ewallet'>('va')

const selectedMethod = ref<PaymentMethod | ''>('')
const isLoading = ref(false)
const serverError = ref('')

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
      { value: 'va_bni',     label: 'BNI Virtual Account',     description: 'Transfer via ATM / mobile banking BNI' }
    ]
  },
  {
    label: 'QRIS',
    methods: [
      { value: 'qris', label: 'QRIS', description: 'Scan QR dengan semua aplikasi e-wallet' }
    ]
  },
  {
    label: 'E-Wallet',
    methods: [
      { value: 'ewallet_ovo',       label: 'OVO',        description: 'Bayar dengan OVO' },
      { value: 'ewallet_dana',      label: 'DANA',       description: 'Bayar dengan DANA' },
      { value: 'ewallet_shopeepay', label: 'ShopeePay',  description: 'Bayar dengan ShopeePay' }
    ]
  }
]

const vaCards = [
  { value: 'va_bca' as PaymentMethod,     label: 'BCA',     colorClass: 'bg-blue-600',   description: 'BCA Virtual Account' },
  { value: 'va_mandiri' as PaymentMethod, label: 'MANDIRI', colorClass: 'bg-amber-500',  description: 'Mandiri Virtual Account' },
  { value: 'va_bri' as PaymentMethod,     label: 'BRI',     colorClass: 'bg-blue-800',   description: 'BRI Virtual Account' },
  { value: 'va_bni' as PaymentMethod,     label: 'BNI',     colorClass: 'bg-orange-500', description: 'BNI Virtual Account' }
]

const ewalletCards = [
  { value: 'ewallet_ovo' as PaymentMethod,       label: 'OVO',        icon: '💜', description: 'Bayar dengan OVO' },
  { value: 'ewallet_dana' as PaymentMethod,      label: 'DANA',       icon: '💙', description: 'Bayar dengan DANA' },
  { value: 'ewallet_shopeepay' as PaymentMethod, label: 'ShopeePay',  icon: '🧡', description: 'Bayar dengan ShopeePay' }
]

const isExpired = computed(() => {
  if (!order.value?.expires_at) return false
  return new Date(order.value.expires_at).getTime() < Date.now()
})

async function selectAndProceed(method: PaymentMethod) {
  if (!order.value || isExpired.value) return
  selectedMethod.value = method
  await proceed()
}

async function proceed() {
  if (!selectedMethod.value || !order.value) return
  serverError.value = ''
  isLoading.value = true
  try {
    const session = await paymentApi.initiate(orderNumber.value, {
      payment_method: selectedMethod.value
    })
    const stored: StoredPaymentSession = { ...session, order_number: orderNumber.value }
    paymentStore.setSession(stored)

    const method = selectedMethod.value
    const base = `/orders/${orderNumber.value}/payment`
    if (method.startsWith('va_')) {
      await router.push(`${base}/va`)
    } else if (method === 'qris') {
      await router.push(`${base}/qris`)
    } else {
      await router.push(`${base}/ewallet`)
    }
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; message?: string; reason?: string }
    if (e.status === 502 || (e.code && String(e.code) === '502')) {
      serverError.value = e.message || 'Layanan pembayaran sedang tidak tersedia. Silakan coba beberapa saat lagi.'
    } else if (e.status === 422) {
      serverError.value = e.message || 'Metode pembayaran ini belum tersedia. Pilih metode lain.'
    } else if (e.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    } else if (e.status === 0) {
      serverError.value = 'Tidak bisa terhubung ke server. Cek koneksi internet Anda.'
    } else {
      serverError.value = e.message || 'Gagal memulai pembayaran. Silakan coba lagi.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Step Progress Bar -->
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <!-- Step 1: Detail Course — done -->
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Detail Course</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <!-- Step 2: Checkout — done -->
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Checkout</span>
        <div class="h-0.5 w-10 mx-1 bg-primary-500"></div>
        <!-- Step 3: Pembayaran — active -->
        <div class="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">3</div>
        <span class="hidden sm:block text-xs font-medium text-primary-600 mx-1">Pembayaran</span>
        <div class="h-0.5 w-10 mx-1 bg-slate-200"></div>
        <!-- Step 4: Selesai — pending -->
        <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center">4</div>
        <span class="hidden sm:block text-xs font-medium text-slate-400 mx-1">Selesai</span>
      </div>
    </div>
  </div>

  <!-- Loading skeleton -->
  <div v-if="orderPending" class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <BaseSkeleton class="h-8 w-48" />
        <BaseSkeleton class="h-10 w-full rounded-xl" />
        <div class="grid grid-cols-2 gap-3">
          <BaseSkeleton class="h-24 rounded-xl" />
          <BaseSkeleton class="h-24 rounded-xl" />
          <BaseSkeleton class="h-24 rounded-xl" />
          <BaseSkeleton class="h-24 rounded-xl" />
        </div>
      </div>
      <div class="space-y-4">
        <BaseSkeleton class="h-48 rounded-xl" />
      </div>
    </div>
  </div>

  <!-- Order not found -->
  <div v-else-if="!order" class="max-w-xl mx-auto px-4 py-20 text-center">
    <BaseEmptyState
      icon="alert"
      title="Order tidak ditemukan"
      description="Order ini tidak ada atau sudah kedaluwarsa. Silakan kembali ke daftar order."
      cta-label="Lihat Order Saya"
      cta-to="/orders"
    />
  </div>

  <!-- Already paid / expired / cancelled -->
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
  <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      <!-- Left: method selection -->
      <div class="lg:col-span-2 space-y-5">
        <div>
          <h1 class="text-xl font-bold text-slate-800 mb-1">Pilih Metode Pembayaran</h1>
          <p class="text-sm text-slate-500">Order <span class="font-mono font-semibold text-slate-700">{{ order.order_number }}</span></p>
        </div>

        <!-- Expired alert -->
        <div v-if="isExpired" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-red-700">Order ini sudah kedaluwarsa. Silakan buat order baru.</p>
        </div>

        <!-- Countdown alert (amber) — only show if not expired -->
        <div v-else class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-amber-800">Selesaikan pembayaran dalam</p>
            <p class="text-xs text-amber-600">Order <span class="font-mono font-bold">{{ order.order_number }}</span></p>
          </div>
          <div class="text-right">
            <OrderCountdownTimer :expires-at="order.expires_at" />
          </div>
        </div>

        <!-- Server error -->
        <div v-if="serverError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ serverError }}
        </div>

        <!-- Tab navigation -->
        <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            type="button"
            :class="[
              'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === 'va'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'va'"
          >
            Virtual Account
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === 'qris'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'qris'"
          >
            QRIS
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200',
              activeTab === 'ewallet'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            ]"
            @click="activeTab = 'ewallet'"
          >
            E-Wallet
          </button>
        </div>

        <!-- VA Tab -->
        <div v-show="activeTab === 'va'">
          <div
            :class="['grid grid-cols-2 gap-3', isExpired ? 'opacity-40 pointer-events-none' : '']"
          >
            <button
              v-for="card in vaCards"
              :key="card.value"
              type="button"
              :disabled="isLoading"
              class="flex flex-col items-center gap-3 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              @click="selectAndProceed(card.value)"
            >
              <!-- Bank logo badge -->
              <div :class="['px-4 py-2 rounded-xl text-white text-sm font-extrabold tracking-wider', card.colorClass]">
                {{ card.label }}
              </div>
              <p class="text-xs text-slate-500 group-hover:text-primary-600 transition-colors text-center leading-tight">
                {{ card.description }}
              </p>
              <span
                v-if="isLoading && selectedMethod === card.value"
                class="inline-flex items-center gap-1.5 text-xs text-primary-600 font-semibold"
              >
                <span class="animate-spin w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full"></span>
                Memproses...
              </span>
              <span v-else class="text-xs font-semibold text-primary-600 group-hover:underline">Pilih</span>
            </button>
          </div>
        </div>

        <!-- QRIS Tab -->
        <div v-show="activeTab === 'qris'">
          <button
            type="button"
            :disabled="isLoading || isExpired"
            :class="[
              'w-full flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group',
              isExpired ? 'opacity-40 pointer-events-none' : ''
            ]"
            @click="selectAndProceed('qris')"
          >
            <div class="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4H4v8h8V4zM20 4h-8v8h8V4zM12 12H4v8h8v-8zM20 16h-2v2h2v-2zM16 12v4h4v-4h-4z" />
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-base font-bold text-slate-800 group-hover:text-primary-700 transition-colors">QRIS</p>
              <p class="text-sm text-slate-500">Scan QR dengan semua aplikasi e-wallet & mobile banking</p>
            </div>
            <span v-if="isLoading && selectedMethod === 'qris'" class="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full flex-shrink-0"></span>
            <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- E-Wallet Tab -->
        <div v-show="activeTab === 'ewallet'">
          <div
            :class="['flex flex-col sm:flex-row gap-3', isExpired ? 'opacity-40 pointer-events-none' : '']"
          >
            <button
              v-for="card in ewalletCards"
              :key="card.value"
              type="button"
              :disabled="isLoading"
              class="flex-1 flex flex-col items-center gap-2 p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              @click="selectAndProceed(card.value)"
            >
              <span class="text-3xl" aria-hidden="true">{{ card.icon }}</span>
              <p class="text-sm font-bold text-slate-700 group-hover:text-primary-700 transition-colors">{{ card.label }}</p>
              <p class="text-xs text-slate-400 text-center">{{ card.description }}</p>
              <span
                v-if="isLoading && selectedMethod === card.value"
                class="inline-flex items-center gap-1.5 text-xs text-primary-600 font-semibold"
              >
                <span class="animate-spin w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full"></span>
                Memproses...
              </span>
              <span v-else class="text-xs font-semibold text-primary-600 group-hover:underline">Pilih</span>
            </button>
          </div>
        </div>

        <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
          Kembali ke Detail Order
        </BaseButton>
      </div>

      <!-- Right: sticky order summary -->
      <div class="lg:sticky lg:top-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-gradient-to-br from-primary-600 to-primary-500 px-5 py-4">
            <p class="text-xs font-semibold text-primary-100 uppercase tracking-wider mb-1">Ringkasan Order</p>
            <p class="text-white font-mono text-sm font-bold">{{ order.order_number }}</p>
          </div>
          <div class="p-5 space-y-4">
            <!-- Course info -->
            <div v-if="order.course?.title">
              <p class="text-xs text-slate-400 mb-1">Course</p>
              <p class="text-sm font-semibold text-slate-800 leading-snug">{{ order.course.title }}</p>
            </div>

            <div class="border-t border-slate-100 pt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Harga</span>
                <span class="font-medium text-slate-700">{{ formatCurrency(order.unit_price) }}</span>
              </div>
              <div v-if="order.tax_amount" class="flex justify-between text-sm">
                <span class="text-slate-500">PPN (11%)</span>
                <span class="font-medium text-slate-700">{{ formatCurrency(order.tax_amount) }}</span>
              </div>
              <div class="flex justify-between border-t border-slate-100 pt-2">
                <span class="text-sm font-bold text-slate-700">Total</span>
                <span class="text-lg font-black text-primary-600">{{ formatCurrency(order.total_amount) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 text-xs text-slate-400">
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Transaksi aman & terenkripsi SSL
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
