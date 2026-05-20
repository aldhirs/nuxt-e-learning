<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  block: false
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-400',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
  outline: 'bg-transparent border border-primary-500 text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-400'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md min-h-[36px]',
  md: 'px-4 py-2 text-base rounded-md min-h-[44px]',
  lg: 'px-6 py-3 text-lg rounded-lg min-h-[52px]'
}

const baseClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.block ? 'w-full' : '',
  (props.disabled || props.loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="baseClasses" @click="emit('click', $event)">
    <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
    <slot />
  </NuxtLink>
  <a v-else-if="href" :href="href" target="_blank" rel="noopener" :class="baseClasses" @click="emit('click', $event)">
    <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
    <slot />
  </a>
  <button v-else :type="type" :disabled="disabled || loading" :class="baseClasses" :aria-disabled="disabled || loading" @click="emit('click', $event)">
    <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
    <slot />
  </button>
</template>
