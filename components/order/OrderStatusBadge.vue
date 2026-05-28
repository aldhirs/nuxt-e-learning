<script setup lang="ts">
import type { OrderStatus } from '~/types'

interface Props {
  status: OrderStatus
}

defineProps<Props>()

const statusMap: Record<OrderStatus, { label: string; severity: 'success' | 'warn' | 'danger' | 'info' | 'default' }> = {
  pending:   { label: 'Awaiting Payment', severity: 'warn' },
  paid:      { label: 'Paid',             severity: 'success' },
  expired:   { label: 'Expired',          severity: 'danger' },
  cancelled: { label: 'Cancelled',        severity: 'default' },
  refunded:  { label: 'Refunded',         severity: 'info' }
}
</script>

<template>
  <BaseBadge :severity="statusMap[status].severity">{{ statusMap[status].label }}</BaseBadge>
</template>
