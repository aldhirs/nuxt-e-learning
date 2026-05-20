<script setup lang="ts">
interface Props {
  type?: 'rect' | 'circle' | 'text'
  width?: string
  height?: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), { type: 'rect', width: 'w-full', height: 'h-4', count: 1 })
</script>
<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="i in count"
      :key="i"
      :class="[
        'skeleton-shimmer',
        props.type === 'circle' ? 'rounded-full' : 'rounded-md',
        width,
        height
      ]"
      aria-hidden="true"
    />
  </div>
</template>
