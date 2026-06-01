<script setup lang="ts">
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'
definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })

const route        = useRoute()
const router       = useRouter()
const paymentStore = usePartnerPaymentStore()
const subPayApi    = useSubscriptionPaymentApi()

const invoiceNumber = computed(() => route.params.invoice_number as string)
const session = computed(() => paymentStore.getSession(invoiceNumber.value))

useSeoMeta({ title: () => `Awaiting VA Payment — ${invoiceNumber.value}` })

onMounted(async () => {
  if (session.value) {
    // Session in store — verify it's VA
    if (!session.value.payment_method?.startsWith('va_')) {
      navigateTo(`/partner/invoice-pay/${invoiceNumber.value}`)
    }
    return
  }

  // No store session (hard refresh / direct URL) — fetch from server
  try {
    const snap = await subPayApi.getStatus(invoiceNumber.value)
    if (snap.status === 'paid') {
      // Already paid — go to done page
      navigateTo(`/partner/invoice-pay/${invoiceNumber.value}/done`)
      return
    }
    if (!snap.has_payment_session || snap.is_expired || !snap.payment_method?.startsWith('va_')) {
      // No active VA session → redirect to method selection
      navigateTo(`/partner/invoice-pay/${invoiceNumber.value}`)
      return
    }
    // Rebuild session from API response
    paymentStore.setSession({
      invoice_number: invoiceNumber.value,
      invoice_amount: snap.amount,
      payment_method: snap.payment_method as string,
      expires_at: snap.expires_at ?? '',
      va_number: snap.va_number,
    })
  } catch {
    navigateTo(`/partner/invoice-pay/${invoiceNumber.value}`)
  }
})

const bankNameMap: Record<string, string> = {
  va_bca: 'BCA', va_mandiri: 'Mandiri', va_bri: 'BRI', va_bni: 'BNI',
  va_cimb: 'CIMB Niaga', va_bsi: 'BSI', va_permata: 'Permata',
}
const bankColorMap: Record<string, string> = {
  va_bca: 'bg-blue-600', va_mandiri: 'bg-amber-500', va_bri: 'bg-blue-800',
  va_bni: 'bg-orange-500', va_cimb: 'bg-red-600', va_bsi: 'bg-emerald-700', va_permata: 'bg-purple-600',
}

const bankLabel = computed(() => bankNameMap[session.value?.payment_method ?? ''] ?? '—')
const bankColor = computed(() => bankColorMap[session.value?.payment_method ?? ''] ?? 'bg-primary-600')

const isExpired = computed(() => {
  if (!session.value?.expires_at) return false
  return new Date(session.value.expires_at).getTime() < Date.now()
})

// ── Copy VA ───────────────────────────────────────────────────────────────────
const copied = ref(false)
async function copyVA() {
  const n = session.value?.va_number
  if (!n) return
  await navigator.clipboard.writeText(n)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2500)
}

// ── Polling ───────────────────────────────────────────────────────────────────
const POLL_MS = 10_000
let pollTimer: ReturnType<typeof setTimeout> | null = null
const showSuccess    = ref(false)
const countdown      = ref(3)
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
  } catch { /* non-fatal */ }
  if (!showSuccess.value) pollTimer = setTimeout(checkStatus, POLL_MS)
}

const { showConfirmModal, isChanging, openConfirmModal, closeConfirmModal, confirmChange } = useChangePaymentMethod(
  { type: 'invoice', invoiceNumber: invoiceNumber.value, methodSelectionPath: `/partner/invoice-pay/${invoiceNumber.value}` },
  { isPaid: computed(() => showSuccess.value), isExpired }
)

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

// ── Accordion instructions ────────────────────────────────────────────────────
const showAtm      = ref(false)
const showMobile   = ref(true)
const showInternet = ref(false)

