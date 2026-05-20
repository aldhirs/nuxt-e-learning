<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}
const props = withDefaults(defineProps<Props>(), { size: 'md', color: 'text-primary-500' })
const sizeClasses = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' }
</script>
<template>
  <span
    :class="['inline-block rounded-full border-current border-t-transparent animate-spin', sizeClasses[size], color]"
    role="status"
    aria-label="Memuat..."
  />
</template>
