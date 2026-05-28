<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, sameAs, helpers } from '@vuelidate/validators'

// Mirrors BE isPasswordComplex: min 8 char, must contain letter AND digit.
const passwordComplex = helpers.withMessage(
  'Password must be at least 8 characters and contain letters and numbers',
  (v: string) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v) && v.length >= 8
)

definePageMeta({ layout: 'minimal' })
useSeoMeta({ title: 'Reset Password' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const tokenParam = computed(() => (route.query.token as string | undefined)?.trim() || '')

const form = reactive({ password: '', password_confirm: '' })
const isLoading = ref(false)
const serverError = ref('')
const success = ref(false)

const passwordRef = computed(() => form.password)
const rules = {
  password: { required, passwordComplex },
  password_confirm: {
    required,
    sameAs: helpers.withMessage('Passwords do not match', sameAs(passwordRef))
  }
}
const v$ = useVuelidate(rules, form)

async function submit() {
  serverError.value = ''
  if (!tokenParam.value) {
    serverError.value = 'Invalid reset link. Token not found.'
    return
  }
  const ok = await v$.value.$validate()
  if (!ok) return
  isLoading.value = true
  try {
    await auth.resetPassword({
      token: tokenParam.value,
      new_password: form.password
    })
    success.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    if (e.status === 404) {
      serverError.value = e.message || 'Reset link is invalid or has expired. Request a new one?'
    } else if (e.status === 422) {
      serverError.value = e.message || 'Password does not meet requirements.'
    } else {
      serverError.value = e.message || 'Failed to reset password.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Reset Password</h1>
        <p class="text-slate-500 text-sm mt-2">Create a new password for your account.</p>
      </div>

      <!-- Invalid: no token -->
      <div v-if="!tokenParam" class="text-center py-8">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Invalid Link</h2>
        <p class="text-slate-500 text-sm mb-6">Reset token not found. Make sure you opened the link from our email.</p>
        <BaseButton variant="primary" to="/forgot-password">Request New Link</BaseButton>
      </div>

      <!-- Success -->
      <div v-else-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Password reset successful</h2>
        <p class="text-slate-500 text-sm mb-6">Please sign in with your new password. Redirecting…</p>
      </div>

      <!-- Form -->
      <BaseCard v-else shadow="md" padding="lg" class="border border-slate-200">
        <div v-if="serverError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ serverError }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <BaseInput
            v-model="form.password"
            type="password"
            label="New Password"
            placeholder="Min. 8 characters"
            :error="v$.password.$error ? (v$.password.$errors[0]?.$message as string) : ''"
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
            :loading="isLoading"
            :disabled="isLoading || v$.$invalid"
          >
            Reset Password
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
