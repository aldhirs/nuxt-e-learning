<script setup lang="ts">
const auth = useAuthStore()
const partner = usePartnerStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

onMounted(async () => {
  // Always fetch clients so PartnerClientSwitcher has the full list.
  // fetchSubscription only if not already loaded to avoid redundant calls.
  await Promise.all([
    partner.fetchClients(),
    partner.subscriptionView === null ? partner.fetchSubscription() : Promise.resolve(),
  ])
})

const { openLmsAdmin, isRedirecting: lmsRedirecting } = usePartnerLmsRedirect()
const storefrontUrl = computed(() =>
  partner.activeClient?.slug ? `/partners/${partner.activeClient.slug}` : '/partners'
)

const navLinks = [
  {
    to: '/partner/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: '/partner/billing',
    label: 'Billing & Subscription',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    to: '/partner/profile',
    label: 'Organization Profile',
    icon: 'M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

const statusBadge = computed(() => {
  switch (partner.subscriptionStatus) {
    case 'trial':     return { label: `Trial · ${partner.trialDaysLeft}d left`, cls: 'bg-blue-100 text-blue-700' }
    case 'active':    return { label: 'Active', cls: 'bg-green-100 text-green-700' }
    case 'past_due':  return { label: 'Past Due', cls: 'bg-amber-100 text-amber-700' }
    case 'suspended': return { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
    case 'cancelled': return { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' }
    default:          return null
  }
})

async function doLogout() {
  partner.reset()
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[--color-bg]">
    <AppNavbar />

    <!-- Status banner (below navbar, full-width) -->
    <PartnerStatusBanner
      :status="partner.subscriptionStatus"
      :trial-days-left="partner.trialDaysLeft"
    />

    <div class="flex-1">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="flex gap-6 lg:gap-8 items-start">

          <!-- ── Sidebar ──────────────────────────────────────── -->
          <aside class="w-56 flex-shrink-0 hidden md:block">
            <div class="sticky top-28 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <!-- Org info + client switcher -->
              <div class="p-4 border-b border-slate-100 bg-gradient-to-br from-primary-50 to-white">
                <PartnerClientSwitcher />
                <span
                  v-if="statusBadge"
                  :class="['inline-block mt-2.5 text-xs font-semibold px-2 py-0.5 rounded-full', statusBadge.cls]"
                >
                  {{ statusBadge.label }}
                </span>
              </div>

              <!-- Nav -->
              <nav aria-label="Partner portal menu">
                <ul class="py-2">
                  <li v-for="link in navLinks" :key="link.to">
                    <NuxtLink
                      :to="link.to"
                      :class="[
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isActive(link.to)
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

                  <!-- External links -->
                  <li class="border-t border-slate-100 mt-2 pt-2">
                    <button
                      type="button"
                      :disabled="!partner.canAccessLms || lmsRedirecting"
                      :class="[
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 border-transparent w-full text-left',
                        partner.canAccessLms
                          ? 'text-slate-600 hover:text-primary-600 hover:bg-primary-50/50'
                          : 'text-slate-300 cursor-not-allowed opacity-60'
                      ]"
                      :title="!partner.canAccessLms ? 'Suspended — pay invoice to reactivate' : 'Open LMS admin panel'"
                      @click="openLmsAdmin"
                    >
                      <svg v-if="lmsRedirecting" class="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Manage Courses
                    </button>
                  </li>
                  <li>
                    <NuxtLink
                      :to="storefrontUrl"
                      target="_blank"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-primary-600 hover:bg-primary-50/50 transition-colors border-l-2 border-transparent"
                    >
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Partner Page
                    </NuxtLink>
                  </li>
                  <li>
                    <a
                      href="/contact-us"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-primary-600 hover:bg-primary-50/50 transition-colors border-l-2 border-transparent"
                    >
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Help & Support
                    </a>
                  </li>

                  <!-- Sign out -->
                  <li class="border-t border-slate-100 mt-2 pt-2">
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50/60 transition-colors border-l-2 border-transparent"
                      @click="doLogout"
                    >
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>

          <!-- ── Page content ────────────────────────────────── -->
          <div class="flex-1 min-w-0">
            <Transition name="profile-page" mode="out-in">
              <slot />
            </Transition>
          </div>

        </div>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40" aria-label="Mobile navigation">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium text-slate-500"
        active-class="text-primary-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
        </svg>
        <span>{{ link.label.split(' ')[0] }}</span>
      </NuxtLink>
    </nav>

    <AppFooter />
    <AppToast />
  </div>
</template>

<style scoped>
.profile-page-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.profile-page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.profile-page-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.profile-page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
