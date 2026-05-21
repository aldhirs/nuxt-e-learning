<script setup lang="ts">
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import { useOrderStore } from '~/stores/order'
import type { CourseListItem, Order, Paginated } from '~/types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const ordersApi = useOrdersApi()
const coursesApi = useCoursesApi()
const orderStore = useOrderStore()
const { formatCurrency, formatDatetime } = useFormatters()

const orderNumber = computed(() => route.params.order_number as string)

const { data: orderFetched, pending, error, refresh } = await useAsyncData<Order | null>(
  () => `order-detail:${orderNumber.value}`,
  async () => {
    try {
      return await ordersApi.getMyOrder(orderNumber.value)
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) return null
      throw err
    }
  },
  { watch: [orderNumber] }
)

// Workaround BE-FEEDBACK #10: BE order response tidak nest course. Tiga
// sumber untuk title + thumbnail (urut prioritas):
//   1) Snapshot di Pinia store — di-stamp /checkout setelah createOrder.
//   2) Lookup dari katalog public via /public/courses (cached useAsyncData
//      key sama dengan /orders list, jadi sering hit cache tanpa refetch).
//   3) Fallback "Course #ID" — kalau dua sumber di atas miss.
const { data: coursesPage } = await useAsyncData<Paginated<CourseListItem>>(
  'course-id-lookup',
  () => coursesApi.listCourses({ limit: 100 })
)
const courseById = computed(() => {
  const map = new Map<number, CourseListItem>()
  for (const c of coursesPage.value?.data ?? []) map.set(c.id, c)
  return map
})

const order = computed<Order | null>(() => {
  const fetched = orderFetched.value
  if (!fetched) return null
  if (fetched.course?.title) return fetched

  const cached = orderStore.currentOrder
  if (cached?.order_number === fetched.order_number && cached.course?.title) {
    return { ...fetched, course: cached.course }
  }
  const lookup = courseById.value.get(fetched.course_id)
  if (lookup) {
    return {
      ...fetched,
      course: {
        id: lookup.id,
        title: lookup.title,
        slug: lookup.slug,
        thumbnail_url: lookup.thumbnail_url
      }
    }
  }
  return fetched
})

useSeoMeta({ title: () => `Order ${orderNumber.value}` })

const statusInfo = computed(() => {
  const o = order.value
  if (!o) return null
  const courseSlug = o.course?.slug
  const courseFallback = courseSlug ? `/checkout?course=${courseSlug}` : '/courses'
  const map: Record<string, { desc: string; nextAction?: string; nextTo?: string }> = {
    pending: {
      desc: 'Menunggu pembayaran. Selesaikan sebelum batas waktu di bawah.',
      nextAction: 'Bayar Sekarang',
      nextTo: `/orders/${o.order_number}/payment`
    },
    paid: {
      desc: 'Pembayaran telah diterima. Anda dapat mulai belajar sekarang.',
      nextAction: 'Mulai Belajar',
      nextTo: courseSlug ? `/courses/${courseSlug}` : '/courses'
    },
    expired: {
      desc: 'Order kedaluwarsa karena tidak dibayar dalam 24 jam. Buat order baru jika masih ingin enroll.',
      nextAction: 'Buat Order Baru',
      nextTo: courseFallback
    },
    cancelled: {
      desc: 'Order telah dibatalkan.',
      nextAction: 'Jelajahi Course',
      nextTo: '/courses'
    },
    refunded: {
      desc: 'Dana telah dikembalikan ke akun Anda.',
      nextAction: 'Jelajahi Course',
      nextTo: '/courses'
    }
  }
  return map[o.status]
})

// ─── Cancel flow ─────────────────────────────────────────────────────────────
const cancelOpen = ref(false)
const cancelReason = ref('')
const cancelLoading = ref(false)
const cancelError = ref('')

function openCancel() {
  cancelReason.value = ''
  cancelError.value = ''
  cancelOpen.value = true
}

