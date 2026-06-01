<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, maxLength, sameAs, helpers } from '@vuelidate/validators'
import type { PartnerRegisterRequest, PartnerRegisterResponse, OnboardAsPartnerResponse } from '~/types/partner'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Partner Registration — DrillSpace' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

// ── Scenario detection ────────────────────────────────────────────────────────
const isLoggedIn = computed(() => auth.isAuthenticated)
const alreadyPartner = computed(() =>
  !!auth.user?.active_client_id &&
  (auth.user?.roles ?? []).some(r => r.role_name === 'CLIENT_OWNER' && r.client_id != null)
)

// Name of current active partner org for the notice banner
const currentPartnerName = computed(() => {
  const role = (auth.user?.roles ?? []).find(r => r.role_name === 'CLIENT_OWNER' && r.client_id != null)
  return role?.client_name ?? null
})

// ── Shared: slug availability ─────────────────────────────────────────────────
const slugStatus = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
let slugTimer: ReturnType<typeof setTimeout> | null = null

function checkSlug(val: string) {
  if (slugTimer) clearTimeout(slugTimer)
  if (!val || val.length < 3) { slugStatus.value = 'idle'; return }
  slugStatus.value = 'checking'
  slugTimer = setTimeout(async () => {
    try {
      const data = await api.get<{ available: boolean }>('/public/partner/check-slug', { query: { slug: val } })
      slugStatus.value = data.available ? 'available' : 'taken'
    } catch { slugStatus.value = 'idle' }
  }, 500)
}

const slugRegex = helpers.withMessage('Use lowercase letters, numbers, and hyphens (3–30 characters)', helpers.regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/))

// ── Scenario A: visitor full form ─────────────────────────────────────────────
const form = reactive<PartnerRegisterRequest & { phone: string }>({
  full_name: '', email: '', password: '', password_confirmation: '',
  organization_name: '', subdomain_slug: '', phone: '', agree_tos: false,
})
const isLoading = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const successEmail = ref('')

const phoneRegex = helpers.withMessage('Invalid format. Use +628...', helpers.regex(/^(\+62[0-9]{8,13})?$/))
const rulesA = {
  full_name: { required, min: minLength(2), max: maxLength(100) },
  email: { required, email },
  password: {
    required, min: minLength(8),
    hasUpper: helpers.withMessage('At least 1 uppercase letter required', (v: string) => /[A-Z]/.test(v)),
    hasNumber: helpers.withMessage('At least 1 number required', (v: string) => /[0-9]/.test(v)),
  },
  password_confirmation: { required, sameAs: sameAs(computed(() => form.password)) },
  organization_name: { required, min: minLength(3), max: maxLength(100) },
  subdomain_slug: { required, slugRegex },
  phone: { phoneRegex },
  agree_tos: { required, mustBeTrue: helpers.withMessage('You must agree to the Terms & Conditions', (v: boolean) => v === true) },
}
const v$ = useVuelidate(rulesA, form)

watch(() => form.subdomain_slug, (val) => {
  form.subdomain_slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
  checkSlug(form.subdomain_slug)
})
watch(() => ({ ...form }), () => { fieldErrors.value = {} }, { deep: true })

