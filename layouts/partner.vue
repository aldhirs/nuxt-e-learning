<script setup lang="ts">
const auth = useAuthStore()
const partner = usePartnerStore()
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

onMounted(async () => {
  // Always refetch clients + subscription on every partner-layout mount so the
  // client list, status badge, and plan info reflect the latest state.
  await partner.fetchClients()
  await partner.fetchSubscription()
})

const { openLmsAdmin, isRedirecting: lmsRedirecting } = usePartnerLmsRedirect()
const storefrontUrl = computed(() =>
  partner.activeClient?.slug ? `/partners/${partner.activeClient.slug}` : '/partners'
)

const navLinks = [
  {
    to: '/partner/dashboard',
    label: 'Dashboard',
    mobileLabel: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    to: '/partner/billing',
    label: 'Billing & Subscription',
    mobileLabel: 'Billing',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    to: '/partner/profile',
    label: 'Organization Profile',
    mobileLabel: 'Profile',
    icon: 'M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

const statusBadge = computed(() => {
  // subscriptionStatus is null when GET /clients/subscription returns 404
  // (e.g. suspended clients). Fall back to the status field on the active
  // client summary, which is populated by fetchClients() via StatusByClientIDs
  // and includes all statuses (no status filter in that query).
  const status = partner.subscriptionStatus ?? partner.activeClient?.subscription_status
  switch (status) {
    case 'trial':     return { label: `Trial · ${partner.trialDaysLeft}d left`, cls: 'bg-blue-100 text-blue-700' }
    case 'active':    return { label: 'Active', cls: 'bg-green-100 text-green-700' }
    case 'past_due':  return { label: 'Past Due', cls: 'bg-amber-100 text-amber-700' }
    case 'suspended': return { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
    case 'cancelled': return { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' }
    default:          return null
  }
})

const isEmailUnverified = computed(() =>
  partner.activeClient !== null && partner.activeClient?.is_active === false
)

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

    <!-- Email verification ticker -->
    <Transition name="slide-down">
      <div
        v-if="isEmailUnverified"
        class="bg-amber-50 border-b border-amber-200"
        role="alert"
        aria-live="polite"
      >
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p class="text-sm text-amber-800 flex-1">
            <span class="font-semibold">Your account is not yet verified.</span>
            Please check your email and click the verification link to activate your partner account.
          </p>
          <NuxtLink
            to="/partner/verify"
            class="flex-shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-lg transition-colors"
          >
            Verify Now →
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <div class="flex-1">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="flex gap-6 lg:gap-8 items-start">

          <!-- ── Sidebar ──────────────────────────────────────── -->
          <aside class="w-56 flex-shrink-0 hidden md:block">
            <div class="sticky top-28 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <!-- Org info + client switcher -->
              <div class="p-4 border-b border-slate-100 bg-gradient-to-br from-primary-50 to-white">
                <PartnerClientSwitcher />
                <div class="mt-2.5 flex flex-col gap-1.5">
                  <!-- Subscription status — billing context, rounded-full -->
                  <div v-if="statusBadge" class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', statusBadge.cls]">
                      {{ statusBadge.label }}
                    </span>
                  </div>
                  <!-- Client / account status — identity context, rounded corners -->
                  <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span
                      v-if="partner.activeClient?.is_active"
                      class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700"
                    >
                      Verified
                    </span>
                    <span
                      v-else
                      class="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700"
                    >
                      Unverified
                    </span>
                  </div>
                </div>
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
            <slot />
          </div>

        </div>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40" aria-label="Mobile partner navigation">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors',
          isActive(link.to) ? 'text-primary-600' : 'text-slate-500'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon" />
        </svg>
        <span>{{ link.mobileLabel }}</span>
      </NuxtLink>
      <button
        type="button"
        class="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium text-red-400 transition-colors hover:text-red-500"
        @click="doLogout"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </nav>

    <AppFooter />
    <AppToast />
  </div>
</template>

<style scoped>
.slide-down-enter-active { transition: all 0.25s ease-out; }
.slide-down-leave-active { transition: all 0.2s ease-in; }
.slide-down-enter-from,
.slide-down-leave-to    { opacity: 0; max-height: 0; overflow: hidden; }
.slide-down-enter-to,
.slide-down-leave-from  { opacity: 1; max-height: 80px; }
</style>

