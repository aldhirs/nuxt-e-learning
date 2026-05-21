<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Profil Saya' })

const auth = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

const refreshing = ref(false)
const loadError = ref('')
const enableProfileEdit = computed(() => Boolean(config.public.enableProfileEdit))

onMounted(async () => {
  if (!auth.user) await refresh()
})

async function refresh() {
  refreshing.value = true
  loadError.value = ''
  try {
    const u = await auth.fetchMe()
    if (!u) loadError.value = 'Sesi Anda sudah berakhir. Silakan login kembali.'
  } catch (err: unknown) {
    loadError.value = (err as { message?: string }).message || 'Gagal memuat profil.'
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
    case 'active': return 'Aktif'
    case 'pending_activation': return 'Menunggu Aktivasi'
    case 'suspended': return 'Diblokir'
    default: return status || '—'
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
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
  <div class="max-w-3xl mx-auto px-4 py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Profil Saya</h1>
      <BaseButton variant="ghost" size="sm" :loading="refreshing" @click="refresh">
        Muat ulang
      </BaseButton>
    </div>

    <!-- Loading state (first load, no cached user) -->
    <BaseCard v-if="!auth.user && refreshing" padding="lg" class="border border-slate-200 text-center">
      <BaseSpinner size="lg" />
      <p class="text-slate-500 text-sm mt-3">Memuat profil...</p>
    </BaseCard>

    <!-- Error state -->
    <BaseCard v-else-if="loadError && !auth.user" padding="lg" class="border border-red-200 bg-red-50">
      <p class="text-sm text-red-700">{{ loadError }}</p>
      <div class="mt-4">
        <BaseButton variant="primary" to="/login">Login Ulang</BaseButton>
      </div>
    </BaseCard>

    <!-- Profile -->
    <div v-else-if="auth.user" class="space-y-6">
      <BaseCard padding="lg" class="border border-slate-200">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {{ (auth.user.full_name || auth.user.username || auth.user.email).charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-slate-800 truncate">{{ auth.user.full_name || auth.user.username || 'Pengguna' }}</h2>
            <p class="text-sm text-slate-500 truncate">{{ auth.user.email }}</p>
            <span v-if="auth.user.status" :class="['inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full', statusBadgeClass(auth.user.status)]">
              {{ statusLabel(auth.user.status) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Detail Akun</h3>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-slate-500">Nama Lengkap</dt>
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
            <dt class="text-slate-500">Nomor HP</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ auth.user.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Role</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ (auth.user.roles && auth.user.roles.length ? auth.user.roles.join(', ') : auth.user.role) || (auth.user.is_student ? 'STUDENT' : '—') }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Login Terakhir</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ formatDate(auth.user.last_login || undefined) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">Bergabung</dt>
            <dd class="text-slate-800 font-medium mt-1">{{ formatDate(auth.user.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">User ID</dt>
            <dd class="text-slate-800 font-mono text-xs mt-1">#{{ auth.user.id }}</dd>
          </div>
        </dl>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Aktivitas</h3>
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
              <p class="text-sm font-semibold text-slate-800 group-hover:text-primary-700">Order Saya</p>
              <p class="text-xs text-slate-500">Riwayat pembelian course Anda</p>
            </div>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </BaseCard>

      <BaseCard padding="lg" class="border border-slate-200">
        <h3 class="font-semibold text-slate-700 mb-4">Pengaturan</h3>
        <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
          <BaseButton v-if="enableProfileEdit" variant="primary" to="/profile/edit">Edit Profil</BaseButton>
          <BaseButton variant="secondary" to="/forgot-password">Ganti Kata Sandi</BaseButton>
          <BaseButton variant="ghost" @click="doLogout">Keluar</BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
