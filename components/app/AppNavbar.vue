<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const mobileMenuOpen = ref(false)
const scrolled       = ref(false)
const searchQuery    = ref('')

async function handleLogout() {
  auth.logout()
  mobileMenuOpen.value = false
  await router.push('/')
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) { router.push('/courses'); return }
  router.push({ path: '/courses', query: { search: q } })
  mobileMenuOpen.value = false
}

// Row 1 right-side links
const quickLinks = [
  { label: 'My Courses', to: '/my/courses', authenticated: true },
  { label: 'Orders',     to: '/orders', authenticated: true },
  { label: 'Partners',   to: '/partners', authenticated: false },
  { label: 'Contact',    to: '/contact-us', authenticated: false },
]

const hasPartnerRole = computed(() =>
  !!auth.user?.active_client_id &&
  (auth.user?.roles ?? []).some(r => r.role_name === 'ADMIN' && r.client_id != null)
)

// Row 2 category bar
const categoryPills = [
  { label: 'All Courses',  to: '/courses',              primary: false },
  { label: 'Free Courses', to: '/courses?is_free=true', primary: true  },
]
const categoryLinks = [
  { label: 'Beginner',     to: '/courses?difficulty=beginner' },
  { label: 'Intermediate', to: '/courses?difficulty=intermediate' },
  { label: 'Advanced',     to: '/courses?difficulty=advanced' },
]

