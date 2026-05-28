<script setup lang="ts">
import type { CourseListItem } from '~/types'

interface Props {
  course: CourseListItem
}

defineProps<Props>()

const { formatCurrency, discountPercent } = useFormatters()

const difficultyLabel: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced'
}

const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  intermediate: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  advanced: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
}

const isWishlisted = ref(false)
const heartAnimating = ref(false)

function toggleWishlist(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  isWishlisted.value = !isWishlisted.value
  heartAnimating.value = true
  setTimeout(() => { heartAnimating.value = false }, 300)
}
</script>

<template>
  <NuxtLink
    :to="`/courses/${course.slug}`"
    class="group flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-2xl"
  >
    <div
      class="relative bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.13)] transition-all duration-300 ease-out hover:-translate-y-1.5 flex flex-col h-full will-change-transform"
    >

      <!-- ── Thumbnail ─────────────────────────── -->
      <div class="relative aspect-[4/2] bg-slate-100 overflow-hidden">
        <img
          v-if="course.thumbnail_url"
          :src="course.thumbnail_url"
          :alt="course.title"
          class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.09]"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200"
        >
          <svg class="w-14 h-14 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <!-- Gradient overlay on hover -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <!-- Badges top-left -->
        <div class="absolute top-3 left-3 flex gap-1.5">
          <span
            v-if="course.is_free"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-500 text-white shadow-sm"
          >FREE</span>
          <span
            v-else-if="course.price !== null && course.compare_at_price && course.compare_at_price > course.price"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm"
          >-{{ discountPercent(course.price, course.compare_at_price) }}%</span>
        </div>
      </div>

      <!-- ── Content ────────────────────────────── -->
      <div class="p-4 flex flex-col flex-1">

        <!-- Partner name -->
        <p class="text-[11px] font-bold text-primary-500 uppercase tracking-widest mb-1.5 truncate">
          {{ course.partner.name }}
        </p>

        <!-- Title -->
        <h3 class="font-bold text-slate-800 text-[15px] leading-snug mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200">
          {{ course.title }}
        </h3>

        <!-- Pill tags -->
        <div class="flex flex-wrap gap-1.5 mb-3">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors duration-200"
            :class="difficultyColor[course.difficulty] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'"
          >
            {{ difficultyLabel[course.difficulty] ?? course.difficulty }}
          </span>
        </div>

        <!-- Price -->
        <div class="mt-auto pt-3 border-t border-slate-100">
          <template v-if="course.is_free">
            <span class="text-emerald-600 font-extrabold text-xl tracking-tight">Free</span>
          </template>
          <template v-else-if="course.price !== null">
            <div class="flex items-baseline gap-2">
              <span class="text-primary-600 font-extrabold text-xl tracking-tight">
                {{ formatCurrency(course.price) }}
              </span>
              <span
                v-if="course.compare_at_price && course.compare_at_price > course.price"
                class="text-slate-400 line-through text-[13px]"
              >{{ formatCurrency(course.compare_at_price) }}</span>
            </div>
          </template>
          <template v-else>
            <span class="text-slate-400 text-sm italic">Price not set</span>
          </template>
        </div>

      </div>
    </div>
  </NuxtLink>
</template>
