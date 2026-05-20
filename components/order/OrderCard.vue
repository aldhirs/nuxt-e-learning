<script setup lang="ts">
import type { OrderListItem } from '~/types'

interface Props {
  order: OrderListItem
}

defineProps<Props>()

const { formatCurrency, formatDate } = useFormatters()
</script>

<template>
  <NuxtLink :to="`/orders/${order.order_number}`" class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl">
    <BaseCard hover shadow="sm" padding="md" class="flex flex-col sm:flex-row gap-4">
      <!-- Thumbnail -->
      <div class="w-full sm:w-24 h-32 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
        <img
          v-if="order.course.thumbnail_url"
          :src="order.course.thumbnail_url"
          :alt="order.course.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-primary-50">
          <svg class="w-8 h-8 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p class="text-xs text-slate-500 font-mono">{{ order.order_number }}</p>
            <h3 class="font-semibold text-slate-800 text-sm leading-snug mt-0.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {{ order.course.title }}
            </h3>
          </div>
          <OrderStatusBadge :status="order.status" />
        </div>

        <div class="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div>
            <span v-if="order.total_amount === 0" class="text-sm font-bold text-green-600">Gratis</span>
            <span v-else class="text-sm font-bold text-primary-600">{{ formatCurrency(order.total_amount) }}</span>
          </div>
          <p class="text-xs text-slate-400">{{ formatDate(order.created_at) }}</p>
        </div>
      </div>
    </BaseCard>
  </NuxtLink>
</template>
