<script setup lang="ts">
import type { UsageCounter } from '~/types/partner'

const props = defineProps<{
  label: string
  usage: UsageCounter | undefined
}>()

const pct = computed(() => props.usage?.percent ?? 0)
const colorClass = computed(() => {
  if (!props.usage || props.usage.limit === -1) return 'bg-primary-500'
  if (pct.value >= 100) return 'bg-red-500'
  if (pct.value >= 80) return 'bg-amber-500'
  return 'bg-primary-500'
})
const limitLabel = computed(() => {
  if (!props.usage) return '—'
  if (props.usage.limit === -1) return 'Unlimited'
  return `${props.usage.current} / ${props.usage.limit}`
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-xs font-medium">
      <span class="text-slate-600">{{ label }}</span>
      <span :class="['font-semibold', pct >= 100 ? 'text-red-600' : 'text-slate-700']">
        {{ limitLabel }}
        <span v-if="usage?.limit === -1" class="font-normal text-slate-400">(unlimited)</span>
      </span>
    </div>
    <div v-if="usage && usage.limit !== -1" class="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        :class="['h-full rounded-full transition-all duration-500', colorClass]"
        :style="{ width: `${Math.min(pct, 100)}%` }"
        :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" role="progressbar"
      />
    </div>
    <p v-if="pct >= 100" class="text-xs text-red-600 font-medium">
      Limit reached — upgrade your plan to add more
    </p>
  </div>
</template>
