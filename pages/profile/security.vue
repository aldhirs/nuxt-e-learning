<script setup lang="ts">
definePageMeta({ layout: 'profile', middleware: 'auth' })
useSeoMeta({ title: 'Security Settings' })

const auth = useAuthStore()
const api  = useApi()
const { success: toastSuccess } = useToast()

// ── Reactive 2FA status (from auth store) ────────────────────────────────────
const twoFAEnabled = computed(() => auth.user?.['2fa_enabled'] === true)

// ─────────────────────────────────────────────────────────────────────────────
// ENABLE 2FA FLOW
// Step 1: POST /auth/2fa/setup        → OTP sent to email
// Step 2: POST /auth/2fa/verify       → {otp_code} → 2FA enabled
// ─────────────────────────────────────────────────────────────────────────────
type EnableStep = 'idle' | 'otp'
const enableStep    = ref<EnableStep>('idle')
const enableLoading = ref(false)
const enableError   = ref('')
const enableEmailMasked = ref('')

// OTP shared state (enable)
const enableDigits  = ref(['', '', '', '', '', ''])
const enableCode    = computed(() => enableDigits.value.join(''))
const enableOtpLoading = ref(false)
const enableOtpError   = ref('')

const enableSecondsLeft = ref(300)
let   enableTimer: ReturnType<typeof setInterval> | null = null
const enableCountdown = computed(() => {
  const m = Math.floor(enableSecondsLeft.value / 60)
  const s = enableSecondsLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
const enableExpired = computed(() => enableSecondsLeft.value === 0)

const enableResendCooldown  = ref(0)
const enableResendRemaining = ref(5)
let   enableResendTimer: ReturnType<typeof setInterval> | null = null

function startEnableCountdown(seconds = 300) {
  enableSecondsLeft.value = seconds
  if (enableTimer) clearInterval(enableTimer)
  enableTimer = setInterval(() => {
    enableSecondsLeft.value = Math.max(0, enableSecondsLeft.value - 1)
    if (enableSecondsLeft.value === 0 && enableTimer) clearInterval(enableTimer)
  }, 1000)
}

function startEnableResendCooldown(seconds = 60) {
  enableResendCooldown.value = seconds
  if (enableResendTimer) clearInterval(enableResendTimer)
  enableResendTimer = setInterval(() => {
    enableResendCooldown.value = Math.max(0, enableResendCooldown.value - 1)
    if (enableResendCooldown.value === 0 && enableResendTimer) clearInterval(enableResendTimer)
  }, 1000)
}

const enableDigitRefs = ref<HTMLInputElement[]>([])

function onEnableInput(i: number, e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  enableDigits.value[i] = val.slice(-1)
  if (val && i < 5) nextTick(() => enableDigitRefs.value[i + 1]?.focus())
  if (enableCode.value.length === 6) submitEnableOtp()
}
function onEnableKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !enableDigits.value[i] && i > 0)
    nextTick(() => enableDigitRefs.value[i - 1]?.focus())
}
function onEnablePaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  if (!pasted) return
  e.preventDefault()
  for (let i = 0; i < 6; i++) enableDigits.value[i] = pasted[i] ?? ''
  nextTick(() => {
    const idx = Math.min(pasted.length, 5)
    enableDigitRefs.value[idx]?.focus()
    if (pasted.length === 6) submitEnableOtp()
  })
}
function clearEnableDigits() {
  enableDigits.value = ['', '', '', '', '', '']
  enableOtpError.value = ''
  nextTick(() => enableDigitRefs.value[0]?.focus())
}

async function requestEnable2FA() {
  enableLoading.value = true
  enableError.value = ''
  try {
    const res = await api.post<{ message: string; email_masked: string; otp_expires_at: string }>(
      '/auth/2fa/setup'
    )
    enableEmailMasked.value = res.email_masked ?? ''
    startEnableCountdown(300)
    startEnableResendCooldown(60)
    enableStep.value = 'otp'
    nextTick(() => enableDigitRefs.value[0]?.focus())
  } catch (err: unknown) {
    enableError.value = (err as { message?: string }).message || 'Failed to send verification code. Please try again.'
  } finally {
    enableLoading.value = false
  }
}

