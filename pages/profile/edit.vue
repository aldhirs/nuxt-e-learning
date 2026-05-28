<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'

const phoneValidator = helpers.withMessage(
  'Invalid phone number (e.g. 08123456789 or +628123456789)',
  (v: string) => !v || /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(v.replace(/[\s\-().]/g, ''))
)

definePageMeta({ layout: 'profile', middleware: 'auth' })
useSeoMeta({ title: 'Edit Profile' })

const auth = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

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
  email: '',
  phone: ''
})

const usernameFormat = helpers.regex(/^[a-zA-Z0-9_.-]+$/)
const rules = {
  full_name: { required, minLength: minLength(3) },
  username: {
    required,
    minLength: minLength(3),
    usernameFormat: helpers.withMessage(
      'Username may only contain letters, numbers, dots, underscores, or dashes',
      usernameFormat
    )
  },
  email: { required, email },
  phone: { phoneValidator }
}
const v$ = useVuelidate(rules, form)

async function hydrate() {
  if (!auth.user) await auth.fetchMe()
  if (auth.user) {
    form.full_name = auth.user.full_name || ''
    form.username = auth.user.username || ''
    form.email = auth.user.email || ''
    form.phone = auth.user.phone || ''
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
    const payload: Record<string, string> = {}
    const fullName = form.full_name.trim()
    const username = form.username.trim().toLowerCase()
    const emailNew = form.email.trim().toLowerCase()
    const phone = form.phone.trim()
    if (fullName !== (auth.user?.full_name || '')) payload.full_name = fullName
    if (username !== (auth.user?.username || '')) payload.username = username
    if (emailNew !== (auth.user?.email || '').toLowerCase()) payload.email = emailNew
    if (phone !== (auth.user?.phone || '')) payload.phone = phone

    if (Object.keys(payload).length === 0) {
      successMessage.value = 'No changes to save.'
      setTimeout(() => router.push('/profile'), 800)
      return
    }

    await auth.updateProfile(payload)
    successMessage.value = 'Profile updated successfully.'
    setTimeout(() => router.push('/profile'), 1200)
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 401) {
      serverError.value = 'Your session has expired. Please sign in again.'
      auth.logout()
      router.push('/login?redirect=/profile/edit')
      return
    }
    const { global, perField } = mapApiError(err, ['full_name', 'username', 'email', 'phone'])
    fieldErrors.value = perField
    serverError.value = global
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Edit Profile</h2>
        <p class="text-sm text-slate-500 mt-1">Update your account information.</p>
      </div>
      <BaseButton variant="ghost" size="sm" to="/profile">← Back</BaseButton>
    </div>

    <BaseCard v-if="!initialReady" padding="lg" class="border border-slate-200 text-center">
      <BaseSpinner size="lg" />
      <p class="text-slate-500 text-sm mt-3">Loading profile...</p>
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
          label="Full Name"
          placeholder="As on your ID card"
          :error="fieldErrors.full_name || (v$.full_name.$error ? 'Name must be at least 3 characters' : '')"
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
          :error="fieldErrors.email || (v$.email.$error ? 'Invalid email' : '')"
          required
          @blur="v$.email.$touch"
        />
        <BaseInput
          v-model="form.phone"
          type="tel"
          label="Phone Number"
          placeholder="08123456789 or +628123456789"
          :error="fieldErrors.phone || (v$.phone.$error ? (v$.phone.$errors[0]?.$message as string) : '')"
          @blur="v$.phone.$touch"
        />

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            :disabled="isLoading || v$.$invalid"
          >
            Save Changes
          </BaseButton>
          <BaseButton type="button" variant="ghost" size="lg" :disabled="isLoading" to="/profile">
            Cancel
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
