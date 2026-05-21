<script setup lang="ts">
import { usePaymentStore } from '~/stores/payment'
import type { PaymentSessionVA } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const { formatCurrency } = useFormatters()
const paymentStore = usePaymentStore()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

// VA session di-stamp ke store saat user submit method picker. Discriminate
// by payment_method.startsWith('va_') agar TypeScript narrow ke VA shape.
const session = computed<PaymentSessionVA | null>(() => {
  const s = paymentStore.getSession(orderNumber.value)
  if (s && s.payment_method.startsWith('va_')) return s as PaymentSessionVA
  return null
})

const bankLabel = computed(() => session.value?.bank_name ?? '—')

useSeoMeta({ title: () => `${bankLabel.value} Virtual Account — ${orderNumber.value}` })

const copied = ref(false)
async function copyVA() {
  if (!session.value?.virtual_account_number) return
  try {
    await navigator.clipboard.writeText(session.value.virtual_account_number)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard denied */ }
}

const howToSteps = computed(() => {
  if (session.value?.instructions?.length) return session.value.instructions
  const amount = formatCurrency(session.value?.amount ?? order.value?.total_amount ?? 0)
  return [
    `Buka aplikasi mobile banking atau ATM ${bankLabel.value}.`,
    'Pilih menu Transfer / Bayar / Virtual Account.',
    'Masukkan nomor Virtual Account di atas.',
    `Konfirmasi jumlah pembayaran sebesar ${amount}.`,
    'Simpan bukti transfer Anda.',
    'Status pembayaran terkonfirmasi otomatis dalam beberapa menit setelah transfer berhasil.'
  ]
})
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

  <!-- Session not found (page diakses langsung tanpa pilih method dulu) -->
  <div v-else-if="!session" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Sesi pembayaran tidak ditemukan"
      description="Silakan pilih metode pembayaran terlebih dahulu."
      cta-label="Pilih Metode Bayar"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else class="max-w-xl mx-auto px-4 py-10">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Ganti metode
    </NuxtLink>

    <h1 class="text-xl font-bold text-slate-800 mb-1">{{ bankLabel }} Virtual Account</h1>
    <p class="text-sm text-slate-500 mb-6">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- VA Card -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6">
      <p class="text-xs text-slate-500 mb-2">Nomor Virtual Account {{ bankLabel }}</p>
      <div class="flex items-center gap-3 mb-2">
        <p class="text-2xl font-mono font-bold text-slate-800 flex-1 tracking-widest break-all">{{ session.virtual_account_number }}</p>
        <button
          type="button"
          :class="['flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all font-medium',
            copied ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700']"
          aria-label="Salin nomor VA"
          @click="copyVA"
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
      <p v-if="session.account_name" class="text-xs text-slate-500 mb-4">a.n. {{ session.account_name }}</p>

      <div class="border-t border-slate-100 pt-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-xs text-slate-500">Total Bayar</p>
          <p class="font-bold text-primary-600 text-lg">{{ formatCurrency(session.amount) }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500">Batas Waktu</p>
          <OrderCountdownTimer :expires-at="session.expires_at" />
        </div>
      </div>
    </BaseCard>

    <!-- Instructions -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-6">
      <h2 class="text-sm font-semibold text-slate-700 mb-3">Cara Pembayaran</h2>
      <ol class="space-y-2.5">
        <li v-for="(step, i) in howToSteps" :key="i" class="flex gap-3 text-sm text-slate-600">
          <span class="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ i + 1 }}</span>
          {{ step }}
        </li>
      </ol>
    </BaseCard>

    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :to="`/orders/${orderNumber}/payment/status`">
        Saya Sudah Bayar
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Kembali ke Detail Order
      </BaseButton>
    </div>
  </div>
</template>
