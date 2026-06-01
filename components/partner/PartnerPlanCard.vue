<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/partner'

const props = defineProps<{
  plan: SubscriptionPlan
  cycle: 'monthly' | 'yearly'
  highlighted?: boolean
}>()

const price = computed(() => props.cycle === 'yearly' ? props.plan.yearly_fee : props.plan.monthly_fee)
const priceFormatted = computed(() => price.value === 0 ? 'Free' : `Rp ${price.value.toLocaleString('id-ID')}`)
const cycleSuffix = computed(() => price.value === 0 ? '14 days' : props.cycle === 'yearly' ? '/year' : '/month')
const maxCourses = computed(() => props.plan.max_courses === -1 ? 'Unlimited' : String(props.plan.max_courses))
const maxStudents = computed(() => props.plan.max_students === -1 ? 'Unlimited' : String(props.plan.max_students))

const commission = computed(() => props.plan.commission_rate_percent != null ? String(props.plan.commission_rate_percent) : '—')

const features = computed(() => [
  { label: `${maxCourses.value} courses`, icon: '📚' },
  { label: `${maxStudents.value} students`, icon: '👥' },
  { label: `${commission.value}% commission`, icon: '💸' },
  { label: 'Custom subdomain', icon: '🌐' },
  { label: 'Analytics dashboard', icon: '📊' },
])
</script>

<template>
  <div :class="['relative flex flex-col bg-white rounded-2xl border p-6 transition-shadow', highlighted ? 'border-primary-400 shadow-lg shadow-primary-100 ring-1 ring-primary-400' : 'border-slate-200 hover:shadow-md']">
    <div v-if="highlighted" class="absolute -top-3 left-1/2 -translate-x-1/2">
      <span class="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
    </div>

    <div class="mb-4">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{{ plan.name }}</p>
      <div class="flex items-end gap-1">
        <span class="text-3xl font-bold text-slate-900">{{ priceFormatted }}</span>
        <span class="text-sm text-slate-500 mb-1">{{ cycleSuffix }}</span>
      </div>
    </div>

    <ul class="space-y-2.5 flex-1 mb-6">
      <li v-for="f in features" :key="f.label" class="flex items-center gap-2 text-sm text-slate-700">
        <span class="text-base leading-none">{{ f.icon }}</span>
        {{ f.label }}
      </li>
    </ul>

    <NuxtLink
      :to="plan.code === 'enterprise' ? '/contact-us' : `/partner/register?plan=${plan.code}`"
      :class="['block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors', highlighted ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200']"
    >
      {{ plan.code === 'enterprise' ? 'Contact Us' : 'Start Free Trial' }}
    </NuxtLink>
  </div>
</template>
