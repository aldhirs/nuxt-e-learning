<script setup lang="ts">
const { toasts } = useToast()

const iconPath: Record<string, string> = {
  success: 'M5 13l4 4L19 7',
  error:   'M6 18L18 6M6 6l12 12',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const colorClass: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColorClass: Record<string, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  info:    'text-blue-500',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['flex items-start gap-3 min-w-64 max-w-sm w-auto px-4 py-3.5 rounded-2xl border shadow-lg pointer-events-auto', colorClass[t.type]]"
          role="alert"
        >
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" :class="iconColorClass[t.type]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="iconPath[t.type]" />
          </svg>
          <p class="text-sm font-medium leading-snug">{{ t.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from   { opacity: 0; transform: translateX(1rem) scale(0.97); }
.toast-leave-to     { opacity: 0; transform: translateX(1rem) scale(0.97); }
.toast-move         { transition: transform 0.25s ease; }
</style>
