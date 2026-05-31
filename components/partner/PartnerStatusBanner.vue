<script setup lang="ts">
import type { SubscriptionStatus } from '~/types/partner'

const props = defineProps<{
  status: SubscriptionStatus | null
  trialDaysLeft?: number
  invoiceNumber?: string | null
}>()

const emit = defineEmits<{ dismiss: [] }>()

const isDismissed = ref(false)

const config = computed(() => {
  switch (props.status) {
    case 'trial':
      if ((props.trialDaysLeft ?? 0) <= 0) {
        return { type: 'error', icon: '✕', text: 'Your trial has ended.', sub: 'Choose a paid plan to reactivate platform access.', cta: 'View Plans', href: '/partner/pricing', dismissable: false }
      }
      return { type: 'info', icon: 'ℹ', text: `Your trial ends in ${props.trialDaysLeft} day${props.trialDaysLeft === 1 ? '' : 's'}.`, sub: null, cta: 'View Paid Plans', href: '/partner/billing', dismissable: true }
    case 'past_due':
      return { type: 'warning', icon: '⚠', text: 'Your subscription invoice is unpaid.', sub: 'Pay now to avoid platform suspension.', cta: 'Pay Now', href: props.invoiceNumber ? `/partner/billing?invoice=${props.invoiceNumber}` : '/partner/billing', dismissable: false }
    case 'suspended':
      return { type: 'error', icon: '⛔', text: 'Your account has been suspended. All portal actions are disabled.', sub: 'Contact our support team to reactivate your account.', cta: 'Contact Support', href: '/contact-us', dismissable: false }
    case 'cancelled':
      return { type: 'neutral', icon: '○', text: 'Your subscription has been cancelled.', sub: null, cta: 'Contact Us', href: '/contact-us', dismissable: false }
    default:
      return null
  }
})

const show = computed(() => !!config.value && !(config.value.dismissable && isDismissed.value))

const colorClass = computed(() => {
  switch (config.value?.type) {
    case 'error':   return 'bg-red-50 border-red-200 text-red-800'
    case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800'
    case 'info':    return 'bg-blue-50 border-blue-200 text-blue-800'
    case 'neutral': return 'bg-slate-50 border-slate-200 text-slate-700'
    default:        return ''
  }
})
const ctaClass = computed(() => {
  switch (config.value?.type) {
    case 'error':   return 'bg-red-600 hover:bg-red-700 text-white'
    case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white'
    case 'info':    return 'bg-blue-600 hover:bg-blue-700 text-white'
    case 'neutral': return 'bg-slate-600 hover:bg-slate-700 text-white'
    default:        return ''
  }
})
</script>

<template>
  <div v-if="show" :class="['border-b px-4 py-3 flex items-center gap-3 text-sm', colorClass]" role="alert">
    <span class="flex-shrink-0 font-semibold text-base leading-none">{{ config!.icon }}</span>
    <div class="flex-1 min-w-0">
      <span class="font-semibold">{{ config!.text }}</span>
      <span v-if="config!.sub" class="ml-1 opacity-80">{{ config!.sub }}</span>
    </div>
    <NuxtLink :to="config!.href" :class="['flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors', ctaClass]">
      {{ config!.cta }}
    </NuxtLink>
    <button
      v-if="config!.dismissable"
      type="button"
      class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
      aria-label="Dismiss"
      @click="isDismissed = true; emit('dismiss')"
    >×</button>
  </div>
</template>
