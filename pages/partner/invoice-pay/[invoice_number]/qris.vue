<script setup lang="ts">
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'
definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })

const route        = useRoute()
const router       = useRouter()
const paymentStore = usePartnerPaymentStore()
const subPayApi    = useSubscriptionPaymentApi()

const invoiceNumber = computed(() => route.params.invoice_number as string)
const session = computed(() => paymentStore.getSession(invoiceNumber.value))

useSeoMeta({ title: () => `Pay with QRIS — ${invoiceNumber.value}` })

onMounted(() => {
  if (session.value?.payment_method !== 'qris') navigateTo(`/partner/invoice-pay/${invoiceNumber.value}`)
})

const qrSrc = computed(() => {
  const s = session.value
  if (!s) return ''
  if (s.qr_url) return s.qr_url
  if (s.qr_string) return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(s.qr_string)}`
  return ''
})

// ── Polling ───────────────────────────────────────────────────────────────────
const POLL_MS = 10_000
let pollTimer: ReturnType<typeof setTimeout> | null = null
const showSuccess = ref(false)
const countdown   = ref(3)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() { if (pollTimer) clearTimeout(pollTimer); pollTimer = null }

function startRedirect() {
  showSuccess.value = true; countdown.value = 3
  paymentStore.clearSession(invoiceNumber.value)
  paymentStore.clearPending()
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      router.push(`/partner/invoice-pay/${invoiceNumber.value}/done`)
    }
  }, 1000)
}

async function checkStatus() {
  try {
    const snap = await subPayApi.getStatus(invoiceNumber.value)
    if (snap.status === 'paid') { stopPolling(); startRedirect(); return }
  } catch { /* retry */ }
  if (!showSuccess.value) pollTimer = setTimeout(checkStatus, POLL_MS)
}

onMounted(() => { pollTimer = setTimeout(checkStatus, POLL_MS) })
onBeforeUnmount(() => { stopPolling(); if (countdownTimer) clearInterval(countdownTimer) })

// ── Manual check ──────────────────────────────────────────────────────────────
const manualChecking = ref(false)
const stillPending   = ref(false)

async function manualCheck() {
  if (manualChecking.value) return
  manualChecking.value = true; stillPending.value = false
  try {
    const snap = await subPayApi.getStatus(invoiceNumber.value)
    if (snap.status === 'paid') { stopPolling(); startRedirect() }
    else { stillPending.value = true; setTimeout(() => { stillPending.value = false }, 4000) }
  } catch { stillPending.value = true; setTimeout(() => { stillPending.value = false }, 4000) }
  finally { manualChecking.value = false }
}
</script>

<template>
  <!-- Success overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 class="text-xl font-black text-slate-800 mb-1">Payment Successful!</h2>
          <p class="text-slate-500 text-sm">Invoice <span class="font-mono font-bold text-slate-700">{{ invoiceNumber }}</span></p>
          <p class="text-slate-400 text-xs mt-3">Redirecting in {{ countdown }} second(s)...</p>
          <div class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" :style="{ width: `${((3 - countdown) / 3) * 100}%` }" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="stillPending" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Payment not yet confirmed. Please wait a moment.
      </div>
    </Transition>
  </Teleport>

  <PartnerInvoicePaymentStepper :step="3" />
  <div v-if="session" class="max-w-sm mx-auto pb-10 px-4">
    <NuxtLink :to="`/partner/invoice-pay/${invoiceNumber}`" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors group mb-6">
      <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      Change payment method
    </NuxtLink>

    <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Pay with QRIS</h1>
    <p class="text-sm text-slate-500 mb-6 text-center font-mono">{{ invoiceNumber }}</p>

    <BaseCard shadow="md" padding="lg" class="border border-slate-200 mb-4 flex flex-col items-center gap-4">
      <div class="w-60 h-60 bg-white rounded-xl border-2 border-slate-200 flex items-center justify-center p-2">
        <img v-if="qrSrc" :src="qrSrc" alt="QR Code QRIS" class="w-full h-full object-contain" loading="lazy" />
        <div v-else class="text-slate-400 text-sm">QR Code</div>
      </div>
      <div class="text-center">
        <p class="text-xs text-slate-500">Invoice Total</p>
        <p class="text-2xl font-bold text-primary-600">Rp {{ session.invoice_amount.toLocaleString('id-ID') }}</p>
      </div>
    </BaseCard>

    <!-- Poll status -->
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-bold text-slate-700 flex items-center gap-2">
          Payment Status
          <span class="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </p>
        <p class="text-xs text-slate-400 mt-0.5">Auto-updates every 10 seconds</p>
      </div>
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Awaiting
      </span>
    </div>

    <!-- Instructions -->
    <div class="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-1.5">
      <p class="font-semibold text-slate-700 mb-2">How to pay:</p>
      <p>1. Open your e-wallet app (GoPay, OVO, DANA, LinkAja, etc.)</p>
      <p>2. Select <strong>Scan QR</strong> or <strong>QRIS</strong></p>
      <p>3. Point your camera at the QR code above</p>
      <p>4. Confirm the payment in your app</p>
    </div>

    <div class="space-y-2">
      <BaseButton variant="primary" size="lg" block :loading="manualChecking" :disabled="manualChecking" @click="manualCheck">
        <svg v-if="!manualChecking" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        {{ manualChecking ? 'Checking...' : "I've Already Paid" }}
      </BaseButton>
      <BaseButton variant="ghost" size="lg" block to="/partner/billing">Back to Billing</BaseButton>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 1rem); }
</style>