onMounted(() => {
  window.addEventListener('scroll', () => { scrolled.value = window.scrollY > 4 })
})
watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-50 transition-all duration-200 bg-white',
      scrolled ? 'shadow-md' : 'border-b border-slate-100'
    ]"
  >
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md">
      Skip to main content
    </a>

    <!-- ── Row 1: Main nav ─────────────────────────────────────────────────── -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">

      <!-- Logo -->
      <NuxtLink to="/" class="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md" aria-label="DrillSpace — Home">
        <img src="/images/logo-square.png" alt="DrillSpace" class="h-9 w-auto" />
      </NuxtLink>

      <!-- Search bar (desktop) -->
      <form class="hidden md:flex flex-1 max-w-xl items-center relative" @submit.prevent="submitSearch">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search maritime courses..."
          class="w-full pl-5 pr-14 py-2.5 text-sm rounded-full border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-0 outline-none transition-all"
          aria-label="Search courses"
        />
        <button
          type="submit"
          class="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors active:scale-95"
          aria-label="Search"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
      </form>

      <!-- Right: notification + quick links + auth -->
      <div class="hidden md:flex items-center gap-1 ml-auto flex-shrink-0">

        <!-- Quick text links -->
         <template v-for="link in quickLinks" :key="link.to">
           <NuxtLink
             v-if="link.authenticated ? auth.isAuthenticated : true"
             :to="link.to"
             class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-50"
           >
             {{ link.label }}
           </NuxtLink>
        </template>

        <div class="w-px h-5 bg-slate-200 mx-1"></div>

        <!-- Become a Partner CTA — shown to guests and student-only users -->
        <NuxtLink
          v-if="!hasPartnerRole"
          to="/partner"
          class="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Sell Courses
        </NuxtLink>

        <!-- Partner Portal link — shown to users with ADMIN role on a client -->
        <NuxtLink
          v-if="hasPartnerRole"
          to="/partner/dashboard"
          class="hidden lg:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Partner Portal
        </NuxtLink>

        <!-- Auth state -->
        <template v-if="auth.isAuthenticated">
          <NuxtLink
            to="/profile"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-sm font-medium text-slate-700"
          >
            <div class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {{ (auth.user?.full_name || auth.user?.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <span class="hidden lg:block max-w-[100px] truncate">
              {{ auth.user?.full_name?.split(' ')[0] || auth.user?.username || 'Account' }}
            </span>
          </NuxtLink>
          <button
            type="button"
            class="ml-1 px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
            @click="handleLogout"
          >
            Sign Out
          </button>
        </template>
        <template v-if="!auth.isAuthenticated">
          <NuxtLink
            to="/login"
            class="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50 transition-all"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="px-5 py-2 rounded-full text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md hover:shadow-primary-500/20 transition-all active:scale-95"
          >
            Register
          </NuxtLink>
        </template>
      </div>

      <!-- Mobile: hamburger -->
      <button
        type="button"
        class="md:hidden ml-auto p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Open navigation menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- ── Row 2: Category bar (desktop only) ───────────────────────────────── -->
    <div class="hidden md:block border-t border-slate-100 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-3">
        <!-- Pill buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <NuxtLink
            v-for="pill in categoryPills"
            :key="pill.to"
            :to="pill.to"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95',
              pill.primary
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'border-2 border-slate-300 text-slate-600 hover:border-primary-400 hover:text-primary-600'
            ]"
          >
            {{ pill.label }}
          </NuxtLink>
        </div>

        <!-- Divider -->
        <div class="w-px h-5 bg-slate-200 flex-shrink-0"></div>

        <!-- Category links (scrollable) -->
        <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Course categories">
          <NuxtLink
            v-for="cat in categoryLinks"
            :key="cat.label"
            :to="cat.to"
            class="flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all whitespace-nowrap"
          >
            {{ cat.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- ── Mobile menu ───────────────────────────────────────────────────────── -->
    <Transition name="slide-down">
      <div
        v-if="mobileMenuOpen"
        id="mobile-menu"
        class="md:hidden border-t border-slate-100 bg-white shadow-xl"
      >
        <!-- Mobile search -->
        <div class="px-4 pt-4 pb-2">
          <form class="relative" @submit.prevent="submitSearch">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search maritime courses..."
              class="w-full pl-5 pr-14 py-3 text-sm rounded-full border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 outline-none"
              aria-label="Search courses"
            />
            <button type="submit"
              class="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center active:scale-95"
              aria-label="Search">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </form>
        </div>

        <!-- Category pills mobile -->
        <div class="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <NuxtLink v-for="pill in categoryPills" :key="pill.label"
            :to="pill.to"
            :class="['flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold',
              pill.primary ? 'bg-primary-500 text-white' : 'border-2 border-slate-300 text-slate-600']">
            {{ pill.label }}
          </NuxtLink>
          <NuxtLink v-for="cat in categoryLinks" :key="cat.label" :to="cat.to"
            class="flex-shrink-0 px-3 py-1.5 rounded-md text-sm text-slate-600 bg-slate-50 whitespace-nowrap">
            {{ cat.label }}
          </NuxtLink>
        </div>

        <!-- Nav links -->
        <div class="px-4 pb-2 space-y-1 border-t border-slate-100 pt-3">
          <NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to"
            class="flex items-center px-3 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]">
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- Auth mobile -->
        <div class="px-4 pb-4 pt-2 border-t border-slate-100 space-y-2">
          <template v-if="auth.isAuthenticated">
            <div class="flex items-center gap-3 px-3 py-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center">
                {{ (auth.user?.full_name || auth.user?.username || 'U').charAt(0).toUpperCase() }}
              </div>
              <p class="text-sm font-semibold text-slate-800">{{ auth.user?.full_name || auth.user?.username }}</p>
            </div>
            <NuxtLink to="/my/courses" class="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]">My Courses</NuxtLink>
            <NuxtLink to="/orders" class="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]">My Orders</NuxtLink>
            <NuxtLink to="/profile" class="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]">My Profile</NuxtLink>
            <button type="button" class="w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left min-h-[44px]" @click="handleLogout">Sign Out</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="block w-full text-center py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary-300">Sign In</NuxtLink>
            <NuxtLink to="/register" class="block w-full text-center py-3 rounded-xl bg-primary-500 text-sm font-bold text-white hover:bg-primary-600">Register</NuxtLink>
            <NuxtLink to="/partner" class="block w-full text-center py-3 rounded-xl border-2 border-primary-200 text-sm font-semibold text-primary-600 hover:bg-primary-50">Sell Courses</NuxtLink>
          </template>
          <template v-if="auth.isAuthenticated && hasPartnerRole">
            <NuxtLink to="/partner/dashboard" class="block w-full text-center py-3 rounded-xl bg-primary-600 text-sm font-bold text-white hover:bg-primary-700">Partner Portal</NuxtLink>
          </template>
          <template v-if="auth.isAuthenticated && !hasPartnerRole">
            <NuxtLink to="/partner" class="block w-full text-center py-3 rounded-xl border-2 border-primary-200 text-sm font-semibold text-primary-600 hover:bg-primary-50">Sell Courses</NuxtLink>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.22s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
