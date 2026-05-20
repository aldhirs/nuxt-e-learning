<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators'

definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Daftar Akun' })

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ full_name: '', email: '', password: '', password_confirmation: '' })
const isLoading = ref(false)
const serverError = ref('')
const success = ref(false)

const passwordRef = computed(() => form.password)

const rules = {
  full_name: { required, minLength: minLength(3) },
  email: { required, email },
  password: { required, minLength: minLength(8) },
  password_confirmation: { required, sameAs: helpers.withMessage('Kata sandi tidak cocok', sameAs(passwordRef)) }
}

const v$ = useVuelidate(rules, form)

async function submit() {
  serverError.value = ''
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 1000))
    success.value = true
  } catch {
    serverError.value = 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">Buat Akun DrillSpace</h1>
        <p class="text-slate-500 text-sm mt-2">Sudah punya akun?
          <NuxtLink to="/login" class="text-primary-600 font-medium hover:underline">Masuk</NuxtLink>
        </p>
      </div>

      <!-- Success state -->
      <div v-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Akun berhasil dibuat!</h2>
        <p class="text-slate-500 text-sm mb-6">Silakan cek email Anda untuk verifikasi akun.</p>
        <BaseButton variant="primary" to="/login">Masuk Sekarang</BaseButton>
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
            v-model="form.full_name"
            label="Nama Lengkap"
            placeholder="Nama sesuai KTP"
            :error="v$.full_name.$error ? 'Nama minimal 3 karakter' : ''"
            required
            @blur="v$.full_name.$touch"
          />
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
            placeholder="Minimal 8 karakter"
            :error="v$.password.$error ? 'Kata sandi minimal 8 karakter' : ''"
            required
            @blur="v$.password.$touch"
          />
          <BaseInput
            v-model="form.password_confirmation"
            type="password"
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            :error="v$.password_confirmation.$error ? v$.password_confirmation.$errors[0]?.$message as string : ''"
            required
            @blur="v$.password_confirmation.$touch"
          />

          <p class="text-xs text-slate-500">
            Dengan mendaftar, Anda menyetujui
            <NuxtLink to="/syarat" class="text-primary-600 hover:underline">Syarat & Ketentuan</NuxtLink>
            dan
            <NuxtLink to="/privasi" class="text-primary-600 hover:underline">Kebijakan Privasi</NuxtLink>
            kami.
          </p>

          <BaseButton type="submit" variant="primary" size="lg" block :loading="isLoading" :disabled="isLoading">
            Buat Akun
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
