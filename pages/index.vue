<script setup lang="ts">
import { useHomepageApi } from '~/composables/api/useHomepageApi'
import type { FeaturedHomepage, Testimonial } from '~/types'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Platform Pelatihan Maritim Terpercaya',
  description: 'DrillSpace — tingkatkan kompetensi maritim Anda bersama instruktur bersertifikat STCW dan para ahli industri.'
})

const homepage = useHomepageApi()

// SSR-friendly fetch: useAsyncData caches per key, replays on hydration.
const { data: featured, pending: featuredPending, error: featuredError, refresh: refreshFeatured } =
  await useAsyncData<FeaturedHomepage>('featured-homepage', () => homepage.getFeatured())

const { data: testimonialsEnvelope, pending: testimonialsPending, error: testimonialsError, refresh: refreshTestimonials } =
  await useAsyncData('homepage-testimonials', () => homepage.getTestimonials())

const featuredCourses = computed(() => featured.value?.courses?.slice(0, 6) ?? [])
const featuredPartners = computed(() => featured.value?.partners?.slice(0, 8) ?? [])
const testimonials = computed<Testimonial[]>(() => testimonialsEnvelope.value?.data ?? [])

async function refreshAll() {
  await Promise.all([refreshFeatured(), refreshTestimonials()])
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 text-white overflow-hidden">
      <div class="absolute inset-0 opacity-10" aria-hidden="true">
        <svg class="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <circle cx="900" cy="150" r="300" fill="white" opacity="0.3"/>
          <circle cx="200" cy="500" r="200" fill="white" opacity="0.2"/>
        </svg>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 bg-primary-500/20 text-primary-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary-500/30">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Platform Pelatihan Maritim #1 di Indonesia
          </div>
          <h1 class="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Tingkatkan Kompetensi Maritim Anda Bersama Para Ahli
          </h1>
          <p class="text-lg text-slate-300 mb-8 leading-relaxed">
            Akses ratusan course bersertifikat STCW dari instruktur berpengalaman. Belajar kapan saja, di mana saja, dan buktikan keahlian Anda dengan sertifikat resmi.
          </p>
          <div class="flex flex-wrap gap-3">
            <BaseButton variant="primary" size="lg" to="/courses">Jelajahi Course</BaseButton>
            <BaseButton variant="ghost" size="lg" to="/partners" class="!text-white !border-white/30 hover:!bg-white/10">Lihat Partner</BaseButton>
          </div>

          <div class="flex flex-wrap gap-6 mt-10 text-sm text-slate-400">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              200+ Course tersedia
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Sertifikat resmi
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Instruktur bersertifikat
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured courses -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Course Pilihan</h2>
          <p class="text-slate-500 text-sm mt-1">Course terpopuler minggu ini</p>
        </div>
        <BaseButton variant="ghost" to="/courses" size="sm">Lihat semua →</BaseButton>
      </div>

      <!-- Loading -->
      <div v-if="featuredPending && !featured" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Memuat course pilihan">
        <BaseSkeleton v-for="i in 3" :key="i" class="aspect-[4/5] rounded-xl" />
      </div>

      <!-- Error -->
      <BaseCard v-else-if="featuredError" padding="lg" class="border border-red-200 bg-red-50">
        <p class="text-sm text-red-700 mb-3">Gagal memuat course pilihan. {{ featuredError.message }}</p>
        <BaseButton variant="secondary" size="sm" @click="refreshFeatured()">Coba lagi</BaseButton>
      </BaseCard>

      <!-- Empty -->
      <BaseEmptyState
        v-else-if="featuredCourses.length === 0"
        title="Belum ada course pilihan"
        description="Course akan ditampilkan di sini segera setelah partner kami publikasikan."
        cta-label="Jelajahi semua course"
        cta-to="/courses"
      />

      <!-- Success -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard v-for="course in featuredCourses" :key="course.id" :course="course" />
      </div>
    </section>

    <!-- Testimonials -->
    <section v-if="testimonials.length > 0 || testimonialsPending" class="bg-slate-50 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-slate-800">Apa Kata Mereka</h2>
          <p class="text-slate-500 mt-2">Cerita dari profesional maritim yang sudah bergabung</p>
        </div>

        <div v-if="testimonialsPending && testimonials.length === 0" class="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
          <BaseSkeleton v-for="i in 3" :key="i" class="h-44 rounded-xl" />
        </div>

        <div v-else-if="testimonialsError" class="text-center">
          <p class="text-sm text-slate-500 mb-3">Gagal memuat testimoni.</p>
          <BaseButton variant="secondary" size="sm" @click="refreshTestimonials()">Coba lagi</BaseButton>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BaseCard v-for="t in testimonials" :key="t.id" shadow="sm" padding="lg" class="border border-slate-200 flex flex-col gap-3">
            <div v-if="t.rating" class="flex gap-0.5 text-yellow-400" :aria-label="`Rating ${t.rating} dari 5`">
              <svg v-for="n in 5" :key="n" class="w-4 h-4" :class="n <= t.rating ? '' : 'text-slate-200'" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed flex-1">"{{ t.content }}"</p>
            <div class="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                <img v-if="t.author_avatar_url" :src="t.author_avatar_url" :alt="t.author_name" class="w-full h-full object-cover" />
                <span v-else>{{ t.author_name.charAt(0) }}</span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">{{ t.author_name }}</p>
                <p v-if="t.author_role" class="text-xs text-slate-500 truncate">{{ t.author_role }}</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </section>

    <!-- Why DrillSpace -->
    <section class="bg-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-slate-800">Mengapa DrillSpace?</h2>
          <p class="text-slate-500 mt-2">Dirancang khusus untuk profesional maritim Indonesia</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="item in [
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Bersertifikat STCW', desc: 'Semua course memenuhi standar internasional STCW.' },
            { icon: 'M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', title: 'Video HD', desc: 'Materi video kualitas tinggi, bisa ditonton offline.' },
            { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Belajar Fleksibel', desc: 'Akses seumur hidup, belajar sesuai jadwal Anda.' },
            { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Komunitas Aktif', desc: 'Bergabung dengan ribuan profesional maritim.' },
          ]" :key="item.title" class="flex flex-col items-center text-center gap-3 p-6 rounded-xl hover:bg-slate-50 transition-colors">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
              </svg>
            </div>
            <h3 class="font-semibold text-slate-800">{{ item.title }}</h3>
            <p class="text-sm text-slate-500">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Partners -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Partner Pelatihan</h2>
          <p class="text-slate-500 text-sm mt-1">Lembaga terpercaya mitra DrillSpace</p>
        </div>
        <BaseButton variant="ghost" to="/partners" size="sm">Lihat semua →</BaseButton>
      </div>
      <!-- Loading -->
      <div v-if="featuredPending && !featured" class="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-busy="true">
        <BaseSkeleton v-for="i in 4" :key="i" class="aspect-square rounded-xl" />
      </div>

      <!-- Error / Empty share section -->
      <BaseCard v-else-if="featuredError" padding="lg" class="border border-red-200 bg-red-50">
        <p class="text-sm text-red-700 mb-3">Gagal memuat partner.</p>
        <BaseButton variant="secondary" size="sm" @click="refreshFeatured()">Coba lagi</BaseButton>
      </BaseCard>

      <BaseEmptyState
        v-else-if="featuredPartners.length === 0"
        title="Belum ada partner"
        description="Partner akan tampil di sini ketika mereka publikasikan course."
      />

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <PartnerCard v-for="partner in featuredPartners" :key="partner.slug" :partner="partner" />
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="bg-primary-600 text-white py-14">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-2xl font-bold mb-3">Siap Tingkatkan Karier Maritim Anda?</h2>
        <p class="text-primary-100 mb-6">Daftar gratis sekarang dan akses ratusan materi pelatihan maritim profesional.</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <BaseButton variant="secondary" size="lg" to="/register">Daftar Gratis</BaseButton>
          <BaseButton variant="ghost" size="lg" to="/courses" class="!text-white !border-white/30 hover:!bg-white/10">Jelajahi Course</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
