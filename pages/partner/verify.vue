<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Email Verification — DrillSpace' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()

const token = route.query.token as string | undefined
type VerifyState = 'checking' | 'success' | 'expired' | 'waiting'
const state = ref<VerifyState>(token ? 'checking' : 'waiting')
const resendEmail = ref((route.query.email as string) ?? '')
const resendLoading = ref(false)
const resendMessage = ref('')
const resendError = ref('')
const resendCount = ref(0)
const resendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown() {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null }
  }, 1000)
}
onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })

if (token) {
  onMounted(async () => {
    try {
      const data = await api.post<{ access_token: string }>('/public/partner/verify-email', { token })
      if (data.access_token) {
        useAuthCookie().value = data.access_token
        await auth.fetchMe()
      }
      state.value = 'success'
      setTimeout(() => router.push('/partner/dashboard?onboarding=true'), 2500)
    } catch { state.value = 'expired' }
  })
}

async function resend() {
  if (!resendEmail.value || resendCooldown.value > 0 || resendCount.value >= 3) return
  resendLoading.value = true
  resendMessage.value = ''
  resendError.value = ''
  try {
    await api.post('/public/partner/resend-verification', { email: resendEmail.value.trim() })
    resendMessage.value = 'Verification link resent. Check your inbox.'
    resendCount.value++
    startCooldown()
  } catch (err: unknown) {
    resendError.value = (err as { message?: string }).message || 'Failed to resend. Please try again.'
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
  <div class="w-full max-w-md text-center">
    <!-- Checking -->
    <div v-if="state === 'checking'" class="space-y-4">
      <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto animate-pulse">
        <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-slate-600">Verifying your email...</p>
    </div>

    <!-- Success -->
    <div v-else-if="state === 'success'" class="space-y-4">
      <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Email Verified!</h1>
      <p class="text-slate-500">Your account is active. Redirecting to your dashboard...</p>
      <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden w-48 mx-auto">
        <div class="h-full bg-primary-500 rounded-full animate-[grow_2.5s_linear_forwards]" />
      </div>
    </div>

    <!-- Expired -->
    <div v-else-if="state === 'expired'" class="space-y-4">
      <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Link Expired</h1>
      <p class="text-slate-500 text-sm">Verification links are only valid for 24 hours after registration.</p>
      <div class="mt-4 space-y-3">
        <BaseInput v-model="resendEmail" type="email" placeholder="Your registered email" label="Email" />
        <p v-if="resendMessage" class="text-sm text-green-600">{{ resendMessage }}</p>
        <p v-if="resendError" class="text-sm text-red-600">{{ resendError }}</p>
        <p v-if="resendCount >= 3" class="text-xs text-slate-400">Resend limit reached. Please contact support.</p>
        <BaseButton variant="primary" block :loading="resendLoading" :disabled="resendLoading || resendCooldown > 0 || resendCount >= 3" @click="resend">
          {{ resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Verification Link' }}
        </BaseButton>
        <NuxtLink to="/partner/register" class="block text-sm text-slate-500 hover:text-primary-600 transition-colors">← Back to registration</NuxtLink>
      </div>
    </div>

    <!-- Waiting -->
    <div v-else class="space-y-5">
      <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Check Your Email</h1>
      <p class="text-slate-500 text-sm">We sent a verification link to your email. The link is valid for 24 hours.</p>
      <p class="text-xs text-slate-400">Check your spam folder if it doesn't appear in your inbox.</p>
      <div class="pt-2 border-t border-slate-100 space-y-3">
        <p class="text-sm text-slate-500">Didn't receive the email?</p>
        <BaseInput v-model="resendEmail" type="email" placeholder="Enter your email" label="Email" />
        <p v-if="resendMessage" class="text-sm text-green-600">{{ resendMessage }}</p>
        <p v-if="resendError" class="text-sm text-red-600">{{ resendError }}</p>
        <BaseButton variant="secondary" block :loading="resendLoading" :disabled="resendLoading || resendCooldown > 0 || resendCount >= 3" @click="resend">
          {{ resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email' }}
        </BaseButton>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
@keyframes grow { from { width: 0 } to { width: 100% } }
</style>
