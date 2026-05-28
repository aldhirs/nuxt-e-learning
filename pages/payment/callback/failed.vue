<script setup lang="ts">
definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Payment Failed' })

const route = useRoute()
const orderNumber = computed(() => route.query.order_number as string)
const reason = computed(() => route.query.reason as string || 'Payment was cancelled or could not be processed by the e-wallet provider.')
</script>

<template>
  <div class="min-h-[calc(100vh-112px)] flex items-center justify-center px-4">
    <div class="text-center max-w-sm w-full">

      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 class="text-xl font-bold text-slate-800 mb-2">Payment Failed</h1>
      <p class="text-slate-500 text-sm mb-6">{{ reason }}</p>

      <div class="flex flex-col gap-2">
        <BaseButton
          v-if="orderNumber"
          variant="primary"
          :to="`/orders/${orderNumber}/payment`"
        >
          Try Another Method
        </BaseButton>
        <BaseButton
          v-if="orderNumber"
          variant="secondary"
          :to="`/orders/${orderNumber}`"
        >
          View Order Details
        </BaseButton>
        <BaseButton variant="ghost" to="/courses">Browse Courses</BaseButton>
      </div>

      <p class="text-xs text-slate-400 mt-6">
        Need help?
        <NuxtLink to="/kontak" class="text-primary-600 hover:underline">Contact our support</NuxtLink>
      </p>

    </div>
  </div>
</template>
