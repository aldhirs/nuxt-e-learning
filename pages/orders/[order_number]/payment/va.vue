<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

const route = useRoute()
const { formatCurrency } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

const bankMap: Record<string, { label: string; vaNumber: string }> = {
  va_bca:     { label: 'BCA',         vaNumber: '1234567890123456' },
  va_mandiri: { label: 'Mandiri',     vaNumber: '8901234567890123' },
  va_bri:     { label: 'BRI',         vaNumber: '0123456789012345' },
  va_bni:     { label: 'BNI',         vaNumber: '9012345678901234' },
  va_bsi:     { label: 'BSI',         vaNumber: '7890123456789012' },
  va_cimb:    { label: 'CIMB Niaga',  vaNumber: '6789012345678901' },
}

const method = computed(() => route.query.method as string || 'va_bca')
const bank = computed(() => bankMap[method.value] ?? bankMap.va_bca)

useSeoMeta({ title: computed(() => `${bank.value.label} Virtual Account — ${orderNumber.value}`) })

const copied = ref(false)

async function copyVA() {
  await navigator.clipboard.writeText(bank.value.vaNumber)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const howToSteps = computed(() => [
  `Buka aplikasi mobile banking atau ATM ${bank.value.label} Anda.`,
  'Pilih menu Transfer / Bayar / Virtual Account.',
  `Masukkan nomor Virtual Account di bawah.`,
  `Konfirmasi jumlah pembayaran sebesar ${formatCurrency(order.value?.total_amount ?? 0)}.`,
  'Simpan bukti transfer Anda.',
  'Enrollment course aktif otomatis setelah dikonfirmasi (maks. 5 menit).'
])
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

  <div v-else class="max-w-xl mx-auto px-4 py-10">
    <NuxtLink :to="`/orders/${orderNumber}/payment`"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Ganti metode
    </NuxtLink>

    <h1 class="text-xl font-bold text-slate-800 mb-1">{{ bank.label }} Virtual Account</h1>
    <p class="text-sm text-slate-500 mb-6">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- VA Card -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-6">
      <p class="text-xs text-slate-500 mb-2">Nomor Virtual Account {{ bank.label }}</p>
      <div class="flex items-center gap-3 mb-4">
        <p class="text-2xl font-mono font-bold text-slate-800 flex-1 tracking-widest break-all">{{ bank.vaNumber }}</p>
        <button
          type="button"
          :class="['flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all font-medium',
            copied ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700']"
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

      <div class="border-t border-slate-100 pt-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-xs text-slate-500">Total Bayar</p>
          <p class="font-bold text-primary-600 text-lg">{{ formatCurrency(order.total_amount) }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500">Batas Waktu</p>
          <OrderCountdownTimer :expires-at="order.expires_at" />
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
