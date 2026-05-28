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
        {{ error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong' }}
      </h1>
      <p class="text-slate-500 text-sm max-w-sm mb-8">
        {{ error.statusCode === 404
          ? "The page you're looking for doesn't exist or has been moved."
          : error.message || 'An unexpected error occurred. Please try again.' }}
      </p>
      <div class="flex gap-3 flex-wrap justify-center">
        <BaseButton variant="primary" to="/">Back to Home</BaseButton>
        <BaseButton variant="secondary" to="/courses">Browse Courses</BaseButton>
      </div>
    </div>
  </NuxtLayout>
</template>
