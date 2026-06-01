<script setup lang="ts">
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'
import type { SubscriptionPaymentMethod } from '~/types/partner'

definePageMeta({ layout: 'minimal', middleware: 'partner-auth' })

const route  = useRoute()
const router = useRouter()
const paymentStore = usePartnerPaymentStore()
const subPayApi    = useSubscriptionPaymentApi()

const invoiceNumber = computed(() => route.params.invoice_number as string)

useSeoMeta({ title: () => `Select Payment Method — ${invoiceNumber.value}` })

// Fetch invoice detail from API — amount comes from server, not URL param.
import type { SubscriptionInvoice } from '~/types/partner'
const invoice    = ref<SubscriptionInvoice | null>(null)
const fetchError = ref('')
const isLoading   = ref(false)
const serverError = ref('')
const activeMethod = ref<SubscriptionPaymentMethod | null>(null)

onMounted(async () => {
  try {
    invoice.value = await subPayApi.fetchInvoice(invoiceNumber.value)
  } catch {
    fetchError.value = 'Failed to load invoice. Go back to billing and try again.'
  }
})

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
  { id: 'va_bca',     name: 'BCA',        desc: 'ATM · BCA Mobile · KlikBCA',        logo: '/images/payment/bca.svg',     accent: 'hover:border-blue-300 hover:shadow-blue-50' },
  { id: 'va_mandiri', name: 'Mandiri',    desc: "ATM · Livin' by Mandiri",            logo: '/images/payment/mandiri.svg', accent: 'hover:border-amber-300 hover:shadow-amber-50' },
  { id: 'va_bri',     name: 'BRI',        desc: 'ATM · BRImo',                        logo: '/images/payment/bri.png',     accent: 'hover:border-sky-300 hover:shadow-sky-50' },
  { id: 'va_bni',     name: 'BNI',        desc: 'ATM · BNI Mobile Banking',           logo: '/images/payment/bni.svg',     accent: 'hover:border-orange-300 hover:shadow-orange-50' },
]

const EWALLETS: MethodItem[] = [
  { id: 'ewallet_dana',      name: 'DANA',      desc: 'Pay from DANA balance',      logo: '/images/payment/dana.svg', accent: 'hover:border-blue-300 hover:shadow-blue-50' },
  { id: 'ewallet_shopeepay', name: 'ShopeePay', desc: 'Pay from ShopeePay balance', logo: '/images/payment/shopeepay.svg', accent: 'hover:border-orange-300 hover:shadow-orange-50' },
]