const instructions = computed(() => {
  const v = session.value?.va_number ?? '—'
  const a = `Rp ${(session.value?.invoice_amount ?? 0).toLocaleString('id-ID')}`
  const map: Record<string, { atm: string[]; mobile: string[]; internet: string[] }> = {
    va_bca: {
      atm:      [`Insert your BCA ATM card and enter your PIN`, `Select Other Transactions → Transfer → BCA Virtual Account`, `Enter VA number: ${v}`, `Confirm the amount ${a}`, `Save the receipt as proof`],
      mobile:   [`Open the BCA Mobile app`, `Select m-BCA → m-Transfer → BCA Virtual Account`, `Enter VA number: ${v}`, `Confirm the amount ${a}`, `Enter your m-BCA PIN and confirm`],
      internet: [`Log in to KlikBCA`, `Select Fund Transfer → BCA Virtual Account`, `Enter VA number: ${v}`, `Confirm the amount ${a}`, `Enter your KeyBCA APPLI 1 and confirm`],
    },
    va_mandiri: {
      atm:      [`Insert your Mandiri ATM card and enter your PIN`, `Select Pay/Buy → Others → Multi Payment`, `Enter company code: 70012`, `Enter VA number: ${v}`, `Confirm the amount ${a}`],
      mobile:   [`Open Livin' by Mandiri`, `Select Payments → Multi Payment`, `Enter company code: 70012`, `Enter VA number: ${v}`, `Enter your PIN and confirm`],
      internet: [`Log in to Mandiri Internet Banking`, `Select Payments → Multi Payment`, `Enter company code: 70012`, `Enter VA number: ${v}`, `Enter your token and confirm`],
    },
    va_bri: {
      atm:      [`Insert your BRI ATM card and enter your PIN`, `Select Other Transactions → Payments → Others → BRIVA`, `Enter VA number: ${v}`, `Confirm the amount ${a}`],
      mobile:   [`Open the BRImo app`, `Select BRIVA`, `Enter VA number: ${v}`, `Confirm the amount ${a} and enter your BRImo PIN`],
      internet: [`Log in to BRI Internet Banking`, `Select Payments → BRIVA`, `Enter VA number: ${v}`, `Confirm the amount ${a}`],
    },
    va_bni: {
      atm:      [`Insert your BNI ATM card and enter your PIN`, `Select Other Menu → Transfer → Savings Account → Virtual Account`, `Enter VA number: ${v}`, `Confirm the amount ${a}`],
      mobile:   [`Open the BNI Mobile Banking app`, `Select Transfer → Virtual Account Billing`, `Enter VA number: ${v}`, `Confirm the amount ${a} and enter your PIN`],
      internet: [`Log in to BNI Internet Banking`, `Select Transfer → Virtual Account Billing`, `Enter VA number: ${v}`, `Confirm the amount ${a}`],
    },
  }
  return map[session.value?.payment_method ?? ''] ?? null
})
</script>

