<template>
  <footer class="bg-slate-900 text-slate-400">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="mb-3">
            <img src="/images/logo.png" alt="DrillSpace" class="h-15 w-auto bg-white rounded-lg px-2 py-1" />
          </div>
          <p class="text-sm leading-relaxed">Trusted maritime training platform. Enhance your competency with industry experts.</p>
        </div>

        <!-- Quick links -->
        <div>
          <h3 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navigation</h3>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.to">
              <NuxtLink :to="link.to" class="text-sm hover:text-white transition-colors">{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Social + copyright -->
        <div>
          <template v-if="socials.length">
          <h3 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Follow Us</h3>
          <div class="flex gap-3 mb-6">
            <a v-for="social in socials" :key="social.label" :href="social.href" :aria-label="social.label" target="_blank" rel="noopener noreferrer"
              class="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="social.icon" />
              </svg>
            </a>
          </div>
          </template>
          <p class="text-xs">© 2026 DrillSpace. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const quickLinks = [
  { label: 'Home',              to: '/' },
  { label: 'Courses',           to: '/courses' },
  { label: 'Partners',          to: '/partners' },
  { label: 'About Us',          to: '/tentang' },
  { label: 'Contact',           to: '/contact-us' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy',    to: '/privacy' },
]

// Social links come from the platform contact info (PRD #16); empty → hidden.
const { info } = usePlatformContactInfo()

const SOCIAL_ICONS = [
  { key: 'linkedin',  label: 'LinkedIn',  icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { key: 'instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { key: 'youtube',   label: 'YouTube',   icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { key: 'facebook',  label: 'Facebook',  icon: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z' },
  { key: 'tiktok',    label: 'TikTok',    icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  { key: 'website',   label: 'Website',   icon: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.93 11h-3.95a15.7 15.7 0 00-1.38-6.02A8.02 8.02 0 0119.93 11zM12 2.04c1.17 1.6 2.07 4.1 2.27 8.96H9.73C9.93 6.14 10.83 3.64 12 2.04zM9.4 4.98A15.7 15.7 0 008.02 11H4.07A8.02 8.02 0 019.4 4.98zM4.07 13h3.95c.12 2.2.6 4.27 1.38 6.02A8.02 8.02 0 014.07 13zM12 21.96c-1.17-1.6-2.07-4.1-2.27-8.96h4.54c-.2 4.86-1.1 7.36-2.27 8.96zm2.6-2.94A15.7 15.7 0 0015.98 13h3.95a8.02 8.02 0 01-5.33 6.02z' },
] as const

const socials = computed(() =>
  SOCIAL_ICONS.filter(s => info.value?.socials?.[s.key]).map(s => ({ label: s.label, icon: s.icon, href: info.value!.socials[s.key] })),
)
</script>
