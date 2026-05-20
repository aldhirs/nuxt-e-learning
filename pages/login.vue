<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'

definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Masuk' })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const isLoading = ref(false)
const serverError = ref('')

const rules = {
  email: { required, email },
  password: { required, minLength: minLength(6) }
}

const v$ = useVuelidate(rules, form)

const redirectTo = computed(() => (route.query.redirect as string) ?? '/')

async function submit() {
  serverError.value = ''
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    auth.mockLogin()
    await router.push(redirectTo.value)
  } catch {
    serverError.value = 'Email atau kata sandi tidak valid. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Masuk ke DrillSpace</h1>
        <p class="text-slate-500 text-sm mt-2">Belum punya akun?
          <NuxtLink to="/register" class="text-primary-600 font-medium hover:underline">Daftar gratis</NuxtLink>
        </p>
      </div>

      <BaseCard shadow="md" padding="lg" class="border border-slate-200">
        <!-- Server error -->
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
            :error="v$.email.$error ? 'Email tidak valid' : ''"
            required
            @blur="v$.email.$touch"
          />

          <BaseInput
            v-model="form.password"
            type="password"
            label="Kata Sandi"
            placeholder="Minimal 6 karakter"
            :error="v$.password.$error ? 'Kata sandi minimal 6 karakter' : ''"
            required
            @blur="v$.password.$touch"
          />

          <div class="flex items-center justify-end">
            <NuxtLink to="/lupa-password" class="text-xs text-primary-600 hover:underline">Lupa kata sandi?</NuxtLink>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="isLoading"
          >
            Masuk
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