const passwordStrength = computed(() => {
  const p = form.password; if (!p) return 0
  let s = 0
  if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Strong', 'Very Strong'][passwordStrength.value])
const strengthColor = computed(() => ['', 'bg-red-400', 'bg-amber-400', 'bg-green-400', 'bg-green-600'][passwordStrength.value])

async function submit() {
  serverError.value = ''; fieldErrors.value = {}
  const valid = await v$.value.$validate()
  if (!valid || slugStatus.value === 'taken') return
  isLoading.value = true
  try {
    const payload = { ...form, phone: form.phone || undefined }
    const res = await api.post<PartnerRegisterResponse>('/public/partner/register', payload)
    successEmail.value = res.email_masked
  } catch (err: unknown) {
    const { global, perField } = mapApiError(err, Object.keys(form))
    fieldErrors.value = perField; serverError.value = global
  } finally { isLoading.value = false }
}

// ── Scenario B: logged-in student → one-click partner ────────────────────────
const onboardForm = reactive({ organization_name: '', subdomain_slug: '', agree_tos: false })
const onboardLoading = ref(false)
const onboardError = ref('')
const onboardFieldErrors = ref<Record<string, string>>({})

const rulesB = {
  organization_name: { required, min: minLength(3), max: maxLength(100) },
  subdomain_slug: { required, slugRegex },
  agree_tos: { required, mustBeTrue: helpers.withMessage('You must agree to the Terms & Conditions', (v: boolean) => v === true) },
}
const vB$ = useVuelidate(rulesB, onboardForm)

watch(() => onboardForm.subdomain_slug, (val) => {
  onboardForm.subdomain_slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
  checkSlug(onboardForm.subdomain_slug)
})
watch(() => ({ ...onboardForm }), () => { onboardFieldErrors.value = {} }, { deep: true })

async function submitOnboard() {
  onboardError.value = ''; onboardFieldErrors.value = {}
  const valid = await vB$.value.$validate()
  if (!valid || slugStatus.value === 'taken') return
  onboardLoading.value = true
  try {
    const res = await api.post<OnboardAsPartnerResponse>('/auth/onboard-as-partner', onboardForm)

    // 1. Swap in the new JWT so all subsequent API calls use the new token
    const cookie = useAuthCookie()
    cookie.value = res.access_token

    // 2. Re-fetch /me so auth.user reflects the new active_client_id and roles
    await auth.fetchMe()

    // 3. Full reset + eager reload of ALL partner data for the new client.
    //    refreshForNewClient resets clients/subscription/stats/profile, then
    //    re-fetches all of them so the dashboard never shows stale data from
    //    any previous partner session.
    const partner = usePartnerStore()
    await partner.refreshForNewClient(res.active_client_id)

    await router.push('/partner/dashboard?onboarding=true')
  } catch (err: unknown) {
    const { global, perField } = mapApiError(err, ['organization_name', 'subdomain_slug', 'agree_tos'])
    onboardFieldErrors.value = perField; onboardError.value = global
  } finally { onboardLoading.value = false }
}
</script>

<template>
  <div class="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
    <!-- Success -->
    <div v-if="successEmail" class="w-full max-w-md text-center space-y-5">
      <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Check Your Email</h1>
      <p class="text-slate-500">We sent a verification link to <strong>{{ successEmail }}</strong></p>
      <p class="text-sm text-slate-400">Link expires in 24 hours. Check your spam folder if you don't see it.</p>
      <NuxtLink to="/partner/verify" class="text-sm text-primary-600 hover:underline">Already have a token? Verify here</NuxtLink>
    </div>

    <!-- Scenario B: logged-in user → one-click (first or additional partner) -->
    <div v-else-if="isLoggedIn" class="w-full max-w-md">

      <!-- Notice: user already has a partner — informational only, not blocking -->
      <div v-if="alreadyPartner" class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
        <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-sm">
          <p class="font-semibold text-amber-800">
            You have an existing partner account 
            <span v-if="currentPartnerName" class="font-bold"> "{{ currentPartnerName }}"</span>.
          </p>
          <p class="text-amber-700 mt-0.5">You can still create a new partner under the same account.</p>
          <NuxtLink to="/partner/dashboard" class="text-amber-800 font-semibold hover:underline text-xs mt-1 inline-block">
            Back to partner dashboard →
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="bg-primary-700 text-white px-8 py-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {{ (auth.user?.full_name || 'U')[0].toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-sm">{{ auth.user?.full_name }}</p>
              <p class="text-xs text-primary-200">{{ auth.user?.email }}</p>
            </div>
          </div>
          <h1 class="text-lg font-bold mt-3">
            {{ alreadyPartner ? 'Create New Partner' : 'Open Your Course Store' }}
          </h1>
          <p class="text-sm text-primary-200 mt-1">
            {{ alreadyPartner ? 'Add a new organization to your account.' : 'One step — no new account needed. Your 14-day trial starts now.' }}
          </p>
        </div>

        <div class="p-8 space-y-4">
          <div v-if="onboardError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">{{ onboardError }}</div>

          <form class="space-y-4" @submit.prevent="submitOnboard">
            <BaseInput
              v-model="onboardForm.organization_name"
              label="Organization / Store Name"
              placeholder="e.g. Maritime Academy"
              required
              :error="onboardFieldErrors.organization_name || (vB$.organization_name.$error ? 'Name must be at least 3 characters' : '')"
              @blur="vB$.organization_name.$touch"
            />

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Subdomain <span class="text-red-500">*</span></label>
              <div class="flex items-center gap-2">
                <BaseInput
                  v-model="onboardForm.subdomain_slug"
                  placeholder="your-name"
                  class="flex-1"
                  :error="onboardFieldErrors.subdomain_slug || (vB$.subdomain_slug.$error ? 'Invalid subdomain format' : '') || (slugStatus === 'taken' ? 'Subdomain already taken' : '')"
                  @blur="vB$.subdomain_slug.$touch"
                />
                <span class="flex-shrink-0 text-sm text-slate-500 whitespace-nowrap">.drillspace.id</span>
              </div>
              <p v-if="onboardForm.subdomain_slug && slugStatus === 'available'" class="text-xs text-green-600 mt-1">✓ Subdomain available</p>
              <p v-else-if="slugStatus === 'checking'" class="text-xs text-slate-400 mt-1">Checking availability...</p>
              <p v-else-if="onboardForm.subdomain_slug" class="text-xs text-slate-400 mt-1">Preview: {{ onboardForm.subdomain_slug }}.drillspace.id</p>
            </div>

            <div class="flex items-start gap-3 pt-1">
              <input id="agree-tos-b" v-model="onboardForm.agree_tos" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" @blur="vB$.agree_tos.$touch" />
              <label for="agree-tos-b" class="text-sm text-slate-600">
                I agree to the <a href="/terms" target="_blank" class="text-primary-600 hover:underline font-medium">Terms & Conditions</a>
                <span v-if="vB$.agree_tos.$error" class="block text-xs text-red-600 mt-0.5">You must agree to the Terms & Conditions</span>
              </label>
            </div>

            <BaseButton type="submit" variant="primary" block :loading="onboardLoading" :disabled="onboardLoading || slugStatus === 'taken'">
              Start My Free Trial
            </BaseButton>
          </form>
        </div>
      </div>
    </div>

    <!-- Scenario A: visitor full form -->
    <div v-else class="w-full max-w-3xl">
    <div class="grid md:grid-cols-5 gap-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <!-- Left panel -->
      <div class="md:col-span-2 bg-primary-700 text-white p-8 flex flex-col justify-between">
        <div class="space-y-4">
          <h1 class="text-xl font-bold leading-snug">Start selling your courses in minutes</h1>
          <ul class="space-y-2.5 text-sm text-primary-100">
            <li>✓ 14-day free trial</li>
            <li>✓ Your own subdomain</li>
            <li>✓ Analytics dashboard</li>
            <li>✓ 24/7 support</li>
          </ul>
        </div>
        <p class="text-xs text-primary-300 mt-8">Trusted by 50+ active partners on DrillSpace</p>
      </div>

      <!-- Form -->
      <div class="md:col-span-3 p-8">
        <h2 class="text-lg font-bold text-slate-900 mb-6">Create a Partner Account</h2>

        <div v-if="serverError" class="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">{{ serverError }}</div>

        <form class="space-y-4" @submit.prevent="submit">
          <BaseInput v-model="form.full_name" label="Full Name" placeholder="Your full name" required :error="fieldErrors.full_name || (v$.full_name.$error ? 'Name must be at least 2 characters' : '')" @blur="v$.full_name.$touch" />
          <BaseInput v-model="form.email" type="email" label="Email" placeholder="you@yourorg.com" required :error="fieldErrors.email || (v$.email.$error ? 'Enter a valid email address' : '')" @blur="v$.email.$touch" />

          <div>
            <BaseInput v-model="form.password" type="password" label="Password" placeholder="Min. 8 characters" required :error="fieldErrors.password || (v$.password.$error ? (v$.password.$errors[0]?.$message as string) || 'Invalid password' : '')" @blur="v$.password.$touch" />
            <div v-if="form.password" class="mt-1.5 flex items-center gap-2">
              <div class="flex gap-0.5">
                <div v-for="i in 4" :key="i" :class="['h-1 w-6 rounded-full transition-colors', i <= passwordStrength ? strengthColor : 'bg-slate-200']" />
              </div>
              <span class="text-xs text-slate-500">{{ strengthLabel }}</span>
            </div>
          </div>

          <BaseInput v-model="form.password_confirmation" type="password" label="Confirm Password" placeholder="Repeat your password" required :error="fieldErrors.password_confirmation || (v$.password_confirmation.$error ? 'Passwords do not match' : '')" @blur="v$.password_confirmation.$touch" />
          <BaseInput v-model="form.organization_name" label="Organization Name" placeholder="e.g. Maritime Academy" required :error="fieldErrors.organization_name || (v$.organization_name.$error ? 'Organization name must be at least 3 characters' : '')" @blur="v$.organization_name.$touch" />

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Subdomain <span class="text-red-500">*</span></label>
            <div class="flex items-center gap-2">
              <BaseInput v-model="form.subdomain_slug" placeholder="your-name" class="flex-1" :error="fieldErrors.subdomain_slug || (v$.subdomain_slug.$error ? 'Invalid subdomain format' : '') || (slugStatus === 'taken' ? 'Subdomain already taken' : '')" @blur="v$.subdomain_slug.$touch" />
              <span class="flex-shrink-0 text-sm text-slate-500 whitespace-nowrap">.drillspace.id</span>
            </div>
            <p v-if="form.subdomain_slug && slugStatus === 'available'" class="text-xs text-green-600 mt-1">✓ Subdomain available</p>
            <p v-else-if="slugStatus === 'checking'" class="text-xs text-slate-400 mt-1">Checking availability...</p>
            <p v-else-if="form.subdomain_slug" class="text-xs text-slate-400 mt-1">Preview: {{ form.subdomain_slug }}.drillspace.id</p>
          </div>

          <BaseInput v-model="form.phone" type="tel" label="Phone (optional)" placeholder="+628123456789" :error="fieldErrors.phone || (v$.phone.$error ? 'Invalid format. Use +628...' : '')" @blur="v$.phone.$touch" />

          <div class="flex items-start gap-3 pt-1">
            <input id="agree-tos" v-model="form.agree_tos" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" @blur="v$.agree_tos.$touch" />
            <label for="agree-tos" class="text-sm text-slate-600">
              I agree to the <a href="/terms" target="_blank" class="text-primary-600 hover:underline font-medium">Terms & Conditions</a> of DrillSpace
              <span v-if="v$.agree_tos.$error" class="block text-xs text-red-600 mt-0.5">You must agree to the Terms & Conditions</span>
            </label>
          </div>

          <BaseButton type="submit" variant="primary" block :loading="isLoading" :disabled="isLoading || slugStatus === 'taken'">
            Create Account
          </BaseButton>
        </form>

        <p class="text-center text-sm text-slate-500 mt-5">
          Already have an account?
          <NuxtLink to="/login" class="text-primary-600 font-medium hover:underline">Sign in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
  </div>
</template>
