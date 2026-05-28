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
useSeoMeta({ title: () => `Select Payment Method — ${orderNumber.value}` })

const { data: order, pending: orderPending } = await useAsyncData(
  () => `payment-index-order:${orderNumber.value}`,
  () => ordersApi.getMyOrder(orderNumber.value).catch((e: { status?: number }) => {
    if (e.status === 404) return null
    throw e
  }),
  { watch: [orderNumber] }
)

const selectedMethod = ref<PaymentMethod | ''>('')
const isLoading = ref(false)
const serverError = ref('')

const isExpired = computed(() => {
  if (!order.value?.expires_at) return false
  return new Date(order.value.expires_at).getTime() < Date.now()
})

async function selectAndProceed(method: PaymentMethod) {
  if (!order.value || isExpired.value) return
  selectedMethod.value = method
  serverError.value = ''
  isLoading.value = true
  try {
    const session = await paymentApi.initiate(orderNumber.value, { payment_method: method })
    const stored: StoredPaymentSession = { ...session, order_number: orderNumber.value }
    paymentStore.setSession(stored)
    const base = `/orders/${orderNumber.value}/payment`
    if (method.startsWith('va_')) await router.push(`${base}/va`)
    else if (method === 'qris') await router.push(`${base}/qris`)
    else await router.push(`${base}/ewallet`)
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; message?: string }
    if (e.status === 502 || String(e.code) === '502') {
      serverError.value = e.message || 'Payment service is currently unavailable. Please try again in a moment.'
    } else if (e.status === 422) {
      serverError.value = e.message || 'This payment method is not available. Please choose another method.'
    } else if (e.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    } else if (e.status === 0) {
      serverError.value = 'Cannot connect to server. Please check your internet connection.'
    } else {
      serverError.value = e.message || 'Failed to start payment. Please try again.'
    }
    selectedMethod.value = ''
  } finally {
    isLoading.value = false
  }
}

// VA bank rows
const vaBanks = [
  {
    value: 'va_bca' as PaymentMethod,
    name: 'BCA',
    logo: '/images/payment/bca.svg',
    desc: 'BCA Virtual Account — ATM / BCA Mobile / KlikBCA',
    accent: 'hover:border-blue-300 hover:shadow-blue-100',
  },
  {
    value: 'va_mandiri' as PaymentMethod,
    name: 'Mandiri',
    logo: '/images/payment/mandiri.svg',
    desc: 'Mandiri Virtual Account — ATM / Livin\' by Mandiri',
    accent: 'hover:border-amber-300 hover:shadow-amber-100',
  },
  {
    value: 'va_bri' as PaymentMethod,
    name: 'BRI',
    logo: '/images/payment/bri.png',
    desc: 'BRI Virtual Account — ATM / BRImo',
    accent: 'hover:border-sky-300 hover:shadow-sky-100',
  },
  {
    value: 'va_bni' as PaymentMethod,
    name: 'BNI',
    logo: '/images/payment/bni.svg',
    desc: 'BNI Virtual Account — ATM / BNI Mobile Banking',
    accent: 'hover:border-orange-300 hover:shadow-orange-100',
  },
]

// E-wallet rows
const ewallets = [
  {
    value: 'ewallet_ovo' as PaymentMethod,
    name: 'OVO',
    logo: '/images/payment/ovo.svg',
    desc: 'Pay directly from OVO balance',
    accent: 'hover:border-purple-300 hover:shadow-purple-100',
  },
  {
    value: 'ewallet_dana' as PaymentMethod,
    name: 'DANA',
    logo: '/images/payment/dana.svg',
    desc: 'Pay directly from DANA balance',
    accent: 'hover:border-blue-300 hover:shadow-blue-100',
  },
  {
    value: 'ewallet_gopay' as PaymentMethod,
    name: 'GoPay',
    logo: '/images/payment/gopay.svg',
    desc: 'Pay directly from GoPay balance',
    accent: 'hover:border-teal-300 hover:shadow-teal-100',
  },
]
</script>

