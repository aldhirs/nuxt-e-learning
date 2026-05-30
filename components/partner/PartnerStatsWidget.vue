<script setup lang="ts">
defineProps<{
  label: string
  value: string | number | null
  sub?: string
  loading?: boolean
  highlight?: 'warning' | 'error' | null
}>()
</script>

<template>
  <div :class="['bg-white rounded-2xl border p-5 space-y-1', highlight === 'error' ? 'border-red-200' : highlight === 'warning' ? 'border-amber-200' : 'border-slate-100']">
    <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ label }}</p>
    <template v-if="loading">
      <div class="h-7 w-24 bg-slate-200 rounded animate-pulse" />
      <div class="h-4 w-16 bg-slate-100 rounded animate-pulse" />
    </template>
    <template v-else>
      <p :class="['text-2xl font-bold', highlight === 'error' ? 'text-red-600' : highlight === 'warning' ? 'text-amber-600' : 'text-slate-900']">
        {{ value ?? '—' }}
      </p>
      <p v-if="sub" class="text-xs text-slate-500">{{ sub }}</p>
    </template>
  </div>
</template>
