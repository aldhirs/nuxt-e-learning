<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { usePaymentStore } from '~/stores/payment'
import type { PaymentStatusSnapshot } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()
const paymentApi = usePaymentApi()
const ordersApi = useOrdersApi()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)

useSeoMeta({ title: () => `Status Pembayaran — ${orderNumber.value}` })

// Fetch order directly with useAsyncData
const { data: order, pending: orderPending } = await useAsyncData(
  () => `status-page-order:${orderNumber.value}`,
  () => ordersApi.getMyOrder(orderNumber.value).catch((e: { status?: number }) => {
    if (e.status === 404) return null
    throw e
  }),
  { watch: [orderNumber] }
)

const snapshot = ref<PaymentStatusSnapshot | null>(null)
const pollCount = ref(0)
const POLL_INTERVAL_MS = 10_000
const MAX_POLLS = 12 // 10s × 12 = 2 menit
const pollError = ref('')

type PollState = 'checking' | 'paid' | 'pending_timeout' | 'expired' | 'cancelled' | 'failed'
const state = ref<PollState>('checking')

let pollTimer: ReturnType<typeof setTimeout> | null = null

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

async function tickStatus() {
  pollError.value = ''
  pollCount.value++
  try {
    const snap = await paymentApi.getStatus(orderNumber.value)
    snapshot.value = snap
    if (snap.status === 'paid') {
      state.value = 'paid'
      paymentStore.clearSession(orderNumber.value)
      stopPolling()
      return
    }
    if (snap.status === 'expired') { state.value = 'expired'; stopPolling(); return }
    if (snap.status === 'cancelled') { state.value = 'cancelled'; stopPolling(); return }
    if (snap.status === 'failed') { state.value = 'failed'; stopPolling(); return }
  } catch (err: unknown) {
    pollError.value = (err as { message?: string }).message || 'Gagal cek status. Coba lagi.'
  }

  if (pollCount.value >= MAX_POLLS) {
    state.value = 'pending_timeout'
    stopPolling()
    return
  }
  pollTimer = setTimeout(tickStatus, POLL_INTERVAL_MS)
}

function manualRecheck() {
  pollCount.value = 0
  state.value = 'checking'
  pollError.value = ''
  stopPolling()
  tickStatus()
}

onMounted(tickStatus)
onBeforeUnmount(stopPolling)

// Derived helpers
const courseSlug = computed(() => order.value?.course?.slug || null)
const paymentMethod = computed(() => snapshot.value?.payment_method || order.value?.payment_method || null)
</script>

