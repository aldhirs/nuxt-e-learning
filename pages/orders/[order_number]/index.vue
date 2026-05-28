<script setup lang="ts">
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import type { Order } from '~/types'

definePageMeta({ layout: 'profile', middleware: 'auth' })

const route = useRoute()
const ordersApi = useOrdersApi()
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

// BE now nests course directly in the order response (id, title, slug, thumbnail_url).
const order = computed<Order | null>(() => orderFetched.value)

useSeoMeta({ title: () => `Order ${orderNumber.value}` })

// Determine the correct payment destination based on already-selected method.
// If payment_method is set on the order (from a previous initiate call), go directly
// to the method-specific page. Only fall back to selection if no method yet.
const payTo = computed(() => {
  const o = order.value
  if (!o) return '/orders'
  const base = `/orders/${o.order_number}/payment`
  const method = o.payment_method
  if (!method) return base
  if (method.startsWith('va_')) return `${base}/va`
  if (method === 'qris') return `${base}/qris`
  if (method.startsWith('ewallet_')) return `${base}/ewallet`
  return base
})

// True when a payment method has already been chosen (but order still pending).
const hasPaymentMethod = computed(() =>
  order.value?.status === 'pending' && !!order.value?.payment_method
)

const statusInfo = computed(() => {
  const o = order.value
  if (!o) return null
  const courseSlug = o.course?.slug
  const courseFallback = courseSlug ? `/checkout?course=${courseSlug}` : '/courses'
  const map: Record<string, { desc: string; nextAction?: string; nextTo?: string }> = {
    pending: {
      desc: 'Awaiting payment. Please complete before the deadline below.',
      nextAction: 'Pay Now',
      nextTo: payTo.value
    },
    paid: {
      desc: 'Payment received. You can start learning now.',
      nextAction: 'Start Learning',
      nextTo: courseSlug ? `/courses/${courseSlug}` : '/courses'
    },
    expired: {
      desc: 'Order expired as it was not paid within 24 hours. Create a new order if you still want to enroll.',
      nextAction: 'Create New Order',
      nextTo: courseFallback
    },
    cancelled: {
      desc: 'This order has been cancelled.',
      nextAction: 'Browse Courses',
      nextTo: '/courses'
    },
    refunded: {
      desc: 'Funds have been returned to your account.',
      nextAction: 'Browse Courses',
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
      cancelError.value = e.message || 'This order cannot be cancelled from its current status.'
    } else {
      cancelError.value = e.message || 'Failed to cancel order.'
    }
  } finally {
    cancelLoading.value = false
  }
}
</script>

<template>
  <div class="flex-1 min-w-0">
    <NuxtLink to="/orders" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to My Orders
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
      <p class="text-sm text-red-700 mb-3">Failed to load order. {{ (error as { message?: string }).message ?? '' }}</p>
      <div class="flex gap-2">
        <BaseButton variant="primary" size="sm" @click="refresh()">Try Again</BaseButton>
        <BaseButton variant="ghost" size="sm" to="/orders">Back to list</BaseButton>
      </div>
    </BaseCard>

    <!-- 404 -->
    <BaseEmptyState
      v-else-if="!order"
      icon="file-x"
      title="Order not found"
      description="This order doesn't exist or you don't have access."
      cta-label="View My Orders"
      cta-to="/orders"
    />

    <!-- Success -->
    <div v-else>
      <div class="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <p class="text-xs text-slate-500 font-mono">{{ order.order_number }}</p>
          <h1 class="text-xl font-bold text-slate-800 mt-1">Order Details</h1>
        </div>
        <OrderStatusBadge :status="order.status" />
      </div>

      <!-- Status card -->
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <p class="text-sm text-slate-600 mb-3">{{ statusInfo?.desc }}</p>

        <!-- Show chosen payment method when already selected -->
        <div v-if="hasPaymentMethod" class="flex items-center gap-2 mb-3 text-sm text-slate-600">
          <svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Method: <strong class="text-slate-800 uppercase">{{ order.payment_method!.replace(/_/g, ' ') }}</strong></span>
        </div>

        <OrderCountdownTimer
          v-if="order.status === 'pending'"
          :expires-at="order.expires_at"
          class="mb-3"
        />
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="statusInfo?.nextTo" variant="primary" size="sm" :to="statusInfo.nextTo">
            {{ statusInfo?.nextAction }}
          </BaseButton>
          <!-- Show "Ganti Metode" only when a method is already selected -->
          <BaseButton
            v-if="hasPaymentMethod"
            variant="secondary"
            size="sm"
            :to="`/orders/${order.order_number}/payment`"
          >
            Change Method
          </BaseButton>
          <BaseButton
            v-if="order.status === 'pending'"
            variant="ghost"
            size="sm"
            :disabled="cancelLoading"
            @click="openCancel"
          >
            Cancel Order
          </BaseButton>
        </div>
      </div>

      <!-- Course -->
      <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Ordered Course</h2>
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
            >View Course</NuxtLink>
          </div>
          <div class="flex-shrink-0 text-sm font-semibold">
            <span v-if="order.unit_price === 0" class="text-green-600">Free</span>
            <span v-else class="text-slate-700">{{ formatCurrency(order.unit_price) }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Payment summary -->
      <BaseCard shadow="sm" padding="md" class="border border-slate-200 mb-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Payment Summary</h2>
        <CheckoutPriceBreakdown :subtotal="order.unit_price" :tax="order.tax_amount" :total="order.total_amount" />
      </BaseCard>

      <!-- Meta -->
      <BaseCard shadow="sm" padding="md" class="border border-slate-200">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">Order Information</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">Order Date</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.created_at) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Payment Deadline</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.expires_at) }}</dd>
          </div>
          <div v-if="order.paid_at" class="flex justify-between">
            <dt class="text-slate-500">Payment Date</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.paid_at) }}</dd>
          </div>
          <div v-if="order.payment_method" class="flex justify-between">
            <dt class="text-slate-500">Payment Method</dt>
            <dd class="text-slate-800 uppercase">{{ order.payment_method.replace(/_/g, ' ') }}</dd>
          </div>
          <div v-if="order.cancelled_at" class="flex justify-between">
            <dt class="text-slate-500">Cancellation Date</dt>
            <dd class="text-slate-800">{{ formatDatetime(order.cancelled_at) }}</dd>
          </div>
          <div v-if="order.cancellation_reason" class="flex justify-between">
            <dt class="text-slate-500">Cancellation Reason</dt>
            <dd class="text-slate-800">{{ order.cancellation_reason }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Customer Name</dt>
            <dd class="text-slate-800">{{ order.student_full_name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Email</dt>
            <dd class="text-slate-800">{{ order.student_email }}</dd>
          </div>
          <div v-if="order.student_phone" class="flex justify-between">
            <dt class="text-slate-500">Phone</dt>
            <dd class="text-slate-800">{{ order.student_phone }}</dd>
          </div>
        </dl>
      </BaseCard>
    </div>

    <!-- Cancel confirm modal -->
    <BaseModal v-model="cancelOpen" title="Cancel Order?">
      <p class="text-sm text-slate-600 mb-4">
        Order <span class="font-mono font-semibold">{{ order?.order_number }}</span> will be cancelled and can no longer be paid. This action cannot be undone.
      </p>
      <BaseInput
        v-model="cancelReason"
        label="Reason (optional)"
        placeholder="e.g. Chose another course"
      />
      <div v-if="cancelError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {{ cancelError }}
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="cancelLoading" @click="cancelOpen = false">Close</BaseButton>
        <BaseButton variant="danger" :loading="cancelLoading" :disabled="cancelLoading" @click="confirmCancel">Cancel Order</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