async function confirmCancel() {
  if (!order.value) return
  cancelLoading.value = true
  cancelError.value = ''
  try {
    const updated = await ordersApi.cancelMyOrder(order.value.order_number, {
      reason: cancelReason.value.trim() || undefined
    })
    // Refetch agar field cancelled_at / cancellation_reason ikut populated.
    orderFetched.value = updated
    cancelOpen.value = false
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    if (e.status === 422 || e.status === 400) {
      cancelError.value = e.message || 'Order ini tidak bisa dibatalkan dari status sekarang.'
    } else {
      cancelError.value = e.message || 'Gagal membatalkan order.'
    }
  } finally {
    cancelLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <NuxtLink to="/orders" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Kembali ke Order Saya
    </NuxtLink>

    <!-- Loading -->
    <div v-if="pending && !order" class="space-y-4" aria-busy="true">
      <BaseSkeleton class="h-6 w-1/3" />
      <BaseSkeleton class="h-24 w-full" />
      <BaseSkeleton class="h-32 w-full" />
      <BaseSkeleton class="h-32 w-full" />
    </div>

    <!-- Error -->
    <BaseCard
      v-else-if="error"
      padding="lg"
      class="border border-red-200 bg-red-50"
    >
      <p class="text-sm text-red-700 mb-3">Gagal memuat order. {{ (error as { message?: string }).message ?? '' }}</p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refresh()">Coba lagi</BaseButton>
        <BaseButton variant="ghost" size="sm" to="/orders">Kembali ke daftar</BaseButton>
      </div>
    </BaseCard>

    <!-- 404 -->
    <BaseEmptyState
      v-else-if="!order"
      icon="file-x"
      title="Order tidak ditemukan"
      description="Order ini tidak ada atau Anda tidak memiliki akses."
      cta-label="Lihat Order Saya"
      cta-to="/orders"
    />

    <!-- Success -->
    <div v-else>
      <div class="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <p class="text-xs text-slate-500 font-mono">{{ order.order_number }}</p>
          <h1 class="text-xl font-bold text-slate-800 mt-1">Detail Order</h1>
        </div>
        <OrderStatusBadge :status="order.status" />
      </div>

      <!-- Status card -->
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <p class="text-sm text-slate-600 mb-3">{{ statusInfo?.desc }}</p>
        <OrderCountdownTimer
          v-if="order.status === 'pending'"
          :expires-at="order.expires_at"
          class="mb-3"
        />
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="statusInfo?.nextTo" variant="primary" size="sm" :to="statusInfo.nextTo">
            {{ statusInfo?.nextAction }}
          </BaseButton>
          <BaseButton
            v-if="order.status === 'pending'"
            variant="ghost"
            size="sm"
            :disabled="cancelLoading"
            @click="openCancel"
          >
            Batalkan Order
          </BaseButton>
        </div>
      </div>

      <!-- Course -->
      <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Course yang Dipesan</h2>
        <div class="flex gap-3">
          <div class="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
            <img
              v-if="order.course?.thumbnail_url"
              :src="order.course.thumbnail_url"
              :alt="order.course.title ?? `Course #${order.course_id}`"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-800 line-clamp-2">
              {{ order.course?.title ?? `Course #${order.course_id}` }}
            </p>
            <NuxtLink
              v-if="order.course?.slug"
              :to="`/courses/${order.course.slug}`"
              class="text-xs text-primary-600 hover:underline"
            >Lihat Course</NuxtLink>
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
        <CheckoutPriceBreakdown :subtotal="order.unit_price" :tax="order.tax_amount" :total="order.total_amount" />
      </BaseCard>

      <!-- Meta -->
      <BaseCard shadow="sm" padding="md" class="border border-slate-200">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Informasi Order</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">Tanggal Order</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.created_at) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Batas Bayar</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.expires_at) }}</dd>
          </div>
          <div v-if="order.paid_at" class="flex justify-between">
            <dt class="text-slate-500">Tanggal Bayar</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.paid_at) }}</dd>
          </div>
          <div v-if="order.payment_method" class="flex justify-between">
            <dt class="text-slate-500">Metode Bayar</dt>
            <dd class="text-slate-800 uppercase">{{ order.payment_method.replace(/_/g, ' ') }}</dd>
          </div>
          <div v-if="order.cancelled_at" class="flex justify-between">
            <dt class="text-slate-500">Tanggal Dibatalkan</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.cancelled_at) }}</dd>
          </div>
          <div v-if="order.cancellation_reason" class="flex justify-between">
            <dt class="text-slate-500">Alasan Pembatalan</dt>
            <dd class="text-slate-800">{{ order.cancellation_reason }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Nama Pemesan</dt>
            <dd class="text-slate-800">{{ order.student_full_name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Email</dt>
            <dd class="text-slate-800">{{ order.student_email }}</dd>
          </div>
          <div v-if="order.student_phone" class="flex justify-between">
            <dt class="text-slate-500">No. HP</dt>
            <dd class="text-slate-800">{{ order.student_phone }}</dd>
          </div>
        </dl>
      </BaseCard>
    </div>

    <!-- Cancel confirm modal -->
    <BaseModal v-model="cancelOpen" title="Batalkan Order?">
      <p class="text-sm text-slate-600 mb-4">
        Order <span class="font-mono font-semibold">{{ order?.order_number }}</span> akan dibatalkan dan tidak bisa dibayar lagi. Tindakan ini tidak dapat dibatalkan.
      </p>
      <BaseInput
        v-model="cancelReason"
        label="Alasan (opsional)"
        placeholder="mis. Pilih course lain"
      />
      <div v-if="cancelError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {{ cancelError }}
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="cancelLoading" @click="cancelOpen = false">Tutup</BaseButton>
        <BaseButton variant="danger" :loading="cancelLoading" :disabled="cancelLoading" @click="confirmCancel">Batalkan Order</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
