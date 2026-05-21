<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators'

definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Daftar Akun' })

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  full_name: '',
  username: '',
  email: '',
  password: '',
  password_confirm: ''
})
const isLoading = ref(false)
const serverError = ref('')
const success = ref(false)

const passwordRef = computed(() => form.password)
const usernameFormat = helpers.regex(/^[a-z0-9_.-]+$/i)

const rules = {
  full_name: { required, minLength: minLength(3) },
  username: {
    required,
    minLength: minLength(3),
    usernameFormat: helpers.withMessage(
      'Username hanya boleh huruf, angka, titik, underscore, atau dash',
      usernameFormat
    )
  },
  email: { required, email },
  password: { required, minLength: minLength(8) },
  password_confirm: {
    required,
    sameAs: helpers.withMessage('Kata sandi tidak cocok', sameAs(passwordRef))
  }
}

const v$ = useVuelidate(rules, form)

watch(() => form.email, (val) => {
  if (!form.username && val.includes('@')) {
    const guess = val.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    if (guess.length >= 3) form.username = guess
  }
})

async function submit() {
  serverError.value = ''
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    await auth.register({
      full_name: form.full_name.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      password: form.password
    })
    // BE saat ini set akun aktif langsung — coba auto-login agar UX seamless.
    try {
      await auth.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        device_name: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined
      })
      await router.push('/')
      return
    } catch {
      // fallthrough: tampilkan success screen + arahkan ke login
    }
    success.value = true
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; message?: string; fields?: Record<string, string> }
    const reason = (e.reason || '').toLowerCase()
    if (e.status === 409 || reason.includes('duplicate') || reason.includes('sudah terdaftar') || reason.includes('uk_users')) {
      serverError.value = 'Email atau username sudah terdaftar. Silakan login atau gunakan email lain.'
    } else if (e.fields && Object.keys(e.fields).length > 0) {
      serverError.value = Object.values(e.fields).join(' • ')
    } else if (e.status === 400 || e.status === 422) {
      serverError.value = 'Data tidak valid. Periksa kembali isian Anda.'
    } else if (e.status === 0) {
      serverError.value = 'Tidak bisa terhubung ke server. Cek koneksi internet Anda.'
    } else {
      serverError.value = e.message || 'Terjadi kesalahan. Silakan coba lagi.'
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
        <h1 class="text-2xl font-bold text-slate-800">Buat Akun DrillSpace</h1>
        <p class="text-slate-500 text-sm mt-2">Sudah punya akun?
          <NuxtLink to="/login" class="text-primary-600 font-medium hover:underline">Masuk</NuxtLink>
        </p>
      </div>

      <!-- Success state (fallback kalau auto-login gagal) -->
      <div v-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-2">Akun berhasil dibuat!</h2>
        <p class="text-slate-500 text-sm mb-6">Silakan masuk dengan email dan kata sandi yang baru saja dibuat.</p>
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
            v-model="form.username"
            label="Username"
            placeholder="contoh: budi_santoso"
            :error="v$.username.$error ? (v$.username.$errors[0]?.$message as string ?? 'Username minimal 3 karakter') : ''"
            required
            hint="Diisi otomatis dari email, bisa diubah."
            @blur="v$.username.$touch"
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
            v-model="form.password_confirm"
            type="password"
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            :error="v$.password_confirm.$error ? (v$.password_confirm.$errors[0]?.$message as string) : ''"
            required
            @blur="v$.password_confirm.$touch"
          />

          <p class="text-xs text-slate-500">
            Dengan mendaftar, Anda menyetujui
            <NuxtLink to="/syarat" class="text-primary-600 hover:underline">Syarat & Ketentuan</NuxtLink>
            dan
            <NuxtLink to="/privasi" class="text-primary-600 hover:underline">Kebijakan Privasi</NuxtLink>
            kami.
          </p>

          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="isLoading || v$.$invalid"
          >
            Daftar
          </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
