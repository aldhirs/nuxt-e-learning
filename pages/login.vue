<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'

definePageMeta({ layout: 'default', middleware: 'guest' })

useSeoMeta({ title: 'Sign In' })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

// ── Step state ────────────────────────────────────────────────────────────────
type Step = 'credentials' | 'otp'
const step = ref<Step>('credentials')

// ── Step 1: Credentials ───────────────────────────────────────────────────────
const form = reactive({ email: '', password: '' })
const isLoading = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const showActivationHint = ref(false)

const FORM_FIELDS = ['email', 'password']
watch(() => ({ ...form }), () => { if (Object.keys(fieldErrors.value).length) fieldErrors.value = {} }, { deep: true })

const rules = {
  email: { required, email },
  password: { required, minLength: minLength(8) }
}
const v$ = useVuelidate(rules, form)

// ── Step 2: OTP ────────────────────────────────────────────────────────────────
const preAuthToken = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const otpCode = computed(() => otpDigits.value.join(''))
const otpError = ref('')
const isOtpLoading = ref(false)
const emailMasked = ref('')

// Countdown timer
const secondsLeft = ref(300) // 5 min default
let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown(seconds: number) {
  secondsLeft.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    secondsLeft.value = Math.max(0, secondsLeft.value - 1)
    if (secondsLeft.value === 0 && countdownTimer) clearInterval(countdownTimer)
  }, 1000)
}

const countdownDisplay = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const isOtpExpired = computed(() => secondsLeft.value === 0)

// Resend
const resendCooldown = ref(0)
const resendRemaining = ref(5)
let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown(seconds = 60) {
  resendCooldown.value = seconds
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldown.value = Math.max(0, resendCooldown.value - 1)
    if (resendCooldown.value === 0 && resendTimer) clearInterval(resendTimer)
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (resendTimer) clearInterval(resendTimer)
})

// OTP digit box refs for focus management
const digitRefs = ref<HTMLInputElement[]>([])

function onDigitInput(index: number, event: Event) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  otpDigits.value[index] = val.slice(-1)
  if (val && index < 5) {
    nextTick(() => digitRefs.value[index + 1]?.focus())
  }
  if (otpCode.value.length === 6) submitOtp()
}

function onDigitKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => digitRefs.value[index - 1]?.focus())
  }
}

function onDigitPaste(event: ClipboardEvent) {
  const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? ''
  if (!pasted) return
  event.preventDefault()
  for (let i = 0; i < 6; i++) {
    otpDigits.value[i] = pasted[i] ?? ''
  }
  nextTick(() => {
    const focusIdx = Math.min(pasted.length, 5)
    digitRefs.value[focusIdx]?.focus()
    if (pasted.length === 6) submitOtp()
  })
}

function clearOtp() {
  otpDigits.value = ['', '', '', '', '', '']
  otpError.value = ''
  nextTick(() => digitRefs.value[0]?.focus())
}

// ── Redirect destination ──────────────────────────────────────────────────────
const redirectTo = computed(() => (route.query.redirect as string) ?? '/')

function postLoginRedirect() {
  const hasPartnerRole =
    !!auth.user?.active_client_id &&
    (auth.user?.roles ?? []).some(r => r.role_name === 'CLIENT_OWNER' && r.client_id != null)
  const hasStudentRole = auth.user?.is_student === true || !hasPartnerRole
  let dest = redirectTo.value
  if (dest === '/') dest = hasPartnerRole && !hasStudentRole ? '/partner/dashboard' : '/'
  router.push(dest)
}