<template>
  <!-- Step Progress Bar — all-done when paid -->
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <div
          :class="['w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center', state === 'paid' ? 'bg-emerald-500' : 'bg-emerald-500']"
        >
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
        <div :class="['h-0.5 w-10 mx-1', state === 'paid' ? 'bg-emerald-500' : 'bg-primary-500']"></div>
        <div :class="['w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center', state === 'paid' ? 'bg-emerald-500' : 'bg-primary-500']">
          <svg v-if="state === 'paid'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>3</span>
        </div>
        <span :class="['hidden sm:block text-xs font-medium mx-1', state === 'paid' ? 'text-emerald-600' : 'text-primary-600']">Pembayaran</span>
        <div :class="['h-0.5 w-10 mx-1', state === 'paid' ? 'bg-emerald-500' : 'bg-slate-200']"></div>
        <div :class="['w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center', state === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400']">
          <svg v-if="state === 'paid'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else>4</span>
        </div>
        <span :class="['hidden sm:block text-xs font-medium mx-1', state === 'paid' ? 'text-emerald-600' : 'text-slate-400']">Selesai</span>
      </div>
    </div>
  </div>

  <!-- Loading while order fetches -->
  <div v-if="orderPending" class="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
    <BaseSkeleton class="h-20 w-20 rounded-full mx-auto" />
    <BaseSkeleton class="h-6 w-48 mx-auto" />
    <BaseSkeleton class="h-4 w-64 mx-auto" />
  </div>

  <div v-else class="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-10">
    <div class="max-w-sm w-full">

      <!-- Checking -->
      <template v-if="state === 'checking'">
        <div class="text-center">
          <!-- Animated ring -->
          <div class="w-20 h-20 mx-auto mb-6 relative">
            <div class="w-full h-full rounded-full border-4 border-slate-100"></div>
            <div class="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Mengecek Status Pembayaran</h1>
          <p class="text-slate-500 text-sm mb-4">Harap tunggu, kami sedang memverifikasi pembayaran Anda...</p>
          <p v-if="pollError" class="text-xs text-red-600 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ pollError }}</p>
          <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span class="animate-spin w-3 h-3 border-2 border-primary-300 border-t-transparent rounded-full" aria-hidden="true"></span>
            Percobaan {{ pollCount }} / {{ MAX_POLLS }}
          </div>
        </div>
      </template>

      <!-- Paid — success banner (green gradient) -->
      <template v-else-if="state === 'paid'">
        <!-- Success banner -->
        <div class="rounded-2xl overflow-hidden mb-6" style="background: linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%);">
          <div class="p-8 text-center text-white">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 class="text-2xl font-black mb-1">Pembayaran Berhasil!</h1>
            <p class="text-emerald-100 text-sm font-mono font-bold">{{ orderNumber }}</p>
            <p class="text-emerald-100 text-xs mt-2">Course Anda telah aktif. Selamat belajar!</p>
          </div>
        </div>

        <!-- Order detail card -->
        <div v-if="order" class="bg-white rounded-xl border border-slate-200 p-5 mb-5 space-y-3">
          <div v-if="order.course?.title">
            <p class="text-xs text-slate-400 mb-0.5">Course</p>
            <p class="text-sm font-semibold text-slate-800">{{ order.course.title }}</p>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Order</span>
            <span class="font-mono font-semibold text-slate-700">{{ order.order_number }}</span>
          </div>
          <div class="flex justify-between text-sm border-t border-slate-100 pt-3">
            <span class="text-slate-400">Dibayar</span>
            <span class="font-bold text-emerald-600">{{ formatCurrency(order.total_amount) }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <BaseButton v-if="courseSlug" variant="primary" size="lg" block :to="`/courses/${courseSlug}`">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mulai Belajar
          </BaseButton>
          <BaseButton v-else variant="primary" size="lg" block to="/courses">
            Lihat Course
          </BaseButton>
          <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">Lihat Detail Order</BaseButton>
        </div>
      </template>

      <!-- Pending timeout: webhook hasn't hit after 2 minutes of polling -->
      <template v-else-if="state === 'pending_timeout'">
        <div class="text-center">
          <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Menunggu Konfirmasi</h1>
          <p class="text-slate-500 text-sm mb-2">
            Pembayaran Anda sedang diproses. Enrollment akan aktif otomatis dalam beberapa menit.
          </p>
          <p v-if="order?.student_email" class="text-slate-500 text-sm mb-6">
            Notifikasi dikirim ke <strong class="text-slate-700">{{ order.student_email }}</strong>.
          </p>

          <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-700 text-left">
            <p class="font-semibold mb-1">Sudah transfer tapi belum terkonfirmasi?</p>
            <p>Pembayaran biasanya dikonfirmasi dalam 1-5 menit. Jika lebih dari 10 menit, hubungi CS kami.</p>
          </div>

          <div class="flex flex-col gap-2">
            <BaseButton variant="primary" size="lg" block @click="manualRecheck">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Cek Status Lagi
            </BaseButton>
            <BaseButton variant="secondary" size="lg" block :to="`/orders/${orderNumber}`">Lihat Status Order</BaseButton>
            <BaseButton variant="ghost" size="lg" block to="/">Kembali ke Beranda</BaseButton>
          </div>
        </div>
      </template>

      <!-- Expired -->
      <template v-else-if="state === 'expired'">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Order Kedaluwarsa</h1>
          <p class="text-slate-500 text-sm mb-6">
            Waktu pembayaran habis. Order ini sudah tidak dapat dibayar lagi. Silakan buat order baru.
          </p>
          <div class="flex flex-col gap-2">
            <BaseButton v-if="courseSlug" variant="primary" size="lg" block :to="`/checkout?course=${courseSlug}`">
              Buat Order Baru
            </BaseButton>
            <BaseButton variant="ghost" size="lg" block to="/courses">Lihat Course</BaseButton>
          </div>
        </div>
      </template>

      <!-- Cancelled -->
      <template v-else-if="state === 'cancelled'">
        <div class="text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Order Dibatalkan</h1>
          <p class="text-slate-500 text-sm mb-6">Order ini telah dibatalkan dan tidak dapat dibayar lagi.</p>
          <div class="flex flex-col gap-2">
            <BaseButton variant="primary" size="lg" block to="/courses">Cari Course Lain</BaseButton>
          </div>
        </div>
      </template>

      <!-- Failed -->
      <template v-else>
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800 mb-2">Pembayaran Gagal</h1>
          <p class="text-slate-500 text-sm mb-6">Pembayaran tidak berhasil. Silakan coba lagi atau pilih metode lain.</p>
          <div class="flex flex-col gap-2">
            <BaseButton variant="primary" size="lg" block :to="`/orders/${orderNumber}/payment`">Pilih Metode Lain</BaseButton>
            <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">Lihat Detail Order</BaseButton>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>
