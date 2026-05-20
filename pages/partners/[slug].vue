<script setup lang="ts">
import { dummyPartners, dummyCourseList } from '~/data/dummy'

definePageMeta({ layout: 'default' })

const route = useRoute()
const partner = computed(() => dummyPartners.find(p => p.slug === route.params.slug))

if (!partner.value) {
  throw createError({ statusCode: 404, message: 'Partner tidak ditemukan' })
}

useSeoMeta({
  title: partner.value?.name,
  description: partner.value?.description
})

const partnerCourses = computed(() => dummyCourseList.filter(c => c.partner.name === partner.value?.name))
</script>

<template>
  <div v-if="partner">
    <!-- Banner -->
    <div
      class="py-16"
      :style="{ background: `linear-gradient(135deg, ${partner.theme?.primary_color ?? '#2F80D2'} 0%, ${partner.theme?.secondary_color ?? '#1a5fa0'} 100%)` }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold bg-white/20 flex-shrink-0"
          >
            <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="w-full h-full object-contain rounded-2xl" />
            <span v-else>{{ partner.name[0] }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold">{{ partner.name }}</h1>
            <p class="text-white/80 mt-1 text-sm max-w-lg">{{ partner.description }}</p>
            <p class="text-white/60 text-xs mt-2">{{ partner.course_count }} course tersedia</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Courses -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 class="text-lg font-bold text-slate-800 mb-6">Course dari {{ partner.name }}</h2>

      <BaseEmptyState
        v-if="partnerCourses.length === 0"
        icon="inbox"
        title="Belum ada course"
        description="Partner ini belum mempublikasikan course."
      />

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard v-for="course in partnerCourses" :key="course.id" :course="course" />
      </div>
    </div>
  </div>
</template>
