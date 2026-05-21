<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { usePaymentStore } from '~/stores/payment'
import type { PaymentStatusSnapshot } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const paymentApi = usePaymentApi()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

useSeoMeta({ title: () => `Status Pembayaran — ${orderNumber.value}` })

const snapshot = ref<PaymentStatusSnapshot | null>(null)
const pollCount = ref(0)
const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 24 // 5s × 24 = 2 menit, lalu surrender ke "menunggu konfirmasi"
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
      // Clear cached session — payment selesai.
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
  stopPolling()
  tickStatus()
}

onMounted(tickStatus)
onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Checking -->
      <template v-if="state === 'checking'">
        <BaseSpinner size="lg" class="mx-auto mb-4" />
        <h1 class="text-xl font-bold text-slate-800 mb-2">Mengecek Status Pembayaran</h1>
        <p class="text-slate-500 text-sm mb-4">Harap tunggu, kami sedang memverifikasi pembayaran Anda...</p>
        <p v-if="pollError" class="text-xs text-red-600 mb-3">{{ pollError }}</p>
        <p class="text-xs text-slate-400">Percobaan {{ pollCount }} / {{ MAX_POLLS }}</p>
      </template>

      <!-- Paid -->
      <template v-else-if="state === 'paid'">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Pembayaran Berhasil!</h1>
        <p class="text-slate-500 text-sm mb-1 font-mono font-semibold">{{ orderNumber }}</p>
        <p class="text-slate-500 text-sm mb-6">Course Anda telah aktif. Selamat belajar!</p>
        <div class="flex flex-col gap-2">
          <BaseButton v-if="order?.course?.slug" variant="primary" :to="`/courses/${order.course.slug}`">Mulai Belajar</BaseButton>
          <BaseButton v-else variant="primary" to="/courses">Lihat Course</BaseButton>
          <BaseButton variant="ghost" :to="`/orders/${orderNumber}`">Lihat Detail Order</BaseButton>
        </div>
      </template>

      <!-- Pending timeout: webhook belum hit setelah 2 menit polling -->
      <template v-else-if="state === 'pending_timeout'">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Menunggu Konfirmasi</h1>
        <p class="text-slate-500 text-sm mb-6">
          Pembayaran Anda sedang diproses. Enrollment akan aktif otomatis dalam beberapa menit.
          <span v-if="order">Notifikasi dikirim ke <strong>{{ order.student_email }}</strong>.</span>
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" @click="manualRecheck">Cek Lagi</BaseButton>
          <BaseButton variant="secondary" :to="`/orders/${orderNumber}`">Lihat Status Order</BaseButton>
          <BaseButton variant="ghost" to="/">Kembali ke Beranda</BaseButton>
        </div>
      </template>

      <!-- Expired -->
      <template v-else-if="state === 'expired'">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Order Kedaluwarsa</h1>
        <p class="text-slate-500 text-sm mb-6">Waktu pembayaran habis. Silakan buat order baru.</p>
        <div class="flex flex-col gap-2">
          <BaseButton v-if="order?.course?.slug" variant="primary" :to="`/checkout?course=${order.course.slug}`">
            Beli Lagi
          </BaseButton>
          <BaseButton variant="ghost" to="/courses">Lihat Course</BaseButton>
        </div>
      </template>

      <!-- Cancelled -->
      <template v-else-if="state === 'cancelled'">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Order Dibatalkan</h1>
        <p class="text-slate-500 text-sm mb-6">Order ini telah dibatalkan dan tidak dapat dibayar lagi.</p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/courses">Cari Course Lain</BaseButton>
        </div>
      </template>

      <!-- Failed -->
      <template v-else>
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Pembayaran Gagal</h1>
        <p class="text-slate-500 text-sm mb-6">Pembayaran tidak berhasil. Silakan coba lagi atau pilih metode lain.</p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :to="`/orders/${orderNumber}/payment`">Pilih Metode Lain</BaseButton>
          <BaseButton variant="ghost" :to="`/orders/${orderNumber}`">Lihat Detail Order</BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>
