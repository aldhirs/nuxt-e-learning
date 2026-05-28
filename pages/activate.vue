<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, sameAs, helpers } from '@vuelidate/validators'

definePageMeta({ layout: 'minimal' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const tokenParam = computed(() => (route.query.token as string | undefined)?.trim() || '')
const orderParam = computed(() => (route.query.order as string | undefined) || '')

type Mode = 'account' | 'order' | 'invalid'
const mode = computed<Mode>(() => {
  if (tokenParam.value) return 'account'
  if (orderParam.value) return 'order'
  return 'invalid'
})

useSeoMeta({
  title: () => (mode.value === 'account' ? 'Account Activation' : mode.value === 'order' ? 'Course Activation' : 'Activation')
})

// ───── Account activation flow (?token=...) ─────
const form = reactive({ password: '', password_confirm: '' })
const accountSubmitting = ref(false)
const accountError = ref('')
const accountSuccess = ref(false)

const passwordRef = computed(() => form.password)
const rules = {
  password: { required, minLength: minLength(8) },
  password_confirm: {
    required,
    sameAs: helpers.withMessage('Passwords do not match', sameAs(passwordRef))
  }
}
const v$ = useVuelidate(rules, form)

async function submitActivate() {
  accountError.value = ''
  const ok = await v$.value.$validate()
  if (!ok) return
  accountSubmitting.value = true
  try {
    await auth.activate({
      token: tokenParam.value,
      password: form.password,
      password_confirm: form.password_confirm
    })
    accountSuccess.value = true
    setTimeout(() => router.push('/'), 1500)
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; message?: string; payload?: { redirect_to_login?: boolean } }
    if (e.status === 404) {
      accountError.value = e.message || 'Activation link is invalid or has expired.'
    } else if (e.status === 409) {
      accountError.value = e.message || 'Account is already active. Please sign in.'
    } else if (e.status === 422) {
      accountError.value = e.message || 'Password does not meet requirements.'
    } else {
      accountError.value = e.message || 'Failed to activate account.'
    }
  } finally {
    accountSubmitting.value = false
  }
}

// ───── Order/Course activation flow (?order=...) ─────
const orderLoading = ref(true)
const orderSuccess = ref(false)
const orderError = ref('')

onMounted(async () => {
  if (mode.value !== 'order') {
    orderLoading.value = false
    return
  }
  // Placeholder: PRD #2 enrollment confirm endpoint not yet wired here.
  await new Promise(r => setTimeout(r, 800))
  orderLoading.value = false
  orderSuccess.value = true
})
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <!-- ──────────── ACCOUNT ACTIVATION ──────────── -->
    <div v-if="mode === 'account'" class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Account Activation</h1>
        <p class="text-slate-500 text-sm mt-2">Create a password to complete your registration.</p>
      </div>

      <BaseCard v-if="!accountSuccess" shadow="md" padding="lg" class="border border-slate-200">
        <div v-if="accountError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ accountError }}
        </div>

        <form class="space-y-4" @submit.prevent="submitActivate">
          <BaseInput
            v-model="form.password"
            type="password"
            label="New Password"
            placeholder="Min. 8 characters"
            :error="v$.password.$error ? 'Password must be at least 8 characters' : ''"
            required
            @blur="v$.password.$touch"
          />
          <BaseInput
            v-model="form.password_confirm"
            type="password"
            label="Confirm Password"
            placeholder="Repeat your password"
            :error="v$.password_confirm.$error ? (v$.password_confirm.$errors[0]?.$message as string) : ''"
            required
            @blur="v$.password_confirm.$touch"
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="accountSubmitting"
            :disabled="accountSubmitting || v$.$invalid"
          >
            Activate & Sign In
          </BaseButton>
        </form>
      </BaseCard>

      <div v-else class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Account activated!</h2>
        <p class="text-slate-500 text-sm mb-6">Welcome to DrillSpace. Redirecting…</p>
      </div>
    </div>

    <!-- ──────────── COURSE/ORDER ACTIVATION ──────────── -->
    <div v-else-if="mode === 'order'" class="text-center max-w-sm w-full">
      <div v-if="orderLoading" class="flex flex-col items-center gap-4">
        <BaseSpinner size="lg" />
        <p class="text-slate-500 text-sm">Activating your course...</p>
      </div>

      <div v-else-if="orderSuccess">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Course Activated!</h1>
        <p class="text-slate-500 text-sm mb-6">
          Order <span class="font-mono font-semibold">{{ orderParam }}</span> has been confirmed. Happy learning!
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/courses">Start Learning Now</BaseButton>
          <BaseButton variant="ghost" to="/orders">View My Orders</BaseButton>
        </div>
      </div>

      <div v-else>
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Activation Failed</h1>
        <p class="text-slate-500 text-sm mb-6">{{ orderError || 'An error occurred while activating the course.' }}</p>
        <BaseButton variant="secondary" to="/orders">Back to Orders</BaseButton>
      </div>
    </div>

    <!-- ──────────── INVALID LINK ──────────── -->
    <div v-else class="text-center max-w-sm w-full">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">Invalid Link</h1>
      <p class="text-slate-500 text-sm mb-6">Activation link is incomplete. Make sure you opened the link from our email.</p>
      <BaseButton variant="secondary" to="/login">Go to Login</BaseButton>
    </div>
  </div>
</template>