async function submitEnableOtp() {
  if (enableCode.value.length !== 6 || enableOtpLoading.value) return
  enableOtpLoading.value = true
  enableOtpError.value = ''
  try {
    await api.post('/auth/2fa/verify', { otp_code: enableCode.value })
    if (enableTimer) clearInterval(enableTimer)
    await auth.fetchMe()
    enableStep.value = 'idle'
    toastSuccess('2FA has been enabled successfully.')
  } catch (err: unknown) {
    clearEnableDigits()
    const e = err as { code?: string; message?: string }
    if (e.code === 'OTP_EXPIRED') {
      enableOtpError.value = 'Code expired. Click Resend to get a new one.'
    } else {
      enableOtpError.value = 'Incorrect code. Please check your email and try again.'
    }
  } finally {
    enableOtpLoading.value = false
  }
}

async function resendEnableOtp() {
  if (enableResendCooldown.value > 0) return
  enableOtpError.value = ''
  try {
    const res = await api.post<{ message: string; email_masked: string; remaining_resends: number }>(
      '/public/auth/2fa/resend-code',
      { purpose: 'setup' }
    )
    enableResendRemaining.value = res.remaining_resends ?? enableResendRemaining.value - 1
    startEnableCountdown(300)
    startEnableResendCooldown(60)
    clearEnableDigits()
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    enableOtpError.value = e.code === 'OTP_RESEND_RATE_LIMIT'
      ? 'Too many resend attempts. Please wait a moment.'
      : e.message || 'Failed to resend code.'
  }
}

function cancelEnable() {
  if (enableTimer) clearInterval(enableTimer)
  if (enableResendTimer) clearInterval(enableResendTimer)
  enableStep.value = 'idle'
  enableDigits.value = ['', '', '', '', '', '']
  enableOtpError.value = ''
  enableError.value = ''
}

// ─────────────────────────────────────────────────────────────────────────────
// DISABLE 2FA FLOW (Opsi B — step-up)
// Step 1: POST /auth/step-up/request  → {action, resource} → OTP sent
// Step 2: POST /auth/step-up/verify   → {otp_code, action, resource} → stepup_token
// Step 3: POST /auth/2fa/disable      → X-Stepup-Token header → done
// ─────────────────────────────────────────────────────────────────────────────
type DisableStep = 'idle' | 'confirm' | 'otp' | 'disabling'
const disableStep    = ref<DisableStep>('idle')
const disableLoading = ref(false)
const disableError   = ref('')

const disableDigits = ref(['', '', '', '', '', ''])
const disableCode   = computed(() => disableDigits.value.join(''))
const disableOtpLoading = ref(false)
const disableOtpError   = ref('')

const disableSecondsLeft = ref(600)
let   disableTimer: ReturnType<typeof setInterval> | null = null
const disableCountdown = computed(() => {
  const m = Math.floor(disableSecondsLeft.value / 60)
  const s = disableSecondsLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
const disableExpired = computed(() => disableSecondsLeft.value === 0)

const disableResendCooldown = ref(0)
let   disableResendTimer: ReturnType<typeof setInterval> | null = null

function startDisableCountdown(seconds = 600) {
  disableSecondsLeft.value = seconds
  if (disableTimer) clearInterval(disableTimer)
  disableTimer = setInterval(() => {
    disableSecondsLeft.value = Math.max(0, disableSecondsLeft.value - 1)
    if (disableSecondsLeft.value === 0 && disableTimer) clearInterval(disableTimer)
  }, 1000)
}
function startDisableResendCooldown(seconds = 60) {
  disableResendCooldown.value = seconds
  if (disableResendTimer) clearInterval(disableResendTimer)
  disableResendTimer = setInterval(() => {
    disableResendCooldown.value = Math.max(0, disableResendCooldown.value - 1)
    if (disableResendCooldown.value === 0 && disableResendTimer) clearInterval(disableResendTimer)
  }, 1000)
}

const disableDigitRefs = ref<HTMLInputElement[]>([])
function onDisableInput(i: number, e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  disableDigits.value[i] = val.slice(-1)
  if (val && i < 5) nextTick(() => disableDigitRefs.value[i + 1]?.focus())
  if (disableCode.value.length === 6) submitDisableOtp()
}
function onDisableKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !disableDigits.value[i] && i > 0)
    nextTick(() => disableDigitRefs.value[i - 1]?.focus())
}
function onDisablePaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  if (!pasted) return
  e.preventDefault()
  for (let i = 0; i < 6; i++) disableDigits.value[i] = pasted[i] ?? ''
  nextTick(() => {
    const idx = Math.min(pasted.length, 5)
    disableDigitRefs.value[idx]?.focus()
    if (pasted.length === 6) submitDisableOtp()
  })
}
function clearDisableDigits() {
  disableDigits.value = ['', '', '', '', '', '']
  disableOtpError.value = ''
  nextTick(() => disableDigitRefs.value[0]?.focus())
}