// ── Step 1 submit ─────────────────────────────────────────────────────────────
async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  showActivationHint.value = false
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    const result = await auth.login({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      device_name: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined,
    })

    // 2FA required — transition to OTP step
    if ('requires_2fa' in result && result.requires_2fa) {
      preAuthToken.value = result.pre_auth_token
      startCountdown(result.expires_in ?? 300)
      startResendCooldown(60)
      step.value = 'otp'
      nextTick(() => digitRefs.value[0]?.focus())
      return
    }

    postLoginRedirect()
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; payload?: { redirect_to_activation?: boolean } }
    const reason = (e.reason || '').toLowerCase()
    const code = e.code || ''
    if (code === 'ACCOUNT_NOT_ACTIVATED' || e.payload?.redirect_to_activation || reason.includes('not activated') || reason.includes('belum diaktivasi')) {
      serverError.value = 'Account not activated. Check your email for the activation link.'
      showActivationHint.value = true
      return
    }
    if (e.status === 423 || reason.includes('locked')) {
      serverError.value = 'Account temporarily locked due to too many attempts. Try again in 15 minutes.'
      return
    }
    const { global, perField } = mapApiError(err, FORM_FIELDS)
    fieldErrors.value = perField
    serverError.value = global || 'Incorrect email or password.'
  } finally {
    isLoading.value = false
  }
}

async function resendActivation() {
  try {
    await auth.resendActivation(form.email.trim().toLowerCase())
    serverError.value = 'Activation link has been resent. Check your inbox.'
    showActivationHint.value = false
  } catch (err: unknown) {
    serverError.value = (err as { message?: string }).message || 'Failed to resend activation link.'
  }
}

// ── Step 2: OTP submit ────────────────────────────────────────────────────────
async function submitOtp() {
  if (otpCode.value.length !== 6 || isOtpLoading.value) return
  otpError.value = ''
  isOtpLoading.value = true
  try {
    await auth.login2FA(preAuthToken.value, otpCode.value)
    if (countdownTimer) clearInterval(countdownTimer)
    postLoginRedirect()
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string }
    clearOtp()
    if (e.code === 'OTP_EXPIRED' || e.status === 422 && (e.message ?? '').toLowerCase().includes('kedaluwarsa')) {
      otpError.value = 'Verification code has expired. Click Resend to get a new one.'
    } else if (e.code === 'PRE_AUTH_TOKEN_INVALID' || e.status === 401) {
      otpError.value = 'Your login session has expired. Please sign in again.'
      setTimeout(() => backToCredentials(), 2000)
    } else {
      otpError.value = 'Incorrect code. Please check your email and try again.'
    }
  } finally {
    isOtpLoading.value = false
  }
}

async function resendOtp() {
  if (resendCooldown.value > 0) return
  otpError.value = ''
  try {
    const res = await auth.resendOtp(preAuthToken.value)
    emailMasked.value = res.email_masked ?? emailMasked.value
    resendRemaining.value = res.remaining_resends ?? resendRemaining.value - 1
    startCountdown(300)
    startResendCooldown(60)
    clearOtp()
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'OTP_RESEND_RATE_LIMIT') {
      otpError.value = 'Too many resend attempts. Please wait a moment.'
    } else {
      otpError.value = e.message || 'Failed to resend code. Please try again.'
    }
  }
}

