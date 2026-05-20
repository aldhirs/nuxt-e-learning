<script setup lang="ts">
import { dummyOrders } from '~/data/dummy'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

useSeoMeta({ title: `Status Pembayaran — ${order.value?.order_number}` })

type PollStatus = 'checking' | 'paid' | 'pending' | 'expired' | 'failed'

const pollStatus = ref<PollStatus>('checking')
const pollCount = ref(0)
const maxPoll = 8

async function checkStatus() {
  pollCount.value++
  await new Promise(r => setTimeout(r, 1500))

  if (order.value?.status === 'paid') {
    pollStatus.value = 'paid'
    return
  }
  if (order.value?.status === 'expired') {
    pollStatus.value = 'expired'
    return
  }

  if (pollCount.value >= maxPoll) {
    pollStatus.value = 'pending'
    return
  }

  setTimeout(checkStatus, 3000)
}

onMounted(checkStatus)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full" v-if="order">
      <!-- Checking -->
      <template v-if="pollStatus === 'checking'">
        <BaseSpinner size="lg" class="mx-auto mb-4" />
        <h1 class="text-xl font-bold text-slate-800 mb-2">Mengecek Status Pembayaran</h1>
        <p class="text-slate-500 text-sm">Harap tunggu, kami sedang memverifikasi pembayaran Anda...</p>
        <p class="text-xs text-slate-400 mt-4">Pemeriksaan ke-{{ pollCount }} dari {{ maxPoll }}</p>
      </template>

      <!-- Paid -->
      <template v-else-if="pollStatus === 'paid'">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Pembayaran Berhasil!</h1>
        <p class="text-slate-500 text-sm mb-1">
          <span class="font-mono font-semibold">{{ order.order_number }}</span>
        </p>
        <p class="text-slate-500 text-sm mb-6">Course Anda telah aktif. Selamat belajar!</p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/courses">Mulai Belajar</BaseButton>
          <BaseButton variant="ghost" :to="`/orders/${order.order_number}`">Lihat Detail Order</BaseButton>
        </div>
      </template>

      <!-- Pending (timeout) -->
      <template v-else-if="pollStatus === 'pending'">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Menunggu Konfirmasi</h1>
        <p class="text-slate-500 text-sm mb-6">
          Pembayaran Anda sedang diproses. Enrollment akan aktif otomatis dalam beberapa menit.
          Anda akan mendapat notifikasi email ke <strong>{{ order.student_email }}</strong>.
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :to="`/orders/${order.order_number}`">Lihat Status Order</BaseButton>
          <BaseButton variant="ghost" to="/">Kembali ke Beranda</BaseButton>
        </div>
      </template>

      <!-- Expired -->
      <template v-else-if="pollStatus === 'expired'">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Order Kedaluwarsa</h1>
        <p class="text-slate-500 text-sm mb-6">
          Waktu pembayaran telah habis. Silakan buat order baru untuk melanjutkan.
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :to="`/courses`">Cari Course</BaseButton>
          <BaseButton variant="ghost" :to="`/orders/${order.order_number}`">Lihat Detail Order</BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>
