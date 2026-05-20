<script setup lang="ts">
import { dummyOrders, dummyPaymentSessions } from '~/data/dummy'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency, formatDatetime } = useFormatters()

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))
const session = computed(() => dummyPaymentSessions.va_bca)

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

useSeoMeta({ title: `Virtual Account — ${order.value?.order_number}` })

const bankLabel = computed(() => {
  const method = route.query.method as string
  const labels: Record<string, string> = { va_bca: 'BCA', va_mandiri: 'Mandiri', va_bri: 'BRI', va_bni: 'BNI', va_bsi: 'BSI', va_cimb: 'CIMB Niaga' }
  return labels[method] ?? 'Bank'
})

const copied = ref(false)

async function copyVA() {
  if (!session.value?.va_number) return
  await navigator.clipboard.writeText(session.value.va_number)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const howToSteps = computed(() => [
  `Buka aplikasi mobile banking atau ATM ${bankLabel.value} Anda.`,
  'Pilih menu Transfer / Bayar / Virtual Account.',
  `Masukkan nomor Virtual Account: ${session.value?.va_number}.`,
  `Konfirmasi pembayaran sebesar ${formatCurrency(order.value?.total_amount ?? 0)}.`,
  'Simpan bukti pembayaran Anda.',
  'Enrollment course akan aktif otomatis setelah pembayaran dikonfirmasi (maks. 5 menit).'
])
</script>

<template>
  <div v-if="order && session" class="max-w-xl mx-auto px-4 py-10">
    <h1 class="text-xl font-bold text-slate-800 mb-1">{{ bankLabel }} Virtual Account</h1>
    <p class="text-sm text-slate-500 mb-6">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- VA Card -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6">
      <p class="text-xs text-slate-500 mb-1">Nomor Virtual Account</p>
      <div class="flex items-center gap-3">
        <p class="text-2xl font-mono font-bold text-slate-800 flex-1 tracking-widest">{{ session.va_number }}</p>
        <button
          type="button"
          :class="['flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all', copied ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700']"
          @click="copyVA"
          aria-label="Salin nomor VA"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ copied ? 'Tersalin!' : 'Salin' }}
        </button>
      </div>

      <div class="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between text-sm">
        <div>
          <p class="text-xs text-slate-500">Total Bayar</p>
          <p class="font-bold text-primary-600 text-lg">{{ formatCurrency(order.total_amount) }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500">Batas Waktu</p>
          <CountdownTimer v-if="order.expires_at" :expires-at="order.expires_at" />
        </div>
      </div>
    </BaseCard>

    <!-- How to pay -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-6">
      <h2 class="text-sm font-semibold text-slate-700 mb-3">Cara Pembayaran</h2>
      <ol class="space-y-2">
        <li v-for="(step, i) in howToSteps" :key="i" class="flex gap-3 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ i + 1 }}</span>
          {{ step }}
        </li>
      </ol>
    </BaseCard>

    <!-- Actions -->
    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :to="`/orders/${order.order_number}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${order.order_number}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