async function requestDisable2FA() {
  disableLoading.value = true
  disableError.value = ''
  try {
    await api.post('/auth/step-up/request', { action: 'disable_2fa', resource: 'self' })
    startDisableCountdown(600)
    startDisableResendCooldown(60)
    disableStep.value = 'otp'
    nextTick(() => disableDigitRefs.value[0]?.focus())
  } catch (err: unknown) {
    disableError.value = (err as { message?: string }).message || 'Failed to send verification code.'
  } finally {
    disableLoading.value = false
  }
}

async function submitDisableOtp() {
  if (disableCode.value.length !== 6 || disableOtpLoading.value) return
  disableOtpLoading.value = true
  disableOtpError.value = ''
  try {
    const res = await api.post<{ stepup_token: string; expires_at: string }>(
      '/auth/step-up/verify',
      { otp_code: disableCode.value, action: 'disable_2fa', resource: 'self' }
    )
    // Step 3: use stepup_token to disable
    disableStep.value = 'disabling'
    await api.post('/auth/2fa/disable', {}, { headers: { 'X-Stepup-Token': res.stepup_token } })
    if (disableTimer) clearInterval(disableTimer)
    await auth.fetchMe()
    disableStep.value = 'idle'
    toastSuccess('2FA has been disabled.')
  } catch (err: unknown) {
    clearDisableDigits()
    const e = err as { code?: string; status?: number; message?: string }
    if (e.code === 'OTP_EXPIRED') {
      disableOtpError.value = 'Code expired. Click Resend to get a new one.'
      disableStep.value = 'otp'
    } else if (e.code === 'STEP_UP_EXPIRED' || e.code === 'STEP_UP_REQUIRED') {
      disableOtpError.value = 'Verification session expired. Please start again.'
      disableStep.value = 'otp'
    } else {
      disableOtpError.value = e.message || 'Incorrect code. Please try again.'
      disableStep.value = 'otp'
    }
  } finally {
    disableOtpLoading.value = false
  }
}

async function resendDisableOtp() {
  if (disableResendCooldown.value > 0) return
  disableOtpError.value = ''
  try {
    await api.post('/public/auth/2fa/resend-code', { purpose: 'step_up' })
    startDisableCountdown(600)
    startDisableResendCooldown(60)
    clearDisableDigits()
  } catch (err: unknown) {
    disableOtpError.value = (err as { message?: string }).message || 'Failed to resend code.'
  }
}

function cancelDisable() {
  if (disableTimer) clearInterval(disableTimer)
  if (disableResendTimer) clearInterval(disableResendTimer)
  disableStep.value = 'idle'
  disableDigits.value = ['', '', '', '', '', '']
  disableOtpError.value = ''
  disableError.value = ''
}

onUnmounted(() => {
  [enableTimer, enableResendTimer, disableTimer, disableResendTimer].forEach(t => { if (t) clearInterval(t) })
})
</script>

