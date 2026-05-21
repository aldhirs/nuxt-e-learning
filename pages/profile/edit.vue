<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Edit Profil' })

const auth = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

// Kill-switch: kalau env flag eksplisit false, page tetap di-disable.
if (!config.public.enableProfileEdit) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
}

const isLoading = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const successMessage = ref('')
const initialReady = ref(false)

const form = reactive({
  full_name: '',
  username: '',
  email: ''
})

const usernameFormat = helpers.regex(/^[a-zA-Z0-9_.-]+$/)
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
  email: { required, email }
}
const v$ = useVuelidate(rules, form)

async function hydrate() {
  if (!auth.user) await auth.fetchMe()
  if (auth.user) {
    form.full_name = auth.user.full_name || ''
    form.username = auth.user.username || ''
    form.email = auth.user.email || ''
  }
  initialReady.value = true
}

onMounted(hydrate)

async function submit() {
  serverError.value = ''
  fieldErrors.value = {}
  successMessage.value = ''
  const ok = await v$.value.$validate()
  if (!ok) return

  isLoading.value = true
  try {
    // Kirim hanya field yang berubah dibanding nilai server saat ini. BE juga
    // toleran ke no-op (kirim nilai sama = 200 tanpa write), tapi diff-based
    // payload lebih hemat + mengurangi false-conflict trigger di future.
    const payload: Record<string, string> = {}
    const fullName = form.full_name.trim()
    const username = form.username.trim().toLowerCase()
    const emailNew = form.email.trim().toLowerCase()
    if (fullName !== (auth.user?.full_name || '')) payload.full_name = fullName
    if (username !== (auth.user?.username || '')) payload.username = username
    if (emailNew !== (auth.user?.email || '').toLowerCase()) payload.email = emailNew

    if (Object.keys(payload).length === 0) {
      successMessage.value = 'Tidak ada perubahan.'
      setTimeout(() => router.push('/profile'), 800)
      return
    }

    await auth.updateProfile(payload)
    successMessage.value = 'Profil berhasil diperbarui.'
    setTimeout(() => router.push('/profile'), 1200)
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; message?: string; fields?: Record<string, string> }
    if (e.fields && Object.keys(e.fields).length > 0) fieldErrors.value = e.fields
    if (e.status === 401) {
      serverError.value = 'Sesi sudah berakhir. Silakan login ulang.'
      auth.logout()
      router.push('/login?redirect=/profile/edit')
    } else if (e.status === 409) {
      const code = (e.code || '').toUpperCase()
      if (code.includes('EMAIL') || code === '3102') {
        serverError.value = 'Email sudah digunakan oleh pengguna lain.'
        fieldErrors.value.email = 'Email sudah digunakan oleh pengguna lain.'
      } else if (code.includes('USERNAME') || code === '3103') {
        serverError.value = 'Username sudah digunakan oleh pengguna lain.'
        fieldErrors.value.username = 'Username sudah digunakan oleh pengguna lain.'
      } else {
        serverError.value = e.message || 'Email atau username sudah dipakai pengguna lain.'
      }
    } else if (e.status === 422 || e.status === 400) {
      serverError.value = e.message || 'Data tidak valid. Periksa kembali isian Anda.'
    } else if (e.status === 0) {
      serverError.value = 'Tidak bisa terhubung ke server. Cek koneksi internet Anda.'
    } else {
      serverError.value = e.message || 'Gagal memperbarui profil.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Edit Profil</h1>
        <p class="text-sm text-slate-500 mt-1">Perbarui informasi akun Anda.</p>
      </div>
      <BaseButton variant="ghost" size="sm" to="/profile">← Kembali</BaseButton>
    </div>

    <BaseCard v-if="!initialReady" padding="lg" class="border border-slate-200 text-center">
      <BaseSpinner size="lg" />
      <p class="text-slate-500 text-sm mt-3">Memuat profil...</p>
    </BaseCard>

    <BaseCard v-else padding="lg" class="border border-slate-200">
      <div v-if="serverError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-sm text-red-700" role="alert">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ serverError }}
      </div>

      <div v-if="successMessage" class="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-sm text-green-700" role="status">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ successMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <BaseInput
          v-model="form.full_name"
          label="Nama Lengkap"
          placeholder="Nama sesuai KTP"
          :error="fieldErrors.full_name || (v$.full_name.$error ? 'Nama minimal 3 karakter' : '')"
          required
          @blur="v$.full_name.$touch"
        />
        <BaseInput
          v-model="form.username"
          label="Username"
          placeholder="username"
          :error="fieldErrors.username || (v$.username.$error ? (v$.username.$errors[0]?.$message as string) : '')"
          required
          @blur="v$.username.$touch"
        />
        <BaseInput
          v-model="form.email"
          type="email"
          label="Email"
          placeholder="email@example.com"
          :error="fieldErrors.email || (v$.email.$error ? 'Email tidak valid' : '')"
          required
          @blur="v$.email.$touch"
        />

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            :disabled="isLoading || v$.$invalid"
          >
            Simpan Perubahan
          </BaseButton>
          <BaseButton type="button" variant="ghost" size="lg" :disabled="isLoading" to="/profile">
            Batal
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
