<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Sign In' })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

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

const redirectTo = computed(() => (route.query.redirect as string) ?? '/')

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  showActivationHint.value = false
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    await auth.login({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      device_name: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined
    })
    // Post-login role redirect: follow ?redirect param first, then role-based default
    const hasPartnerRole =
      !!auth.user?.active_client_id &&
      (auth.user?.roles ?? []).some(r => r.role_name === 'ADMIN' && r.client_id != null)
    const hasStudentRole = auth.user?.is_student === true || !hasPartnerRole

    let dest = redirectTo.value
    if (dest === '/') {
      dest = hasPartnerRole && !hasStudentRole ? '/partner/dashboard' : '/'
    }
    await router.push(dest)
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; payload?: { redirect_to_activation?: boolean } }
    const reason = (e.reason || '').toLowerCase()
    const code = e.code || ''
    // Special cases that need a sticky banner + side effects (activation hint, lockout)
    if (code === 'ACCOUNT_NOT_ACTIVATED' || e.payload?.redirect_to_activation || reason.includes('not activated') || reason.includes('belum diaktivasi')) {
      serverError.value = 'Account not activated. Check your email for the activation link.'
      showActivationHint.value = true
      return
    }
    if (e.status === 423 || reason.includes('locked')) {
      serverError.value = 'Account temporarily locked due to too many attempts. Try again in 15 minutes.'
      return
    }
    // Generic mapping (per-field + global)
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
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Sign In to DrillSpace</h1>
        <p class="text-slate-500 text-sm mt-2">Don't have an account?
          <NuxtLink to="/register" class="text-primary-600 font-medium hover:underline">Sign up as Student</NuxtLink>
          ·
          <NuxtLink to="/partner/register" class="text-primary-600 font-medium hover:underline">Become a Partner</NuxtLink>
        </p>
      </div>

      <BaseCard shadow="md" padding="lg" class="border border-slate-200">
        <!-- Server error -->
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

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="isLoading"
          >
            Sign In
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
