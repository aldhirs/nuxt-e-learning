<script setup lang="ts">
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'

definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })
useSeoMeta({ title: 'Verifying Subscription Payment' })

const route  = useRoute()
const router = useRouter()
const subPayApi = useSubscriptionPaymentApi()
const partnerPaymentStore = usePartnerPaymentStore()

const invoiceNumber = computed(() => route.query.invoice_number as string)

const pollCount = ref(0)
const maxPoll   = 10
type State = 'checking' | 'paid' | 'pending'
const state = ref<State>('checking')

async function poll() {
  if (!invoiceNumber.value) {
    state.value = 'pending'
    return
  }

  pollCount.value++
  await new Promise(r => setTimeout(r, 1500))

  try {
    const snap = await subPayApi.getStatus(invoiceNumber.value)
    if (snap.status === 'paid') {
      // Clear any lingering local session
      partnerPaymentStore.clearSession(invoiceNumber.value)
      state.value = 'paid'
      setTimeout(() => {
        router.push(`/partner/invoice-pay/${invoiceNumber.value}/done`)
      }, 3000)
      return
    }
  } catch {
    // Non-fatal — retry next tick
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
        <p class="text-slate-500 text-sm">Please wait, we are confirming your subscription payment...</p>
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
        <p class="text-slate-500 text-sm mb-6">Your subscription has been activated. Redirecting...</p>
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
          Your payment has been received but is still being verified. Your subscription will activate automatically — we will send a confirmation email.
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/partner/billing">View Billing</BaseButton>
          <BaseButton variant="ghost" to="/partner/dashboard">Go to Dashboard</BaseButton>
        </div>
      </template>

    </div>
  </div>
</template>
