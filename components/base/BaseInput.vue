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
  <div class="flex flex-col gap-1">
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
        'w-full px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px]',
        error
          ? 'border-red-400 focus:ring-red-400 bg-red-50'
          : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 bg-white',
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur', $event)"
    />
    <p v-if="hint && !error" class="text-xs text-slate-500">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="text-xs text-red-600 flex items-center gap-1" role="alert">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>
  </div>
</template>
