<script setup lang="ts">
import { dummyPartners } from '~/data/dummy'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Partner Pelatihan',
  description: 'Temukan lembaga pelatihan maritim terpercaya yang bermitra dengan DrillSpace.'
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-800">Partner Pelatihan</h1>
      <p class="text-slate-500 text-sm mt-1">{{ dummyPartners.length }} lembaga terpercaya bermitra dengan DrillSpace</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <PartnerCard v-for="partner in dummyPartners" :key="partner.id" :partner="partner" />
    </div>
  </div>
</template>
