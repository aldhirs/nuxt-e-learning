<script setup lang="ts">
import { dummyOrderList } from '~/data/dummy'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

useSeoMeta({ title: 'Order Saya' })

const auth = useAuthStore()
const router = useRouter()

if (!auth.isAuthenticated) {
  await router.push('/login?redirect=/orders')
}

const isLoading = ref(false)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <h1 class="text-2xl font-bold text-slate-800 mb-6">Order Saya</h1>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="rounded-xl overflow-hidden bg-white border border-slate-200">
        <div class="p-4 flex gap-4">
          <BaseSkeleton width="w-24" height="h-16" />
          <div class="flex-1 space-y-2">
            <BaseSkeleton height="h-3" width="w-1/4" />
            <BaseSkeleton height="h-4" />
            <BaseSkeleton height="h-4" width="w-3/4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <BaseEmptyState
      v-else-if="dummyOrderList.length === 0"
      icon="shopping-cart"
      title="Belum ada order"
      description="Anda belum pernah melakukan pembelian. Temukan course yang sesuai untuk Anda."
      cta-label="Jelajahi Course"
      cta-to="/courses"
    />

    <!-- List -->
    <div v-else class="space-y-4">
      <OrderCard v-for="order in dummyOrderList" :key="order.id" :order="order" />
    </div>
  </div>
</template>
