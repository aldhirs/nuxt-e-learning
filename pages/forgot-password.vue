<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Forgot Password' })

const auth = useAuthStore()

const form = reactive({ email: '' })
const isLoading = ref(false)
const serverError = ref('')
const success = ref(false)
const successMessage = ref('')

const rules = { email: { required, email } }
const v$ = useVuelidate(rules, form)

async function submit() {
  serverError.value = ''
  const ok = await v$.value.$validate()
  if (!ok) return
  isLoading.value = true
  try {
    const res = await auth.forgotPassword(form.email.trim().toLowerCase())
    successMessage.value = res.message || 'If your email is registered, we have sent you a password reset link. Check your inbox.'
    success.value = true
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    if (e.status === 429) {
      serverError.value = e.message || 'Too many password reset requests. Try again in 1 hour.'
    } else if (e.status === 422) {
      serverError.value = e.message || 'Invalid email.'
    } else {
      serverError.value = e.message || 'Something went wrong. Please try again.'
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
        <h1 class="text-2xl font-bold text-slate-800">Forgot Password</h1>
        <p class="text-slate-500 text-sm mt-2">Enter your email and we will send you a password reset link.</p>
      </div>

      <div v-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Check your inbox</h2>
        <p class="text-slate-500 text-sm mb-6">{{ successMessage }}</p>
        <p class="text-xs text-slate-400 mb-6">The link will expire in 1 hour.</p>
        <BaseButton variant="ghost" to="/login">Back to Login</BaseButton>
      </div>

      <BaseCard v-else shadow="md" padding="lg" class="border border-slate-200">
        <div v-if="serverError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ serverError }}
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="email@example.com"
            :error="v$.email.$error ? 'Invalid email' : ''"
            required
            @blur="v$.email.$touch"
          />

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="isLoading || v$.$invalid"
          >
            Send Reset Link
          </BaseButton>

          <div class="text-center">
            <NuxtLink to="/login" class="text-xs text-slate-500 hover:text-primary-600">← Back to login</NuxtLink>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