<template>
  <!-- Success overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
          <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
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

  <!-- Toast: still pending -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="stillPending" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
        <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Payment not yet confirmed. Please wait a moment.
      </div>
    </Transition>
  </Teleport>

  <PartnerInvoicePaymentStepper :step="3" />
  <div v-if="session" class="max-w-xl mx-auto space-y-5 pb-10 px-4 mt-4">

    <!-- Change method button -->
    <button
      v-if="!isExpired"
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors group"
      @click="openConfirmModal"
    >
      <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Change payment method
    </button>

    <!-- Expired alert -->
    <div v-if="isExpired" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p class="text-sm font-bold text-red-700">Session Expired</p>
        <p class="text-xs text-red-600 mt-0.5">Payment time has expired. Please select another method.</p>
      </div>
    </div>

    <!-- VA gradient card -->
    <div :class="['rounded-2xl overflow-hidden', isExpired ? 'opacity-50 grayscale' : '']"
         style="background: linear-gradient(135deg, #1e5088 0%, #2566ab 50%, #2F80D2 100%);">
      <div class="p-6 text-white">
        <div class="flex items-center justify-between mb-6">
          <div :class="['text-white bg-white/20 rounded-xl px-4 py-2 text-sm font-extrabold tracking-wider']">{{ bankLabel }}</div>
          <div class="text-right">
            <p class="text-xs text-white/60">Virtual Account</p>
            <p class="text-xs text-white/80">a/n DRILLSPACE</p>
          </div>
        </div>
        <p class="text-xs text-white/60 mb-2 uppercase tracking-wider">Virtual Account Number</p>
        <p class="font-mono text-3xl font-black tracking-wider break-all select-all mb-5">{{ session.va_number ?? '—' }}</p>
        <button
          type="button" :disabled="isExpired || !session.va_number"
          :class="['flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all mb-5 disabled:opacity-40', copied ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/30 bg-white/15 hover:bg-white/25']"
          @click="copyVA"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          {{ copied ? 'Copied!' : 'Copy VA Number' }}
        </button>
        <div class="border-t border-white/20 pt-4 flex justify-between">
          <div><p class="text-xs text-white/60 mb-1">Account Name</p><p class="text-sm font-bold">DRILLSPACE</p></div>
          <div class="text-right"><p class="text-xs text-white/60 mb-1">Total Payment</p><p class="text-base font-black">Rp {{ session.invoice_amount.toLocaleString('id-ID') }}</p></div>
        </div>
      </div>
    </div>

    <!-- Exact amount notice -->
    <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      Transfer the <strong>exact</strong> amount. Paying more or less by even 1 digit will fail automatic verification.
    </div>

    <!-- Poll status indicator -->
    <div class="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
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

    <!-- Bank instructions accordion -->
    <div v-if="instructions" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-sm font-bold text-slate-700">How to Pay with {{ bankLabel }}</h2>
      </div>

      <template v-for="(items, key) in { ATM: instructions.atm, 'Mobile Banking': instructions.mobile, 'Internet Banking': instructions.internet }" :key="key">
        <div class="border-b border-slate-100 last:border-b-0">
          <button
            type="button"
            class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            @click="key === 'ATM' ? showAtm = !showAtm : key === 'Mobile Banking' ? showMobile = !showMobile : showInternet = !showInternet"
          >
            <span class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              {{ key }}
              <span v-if="key === 'Mobile Banking'" class="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-medium">Popular</span>
            </span>
            <svg :class="['w-4 h-4 text-slate-400 transition-transform duration-200', (key === 'ATM' && showAtm) || (key === 'Mobile Banking' && showMobile) || (key === 'Internet Banking' && showInternet) ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="(key === 'ATM' && showAtm) || (key === 'Mobile Banking' && showMobile) || (key === 'Internet Banking' && showInternet)" class="px-5 pb-5">
            <ol class="space-y-3">
              <li v-for="(s, i) in items" :key="i" class="flex gap-3 text-sm text-slate-600 leading-relaxed">
                <span class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ i + 1 }}</span>
                <span>{{ s }}</span>
              </li>
            </ol>
          </div>
        </div>
      </template>
    </div>

    <!-- Actions -->
    <div class="space-y-3">
      <BaseButton v-if="!isExpired" variant="primary" size="lg" block :loading="manualChecking" :disabled="manualChecking" @click="manualCheck">
        <svg v-if="!manualChecking" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        {{ manualChecking ? 'Checking...' : "I've Already Transferred" }}
      </BaseButton>
      <BaseButton v-if="isExpired" variant="primary" size="lg" block :to="`/partner/invoice-pay/${invoiceNumber}`">Select Another Method</BaseButton>
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
      <BaseButton variant="ghost" size="lg" block to="/partner/billing">Back to Billing</BaseButton>
    </div>

    <p class="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5 pb-4">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      Secure &amp; SSL 256-bit encrypted transaction
    </p>
  </div>

  <BaseModal v-model="showConfirmModal" title="Change Payment Method?" size="sm" @close="closeConfirmModal">
    <p class="text-sm text-slate-600">The Virtual Account number that was created will expire and can no longer be used for payment.</p>
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
