<script setup lang="ts">
import type { Partner } from '~/types'

interface Props {
  partner: Partner
}

defineProps<Props>()
</script>

<template>
  <NuxtLink :to="`/partners/${partner.slug}`" class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl">
    <BaseCard hover shadow="sm" padding="md" class="h-full flex flex-col items-center text-center gap-3">
      <!-- Logo -->
      <div
        class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0"
        :style="{ background: partner.theme_primary ?? '#2F80D2', color: '#fff' }"
      >
        <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="w-full h-full object-contain" />
        <span v-else>{{ partner.name[0] }}</span>
      </div>

      <div class="flex-1">
        <h3 class="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{{ partner.name }}</h3>
      </div>

      <div class="text-xs text-slate-400">
        {{ partner.course_count }} course
      </div>
    </BaseCard>
  </NuxtLink>
</template>
