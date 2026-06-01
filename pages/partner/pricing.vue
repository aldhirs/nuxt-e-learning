<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/partner'

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Partner Pricing — DrillSpace' })

const cycle = ref<'monthly' | 'yearly'>('monthly')

const { data: plans, status, refresh } = await useFetch<SubscriptionPlan[]>(
  '/public/subscription/plans',
  {
    baseURL: useRuntimeConfig().public.apiBaseUrl as string,
    transform: (res: unknown) => (res as { data?: SubscriptionPlan[] })?.data ?? [],
  }
)
const isLoading = computed(() => status.value === 'pending')

const featureRows = [
  { label: 'Max Courses', key: 'max_courses' as const, format: (v: number) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Max Students', key: 'max_students' as const, format: (v: number) => v === -1 ? 'Unlimited' : String(v) },
  { label: 'Platform Commission', static: (plan: SubscriptionPlan) => plan.commission_rate_percent != null ? `${plan.commission_rate_percent}%` : '—' },
  { label: 'Custom Subdomain', static: '✓' },
  { label: 'Analytics Dashboard', static: (plan: SubscriptionPlan) => plan.code === 'trial' ? '—' : '✓' },
  { label: 'Priority Support', static: (plan: SubscriptionPlan) => ['pro', 'enterprise'].includes(plan.code) ? '✓' : '—' },
  { label: 'Dedicated Support', static: (plan: SubscriptionPlan) => plan.code === 'enterprise' ? '✓' : '—' },
  { label: '99.9% SLA', static: (plan: SubscriptionPlan) => plan.code === 'enterprise' ? '✓' : '—' },
]
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-16">
    <div class="text-center mb-10">
      <NuxtLink to="/partner" class="text-sm text-primary-600 hover:underline mb-4 inline-block">← Back to Partner page</NuxtLink>
      <h1 class="text-3xl font-bold text-slate-900 mt-2">Full Plan Comparison</h1>
      <p class="text-slate-500 mt-2">All plans start with a 14-day free trial.</p>
      <div class="inline-flex bg-slate-100 p-1 rounded-xl gap-1 mt-5">
        <button :class="['px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', cycle === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700']" @click="cycle = 'monthly'">Monthly</button>
        <button :class="['px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', cycle === 'yearly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700']" @click="cycle = 'yearly'">Yearly <span class="text-green-600 text-xs font-semibold ml-1">save ~17%</span></button>
      </div>
    </div>

    <div v-if="isLoading" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      <div v-for="i in 4" :key="i" class="h-72 bg-slate-100 rounded-2xl animate-pulse" />
    </div>
    <div v-else-if="!plans?.length" class="text-center py-12 text-slate-400">
      <p class="mb-3">Failed to load pricing.</p>
      <button class="text-sm text-primary-600 hover:underline" @click="refresh()">Try Again</button>
    </div>
    <template v-else>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <PartnerPlanCard v-for="plan in plans" :key="plan.id" :plan="plan" :cycle="cycle" :highlighted="plan.code === 'pro'" />
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left py-3 px-5 text-slate-500 font-medium">Feature</th>
              <th v-for="plan in plans" :key="plan.id" class="text-center py-3 px-4 text-slate-800 font-semibold">{{ plan.name }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="row in featureRows" :key="row.label" class="hover:bg-slate-50/50 transition-colors">
              <td class="py-3 px-5 text-slate-700">{{ row.label }}</td>
              <td v-for="plan in plans" :key="plan.id" class="py-3 px-4 text-center font-medium text-slate-700">
                <template v-if="row.key">{{ row.format!(plan[row.key] as number) }}</template>
                <template v-else-if="typeof row.static === 'function'">{{ (row.static as (p: SubscriptionPlan) => string)(plan) }}</template>
                <template v-else>{{ row.static }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-center text-xs text-slate-400 mt-5">*Prices exclude 11% VAT.</p>
    </template>
  </div>
</template>
