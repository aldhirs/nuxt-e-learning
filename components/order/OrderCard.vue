<script setup lang="ts">
import type { OrderListItem } from '~/types'

interface Props {
  order: OrderListItem
}

const props = defineProps<Props>()
const { formatCurrency, formatDate } = useFormatters()

const statusConfig: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  pending:   { label: 'Awaiting Payment', dotClass: 'bg-amber-400',   badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:      { label: 'Paid',             dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired:   { label: 'Expired',          dotClass: 'bg-red-400',     badgeClass: 'bg-red-50 text-red-600 border-red-200' },
  cancelled: { label: 'Cancelled',        dotClass: 'bg-slate-400',   badgeClass: 'bg-slate-50 text-slate-600 border-slate-200' },
  refunded:  { label: 'Refunded',         dotClass: 'bg-blue-400',    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' }
}

const statusInfo = computed(() =>
  statusConfig[props.order.status] ?? { label: props.order.status, dotClass: 'bg-slate-400', badgeClass: 'bg-slate-50 text-slate-600 border-slate-200' }
)

// Context-sensitive action button
const action = computed(() => {
  const o = props.order
  const detailTo = `/orders/${o.order_number}`
  switch (o.status) {
    case 'pending': {
      const m = o.payment_method
      let to = `/orders/${o.order_number}/payment`
      if (m?.startsWith('va_'))           to = `/orders/${o.order_number}/payment/va`
      else if (m === 'qris')              to = `/orders/${o.order_number}/payment/qris`
      else if (m?.startsWith('ewallet_')) to = `/orders/${o.order_number}/payment/ewallet`
      return { label: 'Pay Now', to, primary: true }
    }
    case 'paid':
      return o.course?.slug
        ? { label: 'Start Learning', to: `/courses/${o.course.slug}`, primary: true }
        : { label: 'View Details', to: detailTo, primary: false }
    case 'expired':
      return o.course?.slug
        ? { label: 'Buy Again', to: `/checkout?course=${o.course.slug}`, primary: false }
        : { label: 'View Details', to: detailTo, primary: false }
    default:
      return { label: 'View Details', to: detailTo, primary: false }
  }
})

const courseTitle = computed(() =>
  props.order.course?.title ?? `Course #${props.order.course_id}`
)
</script>

<template>
  <div class="group bg-white rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-[0_8px_30px_rgba(47,126,208,0.10)] transition-all duration-300 overflow-hidden">
    <div class="flex">

      <!-- Thumbnail -->
      <NuxtLink
        :to="`/orders/${order.order_number}`"
        class="relative flex-shrink-0 w-28 sm:w-36 overflow-hidden bg-slate-100"
        tabindex="-1"
        aria-hidden="true"
      >
        <BaseImage
          type="course"
          :src="order.course?.thumbnail_url"
          :alt="courseTitle"
          img-class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <!-- Pending pulse indicator -->
        <div v-if="order.status === 'pending'" class="absolute top-2 left-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        </div>
      </NuxtLink>

      <!-- Content -->
      <div class="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">

        <!-- Top row -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-400 font-mono mb-1 tracking-wide">
              {{ order.order_number }}
            </p>
            <NuxtLink
              :to="`/orders/${order.order_number}`"
              class="block font-bold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2 hover:text-primary-600 transition-colors"
            >
              {{ courseTitle }}
            </NuxtLink>
            <p class="text-xs text-slate-400 mt-1">DrillSpace E-Learning</p>
          </div>

          <!-- Status badge -->
          <span
            :class="['flex-shrink-0 inline-flex items-center gap-1.5 border text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', statusInfo.badgeClass]"
          >
            <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', statusInfo.dotClass]" aria-hidden="true"></span>
            {{ statusInfo.label }}
          </span>
        </div>

        <!-- Bottom row: amount + date + action -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p class="text-base sm:text-lg font-black tabular-nums" :class="order.total_amount === 0 ? 'text-emerald-600' : 'text-primary-600'">
              {{ order.total_amount === 0 ? 'Free' : formatCurrency(order.total_amount) }}
            </p>
            <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(order.created_at) }}</p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Secondary: always show "View Details" when primary action goes elsewhere -->
            <NuxtLink
              v-if="action.to !== `/orders/${order.order_number}`"
              :to="`/orders/${order.order_number}`"
              class="text-xs font-semibold text-slate-400 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              View Details
            </NuxtLink>

            <!-- Primary action -->
            <NuxtLink
              :to="action.to"
              :class="[
                'inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95',
                action.primary
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-[0_0_0_3px_#bcd9fc]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              ]"
            >
              <svg v-if="action.primary && order.status === 'pending'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <svg v-else-if="action.primary && order.status === 'paid'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
