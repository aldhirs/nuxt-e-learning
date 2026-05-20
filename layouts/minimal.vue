<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-primary-600" aria-label="DrillSpace — Halaman Utama">
          <svg class="w-7 h-7 text-primary-500" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16 2L3 9v14l13 7 13-7V9L16 2zm0 2.5l10.5 5.7V22l-10.5 5.7L5.5 22V10.2L16 4.5z"/>
            <circle cx="16" cy="16" r="4" />
          </svg>
          <span>DrillSpace</span>
        </NuxtLink>

        <div class="flex items-center gap-3 text-sm text-slate-500">
          <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="hidden sm:inline">Pembayaran aman & terenkripsi</span>
        </div>
      </div>
    </header>

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <footer class="bg-white border-t border-slate-200 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
        © 2026 DrillSpace. All rights reserved. ·
        <NuxtLink to="/tentang" class="hover:text-slate-600 transition-colors">Tentang</NuxtLink> ·
        <NuxtLink to="/kontak" class="hover:text-slate-600 transition-colors">Kontak</NuxtLink>
      </div>
    </footer>
  </div>
</template>
