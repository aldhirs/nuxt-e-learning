<script setup lang="ts">
import { dummyOrders } from '~/data/dummy'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { formatCurrency, formatDatetime } = useFormatters()

if (!auth.isAuthenticated) {
  await router.push('/login?redirect=/orders')
}

const order = computed(() => dummyOrders.find(o => o.order_number === route.params.order_number))

if (!order.value) {
  throw createError({ statusCode: 404, message: 'Order tidak ditemukan' })
}

useSeoMeta({ title: `Order ${order.value?.order_number}` })

const statusInfo = computed(() => {
  if (!order.value) return null
  const map: Record<string, { desc: string; nextAction: string; nextTo?: string }> = {
    pending: { desc: 'Menunggu pembayaran dari Anda.', nextAction: 'Bayar Sekarang', nextTo: `/orders/${order.value.order_number}/payment` },
    paid: { desc: 'Pembayaran telah diterima. Anda dapat mengakses course.', nextAction: 'Akses Course', nextTo: '/courses' },
    expired: { desc: 'Order kedaluwarsa karena tidak dibayar dalam 24 jam.', nextAction: 'Buat Order Baru', nextTo: `/checkout?course=${order.value.course.slug}` },
    cancelled: { desc: 'Order telah dibatalkan.', nextAction: 'Jelajahi Course', nextTo: '/courses' },
    refunded: { desc: 'Dana telah dikembalikan ke akun Anda.', nextAction: 'Jelajahi Course', nextTo: '/courses' },
  }
  return map[order.value.status]
})
</script>

<template>
  <div v-if="order" class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <!-- Back -->
    <NuxtLink to="/orders" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Kembali ke Order Saya
    </NuxtLink>

    <div class="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <p class="text-xs text-slate-500 font-mono">{{ order.order_number }}</p>
        <h1 class="text-xl font-bold text-slate-800 mt-1">Detail Order</h1>
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>

    <!-- Status explanation -->
    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
      <p class="text-sm text-slate-600 mb-3">{{ statusInfo?.desc }}</p>
      <CountdownTimer
        v-if="order.status === 'pending' && order.expires_at"
        :expires-at="order.expires_at"
        class="mb-3"
      />
      <BaseButton
        v-if="statusInfo?.nextTo"
        variant="primary"
        size="sm"
        :to="statusInfo.nextTo"
      >
        {{ statusInfo?.nextAction }}
      </BaseButton>
    </div>

    <!-- Course -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-4">
      <h2 class="text-sm font-semibold text-slate-700 mb-4">Course yang Dipesan</h2>
      <div class="flex gap-3">
        <div class="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
          <img v-if="order.course.thumbnail_url" :src="order.course.thumbnail_url" :alt="order.course.title" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-800 line-clamp-2">{{ order.course.title }}</p>
          <NuxtLink :to="`/courses/${order.course.slug}`" class="text-xs text-primary-600 hover:underline">Lihat Course</NuxtLink>
        </div>
        <div class="flex-shrink-0 text-sm font-semibold">
          <span v-if="order.unit_price === 0" class="text-green-600">Gratis</span>
          <span v-else class="text-slate-700">{{ formatCurrency(order.unit_price) }}</span>
        </div>
      </div>
    </BaseCard>

    <!-- Payment summary -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-4">
      <h2 class="text-sm font-semibold text-slate-700 mb-4">Ringkasan Pembayaran</h2>
      <PriceBreakdown
        :subtotal="order.unit_price"
        :tax="order.tax_amount"
        :total="order.total_amount"
      />
    </BaseCard>

    <!-- Meta -->
    <BaseCard shadow="sm" padding="md" class="border border-slate-200">
      <h2 class="text-sm font-semibold text-slate-700 mb-4">Informasi Order</h2>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-slate-500">Tanggal Order</dt>
          <dd class="text-slate-800">{{ formatDatetime(order.created_at) }}</dd>
        </div>
        <div v-if="order.expires_at" class="flex justify-between">
          <dt class="text-slate-500">Batas Bayar</dt>
          <dd class="text-slate-800">{{ formatDatetime(order.expires_at) }}</dd>
        </div>
        <div v-if="order.paid_at" class="flex justify-between">
          <dt class="text-slate-500">Tanggal Bayar</dt>
          <dd class="text-slate-800">{{ formatDatetime(order.paid_at) }}</dd>
        </div>
        <div v-if="order.payment_method" class="flex justify-between">
          <dt class="text-slate-500">Metode Bayar</dt>
          <dd class="text-slate-800 uppercase">{{ order.payment_method.replace('_', ' ') }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Nama Pemesan</dt>
          <dd class="text-slate-800">{{ order.student_full_name }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Email</dt>
          <dd class="text-slate-800">{{ order.student_email }}</dd>
        </div>
      </dl>
    </BaseCard>
  </div>
</template>
