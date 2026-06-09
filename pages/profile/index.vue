<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'profile', middleware: 'auth' })
useSeoMeta({ title: 'My Profile' })

const auth = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

const refreshing = ref(false)
const loadError = ref('')
const enableProfileEdit = computed(() => Boolean(config.public.enableProfileEdit))

const missingProfileFields = computed(() => {
  const u = auth.user
  if (!u) return []
  const missing: string[] = []
  if (!u.full_name) missing.push('full name')
  if (!u.phone) missing.push('phone number')
  if (!u.date_of_birth) missing.push('date of birth')
  return missing
})
const isProfileIncomplete = computed(() => missingProfileFields.value.length > 0)

onMounted(async () => {
  if (!auth.user) await refresh()
})

async function refresh() {
  refreshing.value = true
  loadError.value = ''
  try {
    const u = await auth.fetchMe()
    if (!u) loadError.value = 'Your session has expired. Please sign in again.'
  } catch (err: unknown) {
    loadError.value = (err as { message?: string }).message || 'Failed to load profile.'
  } finally {
    refreshing.value = false
  }
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'pending_activation': return 'bg-amber-100 text-amber-700'
    case 'suspended': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function statusLabel(status?: string) {
  switch (status) {
    case 'active': return 'Active'
    case 'pending_activation': return 'Pending Activation'
    case 'suspended': return 'Suspended'
    default: return status || '—'
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

async function doLogout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div class="flex-1 min-w-0">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-xl font-bold text-slate-800">My Profile</h2>
      </div>
    </div>

    <!-- Loading state -->
    <BaseCard v-if="!auth.user && refreshing" padding="lg" class="border border-slate-200 text-center">
      <BaseSpinner size="lg" />
      <p class="text-slate-500 text-sm mt-3">Loading profile...</p>
    </BaseCard>

    <!-- Error state -->
    <BaseCard v-else-if="loadError && !auth.user" padding="lg" class="border border-red-200 bg-red-50">
      <p class="text-sm text-red-700">{{ loadError }}</p>
      <div class="mt-4">
        <BaseButton variant="primary" to="/login">Sign In Again</BaseButton>
      </div>
    </BaseCard>

    <!-- Profile -->
    <div v-else-if="auth.user" class="space-y-6">

      <!-- Incomplete profile ticker -->
      <div v-if="isProfileIncomplete && enableProfileEdit" class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl" role="alert">
        <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-amber-800">Complete your profile to receive certificates</p>
          <p class="text-sm text-amber-700 mt-0.5">
            Your profile information — including your full name and date of birth — will appear on your course certificates.
            Missing: <span class="font-medium">{{ missingProfileFields.join(', ') }}</span>.
          </p>
          <NuxtLink to="/profile/edit" class="inline-block mt-2 text-sm font-semibold text-amber-800 hover:underline">
            Complete profile →
          </NuxtLink>
        </div>
      </div>

      <BaseCard padding="lg" class="border border-slate-200">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {{ (auth.user.full_name || auth.user.username || auth.user.email).charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-slate-800 truncate">{{ auth.user.full_name || auth.user.username || 'User' }}</h2>
            <p class="text-sm text-slate-500 truncate">{{ auth.user.email }}</p>
            <span v-if="auth.user.status" :class="['inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full', statusBadgeClass(auth.user.status)]">
              {{ statusLabel(auth.user.status) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Account Details</h3>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-slate-500">Full Name</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ auth.user.full_name || '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Username</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ auth.user.username || '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Email</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ auth.user.email }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Phone Number</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ auth.user.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Date of Birth</dt>
            <dd class="mt-1">
              <span v-if="auth.user.date_of_birth" class="text-slate-800 font-medium">{{ formatDate(auth.user.date_of_birth) }}</span>
              <span v-else class="text-amber-600 text-sm font-medium">Not set — required for certificates</span>
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">Last Login</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ formatDate(auth.user.last_login || undefined) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Member Since</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ formatDate(auth.user.created_at) }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Activity</h3>
        <NuxtLink
          to="/orders"
          class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors group"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800 group-hover:text-primary-700">My Orders</p>
              <p class="text-xs text-slate-500">Your course purchase history</p>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Settings</h3>
        <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
          <BaseButton v-if="enableProfileEdit" variant="primary" to="/profile/edit">Edit Profile</BaseButton>
          <BaseButton variant="secondary" to="/forgot-password">Change Password</BaseButton>
          <BaseButton variant="ghost" @click="doLogout">Sign Out</BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