<template>
  <div class="flex-1 min-w-0 space-y-6">

    <!-- Page heading -->
    <div>
      <h2 class="text-xl font-bold text-slate-800">Security</h2>
      <p class="text-sm text-slate-400 mt-0.5">Manage your account security settings</p>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         TWO-FACTOR AUTHENTICATION
    ═══════════════════════════════════════════════════════════ -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-start gap-4">
        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', twoFAEnabled ? 'bg-emerald-100' : 'bg-slate-100']">
          <svg :class="['w-5 h-5', twoFAEnabled ? 'text-emerald-600' : 'text-slate-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-base font-bold text-slate-800">Two-Factor Authentication (2FA)</h3>
            <span v-if="twoFAEnabled" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Enabled
            </span>
            <span v-else class="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              Disabled
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-1 leading-relaxed">
            Add an extra layer of security. When enabled, you'll receive a 6-digit code via email each time you sign in.
          </p>
        </div>
      </div>

      <div class="px-6 py-5">

        <!-- ── ENABLE FLOW ─────────────────────────────────────────────────── -->
        <template v-if="!twoFAEnabled">

          <!-- Idle: enable CTA -->
          <div v-if="enableStep === 'idle'">
            <div v-if="enableError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ enableError }}</span>
            </div>
            <div class="flex items-start gap-4 p-4 bg-primary-50 rounded-xl border border-primary-100 mb-5">
              <svg class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-sm text-primary-700">
                We'll send a 6-digit verification code to <strong>{{ auth.user?.email }}</strong> every time you sign in.
              </p>
            </div>
            <BaseButton variant="primary" :loading="enableLoading" :disabled="enableLoading" @click="requestEnable2FA">
              Enable Two-Factor Authentication
            </BaseButton>
          </div>

          <!-- OTP step (enable) -->
          <div v-else-if="enableStep === 'otp'" class="max-w-sm">
            <p class="text-sm text-slate-600 mb-5 leading-relaxed">
              We sent a 6-digit code to
              <span class="font-semibold text-slate-800">{{ enableEmailMasked || auth.user?.email }}</span>.
              Enter it below to activate 2FA.
            </p>

            <!-- Error -->
            <div v-if="enableOtpError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ enableOtpError }}</span>
            </div>

            <!-- Expired banner -->
            <div v-if="enableExpired && !enableOtpError" class="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Code expired. Click <strong>Resend</strong> to get a new one.</span>
            </div>

            <!-- 6-digit boxes -->
            <div class="flex gap-2.5 mb-4" aria-label="Verification code input">
              <input
                v-for="(_, i) in enableDigits"
                :key="i"
                :ref="(el) => { if (el) enableDigitRefs[i] = el as HTMLInputElement }"
                v-model="enableDigits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                :disabled="enableOtpLoading || enableExpired"
                :class="[
                  'w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-150',
                  'focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
                  enableDigits[i] ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white',
                  (enableOtpLoading || enableExpired) ? 'opacity-50 cursor-not-allowed' : '',
                  enableOtpError ? 'border-red-300 bg-red-50' : ''
                ]"
                :aria-label="`Digit ${i + 1}`"
                @input="onEnableInput(i, $event)"
                @keydown="onEnableKeydown(i, $event)"
                @paste="onEnablePaste"
              />
            </div>

            <!-- Timer -->
            <p class="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span v-if="!enableExpired">Code expires in <span class="font-semibold tabular-nums" :class="enableSecondsLeft < 60 ? 'text-amber-600' : ''">{{ enableCountdown }}</span></span>
              <span v-else class="text-amber-600 font-medium">Code has expired</span>
            </p>

            <div class="flex items-center gap-3 flex-wrap">
              <BaseButton
                variant="primary"
                :loading="enableOtpLoading"
                :disabled="enableOtpLoading || enableCode.length < 6 || enableExpired"
                @click="submitEnableOtp"
              >
                Verify & Enable
              </BaseButton>
              <button
                type="button"
                :disabled="enableResendCooldown > 0"
                :class="['text-sm font-medium transition-colors', enableResendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700']"
                @click="resendEnableOtp"
              >
                {{ enableResendCooldown > 0 ? `Resend in ${enableResendCooldown}s` : 'Resend code' }}
              </button>
              <button type="button" class="text-sm text-slate-400 hover:text-slate-600 transition-colors" @click="cancelEnable">
                Cancel
              </button>
            </div>
          </div>
        </template>

        <!-- ── DISABLE FLOW ────────────────────────────────────────────────── -->
        <template v-else>

          <!-- Idle: disable CTA -->
          <div v-if="disableStep === 'idle' || disableStep === 'confirm'">
            <div class="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-5">
              <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p class="text-sm text-amber-700">
                Disabling 2FA will make your account less secure. You will only need your password to sign in.
              </p>
            </div>

            <div v-if="disableError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ disableError }}</span>
            </div>

            <BaseButton
              variant="secondary"
              class="!text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300"
              :loading="disableLoading"
              :disabled="disableLoading"
              @click="requestDisable2FA"
            >
              Disable Two-Factor Authentication
            </BaseButton>
          </div>

          <!-- OTP step (disable / step-up verify) -->
          <div v-else-if="disableStep === 'otp' || disableStep === 'disabling'" class="max-w-sm">
            <p class="text-sm text-slate-600 mb-5 leading-relaxed">
              For your security, we sent a 6-digit verification code to
              <span class="font-semibold text-slate-800">{{ auth.user?.email }}</span>.
              Enter it to confirm disabling 2FA.
            </p>

            <!-- Error -->
            <div v-if="disableOtpError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ disableOtpError }}</span>
            </div>

            <!-- Expired banner -->
            <div v-if="disableExpired && !disableOtpError" class="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Code expired. Click <strong>Resend</strong> to get a new one.</span>
            </div>

            <!-- 6-digit boxes -->
            <div class="flex gap-2.5 mb-4" aria-label="Verification code input">
              <input
                v-for="(_, i) in disableDigits"
                :key="i"
                :ref="(el) => { if (el) disableDigitRefs[i] = el as HTMLInputElement }"
                v-model="disableDigits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                :disabled="disableOtpLoading || disableExpired || disableStep === 'disabling'"
                :class="[
                  'w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-150',
                  'focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
                  disableDigits[i] ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white',
                  (disableOtpLoading || disableExpired || disableStep === 'disabling') ? 'opacity-50 cursor-not-allowed' : '',
                  disableOtpError ? 'border-red-300 bg-red-50' : ''
                ]"
                :aria-label="`Digit ${i + 1}`"
                @input="onDisableInput(i, $event)"
                @keydown="onDisableKeydown(i, $event)"
                @paste="onDisablePaste"
              />
            </div>

            <!-- Timer -->
            <p class="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span v-if="!disableExpired">Code expires in <span class="font-semibold tabular-nums" :class="disableSecondsLeft < 60 ? 'text-amber-600' : ''">{{ disableCountdown }}</span></span>
              <span v-else class="text-amber-600 font-medium">Code has expired</span>
            </p>

            <!-- Loading state for step 3 -->
            <div v-if="disableStep === 'disabling'" class="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Disabling 2FA...
            </div>

            <div v-else class="flex items-center gap-3 flex-wrap">
              <BaseButton
                variant="primary"
                class="!bg-red-500 hover:!bg-red-600 !border-red-500"
                :loading="disableOtpLoading"
                :disabled="disableOtpLoading || disableCode.length < 6 || disableExpired"
                @click="submitDisableOtp"
              >
                Confirm Disable
              </BaseButton>
              <button
                type="button"
                :disabled="disableResendCooldown > 0"
                :class="['text-sm font-medium transition-colors', disableResendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700']"
                @click="resendDisableOtp"
              >
                {{ disableResendCooldown > 0 ? `Resend in ${disableResendCooldown}s` : 'Resend code' }}
              </button>
              <button type="button" class="text-sm text-slate-400 hover:text-slate-600 transition-colors" @click="cancelDisable">
                Cancel
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>

  </div>
</template>
