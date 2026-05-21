<script setup lang="ts">
import type { CourseListItem } from '~/types'

interface Props {
  course: CourseListItem
}

defineProps<Props>()

const { formatCurrency, discountPercent } = useFormatters()

const difficultyLabel: Record<string, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir'
}
</script>

<template>
  <NuxtLink :to="`/courses/${course.slug}`" class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl">
    <BaseCard hover shadow="sm" padding="none" class="overflow-hidden h-full flex flex-col">
      <!-- Thumbnail -->
      <div class="relative aspect-video bg-slate-200 overflow-hidden">
        <img
          v-if="course.thumbnail_url"
          :src="course.thumbnail_url"
          :alt="course.title"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-primary-50">
          <svg class="w-12 h-12 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <!-- Free badge -->
        <div v-if="course.is_free" class="absolute top-2 left-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">GRATIS</span>
        </div>

        <!-- Discount badge -->
        <div v-else-if="course.price !== null && course.compare_at_price && course.compare_at_price > course.price" class="absolute top-2 left-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500 text-white">
            -{{ discountPercent(course.price, course.compare_at_price) }}%
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 flex flex-col flex-1">
        <p class="text-xs text-primary-600 font-medium mb-1">{{ course.partner.name }}</p>
        <h3 class="font-semibold text-slate-800 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {{ course.title }}
        </h3>

        <!-- Meta row -->
        <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
            {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
          </span>
        </div>

        <!-- Price -->
        <div class="mt-auto">
          <div v-if="course.is_free" class="text-green-600 font-bold text-base">Gratis</div>
          <div v-else-if="course.price !== null" class="flex items-baseline gap-2">
            <span class="text-primary-600 font-bold text-base">{{ formatCurrency(course.price) }}</span>
            <span v-if="course.compare_at_price && course.compare_at_price > course.price" class="text-slate-400 line-through text-xs">
              {{ formatCurrency(course.compare_at_price) }}
            </span>
          </div>
          <div v-else class="text-slate-400 text-xs italic">Harga belum diset</div>
        </div>
      </div>
    </BaseCard>
  </NuxtLink>
</template>