function backToCredentials() {
  if (countdownTimer) clearInterval(countdownTimer)
  if (resendTimer) clearInterval(resendTimer)
  step.value = 'credentials'
  preAuthToken.value = ''
  otpDigits.value = ['', '', '', '', '', '']
  otpError.value = ''
}
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">

      <!-- ── Step 1: Credentials ──────────────────────────────────────────── -->
      <Transition name="step" mode="out-in">
        <div v-if="step === 'credentials'" key="credentials">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-slate-800">Sign In to DrillSpace</h1>
            <p class="text-slate-500 text-sm mt-2">Don't have an account?
              <NuxtLink to="/register" class="text-primary-600 font-medium hover:underline">Sign up as Student</NuxtLink>
              ·
              <NuxtLink to="/partner/register" class="text-primary-600 font-medium hover:underline">Become a Partner</NuxtLink>
            </p>
          </div>

          <BaseCard shadow="md" padding="lg" class="border border-slate-200">
            <div v-if="serverError" class="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ serverError }}</span>
              </div>
              <button
                v-if="showActivationHint"
                type="button"
                class="self-start text-xs underline text-red-800 hover:text-red-900"
                @click="resendActivation"
              >Resend activation link</button>
            </div>

            <form class="space-y-4" @submit.prevent="submit">
              <BaseInput
                v-model="form.email"
                type="email"
                label="Email"
                placeholder="email@example.com"
                :error="fieldErrors.email || (v$.email.$error ? 'Invalid email' : '')"
                required
                @blur="v$.email.$touch"
              />
              <BaseInput
                v-model="form.password"
                type="password"
                label="Password"
                placeholder="Min. 8 characters"
                :error="fieldErrors.password || (v$.password.$error ? 'Password must be at least 8 characters' : '')"
                required
                @blur="v$.password.$touch"
              />
              <div class="flex items-center justify-end">
                <NuxtLink to="/forgot-password" class="text-xs text-primary-600 hover:underline">Forgot password?</NuxtLink>
              </div>
              <BaseButton type="submit" variant="primary" size="lg" block :loading="isLoading" :disabled="isLoading">
                Sign In
              </BaseButton>
            </form>
          </BaseCard>
        </div>

        <!-- ── Step 2: OTP Verification ─────────────────────────────────────── -->
        <div v-else key="otp">
          <div class="text-center mb-8">
            <!-- Shield icon -->
            <div class="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-slate-800">2-Factor Verification</h1>
            <p class="text-slate-500 text-sm mt-2 leading-relaxed">
              We sent a 6-digit verification code to
              <span v-if="emailMasked" class="font-semibold text-slate-700">{{ emailMasked }}</span>
              <span v-else>your email</span>.
              Enter it below to complete sign in.
            </p>
          </div>

          <BaseCard shadow="md" padding="lg" class="border border-slate-200">

            <!-- OTP Error -->
            <div v-if="otpError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ otpError }}</span>
            </div>

            <!-- OTP expired banner -->
            <div v-if="isOtpExpired && !otpError" class="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-5 text-sm text-amber-700" role="alert">
              <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Code expired. Click <strong>Resend</strong> to get a new one.</span>
            </div>

            <!-- 6-digit input boxes -->
            <div class="flex justify-center gap-3 mb-6" aria-label="One-time password input">
              <input
                v-for="(_, i) in otpDigits"
                :key="i"
                :ref="(el) => { if (el) digitRefs[i] = el as HTMLInputElement }"
                v-model="otpDigits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                :disabled="isOtpLoading || isOtpExpired"
                :class="[
                  'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-150',
                  'focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
                  otpDigits[i] ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-900',
                  (isOtpLoading || isOtpExpired) ? 'opacity-50 cursor-not-allowed' : '',
                  otpError ? 'border-red-300 bg-red-50' : ''
                ]"
                :aria-label="`Digit ${i + 1}`"
                @input="onDigitInput(i, $event)"
                @keydown="onDigitKeydown(i, $event)"
                @paste="onDigitPaste"
              />
            </div>

            <!-- Timer -->
            <div class="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-6">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span v-if="!isOtpExpired">Code expires in <span class="font-semibold tabular-nums" :class="secondsLeft < 60 ? 'text-amber-600' : 'text-slate-700'">{{ countdownDisplay }}</span></span>
              <span v-else class="text-amber-600 font-medium">Code has expired</span>
            </div>

            <!-- Verify button -->
            <BaseButton
              type="button"
              variant="primary"
              size="lg"
              block
              :loading="isOtpLoading"
              :disabled="isOtpLoading || otpCode.length < 6 || isOtpExpired"
              @click="submitOtp"
            >
              <template v-if="isOtpLoading">Verifying...</template>
              <template v-else>Verify Code</template>
            </BaseButton>

            <!-- Resend + back -->
            <div class="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                class="text-slate-500 hover:text-slate-700 transition-colors"
                @click="backToCredentials"
              >
                ← Back to sign in
              </button>

              <button
                type="button"
                :disabled="resendCooldown > 0"
                :class="[
                  'font-medium transition-colors',
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-primary-600 hover:text-primary-700'
                ]"
                @click="resendOtp"
              >
                <span v-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
                <span v-else>Resend code</span>
              </button>
            </div>

            <p v-if="resendRemaining <= 2 && resendRemaining > 0" class="mt-3 text-xs text-amber-600 text-center">
              {{ resendRemaining }} resend attempt{{ resendRemaining !== 1 ? 's' : '' }} remaining.
            </p>
          </BaseCard>
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.step-enter-active, .step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.step-enter-from { opacity: 0; transform: translateX(20px); }
.step-leave-to   { opacity: 0; transform: translateX(-20px); }
</style>
