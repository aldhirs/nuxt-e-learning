<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, maxLength, email, helpers } from '@vuelidate/validators'
import type { UpdatePartnerProfileRequest, ClientType } from '~/types/partner'

definePageMeta({ layout: 'partner', middleware: 'partner-auth' })
useSeoMeta({ title: 'Organization Profile — DrillSpace' })

const partner = usePartnerStore()
const api = useApi()

const form = reactive({
  name: '' as string,
  email: '' as string,
  phone: '' as string,
  address: '' as string,
  client_type: 'company' as ClientType,
  logo_file: null as File | null,
})

const toast = useToast()
const { transformUrl } = useFileUrl()
const isLoading = ref(false)
const isSaving = ref(false)
const serverError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const logoPreview = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  const p = await partner.fetchProfile()
  if (p) {
    form.name = p.name; form.email = p.email; form.phone = p.phone ?? ''
    form.address = p.address ?? ''; form.client_type = p.client_type
    if (p.logo) logoPreview.value = transformUrl(p.logo)
  }
  isLoading.value = false
})

const phoneOptional = helpers.withMessage('Invalid format. Use +628...', (v: string) => !v || /^\+62[0-9]{8,13}$/.test(v))

const rules = {
  name:    { required, min: minLength(3), max: maxLength(100) },
  email:   { required, email },
  phone:   { phoneOptional },
  address: { max: maxLength(500) },
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v$ = useVuelidate(rules, form as any)

function fe(field: string, vuelidateMsg = ''): string {
  return (fieldErrors.value[field] ?? '') || vuelidateMsg
}

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'government', label: 'Government' },
  { value: 'shipowner', label: 'Shipowner' },
]

function handleLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { fieldErrors.value = { ...fieldErrors.value, logo: 'File size must not exceed 2MB' }; return }
  if (!['image/png', 'image/jpeg'].includes(file.type)) { fieldErrors.value = { ...fieldErrors.value, logo: 'Only PNG or JPG files are allowed' }; return }
  fieldErrors.value = { ...fieldErrors.value, logo: '' }
  form.logo_file = file
  const reader = new FileReader()
  reader.onload = (ev) => { logoPreview.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

async function submit() {
  serverError.value = ''; fieldErrors.value = {}
  const valid = await v$.value.$validate()
  if (!valid) return
  isSaving.value = true
  try {
    let logoUrl: string | undefined
    if (form.logo_file) {
      const fd = new FormData()
      fd.append('file', form.logo_file)
      try {
        const uploadRes = await $fetch<{ data: { url: string } }>('/upload', {
          method: 'POST',
          baseURL: useRuntimeConfig().public.apiBaseUrl as string,
          headers: { Authorization: `Bearer ${useAuthCookie().value}` },
          body: fd,
        })
        logoUrl = uploadRes.data?.url ? transformUrl(uploadRes.data.url) : undefined
      } catch {
        toast.error('Logo upload failed. Other profile changes will still be saved.')
      }
    }
    const payload: UpdatePartnerProfileRequest = {
      name: form.name, email: form.email,
      phone: form.phone || undefined,
      address: form.address || undefined,
      client_type: form.client_type,
      ...(logoUrl ? { logo: logoUrl } : {}),
    }
    const clientId = partner.activeClient?.id ?? useAuthStore().user?.active_client_id
    await api.put('/clients/profile', payload, { headers: clientId ? { 'X-Client-ID': String(clientId) } : {} })
    await partner.fetchProfile()
    toast.success('Organization profile updated successfully.')
    form.logo_file = null
  } catch (err: unknown) {
    const { global, perField } = mapApiError(err, Object.keys(form))
    fieldErrors.value = perField
    serverError.value = global || 'Failed to save profile.'
  } finally {
    isSaving.value = false }
}

function cancel() {
  const p = partner.profile
  if (!p) return
  form.name = p.name; form.email = p.email; form.phone = p.phone ?? ''
  form.address = p.address ?? ''; form.client_type = p.client_type
  form.logo_file = null; logoPreview.value = p.logo ?? null
  v$.value.$reset(); fieldErrors.value = {}; serverError.value = ''
}
</script>

<template>
  <div class="space-y-6 pb-20 md:pb-0 max-w-2xl">
    <h1 class="text-xl font-bold text-slate-900">Organization Profile</h1>

    <template v-if="isLoading">
      <div class="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div v-for="i in 6" :key="i" class="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </template>

    <template v-else>
      <div v-if="serverError" class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ serverError }}</div>

      <form class="space-y-5" @submit.prevent="submit">
        <!-- Logo -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 class="text-sm font-semibold text-slate-700 mb-4">Organization Logo</h2>
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 overflow-hidden flex items-center justify-center bg-slate-50">
              <img v-if="logoPreview" :src="logoPreview" alt="Logo preview" class="w-full h-full object-contain" />
              <span v-else class="text-slate-400 text-3xl font-bold">{{ (form.name || '?')[0]?.toUpperCase() }}</span>
            </div>
            <div class="space-y-1.5">
              <label class="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                Click to upload logo
                <input type="file" accept="image/png,image/jpeg" class="sr-only" @change="handleLogoChange" />
              </label>
              <p class="text-xs text-slate-400">PNG or JPG, max 2MB</p>
              <p v-if="fieldErrors.logo" class="text-xs text-red-600">{{ fieldErrors.logo }}</p>
            </div>
          </div>
        </div>

        <!-- Org info -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <h2 class="text-sm font-semibold text-slate-700">Organization Information</h2>
          <BaseInput v-model="form.name" label="Organization Name" required :error="fe('name', v$.name.$error ? 'Name must be at least 3 characters' : '')" @blur="v$.name.$touch" />
          <BaseInput v-model="form.email" type="email" label="Contact Email" required :error="fe('email', v$.email.$error ? 'Enter a valid email address' : '')" @blur="v$.email.$touch" />
          <BaseInput v-model="form.phone" type="tel" label="Phone" placeholder="+628..." :error="fe('phone', v$.phone.$error ? 'Invalid format. Use +628...' : '')" @blur="v$.phone.$touch" />
          <BaseInput v-model="form.address" label="Address" placeholder="Full address..." :error="fe('address')" />
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Organization Type</label>
            <select v-model="form.client_type" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition">
              <option v-for="t in CLIENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
        </div>

        <!-- Platform settings -->
        <div class="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 class="text-sm font-semibold text-slate-700 mb-3">Platform Settings</h2>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Subdomain</label>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed">{{ partner.profile?.slug ?? '—' }}</div>
              <span class="text-sm text-slate-400 flex-shrink-0">.drillspace.id</span>
            </div>
            <p class="text-xs text-slate-400 mt-1.5">Subdomain cannot be changed here. <NuxtLink to="/contact-us" class="text-primary-600 hover:underline">Contact support</NuxtLink> to request a change.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <BaseButton type="submit" variant="primary" :loading="isSaving" :disabled="isSaving">Save Changes</BaseButton>
          <BaseButton type="button" variant="secondary" :disabled="isSaving" @click="cancel">Cancel</BaseButton>
        </div>
      </form>
    </template>
  </div>
</template>

