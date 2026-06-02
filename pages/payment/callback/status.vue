<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'

definePageMeta({ layout: 'minimal' })
useSeoMeta({ title: 'Verifying Payment' })

const route      = useRoute()
const router     = useRouter()
const paymentApi = usePaymentApi()

const orderNumber = computed(() => route.query.order_number as string)

const pollCount = ref(0)
const pollError = ref('')
const MAX_POLLS = 12          // 10s × 12 = 2 min
const POLL_INTERVAL_MS = 10_000

let pollTimer: ReturnType<typeof setTimeout> | null = null

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

async function tick() {
  if (!orderNumber.value) {
    await router.replace('/orders')
    return
  }

  pollError.value = ''
  pollCount.value++

  try {
    const snap = await paymentApi.getStatus(orderNumber.value)

    if (snap.payment_attempt_status === 'paid') {
      stopPolling()
      await router.replace(`/orders/${orderNumber.value}/payment/done`)
      return
    }
    if (snap.payment_attempt_status === 'failed') {
      stopPolling()
      await router.replace(`/orders/${orderNumber.value}/payment/failed`)
      return
    }
    // Order-level terminal states (expired/cancelled) — no point retrying
    if (snap.status === 'expired' || snap.status === 'cancelled') {
      stopPolling()
      await router.replace(`/orders/${orderNumber.value}`)
      return
    }
  } catch (err: unknown) {
    pollError.value = (err as { message?: string }).message || 'Failed to check status.'
  }

  if (pollCount.value >= MAX_POLLS) {
    stopPolling()
    await router.replace(`/orders/${orderNumber.value}`)
    return
  }

  pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
}

onMounted(tick)
onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Animated ring -->
      <div class="w-20 h-20 mx-auto mb-6 relative">
        <div class="w-full h-full rounded-full border-4 border-slate-100"></div>
        <div class="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <svg class="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>

      <h1 class="text-xl font-bold text-slate-800 mb-2">Verifying Payment</h1>
      <p class="text-slate-500 text-sm mb-4">Please wait while we confirm your payment...</p>

      <p v-if="pollError" class="text-xs text-red-600 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {{ pollError }}
      </p>

      <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
        <span class="animate-spin w-3 h-3 border-2 border-primary-300 border-t-transparent rounded-full" aria-hidden="true"></span>
        Checking {{ pollCount }} / {{ MAX_POLLS }}
      </div>

    </div>
  </div>
</template>
