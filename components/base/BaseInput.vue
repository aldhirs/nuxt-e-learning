<script setup lang="ts">
interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [e: FocusEvent]
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 8)}`)
const errorId = computed(() => `${inputId.value}-error`)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      :class="[
        'w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 min-h-[44px] bg-white',
        error
          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-400'
          : 'border-slate-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500',
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur', $event)"
    />
    <p v-if="hint && !error" class="text-xs text-slate-400">{{ hint }}</p>
    <Transition name="fade-error">
      <p v-if="error" :id="errorId" class="text-xs text-red-500 flex items-center gap-1" role="alert">
        <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-error-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-error-enter-from   { opacity: 0; transform: translateY(-4px); }
</style>
