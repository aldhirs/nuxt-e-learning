<script setup lang="ts">
interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number | null
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Pilih...'
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const selectId = computed(() => props.id || `select-${Math.random().toString(36).slice(2, 8)}`)
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="selectId" class="text-sm font-medium text-slate-700">{{ label }}</label>
    <select
      :id="selectId"
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'w-full px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] appearance-none bg-white bg-[url(\'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23374151%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E\')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-9',
        error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-primary-500',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="text-xs text-red-600" role="alert">{{ error }}</p>
  </div>
</template>
