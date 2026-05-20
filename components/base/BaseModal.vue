<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  closable?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  confirm: []
}>()

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
}

function close() {
  if (props.closable) {
    emit('update:modelValue', false)
    emit('close')
  }
}

// Trap focus and close on Escape
onMounted(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue && props.closable) close()
  }
  window.addEventListener('keydown', handleKey)
  onUnmounted(() => window.removeEventListener('keydown', handleKey))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close" aria-hidden="true" />

        <!-- Panel -->
        <div :class="['relative bg-white rounded-xl shadow-xl w-full', sizeClasses[size]]">
          <!-- Header -->
          <div v-if="title || closable" class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 v-if="title" id="modal-title" class="text-lg font-semibold text-slate-800">{{ title }}</h2>
            <button
              v-if="closable"
              type="button"
              class="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tutup modal"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform 0.2s ease; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.95); }
</style>
