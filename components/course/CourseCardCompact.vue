<script setup lang="ts">
import type { CourseListItem } from '~/types'

interface Props {
  course: CourseListItem
}

defineProps<Props>()

const { formatCurrency } = useFormatters()
</script>

<template>
  <NuxtLink :to="`/courses/${course.slug}`" class="group flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
    <!-- Thumbnail -->
    <div class="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-slate-200">
      <img
        v-if="course.thumbnail_url"
        :src="course.thumbnail_url"
        :alt="course.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-primary-50">
        <svg class="w-6 h-6 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <p class="text-xs text-primary-600 font-medium truncate">{{ course.partner.name }}</p>
      <h4 class="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{{ course.title }}</h4>
      <div class="mt-1">
        <span v-if="course.price === 0" class="text-xs font-semibold text-green-600">Gratis</span>
        <span v-else class="text-xs font-semibold text-primary-600">{{ formatCurrency(course.price) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
