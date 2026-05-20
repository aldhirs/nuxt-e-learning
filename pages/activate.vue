<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Aktivasi Course' })

const route = useRoute()
const router = useRouter()
const orderNumber = computed(() => route.query.order as string)
const isLoading = ref(true)
const isSuccess = ref(false)
const error = ref('')

onMounted(async () => {
  await new Promise(r => setTimeout(r, 1200))
  isLoading.value = false
  if (orderNumber.value) {
    isSuccess.value = true
  } else {
    error.value = 'Link aktivasi tidak valid.'
  }
})
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">
      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center gap-4">
        <BaseSpinner size="lg" />
        <p class="text-slate-500 text-sm">Mengaktifkan course Anda...</p>
      </div>

      <!-- Success -->
      <div v-else-if="isSuccess">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Course Berhasil Diaktifkan!</h1>
        <p class="text-slate-500 text-sm mb-6">
          Order <span class="font-mono font-semibold">{{ orderNumber }}</span> telah dikonfirmasi. Selamat belajar!
        </p>
        <div class="flex flex-col gap-2">
          <BaseButton variant="primary" to="/courses">Mulai Belajar Sekarang</BaseButton>
          <BaseButton variant="ghost" to="/orders">Lihat Order Saya</BaseButton>
        </div>
      </div>

      <!-- Error -->
      <div v-else>
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 mb-2">Aktivasi Gagal</h1>
        <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
        <BaseButton variant="secondary" to="/orders">Kembali ke Order</BaseButton>
      </div>
    </div>
  </div>
</template>
