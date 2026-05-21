<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const scrolled = ref(false)

async function handleLogout() {
  auth.logout()
  mobileMenuOpen.value = false
  await router.push('/')
}

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Course', to: '/courses' },
  { label: 'Partner', to: '/partners' }
]

onMounted(() => {
  window.addEventListener('scroll', () => { scrolled.value = window.scrollY > 8 })
})

watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 transition-all duration-200',
      scrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-white/90 backdrop-blur-md'
    ]"
  >
    <!-- Skip to content -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md">
      Skip to main content
    </a>

    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigasi utama">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 font-bold text-xl text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md" aria-label="DrillSpace — Halaman Utama">
        <svg class="w-8 h-8 text-primary-500" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16 2L3 9v14l13 7 13-7V9L16 2zm0 2.5l10.5 5.7V22l-10.5 5.7L5.5 22V10.2L16 4.5z"/>
          <circle cx="16" cy="16" r="4" />
        </svg>
        <span>DrillSpace</span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            route.path === link.to
              ? 'text-primary-600 bg-primary-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          ]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <!-- Desktop Search + Auth -->
      <div class="hidden md:flex items-center gap-3">
        <!-- Search -->
        <form action="/courses" method="get" class="relative">
          <input
            name="search"
            type="search"
            placeholder="Cari course..."
            class="pl-9 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none w-48 transition-all focus:w-64"
            aria-label="Cari course"
          />
          <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <!-- Auth state -->
        <template v-if="auth.isAuthenticated">
          <NuxtLink
            to="/orders"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors"
            aria-label="Lihat order saya"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Order
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="text-sm text-slate-600 hover:text-primary-600 transition-colors"
          >Hai, {{ (auth.user?.full_name?.split(' ')[0]) || auth.user?.username || 'Akun' }}</NuxtLink>
          <BaseButton variant="ghost" size="sm" @click="handleLogout">Keluar</BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="ghost" size="sm" to="/login">Masuk</BaseButton>
          <BaseButton variant="primary" size="sm" to="/register">Daftar</BaseButton>
        </template>
      </div>

      <!-- Mobile burger -->
      <button
        type="button"
        class="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Buka menu navigasi"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </nav>

    <!-- Mobile menu overlay -->
    <Transition name="slide-down">
      <div
        v-if="mobileMenuOpen"
        id="mobile-menu"
        class="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-2 shadow-lg"
      >
        <!-- Search mobile -->
        <form action="/courses" method="get">
          <div class="relative mb-2">
            <input
              name="search"
              type="search"
              placeholder="Cari course..."
              class="w-full pl-9 pr-3 py-2.5 text-sm rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
              aria-label="Cari course"
            />
            <svg class="absolute left-2.5 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        <!-- Nav links -->
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="[
            'px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] flex items-center',
            route.path === link.to ? 'text-primary-600 bg-primary-50' : 'text-slate-700 hover:bg-slate-50'
          ]"
        >
          {{ link.label }}
        </NuxtLink>

        <div class="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2">
          <template v-if="auth.isAuthenticated">
            <p class="text-sm text-slate-600 px-3">Hai, {{ auth.user?.full_name || auth.user?.username || 'Akun' }}</p>
            <BaseButton variant="ghost" block to="/orders">Order Saya</BaseButton>
            <BaseButton variant="ghost" block to="/profile">Profil Saya</BaseButton>
            <BaseButton variant="secondary" block @click="handleLogout">Keluar</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="secondary" block to="/login">Masuk</BaseButton>
            <BaseButton variant="primary" block to="/register">Daftar</BaseButton>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
