<script setup lang="ts">
import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { usePaymentStore } from '~/stores/payment'

definePageMeta({ layout: 'minimal', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useFormatters()
const paymentStore = usePaymentStore()
const paymentApi = usePaymentApi()
const ordersApi = useOrdersApi()

const orderNumber = computed(() => route.params.order_number as string)

// Fix blank page: fetch order directly instead of relying on store hydration
const { data: order, pending: orderPending } = await useAsyncData(
  () => `va-page-order:${orderNumber.value}`,
  () => ordersApi.getMyOrder(orderNumber.value).catch((e: { status?: number }) => {
    if (e.status === 404) return null
    throw e
  }),
  { watch: [orderNumber] }
)

// Raw session from store (fallback when fresh page load happens after store setSession)
const rawSession = computed(() => paymentStore.getSession(orderNumber.value))

const bankNameMap: Record<string, string> = {
  va_bca: 'BCA', va_mandiri: 'Mandiri', va_bri: 'BRI', va_bni: 'BNI',
  va_cimb: 'CIMB', va_bsi: 'BSI', va_permata: 'Permata', va_danamon: 'Danamon'
}

const bankColorMap: Record<string, string> = {
  va_bca: 'bg-blue-600',
  va_mandiri: 'bg-amber-500',
  va_bri: 'bg-blue-800',
  va_bni: 'bg-orange-500'
}

// Derive all VA fields: prefer live order data, fall back to store session
const paymentMethod = computed(() =>
  order.value?.payment_method
  || (rawSession.value?.payment_method as string)
  || ''
)

const bankLabel = computed(() =>
  bankNameMap[paymentMethod.value] || paymentMethod.value?.replace('va_', '').toUpperCase() || '—'
)

const bankColorClass = computed(() =>
  bankColorMap[paymentMethod.value] || 'bg-primary-600'
)

// VA number: from order.payment_reference (BE returns this from initiate)
// or from stored session virtual_account_number as fallback
const vaNumber = computed(() =>
  order.value?.payment_reference
  || (rawSession.value as Record<string, unknown> | null)?.virtual_account_number as string
  || (rawSession.value as Record<string, unknown> | null)?.payment_reference as string
  || '—'
)

const vaAmount = computed(() =>
  order.value?.total_amount
  || (rawSession.value as Record<string, unknown> | null)?.amount as number
  || 0
)

const vaExpiresAt = computed(() =>
  order.value?.expires_at
  || (rawSession.value as Record<string, unknown> | null)?.expires_at as string
  || ''
)

const isExpired = computed(() => {
  if (!vaExpiresAt.value) return false
  return new Date(vaExpiresAt.value).getTime() < Date.now()
})

const hasVaData = computed(() => {
  if (!order.value && !rawSession.value) return false
  // Has VA data if order has payment_method starting with va_ and has payment_reference
  if (order.value?.payment_method?.startsWith('va_') && order.value?.payment_reference) return true
  // Or if store has a VA session
  if (rawSession.value?.payment_method?.startsWith('va_')) return true
  return false
})

useSeoMeta({ title: () => `${bankLabel.value} Virtual Account — ${orderNumber.value}` })

// Copy VA number
const copied = ref(false)
async function copyVA() {
  const num = vaNumber.value
  if (!num || num === '—') return
  try {
    await navigator.clipboard.writeText(num)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch { /* clipboard denied */ }
}

// --- Polling ---
const POLL_INTERVAL_MS = 10_000
let pollTimer: ReturnType<typeof setTimeout> | null = null

// Payment success overlay state
const showSuccessOverlay = ref(false)
const redirectCountdown = ref(3)
let redirectTimer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

async function checkStatus() {
  try {
    const snap = await paymentApi.getStatus(orderNumber.value)
    if (snap.status === 'paid') {
      stopPolling()
      paymentStore.clearSession(orderNumber.value)
      showSuccessOverlay.value = true
      redirectCountdown.value = 3
      redirectTimer = setInterval(() => {
        redirectCountdown.value--
        if (redirectCountdown.value <= 0) {
          if (redirectTimer) clearInterval(redirectTimer)
          router.push(`/orders/${orderNumber.value}/payment/done`)
        }
      }, 1000)
      return
    }
  } catch {
    // Non-fatal — just retry next tick
  }
  if (!showSuccessOverlay.value) {
    pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS)
  }
}

// Change Payment Method
const { showConfirmModal, isChanging, openConfirmModal, closeConfirmModal, confirmChange } = useChangePaymentMethod(
  { type: 'order', orderNumber: orderNumber.value, methodSelectionPath: `/orders/${orderNumber.value}/payment` },
  { isPaid: computed(() => showSuccessOverlay.value), isExpired }
)

onMounted(() => {
  // Start polling once mounted on client
  pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS)
})

onBeforeUnmount(() => {
  stopPolling()
  if (redirectTimer) clearInterval(redirectTimer)
})

// --- Manual "I've Already Transferred" check ---
const manualChecking = ref(false)
const manualResult = ref<'' | 'pending' | 'paid'>('')

async function manualCheck() {
  if (manualChecking.value) return
  manualChecking.value = true
  manualResult.value = ''
  try {
    const snap = await paymentApi.getStatus(orderNumber.value)
    if (snap.status === 'paid') {
      stopPolling()
      paymentStore.clearSession(orderNumber.value)
      showSuccessOverlay.value = true
      redirectCountdown.value = 3
      redirectTimer = setInterval(() => {
        redirectCountdown.value--
        if (redirectCountdown.value <= 0) {
          if (redirectTimer) clearInterval(redirectTimer)
          router.push(`/orders/${orderNumber.value}/payment/done`)
        }
      }, 1000)
    } else {
      manualResult.value = 'pending'
      // Hide toast after 4s
      setTimeout(() => { manualResult.value = '' }, 4000)
    }
  } catch {
    manualResult.value = 'pending'
    setTimeout(() => { manualResult.value = '' }, 4000)
  } finally {
    manualChecking.value = false
  }
}

// --- Accordion instructions ---
const showAtm = ref(false)
const showMobile = ref(true) // Mobile Banking expanded by default
const showInternet = ref(false)

interface BankMethod {
  atm: string[]
  mobile: string[]
  internet: string[]
}

interface BankInstruction {
  name: string
  color: string
  methods: BankMethod
}

const bankInstructions = computed<BankInstruction | null>(() => {
  const v = vaNumber.value
  const a = formatCurrency(vaAmount.value)
  const instructions: Record<string, BankInstruction> = {
    va_bca: {
      name: 'BCA', color: 'bg-blue-600',
      methods: {
        atm: [
          'Insert your BCA ATM card and PIN',
          'Select Other Transactions → Transfer → to BCA Virtual Account',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Done, save the receipt as proof'
        ],
        mobile: [
          'Open the BCA Mobile app',
          'Select m-BCA → m-Transfer → BCA Virtual Account',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your m-BCA PIN and confirm'
        ],
        internet: [
          'Log in to KlikBCA at klikbca.com',
          'Select Fund Transfer → Transfer to BCA Virtual Account',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your KeyBCA APPLI 1 and confirm'
        ]
      }
    },
    va_mandiri: {
      name: 'Mandiri', color: 'bg-amber-500',
      methods: {
        atm: [
          'Insert your Mandiri ATM card and PIN',
          'Select Pay/Buy → Others → Multi Payment',
          'Enter company code: 70012',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a} and complete the transaction`
        ],
        mobile: [
          'Open the Livin\' by Mandiri app',
          'Select Payments → Multi Payment',
          'Enter company code: 70012',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a} and enter your PIN`
        ],
        internet: [
          'Log in to Mandiri Internet Banking at ib.bankmandiri.co.id',
          'Select Payments → Multi Payment',
          'Enter company code: 70012',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a} and enter your token`
        ]
      }
    },
    va_bri: {
      name: 'BRI', color: 'bg-blue-800',
      methods: {
        atm: [
          'Insert your BRI ATM card and PIN',
          'Select Other Transactions → Payments → Others → BRIVA',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Done, save the receipt as proof'
        ],
        mobile: [
          'Open the BRImo app',
          'Select BRIVA',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your BRImo PIN and confirm'
        ],
        internet: [
          'Log in to BRI Internet Banking at ib.bri.co.id',
          'Select Payments → BRIVA',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your BRI password and mToken'
        ]
      }
    },
    va_bni: {
      name: 'BNI', color: 'bg-orange-500',
      methods: {
        atm: [
          'Insert your BNI ATM card and PIN',
          'Select Other Menu → Transfer → Savings Account → Virtual Account',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Done, save the receipt as proof'
        ],
        mobile: [
          'Open the BNI Mobile Banking app',
          'Select Transfer → Virtual Account Billing',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your BNI Mobile PIN and confirm'
        ],
        internet: [
          'Log in to BNI Internet Banking at ibank.bni.co.id',
          'Select Transfer → Virtual Account Billing',
          `Enter VA number: ${v}`,
          `Confirm the amount ${a}`,
          'Enter your transaction password'
        ]
      }
    }
  }
  return instructions[paymentMethod.value] || null
})
</script>

<template>
  <!-- Step Progress Bar -->
  <div class="bg-white border-b border-slate-100">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-center gap-1">
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Detail Course</span>
        <div class="h-0.5 w-10 mx-1 bg-emerald-500"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="hidden sm:block text-xs font-medium text-emerald-600 mx-1">Checkout</span>
        <div class="h-0.5 w-10 mx-1 bg-primary-500"></div>
        <div class="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">3</div>
        <span class="hidden sm:block text-xs font-medium text-primary-600 mx-1">Payment</span>
        <div class="h-0.5 w-10 mx-1 bg-slate-200"></div>
        <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center">4</div>
        <span class="hidden sm:block text-xs font-medium text-slate-400 mx-1">Done</span>
      </div>
    </div>
  </div>

  <!-- Payment Success Overlay -->
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

  <!-- Loading skeleton — only shown when store has no session AND fetch is in flight -->
  <div v-if="!rawSession && orderPending" class="max-w-2xl mx-auto px-4 py-10 space-y-4">
    <BaseSkeleton class="h-5 w-32" />
    <BaseSkeleton class="h-7 w-56" />
    <BaseSkeleton class="h-48 w-full rounded-2xl" />
    <BaseSkeleton class="h-16 w-full rounded-xl" />
    <BaseSkeleton class="h-64 w-full rounded-2xl" />
    <BaseSkeleton class="h-12 w-full rounded-xl" />
  </div>

  <!-- Order not found — store empty AND fetch returned null -->
  <div v-else-if="!rawSession && !order" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Order not found"
      description="Please go back and start again from the payment method selection."
      cta-label="View My Orders"
      cta-to="/orders"
    />
  </div>

  <!-- No VA data in either store or fetched order -->
  <div v-else-if="!hasVaData" class="max-w-xl mx-auto px-4 py-20">
    <BaseEmptyState
      icon="alert"
      title="Virtual Account data not available"
      description="Please select a Virtual Account payment method first."
      cta-label="Select Payment Method"
      :cta-to="`/orders/${orderNumber}/payment`"
    />
  </div>

  <!-- VA Payment Detail — shows immediately from store session, refreshes when order fetched -->
  <div v-else class="max-w-2xl mx-auto px-4 py-8 space-y-5">

    <!-- Change Payment Method button -->
    <button
      v-if="!isExpired"
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors group"
      @click="openConfirmModal"
    >
      <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Change payment method
    </button>

    <!-- Expired alert -->
    <div v-if="isExpired" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-bold text-red-700">Order Expired</p>
        <p class="text-xs text-red-600 mt-0.5">Payment time has expired. Please create a new order to continue.</p>
      </div>
    </div>

    <!-- Countdown alert (amber) -->
    <div v-else class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-semibold text-amber-800">Complete payment within</p>
        <p class="text-xs text-amber-600">Order <span class="font-mono font-bold">{{ orderNumber }}</span></p>
      </div>
      <div class="text-right">
        <OrderCountdownTimer :expires-at="vaExpiresAt" />
      </div>
    </div>

    <!-- VA Gradient Card -->
    <div
      :class="['rounded-2xl overflow-hidden transition-opacity', isExpired ? 'opacity-50 grayscale' : '']"
      style="background: linear-gradient(135deg, #1e5088 0%, #2566ab 50%, #2F80D2 100%);"
    >
      <div class="p-6 md:p-8 text-white">
        <!-- Bank logo -->
        <div class="flex items-center justify-between mb-6">
          <div :class="['bg-white rounded-xl px-4 py-2 text-sm font-extrabold tracking-wider', bankColorClass]" style="color: black;">
            {{ bankLabel }}
          </div>
          <div class="text-right">
            <p class="text-xs text-white/60">Virtual Account</p>
            <p class="text-xs text-white/80 font-medium">a.n. DRILLSPACE</p>
          </div>
        </div>

        <!-- VA Number -->
        <div class="mb-6">
          <p class="text-xs text-white/60 mb-2 uppercase tracking-wider">Virtual Account Number</p>
          <p class="font-mono text-3xl md:text-4xl font-black tracking-wider break-all select-all">
            {{ vaNumber }}
          </p>
        </div>

        <!-- Copy button -->
        <button
          type="button"
          :disabled="isExpired || vaNumber === '—'"
          class="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          :style="copied ? 'background: rgba(16,185,129,.4);' : 'background: rgba(255,255,255,.15);'"
          aria-label="Copy VA number"
          @click="copyVA"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ copied ? 'Copied!' : 'Copy VA Number' }}
        </button>

        <!-- Bottom: account name + amount -->
        <div class="border-t border-white/20 pt-5 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-white/60 mb-1">Account Name</p>
            <p class="text-sm font-bold">DRILLSPACE</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-white/60 mb-1">Total Payment</p>
            <p class="text-base font-black tabular-nums">{{ formatCurrency(vaAmount) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Exact amount notice -->
    <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <span>
        Pay the <strong>exact</strong> amount as billed.
        Paying more or less by even 1 digit will fail automatic verification.
      </span>
    </div>

    <!-- Realtime status card -->
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between gap-4">
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
    </div>

    <!-- Accordion: Bank Instructions -->
    <div v-if="bankInstructions" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-sm font-bold text-slate-700 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          How to Pay with {{ bankInstructions.name }}
        </h2>
      </div>

      <!-- ATM -->
      <div class="border-b border-slate-100">
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          :aria-expanded="showAtm"
          @click="showAtm = !showAtm"
        >
          <span class="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            ATM
          </span>
          <svg
            :class="['w-4 h-4 text-slate-400 transition-transform duration-200', showAtm ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="showAtm" class="px-5 pb-5">
          <ol class="space-y-3">
            <li
              v-for="(step, i) in bankInstructions.methods.atm"
              :key="i"
              class="flex gap-3 text-sm text-slate-600 leading-relaxed"
            >
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {{ i + 1 }}
              </span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- Mobile Banking (expanded by default) -->
      <div class="border-b border-slate-100">
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          :aria-expanded="showMobile"
          @click="showMobile = !showMobile"
        >
          <span class="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile Banking
            <span class="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">Popular</span>
          </span>
          <svg
            :class="['w-4 h-4 text-slate-400 transition-transform duration-200', showMobile ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="showMobile" class="px-5 pb-5">
          <ol class="space-y-3">
            <li
              v-for="(step, i) in bankInstructions.methods.mobile"
              :key="i"
              class="flex gap-3 text-sm text-slate-600 leading-relaxed"
            >
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {{ i + 1 }}
              </span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- Internet Banking -->
      <div>
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          :aria-expanded="showInternet"
          @click="showInternet = !showInternet"
        >
          <span class="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Internet Banking
          </span>
          <svg
            :class="['w-4 h-4 text-slate-400 transition-transform duration-200', showInternet ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-show="showInternet" class="px-5 pb-5">
          <ol class="space-y-3">
            <li
              v-for="(step, i) in bankInstructions.methods.internet"
              :key="i"
              class="flex gap-3 text-sm text-slate-600 leading-relaxed"
            >
              <span class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {{ i + 1 }}
              </span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      <BaseButton
        v-if="!isExpired"
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
        {{ manualChecking ? 'Checking...' : 'I\'ve Already Transferred' }}
      </BaseButton>

      <BaseButton
        v-if="isExpired && order?.course?.slug"
        variant="primary"
        size="lg"
        block
        :to="`/checkout?course=${order.course.slug}`"
      >
        Create New Order
      </BaseButton>

      <BaseButton
        v-if="!isExpired"
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

    <p class="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5 pb-4">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Secure &amp; SSL 256-bit encrypted transaction
    </p>
  </div>

  <!-- Change Payment Method Confirmation Modal -->
  <BaseModal v-model="showConfirmModal" title="Change Payment Method?" size="sm" @close="closeConfirmModal">
    <p class="text-sm text-slate-600">
      The Virtual Account number that was created will expire and can no longer be used for payment.
    </p>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <BaseButton variant="ghost" size="sm" :disabled="isChanging" @click="closeConfirmModal">Cancel</BaseButton>
        <BaseButton variant="primary" size="sm" :loading="isChanging" @click="confirmChange">Yes, Change Method</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 1rem);
}
</style>
