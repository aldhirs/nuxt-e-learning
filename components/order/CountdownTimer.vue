<script setup lang="ts">
interface Props {
  expiresAt: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ expired: [] }>()

const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 })
const isExpired = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function compute() {
  const diff = new Date(props.expiresAt).getTime() - Date.now()
  if (diff <= 0) {
    isExpired.value = true
    timeLeft.value = { hours: 0, minutes: 0, seconds: 0 }
    if (timer) clearInterval(timer)
    emit('expired')
    return
  }
  const totalSec = Math.floor(diff / 1000)
  timeLeft.value = {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

onMounted(() => {
  compute()
  timer = setInterval(compute, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div>
    <div v-if="isExpired" class="flex items-center gap-2 text-red-600 font-semibold text-sm">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Waktu pembayaran habis
    </div>
    <div v-else class="flex items-center gap-2">
      <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="font-mono font-bold text-amber-600 text-lg tracking-widest">
        {{ pad(timeLeft.hours) }}:{{ pad(timeLeft.minutes) }}:{{ pad(timeLeft.seconds) }}
      </span>
    </div>
  </div>
</template>
