<script setup lang="ts">
import type { SubscriptionInvoice, SubscriptionPaymentMethod } from '~/types/partner'

const props = defineProps<{ invoice: SubscriptionInvoice | null; open: boolean }>()
const emit = defineEmits<{ close: []; paid: [] }>()

const { session, isCreating, isPolling, isPaid, createError, createSession, reset } = useInvoicePayment()
const selectedMethod = ref<SubscriptionPaymentMethod | null>(null)
type DrawerStep = 'select' | 'payment' | 'success'
const step = ref<DrawerStep>('select')

const METHODS: { id: SubscriptionPaymentMethod; label: string }[] = [
  { id: 'va_bca', label: 'VA BCA' }, { id: 'va_mandiri', label: 'VA Mandiri' },
  { id: 'va_bri', label: 'VA BRI' }, { id: 'va_bni', label: 'VA BNI' },
  { id: 'qris', label: 'QRIS' }, { id: 'ewallet_dana', label: 'DANA' },
  { id: 'ewallet_shopeepay', label: 'ShopeePay' }, { id: 'ewallet_ovo', label: 'OVO' },
]

watch(() => props.open, (val) => { if (!val) { reset(); step.value = 'select'; selectedMethod.value = null } })
watch(isPaid, (val) => { if (val) { step.value = 'success'; emit('paid') } })

async function handleCreate() {
  if (!props.invoice || !selectedMethod.value) return
  const s = await createSession(props.invoice, selectedMethod.value, () => { step.value = 'success'; emit('paid') })
  if (s) {
    if (s.redirect_url) window.open(s.redirect_url, '_blank')
    step.value = 'payment'
  }
}

const copied = ref(false)
async function copyVa() {
  if (session.value?.va_number) {
    await navigator.clipboard.writeText(session.value.va_number)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function handleClose() {
  reset(); step.value = 'select'; selectedMethod.value = null; emit('close')
}

const isVa = computed(() => session.value?.payment_method?.startsWith('va_'))
const isQris = computed(() => session.value?.payment_method === 'qris')
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 bg-slate-900/40 z-40" @click="handleClose" />
    </Transition>
    <Transition name="slide-right">
      <div v-if="open" class="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        <!-- Header -->
        <div class="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ step === 'success' ? 'Payment Successful' : 'Pay Invoice' }}</p>
            <p v-if="invoice && step !== 'success'" class="text-xs text-slate-500 mt-0.5 font-mono">{{ invoice.invoice_number }}</p>
            <p v-if="invoice && step !== 'success'" class="text-sm font-bold text-slate-900 mt-1">Rp {{ invoice.amount.toLocaleString('id-ID') }}</p>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-700 text-xl leading-none mt-0.5" @click="handleClose">×</button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5">
          <!-- Step: select method -->
          <template v-if="step === 'select'">
            <p class="text-sm font-medium text-slate-700 mb-4">Select Payment Method</p>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="m in METHODS" :key="m.id" type="button"
                :class="['px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all', selectedMethod === m.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-700 hover:border-slate-300']"
                @click="selectedMethod = m.id"
              >{{ m.label }}</button>
            </div>
            <p v-if="createError" class="mt-4 text-xs text-red-600">{{ createError }}</p>
          </template>

          <!-- Step: VA -->
          <template v-else-if="step === 'payment' && isVa">
            <button type="button" class="text-xs text-primary-600 mb-4 flex items-center gap-1" @click="step = 'select'; reset()">← Back</button>
            <p class="text-sm font-semibold text-slate-700 mb-1">Virtual Account Number</p>
            <div class="bg-slate-50 rounded-xl p-4 mb-3">
              <p class="text-2xl font-mono font-bold tracking-widest text-slate-900 text-center mb-3">{{ session?.va_number ?? '—' }}</p>
              <button type="button" class="w-full text-sm font-semibold text-primary-600 border border-primary-300 rounded-xl py-2 hover:bg-primary-50 transition-colors" @click="copyVa">
                {{ copied ? '✓ Copied!' : 'Copy VA Number' }}
              </button>
            </div>
            <div class="space-y-2 text-sm text-slate-600 mb-4">
              <div class="flex justify-between">
                <span>Transfer Amount (EXACT)</span>
                <span class="font-bold text-slate-900">Rp {{ invoice?.amount.toLocaleString('id-ID') }}</span>
              </div>
              <p class="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">⚠ Transfer the exact amount — no more, no less.</p>
              <div v-if="session?.expires_at" class="flex justify-between text-xs text-slate-500">
                <span>Valid until</span>
                <span>{{ new Date(session.expires_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              Waiting for payment... (auto-updates)
            </div>
          </template>

          <!-- Step: QRIS -->
          <template v-else-if="step === 'payment' && isQris">
            <button type="button" class="text-xs text-primary-600 mb-4 flex items-center gap-1" @click="step = 'select'; reset()">← Back</button>
            <p class="text-sm font-semibold text-slate-700 mb-3 text-center">Scan QR Code</p>
            <div class="flex justify-center mb-4">
              <img v-if="session?.qr_url" :src="session.qr_url" alt="QR Code" class="w-48 h-48 rounded-xl" />
              <div v-else class="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">QR Code</div>
            </div>
            <p class="text-center text-sm font-bold text-slate-900 mb-1">Rp {{ invoice?.amount.toLocaleString('id-ID') }}</p>
            <div class="flex items-center justify-center gap-2 text-xs text-slate-500 mt-3">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              Waiting for payment...
            </div>
          </template>

          <!-- Step: e-wallet -->
          <template v-else-if="step === 'payment'">
            <div class="text-center py-8 space-y-3">
              <p class="text-sm text-slate-600">You've been redirected to the payment app.</p>
              <p class="text-xs text-slate-400">Return to this page after completing payment.</p>
              <div class="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                Waiting for confirmation...
              </div>
            </div>
          </template>

          <!-- Step: success -->
          <template v-else-if="step === 'success'">
            <div class="flex flex-col items-center text-center py-8 gap-4">
              <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="text-lg font-bold text-slate-900">Payment Successful!</p>
                <p v-if="invoice" class="text-sm text-slate-500 mt-1">Invoice {{ invoice.invoice_number }} has been paid.</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-slate-100">
          <template v-if="step === 'select'">
            <BaseButton variant="primary" block :disabled="!selectedMethod || isCreating" :loading="isCreating" @click="handleCreate">Create Payment</BaseButton>
          </template>
          <template v-else-if="step === 'success'">
            <BaseButton variant="primary" block @click="handleClose">Close</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="secondary" block @click="handleClose">Done</BaseButton>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
