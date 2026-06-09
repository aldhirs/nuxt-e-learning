<script setup lang="ts">
interface Props {
  modelValue: string  // YYYY-MM-DD or ''
  label?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  max?: string  // YYYY-MM-DD
  min?: string  // YYYY-MM-DD
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const inputId = computed(() => props.id || `dp-${Math.random().toString(36).slice(2, 8)}`)
const errorId = computed(() => `${inputId.value}-error`)

// ── Calendar state ────────────────────────────────────────────────────────────
const open = ref(false)
const root = ref<HTMLElement | null>(null)

// Parse modelValue → { year, month (0-based), day }
function parseValue(v: string) {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

const parsed = computed(() => parseValue(props.modelValue))

// Displayed month/year in the calendar — default to selected or today
const now = new Date()
const viewYear = ref(parsed.value?.year ?? now.getFullYear() - 25)
const viewMonth = ref(parsed.value?.month ?? now.getMonth())

// When picker opens, sync view to current value
watch(open, (v) => {
  if (v) {
    viewYear.value = parsed.value?.year ?? now.getFullYear() - 25
    viewMonth.value = parsed.value?.month ?? now.getMonth()
  }
})

// ── Year picker mode ──────────────────────────────────────────────────────────
const yearPickerMode = ref(false)
const yearRangeBase = ref(Math.floor((parsed.value?.year ?? now.getFullYear() - 25) / 12) * 12)

function openYearPicker() {
  yearRangeBase.value = Math.floor(viewYear.value / 12) * 12
  yearPickerMode.value = true
}

const yearGrid = computed(() => Array.from({ length: 12 }, (_, i) => yearRangeBase.value + i))

function selectYear(y: number) {
  viewYear.value = y
  yearPickerMode.value = false
}

// ── Calendar grid ─────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells: Array<{ day: number | null; date: string | null }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date: dateStr })
  }
  return cells
})

function isSelected(dateStr: string | null) {
  return !!dateStr && dateStr === props.modelValue
}

function isDisabled(dateStr: string | null) {
  if (!dateStr) return true
  if (props.max && dateStr > props.max) return true
  if (props.min && dateStr < props.min) return true
  return false
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  const t = now
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  return dateStr === todayStr
}

function selectDate(dateStr: string | null) {
  if (!dateStr || isDisabled(dateStr)) return
  emit('update:modelValue', dateStr)
  open.value = false
  emit('blur')
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

// ── Display text ──────────────────────────────────────────────────────────────
const displayValue = computed(() => {
  if (!parsed.value) return ''
  const { year, month, day } = parsed.value
  return `${MONTHS[month]} ${day}, ${year}`
})

// ── Close on outside click ────────────────────────────────────────────────────
function onOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false
    emit('blur')
  }
}

onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
  <div ref="root" class="flex flex-col gap-1.5 relative">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-slate-700">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
    </label>

    <!-- Trigger -->
    <button
      :id="inputId"
      type="button"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-haspopup="'dialog'"
      :aria-invalid="!!error"
      :aria-describedby="error ? errorId : undefined"
      :class="[
        'w-full px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 focus:outline-none focus:ring-2 min-h-[44px] bg-white flex items-center justify-between gap-2',
        error
          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-400'
          : 'border-slate-200 focus:ring-2 focus:ring-primary-100 focus:border-primary-500',
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer',
      ]"
      @click="open = !open"
    >
      <span :class="displayValue ? 'text-slate-800' : 'text-slate-400'">
        {{ displayValue || 'Select date' }}
      </span>
      <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>

    <!-- Calendar popover -->
    <Transition name="dp-fade">
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-label="label || 'Date picker'"
        class="absolute top-full left-0 z-50 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
      >
        <!-- Year picker grid -->
        <div v-if="yearPickerMode" class="p-3">
          <div class="flex items-center justify-between mb-3">
            <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" @click="yearRangeBase -= 12">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span class="text-sm font-semibold text-slate-700">{{ yearRangeBase }} – {{ yearRangeBase + 11 }}</span>
            <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" @click="yearRangeBase += 12">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1">
            <button
              v-for="y in yearGrid"
              :key="y"
              type="button"
              :class="[
                'py-2 rounded-lg text-sm font-medium transition-colors',
                y === viewYear ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-700'
              ]"
              @click="selectYear(y)"
            >
              {{ y }}
            </button>
          </div>
        </div>

        <!-- Month/day calendar -->
        <template v-else>
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Previous month" @click="prevMonth">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              class="text-sm font-semibold text-slate-700 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
              @click="openYearPicker"
            >
              {{ MONTHS[viewMonth] }} {{ viewYear }}
            </button>
            <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Next month" @click="nextMonth">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <!-- Day grid -->
          <div class="p-3">
            <div class="grid grid-cols-7 mb-1">
              <span
                v-for="d in DAYS_SHORT"
                :key="d"
                class="text-center text-xs font-medium text-slate-400 py-1"
              >{{ d }}</span>
            </div>
            <div class="grid grid-cols-7 gap-0.5">
              <div v-for="(cell, i) in calendarDays" :key="i">
                <button
                  v-if="cell.day"
                  type="button"
                  :disabled="isDisabled(cell.date)"
                  :aria-label="`${MONTHS[viewMonth]} ${cell.day}, ${viewYear}`"
                  :aria-pressed="isSelected(cell.date)"
                  :class="[
                    'w-full aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center',
                    isSelected(cell.date)
                      ? 'bg-primary-600 text-white'
                      : isDisabled(cell.date)
                        ? 'text-slate-300 cursor-not-allowed'
                        : isToday(cell.date)
                          ? 'ring-1 ring-primary-400 text-primary-700 hover:bg-primary-50'
                          : 'text-slate-700 hover:bg-slate-100',
                  ]"
                  @click="selectDate(cell.date)"
                >
                  {{ cell.day }}
                </button>
              </div>
            </div>
          </div>

          <!-- Clear -->
          <div v-if="modelValue" class="px-4 pb-3">
            <button
              type="button"
              class="w-full text-xs text-slate-400 hover:text-red-500 transition-colors py-1"
              @click="emit('update:modelValue', ''); open = false; emit('blur')"
            >
              Clear date
            </button>
          </div>
        </template>
      </div>
    </Transition>

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
.dp-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dp-fade-enter-from   { opacity: 0; transform: translateY(-6px); }
.dp-fade-leave-active { transition: opacity 0.1s ease; }
.dp-fade-leave-to     { opacity: 0; }

.fade-error-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-error-enter-from   { opacity: 0; transform: translateY(-4px); }
</style>
