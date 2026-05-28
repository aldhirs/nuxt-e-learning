<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Verifying Payment' })

const route = useRoute()
const router = useRouter()

const orderNumber = computed(() => route.query.order_number as string)
const pollCount = ref(0)
const maxPoll = 10
type State = 'checking' | 'paid' | 'pending'
const state = ref<State>('checking')

async function poll() {
  pollCount.value++
  await new Promise(r => setTimeout(r, 1500))

  // Dummy: after 2 polls, treat as paid
  if (pollCount.value >= 2) {
    state.value = 'paid'
    setTimeout(() => {
      router.push(orderNumber.value ? `/orders/${orderNumber.value}/payment/done` : '/orders')
    }, 3000)
    return
  }

  if (pollCount.value < maxPoll) {
    setTimeout(poll, 3000)
  } else {
    state.value = 'pending'
  }
}

onMounted(poll)
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <!-- Checking -->
      <template v-if="state === 'checking'">
        <BaseSpinner size="lg" class="mx-auto mb-4" />
        <h1 class="text-xl font-bold text-slate-800 mb-2">Verifying Payment</h1>
        <p class="text-slate-500 text-sm">Please wait, we are confirming your e-wallet payment...</p>
        <div class="mt-4 flex justify-center gap-1">
          <span
            v-for="i in maxPoll"
            :key="i"
            :class="['inline-block w-1.5 h-1.5 rounded-full transition-all', i <= pollCount ? 'bg-primary-500' : 'bg-slate-200']"
          />
        </div>
      </template>

      <!-- Paid -->
      <template v-else-if="state === 'paid'">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
        <p class="text-slate-500 text-sm mb-6">Your course is now active. Redirecting to order details...</p>
        <BaseSpinner size="sm" class="mx-auto" />
      </template>

      <!-- Still pending after max polls -->
      <template v-else-if="state === 'pending'">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Payment Being Processed</h1>
        <p class="text-slate-500 text-sm mb-6">
          Your payment has been received but is still being verified. Your course will activate automatically — we will send you a confirmation email.
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" :to="orderNumber ? `/orders/${orderNumber}` : '/orders'">
            View Order Status
          </BaseButton>
          <BaseButton variant="ghost" to="/">Back to Home</BaseButton>
        </div>
      </template>

    </div>
  </div>
</template>
