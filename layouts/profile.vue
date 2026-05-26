<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const userInitial = computed(() =>
  (auth.user?.full_name || auth.user?.username || auth.user?.email || 'U').charAt(0).toUpperCase()
)

const navLinks = [
  {
    to: '/profile',
    label: 'Profil',
    exact: true,
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  },
  {
    to: '/orders',
    label: 'Daftar Order',
    exact: false,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
  },
  {
    to: '/profile/edit',
    label: 'Edit Profil',
    exact: true,
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
  }
]

function isActive(link: typeof navLinks[0]) {
  return link.exact
    ? route.path === link.to
    : route.path.startsWith(link.to)
}

async function doLogout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[--color-bg]">
    <AppNavbar />

    <div class="flex-1">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="flex gap-6 lg:gap-8 items-start">

          <!-- ── Sidebar ──────────────────────────────────────── -->
          <aside class="w-56 flex-shrink-0 hidden md:block">
            <!-- sticky card: stays at top-left regardless of content height changes -->
            <div class="sticky top-28 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <!-- User info -->
              <div class="p-5 border-b border-slate-100 bg-gradient-to-br from-primary-50 to-white">
                <div class="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-lg mb-3 shadow-md select-none">
                  {{ userInitial }}
                </div>
                <p class="text-sm font-bold text-slate-800 truncate leading-tight">
                  {{ auth.user?.full_name || auth.user?.username || 'Pengguna' }}
                </p>
                <p class="text-xs text-slate-400 truncate mt-0.5">{{ auth.user?.email }}</p>
              </div>

              <!-- Nav -->
              <nav aria-label="Menu profil">
                <ul class="py-2">
                  <li v-for="link in navLinks" :key="link.to">
                    <NuxtLink
                      :to="link.to"
                      :class="[
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isActive(link)
                          ? 'font-semibold text-primary-600 bg-primary-50/70 border-l-2 border-primary-500'
                          : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50/50 border-l-2 border-transparent'
                      ]"
                    >
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
                      </svg>
                      {{ link.label }}
                    </NuxtLink>
                  </li>

                  <li class="border-t border-slate-100 mt-2 pt-2">
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50/60 transition-colors border-l-2 border-transparent"
                      @click="doLogout"
                    >
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          <!-- ── Page content: animates on route change ──────── -->
          <div class="flex-1 min-w-0">
            <Transition name="profile-content" mode="out-in">
              <div :key="route.path">
                <slot />
              </div>
            </Transition>
          </div>

        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.profile-content-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.profile-content-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.profile-content-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.profile-content-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
