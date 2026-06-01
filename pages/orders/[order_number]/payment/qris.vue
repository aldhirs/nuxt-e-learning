<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { usePaymentStore } from '~/stores/payment'
import type { PaymentSessionQRIS } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()
const paymentStore = usePaymentStore()
const paymentApi = usePaymentApi()

const orderNumber = computed(() => route.params.order_number as string)
const order = useOrder(orderNumber)

const session = computed<PaymentSessionQRIS | null>(() => {
  const s = paymentStore.getSession(orderNumber.value)
  return s && s.payment_method === 'qris' ? (s as PaymentSessionQRIS) : null
})

useSeoMeta({ title: () => `QRIS — ${orderNumber.value}` })

// QR image: prefer server-rendered url, fall back to goQR.me public API
const qrImageSrc = computed(() => {
  const s = session.value
  if (!s) return ''
  if (s.qr_image_url) return s.qr_image_url
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(s.qr_content)}`
})

// ── Polling ───────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 10_000
let pollTimer: ReturnType<typeof setTimeout> | null = null

const showSuccessOverlay = ref(false)
const redirectCountdown  = ref(3)
let redirectTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

function startRedirect() {
  showSuccessOverlay.value = true
  redirectCountdown.value  = 3
  redirectTimer = setInterval(() => {
    redirectCountdown.value--
    if (redirectCountdown.value <= 0) {
      if (redirectTimer) clearInterval(redirectTimer)
      router.push(`/orders/${orderNumber.value}/payment/done`)
    }
  }, 1000)
}

async function checkStatus() {
  try {
    const snap = await paymentApi.getStatus(orderNumber.value)
    if (snap.status === 'paid') {
      stopPolling()
      paymentStore.clearSession(orderNumber.value)
      startRedirect()
      return
    }
  } catch {
    // Non-fatal — retry next tick
  }
  if (!showSuccessOverlay.value) {
    pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS)
  }
}

const isExpiredQris = computed(() => {
  const s = session.value
  if (!s?.expires_at) return false
  return new Date(s.expires_at).getTime() < Date.now()
})

const { showConfirmModal, isChanging, openConfirmModal, closeConfirmModal, confirmChange } = useChangePaymentMethod(
  { type: 'order', orderNumber: orderNumber.value, methodSelectionPath: `/orders/${orderNumber.value}/payment` },
  { isPaid: computed(() => showSuccessOverlay.value), isExpired: isExpiredQris }
)

onMounted(() => {
  pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  stopPolling()
  if (redirectTimer) clearInterval(redirectTimer)
})

// ── Manual "I've Already Paid" check ──────────────────────────────────────
const manualChecking = ref(false)
const manualResult   = ref<'' | 'pending' | 'paid'>('')

async function manualCheck() {
  if (manualChecking.value) return
  manualChecking.value = true
  manualResult.value   = ''
  try {
    const snap = await paymentApi.getStatus(orderNumber.value)
    if (snap.status === 'paid') {
      stopPolling()
      paymentStore.clearSession(orderNumber.value)
      startRedirect()
    } else {
      manualResult.value = 'pending'
      setTimeout(() => { manualResult.value = '' }, 4000)
    }
  } catch {
    manualResult.value = 'pending'
    setTimeout(() => { manualResult.value = '' }, 4000)
  } finally {
    manualChecking.value = false
  }
}
</script>

<template>
  <!-- Success overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showSuccessOverlay"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        aria-live="assertive"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-black text-slate-800 mb-2">Payment Successful!</h2>
          <p class="text-slate-500 text-sm mb-1">Order <span class="font-mono font-bold text-slate-700">{{ orderNumber }}</span></p>
          <p class="text-slate-400 text-xs mt-3">Redirecting in {{ redirectCountdown }} seconds...</p>
          <div class="mt-4">
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                :style="{ width: `${((3 - redirectCountdown) / 3) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast: still pending after manual check -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="manualResult === 'pending'"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2"
        role="status"
      >
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Payment not yet confirmed. Please wait a moment.
      </div>
    </Transition>
  </Teleport>

  <!-- Empty states -->
  <div v-if="!order" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Order not found"
      description="Please go back and start again from the payment method selection."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <div v-else-if="!session" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="QRIS session not found"
      description="Please select a payment method first."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <!-- QRIS payment page -->
  <div v-else class="max-w-sm mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      @click="openConfirmModal"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Change method
    </button>

    <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Pay with QRIS</h1>
    <p class="text-sm text-slate-500 mb-6 text-center">Order <span class="font-mono font-semibold">{{ order.order_number }}</span></p>

    <!-- QR card -->
    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-4 flex flex-col items-center gap-4">
      <div class="w-60 h-60 bg-white rounded-xl border-2 border-slate-200 flex items-center justify-center p-2">
        <img :src="qrImageSrc" alt="QR code for payment" class="w-full h-full object-contain" loading="lazy" />
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500">Total Amount</p>
        <p class="text-2xl font-bold text-primary-600">{{ formatCurrency(session.amount) }}</p>
      </div>

      <div class="text-center">
        <p class="text-xs text-slate-500 mb-1">QR valid for</p>
        <OrderCountdownTimer :expires-at="session.expires_at" />
      </div>
    </BaseCard>

    <!-- Auto-poll status indicator -->
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-slate-700 flex items-center gap-2">
          Payment Status
          <span class="animate-spin w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full" aria-hidden="true"></span>
        </p>
        <p class="text-xs text-slate-400 mt-0.5">Status automatically updated every 10 seconds</p>
      </div>
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex-shrink-0">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Awaiting Payment
      </span>
    </div>

    <!-- Instructions -->
    <div class="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-1.5">
      <p class="font-semibold text-slate-700 mb-2">How to pay:</p>
      <template v-if="session.instructions?.length">
        <p v-for="(step, i) in session.instructions" :key="i">{{ i + 1 }}. {{ step }}</p>
      </template>
      <template v-else>
        <p>1. Open your e-wallet app (GoPay, OVO, DANA, LinkAja, etc.)</p>
        <p>2. Select <strong>Scan QR</strong> or <strong>QRIS</strong> menu</p>
        <p>3. Point your camera at the QR code above</p>
        <p>4. Confirm the payment in your app</p>
      </template>
    </div>

    <!-- Actions -->
    <div class="space-y-2">
      <BaseButton
        variant="primary"
        size="lg"
        block
        :loading="manualChecking"
        :disabled="manualChecking"
        @click="manualCheck"
      >
        <svg v-if="!manualChecking" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ manualChecking ? 'Checking...' : "I've Already Paid" }}
      </BaseButton>
      <BaseButton
        variant="secondary"
        size="lg"
        block
        :loading="isChanging"
        :disabled="isChanging"
        @click="openConfirmModal"
      >
        Change Payment Method
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block :to="`/orders/${orderNumber}`">
        Back to Order Details
      </BaseButton>
    </div>
  </div>

  <!-- Change Payment Method Confirmation Modal -->
  <BaseModal v-model="showConfirmModal" title="Change Payment Method?" size="sm" @close="closeConfirmModal">
    <p class="text-sm text-slate-600">The QR code that was generated will expire and can no longer be scanned for payment.</p>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton variant="ghost" size="sm" :disabled="isChanging" @click="closeConfirmModal">Cancel</BaseButton>
        <BaseButton variant="primary" size="sm" :loading="isChanging" @click="confirmChange">Yes, Change Method</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
</style>
