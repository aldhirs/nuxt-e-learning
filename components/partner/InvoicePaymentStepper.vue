<script setup lang="ts">
const props = defineProps<{ step: 1 | 2 | 3 | 4 }>()

const steps = ['Invoice', 'Payment Method', 'Payment', 'Done']

function stepState(index: number): 'done' | 'active' | 'pending' {
  const n = index + 1
  if (n < props.step) return 'done'
  if (n === props.step) return 'active'
  return 'pending'
}
</script>

<template>
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <template v-for="(label, i) in steps" :key="label">
          <!-- Connector (before each step except first) -->
          <div
            v-if="i > 0"
            :class="['h-0.5 w-10 mx-1', stepState(i) === 'pending' ? 'bg-slate-200' : stepState(i) === 'active' ? 'bg-primary-500' : 'bg-emerald-500']"
          />

          <!-- Step circle -->
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
              stepState(i) === 'done'    ? 'bg-emerald-500 text-white' :
              stepState(i) === 'active'  ? 'bg-primary-500 text-white' :
                                           'bg-slate-200 text-slate-400'
            ]"
          >
            <svg v-if="stepState(i) === 'done'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>

          <!-- Step label -->
          <span
            :class="[
              'hidden sm:block text-xs font-medium mx-1',
              stepState(i) === 'done'   ? 'text-emerald-600' :
              stepState(i) === 'active' ? 'text-primary-600' :
                                          'text-slate-400'
            ]"
          >
            {{ label }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
