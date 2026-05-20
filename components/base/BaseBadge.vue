<script setup lang="ts">
interface Props {
  label: string
  severity?: 'success' | 'warn' | 'danger' | 'info' | 'default' | 'primary'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  severity: 'default',
  size: 'sm'
})

const severityClasses: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  warn: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-100 text-primary-800'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm'
}
</script>

<template>
  <span
    :class="['inline-flex items-center font-medium rounded-full', severityClasses[severity], sizeClasses[size]]"
    :aria-label="label"
  >
    {{ label }}
  </span>
</template>
