<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  hover: false,
  shadow: 'sm',
  border: true
})

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6'
}

const shadowClasses: Record<string, string> = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
}

const classes = computed(() => [
  'bg-white rounded-lg transition-all duration-200',
  paddingClasses[props.padding],
  shadowClasses[props.shadow],
  props.border ? 'border border-slate-100' : '',
  props.hover ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''
])
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
