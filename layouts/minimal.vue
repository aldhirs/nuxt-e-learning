<template>
  <div class="min-h-screen flex flex-col bg-[--color-bg]">
    <header class="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 rounded-md" aria-label="DrillSpace — Halaman Utama">
          <img src="/images/logo.png" alt="DrillSpace" class="h-8 w-auto" />
        </NuxtLink>

        <div class="flex items-center gap-3 text-sm text-slate-500">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="hidden sm:inline">Pembayaran aman & terenkripsi</span>
        </div>
      </div>
    </header>

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <footer class="bg-white border-t border-slate-100 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
        © 2026 DrillSpace. All rights reserved. ·
        <NuxtLink to="/tentang" class="hover:text-primary-600 transition-colors">Tentang</NuxtLink> ·
        <NuxtLink to="/kontak" class="hover:text-primary-600 transition-colors">Kontak</NuxtLink>
      </div>
    </footer>
  </div>
</template>