async function selectAndProceed(method: SubscriptionPaymentMethod) {
  if (isLoading.value || !invoice.value) return
  activeMethod.value = method
  serverError.value  = ''
  isLoading.value    = true
  try {
    const session = await subPayApi.initiate(invoiceNumber.value, method)
    paymentStore.setSession({
      invoice_number: invoiceNumber.value,
      invoice_amount: invoice.value.amount,
      payment_method: method,
      expires_at:     session.expired_at ?? '',
      va_number:      session.va_number,
      bank_code:      session.bank_code,
      qr_url:         session.qris_url,
      qr_string:      session.qris_string,
      redirect_url:   session.ewallet_redirect_url,
    })
    const base = `/partner/invoice-pay/${invoiceNumber.value}`
    if (method.startsWith('va_'))       await router.push(`${base}/va`)
    else if (method === 'qris')          await router.push(`${base}/qris`)
    else                                 await router.push(`${base}/ewallet`)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    serverError.value = e.message || 'Failed to start payment. Please try again.'
    activeMethod.value = null
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <PartnerInvoicePaymentStepper :step="2" />
  <div class="max-w-xl mx-auto space-y-6 mt-2 pb-10 px-4">

    <!-- Header -->
    <div>
      <NuxtLink
        to="/partner/billing"
        class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors group mb-4"
      >
        <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Billing
      </NuxtLink>
      <h1 class="text-xl font-bold text-slate-800 mb-0.5">Select Payment Method</h1>
      <p class="text-sm text-slate-500 font-mono">{{ invoiceNumber }}</p>
    </div>

    <!-- Invoice summary card -->
    <div v-if="invoice" class="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs text-slate-400 mb-0.5">Invoice Total</p>
        <p class="text-2xl font-black text-primary-600 tracking-tight">Rp {{ invoice.amount.toLocaleString('id-ID') }}</p>
      </div>
      <BaseBadge
        :label="invoice.status === 'past_due' ? 'Overdue' : 'Pending'"
        :severity="invoice.status === 'past_due' ? 'danger' : 'warn'"
      />
    </div>
    <div v-else-if="!fetchError" class="h-16 bg-slate-100 rounded-2xl animate-pulse" />

    <!-- Fetch error -->
    <div v-if="fetchError" class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ fetchError }}
    </div>

    <!-- Server error -->
    <div v-if="serverError" class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ serverError }}
    </div>

    <!-- SECTION: Virtual Account -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 h-px bg-slate-200" />
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Virtual Account</span>
        <div class="flex-1 h-px bg-slate-200" />
      </div>
      <div class="space-y-2">
        <button
          v-for="bank in VA_BANKS" :key="bank.id" type="button" :disabled="isLoading"
          :class="['group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed', bank.accent]"
          @click="selectAndProceed(bank.id)"
        >
          <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
            <img v-if="bank.logo" :src="bank.logo" :alt="bank.name" class="max-h-9 max-w-[76px] w-auto object-contain" loading="lazy" />
            <div v-else :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base select-none', bank.initialBg]">{{ bank.initial }}</div>
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="text-sm font-semibold text-slate-800 leading-tight">{{ bank.name }} Virtual Account</p>
            <p class="text-xs text-slate-400 mt-0.5 truncate">{{ bank.desc }}</p>
          </div>
          <div class="flex-shrink-0 w-6 flex items-center justify-center">
            <span v-if="isLoading && activeMethod === bank.id" class="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block" />
            <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <!-- SECTION: QRIS -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 h-px bg-slate-200" />
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">QRIS</span>
        <div class="flex-1 h-px bg-slate-200" />
      </div>
      <button
        type="button" :disabled="isLoading"
        class="group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-300 hover:shadow-md hover:shadow-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="selectAndProceed('qris')"
      >
        <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
          <img src="/images/payment/qris.svg" alt="QRIS" class="max-h-9 max-w-[76px] w-auto object-contain" loading="lazy" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-semibold text-slate-800">QRIS</p>
          <p class="text-xs text-slate-400 mt-0.5">GoPay · OVO · DANA · LinkAja · mobile banking</p>
        </div>
        <div class="flex-shrink-0 w-6 flex items-center justify-center">
          <span v-if="isLoading && activeMethod === 'qris'" class="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
          <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- SECTION: E-Wallet -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="flex-1 h-px bg-slate-200" />
        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">E-Wallet</span>
        <div class="flex-1 h-px bg-slate-200" />
      </div>
      <div class="space-y-2">
        <button
          v-for="wallet in EWALLETS" :key="wallet.id" type="button" :disabled="isLoading"
          :class="['group w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl border-2 border-slate-100 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed', wallet.accent]"
          @click="selectAndProceed(wallet.id)"
        >
          <div class="w-20 h-10 flex items-center justify-center flex-shrink-0">
            <img v-if="wallet.logo" :src="wallet.logo" :alt="wallet.name" class="max-h-9 max-w-[76px] w-auto object-contain" loading="lazy" />
            <div v-else :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base select-none', wallet.initialBg]">{{ wallet.initial }}</div>
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="text-sm font-semibold text-slate-800">{{ wallet.name }}</p>
            <p class="text-xs text-slate-400 mt-0.5 truncate">{{ wallet.desc }}</p>
          </div>
          <div class="flex-shrink-0 w-6 flex items-center justify-center">
            <span v-if="isLoading && activeMethod === wallet.id" class="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block" />
            <svg v-else class="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>

    <p class="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5 pt-2">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Secure &amp; SSL 256-bit encrypted transaction
    </p>
  </div>
</template>
