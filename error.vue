<script setup lang="ts">
interface Props {
  error: { statusCode: number; message: string }
}

defineProps<Props>()
</script>

<template>
  <NuxtLayout name="default">
    <div class="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
      <div class="text-8xl font-black text-slate-100 mb-4 select-none">{{ error.statusCode }}</div>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">
        {{ error.statusCode === 404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan' }}
      </h1>
      <p class="text-slate-500 text-sm max-w-sm mb-8">
        {{ error.statusCode === 404
          ? 'Halaman yang Anda cari tidak ada atau telah dipindahkan.'
          : error.message || 'Terjadi kesalahan tak terduga. Silakan coba lagi.' }}
      </p>
      <div class="flex gap-3 flex-wrap justify-center">
        <BaseButton variant="primary" to="/">Kembali ke Beranda</BaseButton>
        <BaseButton variant="secondary" to="/courses">Lihat Course</BaseButton>
      </div>
    </div>
  </NuxtLayout>
</template>
