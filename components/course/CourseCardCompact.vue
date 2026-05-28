<script setup lang="ts">
import type { CourseListItem } from '~/types'

interface Props {
  course: CourseListItem
}

defineProps<Props>()

const { formatCurrency } = useFormatters()

const difficultyLabel: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced'
}

const difficultyColor: Record<string, string> = {
  beginner:     'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-amber-50 text-amber-700',
  advanced:     'bg-rose-50 text-rose-700'
}
</script>

<template>
  <NuxtLink
    :to="`/courses/${course.slug}`"
    class="group flex gap-3 p-3 rounded-xl bg-white hover:bg-slate-50/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 will-change-transform"
  >

    <!-- Thumbnail -->
    <div class="relative w-[72px] h-[56px] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm group-hover:shadow-md transition-shadow duration-200">
      <img
        v-if="course.thumbnail_url"
        :src="course.thumbnail_url"
        :alt="course.title"
        class="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-300 ease-out"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100"
      >
        <svg class="w-6 h-6 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <!-- Free badge overlay -->
      <span
        v-if="course.is_free"
        class="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white leading-none shadow-sm"
      >FREE</span>
    </div>

    <!-- Text content -->
    <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
      <div>
        <p class="text-[10px] font-bold text-primary-500 uppercase tracking-widest truncate mb-0.5">
          {{ course.partner.name }}
        </p>
        <h4 class="text-[13px] font-semibold text-slate-800 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200 leading-snug">
          {{ course.title }}
        </h4>
      </div>

      <div class="flex items-center justify-between mt-1.5 gap-2">
        <!-- Price -->
        <span v-if="course.is_free" class="text-sm font-bold text-emerald-600">Free</span>
        <span v-else-if="course.price !== null" class="text-sm font-bold text-primary-600">
          {{ formatCurrency(course.price) }}
        </span>
        <span v-else class="text-xs text-slate-400 italic">Not set</span>

        <!-- Difficulty pill -->
        <span
          class="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200"
          :class="difficultyColor[course.difficulty] ?? 'bg-slate-100 text-slate-500'"
        >
          {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
        </span>
      </div>
    </div>

  </NuxtLink>
</template>
