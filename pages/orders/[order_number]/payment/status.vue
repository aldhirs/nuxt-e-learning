<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

useSeoMeta({ title: computed(() => `Status Pembayaran — ${orderNumber.value}`) })

type PollStatus = 'checking' | 'paid' | 'pending' | 'expired'

const pollStatus = ref<PollStatus>('checking')
const pollCount = ref(0)
const maxPoll = 6

async function checkStatus() {
  pollCount.value++
  await new Promise(r => setTimeout(r, 1500))

  if (!order.value) {
    pollStatus.value = 'pending'
    return
  }

  if (order.value.status === 'paid') {
    pollStatus.value = 'paid'
    return
  }

  if (order.value.status === 'expired') {
    pollStatus.value = 'expired'
    return
  }

  if (pollCount.value >= maxPoll) {
    // Setelah maxPoll tetap pending → tampilkan pesan tunggu
    pollStatus.value = 'pending'
    return
  }

  setTimeout(checkStatus, 3000)
}

onMounted(checkStatus)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Checking -->
      <template v-if="pollStatus === 'checking'">
        <BaseSpinner size="lg" class="mx-auto mb-4" />
        <h1 class="text-xl font-bold text-slate-800 mb-2">Mengecek Status Pembayaran</h1>
        <p class="text-slate-500 text-sm mb-4">Harap tunggu, kami sedang memverifikasi pembayaran Anda...</p>
        <div class="flex justify-center gap-1.5">
          <span
            v-for="i in maxPoll"
            :key="i"
            :class="['inline-block w-2 h-2 rounded-full transition-all duration-300',
              i <= pollCount ? 'bg-primary-500 scale-110' : 'bg-slate-200']"
          />
        </div>
      </template>

      <!-- Paid -->
      <template v-else-if="pollStatus === 'paid'">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Pembayaran Berhasil!</h1>
        <p class="text-slate-500 text-sm mb-1 font-mono font-semibold">{{ orderNumber }}</p>
        <p class="text-slate-500 text-sm mb-6">Course Anda telah aktif. Selamat belajar!</p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/courses">Mulai Belajar</BaseButton>
          <BaseButton variant="ghost" :to="`/orders/${orderNumber}`">Lihat Detail Order</BaseButton>
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
          <span v-if="order">Notifikasi dikirim ke <strong>{{ order.student_email }}</strong>.</span>
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :to="`/orders/${orderNumber}`">Lihat Status Order</BaseButton>
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
        <p class="text-slate-500 text-sm mb-6">Waktu pembayaran habis. Silakan buat order baru.</p>
        <div class="flex flex-col gap-2">
          <BaseButton v-if="order" variant="primary" :to="`/checkout?course=${order.course.slug}`">
            Beli Lagi
          </BaseButton>
          <BaseButton variant="ghost" to="/courses">Lihat Course</BaseButton>
        </div>
      </template>

    </div>
  </div>
</template>