<template>
  <!-- Step Progress Bar -->
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Detail Course</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Checkout</span>
        <div class="h-0.5 w-10 mx-1 bg-primary-500"></div>
        <div class="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">3</div>
        <span class="hidden sm:block text-xs font-medium text-primary-600 mx-1">Payment</span>
        <div class="h-0.5 w-10 mx-1 bg-slate-200"></div>
        <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center">4</div>
        <span class="hidden sm:block text-xs font-medium text-slate-400 mx-1">Done</span>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div v-if="orderPending" class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-3">
        <BaseSkeleton class="h-8 w-48" />
        <BaseSkeleton class="h-14 rounded-xl" />
        <BaseSkeleton class="h-5 w-36 mt-4" />
        <BaseSkeleton v-for="i in 4" :key="i" class="h-20 rounded-2xl" />
        <BaseSkeleton class="h-5 w-24 mt-2" />
        <BaseSkeleton class="h-20 rounded-2xl" />
        <BaseSkeleton class="h-5 w-28 mt-2" />
        <BaseSkeleton v-for="i in 3" :key="`ew-${i}`" class="h-20 rounded-2xl" />
      </div>
      <div><BaseSkeleton class="h-56 rounded-2xl" /></div>
    </div>
  </div>

  <!-- Not found -->
  <div v-else-if="!order" class="max-w-xl mx-auto px-4 py-20 text-center">
    <BaseEmptyState icon="alert" title="Order not found"
      description="This order doesn't exist or has already expired."
      cta-label="View My Orders" cta-to="/orders" />
  </div>

  <!-- Not payable -->
  <div v-else-if="order.status !== 'pending'" class="max-w-xl mx-auto px-4 py-20 text-center">
    <BaseEmptyState icon="alert" title="Cannot pay"
      :description="order.status === 'paid' ? 'This order has already been paid.' : 'This order is no longer active.'"
      cta-label="View Order Details" :cta-to="`/orders/${orderNumber}`" />
  </div>

  <!-- Payment method selection -->
  <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      <!-- ── Left: methods ───────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Header -->
        <div>
          <h1 class="text-xl font-bold text-slate-800 mb-0.5">Select Payment Method</h1>
          <p class="text-sm text-slate-500">Order <span class="font-mono font-semibold text-slate-700">{{ order.order_number }}</span></p>
        </div>

        <!-- Timer / expired -->
        <div v-if="isExpired" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-semibold text-red-700">This order has expired. Please create a new order.</p>
        </div>
        <div v-else class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-amber-800">Complete payment within</p>
            <p class="text-xs text-amber-600">Order <span class="font-mono font-bold">{{ order.order_number }}</span></p>
          </div>
          <OrderCountdownTimer :expires-at="order.expires_at" />
        </div>

        <!-- Server error -->
        <div v-if="serverError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ serverError }}
        </div>

        <!-- ══════════════════════════════════════════════
             SECTION 1 — Virtual Account
        ══════════════════════════════════════════════ -->
        <div :class="isExpired ? 'opacity-40 pointer-events-none select-none' : ''">
          <!-- Section header -->
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">Virtual Account</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <!-- Bank rows -->
          <div class="space-y-2.5">
            <button
              v-for="bank in vaBanks"
              :key="bank.value"
              type="button"
              :disabled="isLoading"
              :class="[
                'group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:shadow-md',
                bank.accent
              ]"
              @click="selectAndProceed(bank.value)"
            >
              <!-- Logo -->
              <div class="w-24 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  :src="bank.logo"
                  :alt="bank.name"
                  class="max-h-9 max-w-[88px] w-auto object-contain"
                  loading="lazy"
                />
              </div>

              <!-- Info -->
              <div class="flex-1 text-left">
                <p class="text-sm font-semibold text-slate-800 leading-tight">{{ bank.name }} Virtual Account</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ bank.desc }}</p>
              </div>

              <!-- Arrow / spinner -->
              <div class="flex-shrink-0 w-7 flex items-center justify-center">
                <span
                  v-if="isLoading && selectedMethod === bank.value"
                  class="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full block"
                ></span>
                <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════
             SECTION 2 — QRIS
        ══════════════════════════════════════════════ -->
        <div :class="isExpired ? 'opacity-40 pointer-events-none select-none' : ''">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">QRIS</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <button
            type="button"
            :disabled="isLoading"
            class="group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-300 hover:shadow-md hover:shadow-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="selectAndProceed('qris')"
          >
            <!-- QRIS logo -->
            <div class="w-24 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/images/payment/qris.svg"
                alt="QRIS"
                class="max-h-9 max-w-[88px] w-auto object-contain"
                loading="lazy"
              />
            </div>

            <div class="flex-1 text-left">
              <p class="text-sm font-semibold text-slate-800">QRIS</p>
              <p class="text-xs text-slate-400 mt-0.5">GoPay · OVO · DANA · LinkAja · mobile banking · & more</p>
            </div>

            <div class="flex-shrink-0 w-7 flex items-center justify-center">
              <span v-if="isLoading && selectedMethod === 'qris'" class="animate-spin w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full block"></span>
              <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <!-- ══════════════════════════════════════════════
             SECTION 3 — E-Wallet
        ══════════════════════════════════════════════ -->
        <div :class="isExpired ? 'opacity-40 pointer-events-none select-none' : ''">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1 h-px bg-slate-200"></div>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">E-Wallet</span>
            <div class="flex-1 h-px bg-slate-200"></div>
          </div>

          <div class="space-y-2.5">
            <button
              v-for="wallet in ewallets"
              :key="wallet.value"
              type="button"
              :disabled="isLoading"
              :class="[
                'group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:shadow-md',
                wallet.accent
              ]"
              @click="selectAndProceed(wallet.value)"
            >
              <!-- Logo -->
              <div class="w-24 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  :src="wallet.logo"
                  :alt="wallet.name"
                  class="max-h-9 max-w-[88px] w-auto object-contain"
                  loading="lazy"
                />
              </div>

              <div class="flex-1 text-left">
                <p class="text-sm font-semibold text-slate-800">{{ wallet.name }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ wallet.desc }}</p>
              </div>

              <div class="flex-shrink-0 w-7 flex items-center justify-center">
                <span
                  v-if="isLoading && selectedMethod === wallet.value"
                  class="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full block"
                ></span>
                <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
          Back to Order Details
        </BaseButton>
      </div>

      <!-- ── Right: sticky order summary ──────────────────────── -->
      <div class="lg:sticky lg:top-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="bg-gradient-to-br from-primary-600 to-primary-500 px-5 py-4">
            <p class="text-xs font-semibold text-primary-100 uppercase tracking-wider mb-1">Order Summary</p>
            <p class="text-white font-mono text-sm font-bold">{{ order.order_number }}</p>
          </div>
          <div class="p-5 space-y-4">
            <div v-if="order.course?.title">
              <p class="text-xs text-slate-400 mb-1">Course</p>
              <p class="text-sm font-semibold text-slate-800 leading-snug">{{ order.course.title }}</p>
            </div>
            <div class="border-t border-slate-100 pt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Price</span>
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
              <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure & SSL encrypted transaction
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
