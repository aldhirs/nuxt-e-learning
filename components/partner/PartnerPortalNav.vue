<script setup lang="ts">
const route = useRoute()
const partner = usePartnerStore()
const { openLmsAdmin, isRedirecting } = usePartnerLmsRedirect()

const navLinks = [
  { label: 'Dashboard', to: '/partner/dashboard', icon: 'home' },
  { label: 'Billing & Subscription', to: '/partner/billing', icon: 'credit-card' },
  { label: 'Organization Profile', to: '/partner/profile', icon: 'user' },
]

const storefrontUrl = computed(() => partner.activeClient?.slug ? `/partners/${partner.activeClient.slug}` : '/partners')

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <nav class="flex flex-col h-full py-5 px-3 gap-1" aria-label="Partner portal navigation">
    <div class="flex-1">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          isActive(link.to)
            ? 'bg-primary-50 text-primary-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        ]"
      >
        <svg v-if="link.icon === 'home'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <svg v-else-if="link.icon === 'credit-card'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <svg v-else-if="link.icon === 'user'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
        {{ link.label }}
      </NuxtLink>
    </div>

    <div class="border-t border-slate-200 my-2" />

    <button
      type="button"
      :disabled="!partner.canAccessLms || isRedirecting"
      :class="[
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left',
        partner.canAccessLms
          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          : 'text-slate-400 cursor-not-allowed opacity-60'
      ]"
      :title="!partner.canAccessLms ? 'Platform suspended — pay your invoice to reactivate' : 'Open LMS admin panel'"
      @click="openLmsAdmin"
    >
      <svg v-if="isRedirecting" class="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      Manage Courses (LMS)
    </button>

    <NuxtLink
      :to="storefrontUrl"
      target="_blank"
      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      View Partner Page
    </NuxtLink>

    <div class="border-t border-slate-200 my-2" />

    <a href="/contact-us" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Help & Support
    </a>
  </nav>
</template>
