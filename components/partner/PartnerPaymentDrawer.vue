<script setup lang="ts">
import type { SubscriptionInvoice, SubscriptionPaymentMethod } from '~/types/partner'

const props = defineProps<{ invoice: SubscriptionInvoice | null; open: boolean }>()
const emit = defineEmits<{ close: []; paid: [] }>()

const { session, isCreating, isPolling, isPaid, createError, createSession, reset } = useInvoicePayment()

type DrawerStep = 'select' | 'payment' | 'success'
const step = ref<DrawerStep>('select')
const activeMethod = ref<SubscriptionPaymentMethod | null>(null)

watch(() => props.open, (val) => {
  if (!val) { reset(); step.value = 'select'; activeMethod.value = null }
})
watch(isPaid, (val) => { if (val) { step.value = 'success'; emit('paid') } })

async function handleSelect(method: SubscriptionPaymentMethod) {
  if (!props.invoice || isCreating.value) return
  activeMethod.value = method
  createError.value = ''
  const s = await createSession(props.invoice, method, () => { step.value = 'success'; emit('paid') })
  if (s) {
    if (s.redirect_url) window.open(s.redirect_url, '_blank')
    step.value = 'payment'
  } else {
    activeMethod.value = null
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
  reset(); step.value = 'select'; activeMethod.value = null; emit('close')
}

const isVa   = computed(() => session.value?.payment_method?.startsWith('va_'))
const isQris = computed(() => session.value?.payment_method === 'qris')

// ─── Payment method catalogue ────────────────────────────────────────────────

interface MethodItem {
  id: SubscriptionPaymentMethod
  name: string
  desc: string
  logo?: string
  initial?: string
  initialBg?: string
  accent: string
}

const VA_BANKS: MethodItem[] = [
  { id: 'va_bca',     name: 'BCA',     desc: 'ATM · BCA Mobile · KlikBCA',          logo: '/images/payment/bca.svg',     accent: 'hover:border-blue-300 hover:shadow-blue-50' },
  { id: 'va_mandiri', name: 'Mandiri', desc: "ATM · Livin' by Mandiri",             logo: '/images/payment/mandiri.svg', accent: 'hover:border-amber-300 hover:shadow-amber-50' },
  { id: 'va_bri',     name: 'BRI',     desc: 'ATM · BRImo',                          logo: '/images/payment/bri.png',     accent: 'hover:border-sky-300 hover:shadow-sky-50' },
  { id: 'va_bni',     name: 'BNI',     desc: 'ATM · BNI Mobile Banking',             logo: '/images/payment/bni.svg',     accent: 'hover:border-orange-300 hover:shadow-orange-50' },
  { id: 'va_cimb',    name: 'CIMB Niaga', desc: 'ATM · OCTO Mobile',               initial: 'C', initialBg: 'bg-red-600',    accent: 'hover:border-red-300 hover:shadow-red-50' },
  { id: 'va_bsi',     name: 'BSI',     desc: 'ATM · BSI Mobile',                     initial: 'B', initialBg: 'bg-emerald-700', accent: 'hover:border-emerald-300 hover:shadow-emerald-50' },
  { id: 'va_permata', name: 'Permata', desc: 'ATM · PermataMobile X',                initial: 'P', initialBg: 'bg-purple-600',  accent: 'hover:border-purple-300 hover:shadow-purple-50' },
]

const EWALLETS: MethodItem[] = [
  { id: 'ewallet_ovo',       name: 'OVO',       desc: 'Bayar langsung dari saldo OVO',      logo: '/images/payment/ovo.svg',  accent: 'hover:border-purple-300 hover:shadow-purple-50' },
  { id: 'ewallet_dana',      name: 'DANA',      desc: 'Bayar langsung dari saldo DANA',     logo: '/images/payment/dana.svg', accent: 'hover:border-blue-300 hover:shadow-blue-50' },
  { id: 'ewallet_shopeepay', name: 'ShopeePay', desc: 'Bayar langsung dari saldo ShopeePay', initial: 'S', initialBg: 'bg-orange-500', accent: 'hover:border-orange-300 hover:shadow-orange-50' },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 bg-slate-900/40 z-40" @click="handleClose" />
    </Transition>

    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
      >
        <!-- ── Header ──────────────────────────────────────────────── -->
        <div class="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p class="text-base font-bold text-slate-800">
              {{ step === 'success' ? 'Payment Successful' : 'Pay Invoice' }}
            </p>
            <template v-if="invoice && step !== 'success'">
              <p class="text-xs text-slate-400 font-mono mt-0.5">{{ invoice.invoice_number }}</p>
              <p class="text-xl font-black text-primary-600 mt-1 tracking-tight">
                Rp {{ invoice.amount.toLocaleString('id-ID') }}
              </p>
            </template>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mt-0.5"
            aria-label="Tutup"
            @click="handleClose"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- ── Body ───────────────────────────────────────────────── -->
        <div class="flex-1 overflow-y-auto">

          <!-- Step: select method ──────────────────────────────── -->
          <template v-if="step === 'select'">
            <div class="px-6 py-5 space-y-6">

              <!-- Error banner -->
              <div
                v-if="createError"
                class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
              >
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ createError }}
              </div>

              <!-- SECTION: Virtual Account ────────────────────── -->
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-1 h-px bg-slate-200" />
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Virtual Account</span>
                  <div class="flex-1 h-px bg-slate-200" />
                </div>
                <div class="space-y-2">
                  <button
                    v-for="bank in VA_BANKS"
                    :key="bank.id"
                    type="button"
                    :disabled="isCreating"
                    :class="[
                      'group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200',
                      'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                      bank.accent
                    ]"
                    @click="handleSelect(bank.id)"
                  >
                    <!-- Logo / initial -->
                    <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
                      <img
                        v-if="bank.logo"
                        :src="bank.logo"
                        :alt="bank.name"
                        class="max-h-9 max-w-[76px] w-auto object-contain"
                        loading="lazy"
                      />
                      <div
                        v-else
                        :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base select-none', bank.initialBg]"
                      >
                        {{ bank.initial }}
                      </div>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 text-left min-w-0">
                      <p class="text-sm font-semibold text-slate-800 leading-tight">{{ bank.name }} Virtual Account</p>
                      <p class="text-xs text-slate-400 mt-0.5 truncate">{{ bank.desc }}</p>
                    </div>

                    <!-- Arrow / spinner -->
                    <div class="flex-shrink-0 w-6 flex items-center justify-center">
                      <span
                        v-if="isCreating && activeMethod === bank.id"
                        class="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block"
                      />
                      <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- SECTION: QRIS ───────────────────────────────── -->
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-1 h-px bg-slate-200" />
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">QRIS</span>
                  <div class="flex-1 h-px bg-slate-200" />
                </div>
                <button
                  type="button"
                  :disabled="isCreating"
                  class="group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-300 hover:shadow-md hover:shadow-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="handleSelect('qris')"
                >
                  <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
                    <img src="/images/payment/qris.svg" alt="QRIS" class="max-h-9 max-w-[76px] w-auto object-contain" loading="lazy" />
                  </div>
                  <div class="flex-1 text-left">
                    <p class="text-sm font-semibold text-slate-800">QRIS</p>
                    <p class="text-xs text-slate-400 mt-0.5">GoPay · OVO · DANA · LinkAja · mobile banking</p>
                  </div>
                  <div class="flex-shrink-0 w-6 flex items-center justify-center">
                    <span v-if="isCreating && activeMethod === 'qris'" class="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                    <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              <!-- SECTION: E-Wallet ───────────────────────────── -->
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-1 h-px bg-slate-200" />
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">E-Wallet</span>
                  <div class="flex-1 h-px bg-slate-200" />
                </div>
                <div class="space-y-2">
                  <button
                    v-for="wallet in EWALLETS"
                    :key="wallet.id"
                    type="button"
                    :disabled="isCreating"
                    :class="[
                      'group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200',
                      'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                      wallet.accent
                    ]"
                    @click="handleSelect(wallet.id)"
                  >
                    <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
                      <img
                        v-if="wallet.logo"
                        :src="wallet.logo"
                        :alt="wallet.name"
                        class="max-h-9 max-w-[76px] w-auto object-contain"
                        loading="lazy"
                      />
                      <div
                        v-else
                        :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base select-none', wallet.initialBg]"
                      >
                        {{ wallet.initial }}
                      </div>
                    </div>
                    <div class="flex-1 text-left min-w-0">
                      <p class="text-sm font-semibold text-slate-800">{{ wallet.name }}</p>
                      <p class="text-xs text-slate-400 mt-0.5 truncate">{{ wallet.desc }}</p>
                    </div>
                    <div class="flex-shrink-0 w-6 flex items-center justify-center">
                      <span
                        v-if="isCreating && activeMethod === wallet.id"
                        class="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block"
                      />
                      <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </template>

          <!-- Step: VA payment ─────────────────────────────────── -->
          <template v-else-if="step === 'payment' && isVa">
            <div class="px-6 py-5 space-y-5">
              <button
                type="button"
                class="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                @click="step = 'select'; reset(); activeMethod = null"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Virtual Account Number</p>
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p class="text-2xl font-mono font-bold tracking-widest text-slate-900 text-center mb-4">
                    {{ session?.va_number ?? '—' }}
                  </p>
                  <button
                    type="button"
                    class="w-full text-sm font-semibold text-primary-600 border border-primary-300 rounded-xl py-2.5 hover:bg-primary-50 transition-colors"
                    @click="copyVa"
                  >
                    {{ copied ? '✓ Tersalin!' : 'Salin Nomor VA' }}
                  </button>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-500">Jumlah Transfer (TEPAT)</span>
                  <span class="font-bold text-slate-900">Rp {{ invoice?.amount.toLocaleString('id-ID') }}</span>
                </div>
                <div
                  v-if="session?.expires_at"
                  class="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-3"
                >
                  <span>Berlaku sampai</span>
                  <span class="font-medium">
                    {{ new Date(session.expires_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>
              </div>

              <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                ⚠ Transfer jumlah yang tepat — lebih atau kurang akan gagal diverifikasi otomatis.
              </div>

              <div class="flex items-center gap-2.5 text-xs text-slate-500 pt-1">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                Menunggu konfirmasi pembayaran...
              </div>
            </div>
          </template>

          <!-- Step: QRIS payment ───────────────────────────────── -->
          <template v-else-if="step === 'payment' && isQris">
            <div class="px-6 py-5 space-y-5">
              <button
                type="button"
                class="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                @click="step = 'select'; reset(); activeMethod = null"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <p class="text-sm font-semibold text-slate-700 text-center">Scan Kode QR</p>
              <div class="flex justify-center">
                <img
                  v-if="session?.qr_url"
                  :src="session.qr_url"
                  alt="QR Code"
                  class="w-56 h-56 rounded-2xl border border-slate-200 p-2 bg-white shadow-sm"
                />
                <div
                  v-else
                  class="w-56 h-56 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm"
                >
                  QR Code
                </div>
              </div>
              <p class="text-center text-lg font-black text-primary-600">Rp {{ invoice?.amount.toLocaleString('id-ID') }}</p>
              <div class="flex items-center justify-center gap-2.5 text-xs text-slate-500">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                Menunggu pembayaran...
              </div>
            </div>
          </template>

          <!-- Step: e-wallet (redirect) ────────────────────────── -->
          <template v-else-if="step === 'payment'">
            <div class="px-6 py-16 flex flex-col items-center gap-4 text-center">
              <div class="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                <svg class="w-7 h-7 text-primary-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <p class="text-sm font-semibold text-slate-700">Anda sudah diarahkan ke aplikasi pembayaran.</p>
              <p class="text-xs text-slate-400">Kembali ke halaman ini setelah menyelesaikan pembayaran.</p>
              <div class="flex items-center gap-2.5 text-xs text-slate-500 mt-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                Menunggu konfirmasi...
              </div>
            </div>
          </template>

          <!-- Step: success ────────────────────────────────────── -->
          <template v-else-if="step === 'success'">
            <div class="px-6 py-16 flex flex-col items-center gap-5 text-center">
              <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="text-xl font-black text-slate-900">Pembayaran Berhasil!</p>
                <p v-if="invoice" class="text-sm text-slate-500 mt-1">
                  Invoice <span class="font-mono font-semibold">{{ invoice.invoice_number }}</span> telah lunas.
                </p>
              </div>
            </div>
          </template>

        </div>

        <!-- ── Footer ─────────────────────────────────────────────── -->
        <div class="px-6 py-5 border-t border-slate-100">
          <BaseButton
            v-if="step === 'success'"
            variant="primary"
            block
            @click="handleClose"
          >
            Selesai
          </BaseButton>
          <BaseButton
            v-else-if="step === 'payment'"
            variant="secondary"
            block
            @click="handleClose"
          >
            Selesai
          </BaseButton>
          <p v-else class="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Transaksi aman & terenkripsi SSL
          </p>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
