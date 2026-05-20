<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Kontak' })
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-16">
    <h1 class="text-3xl font-bold text-slate-800 mb-4">Hubungi Kami</h1>
    <p class="text-slate-600 leading-relaxed mb-6">Butuh bantuan? Tim kami siap membantu Anda.</p>
    <div class="space-y-4 text-sm text-slate-600">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>support@drillspace.id</span>
      </div>
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>+62 21 1234 5678</span>
      </div>
    </div>
    <p class="text-slate-500 text-sm italic mt-8">Halaman ini sedang dikembangkan.</p>
  </div>
</template>
