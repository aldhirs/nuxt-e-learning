<script setup lang="ts">
import type { OrderStatus } from '~/types'

interface Props {
  status: OrderStatus
}

defineProps<Props>()

const statusMap: Record<OrderStatus, { label: string; severity: 'success' | 'warn' | 'danger' | 'info' | 'default' }> = {
  pending: { label: 'Menunggu Pembayaran', severity: 'warn' },
  paid: { label: 'Lunas', severity: 'success' },
  expired: { label: 'Kedaluwarsa', severity: 'danger' },
  cancelled: { label: 'Dibatalkan', severity: 'default' },
  refunded: { label: 'Dikembalikan', severity: 'info' }
}
</script>

<template>
  <BaseBadge :severity="statusMap[status].severity">{{ statusMap[status].label }}</BaseBadge>
</template>
