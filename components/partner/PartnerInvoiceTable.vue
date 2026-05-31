<script setup lang="ts">
import type { SubscriptionInvoice, InvoiceStatus, BillingCycle } from '~/types/partner'

const props = defineProps<{
  invoices: SubscriptionInvoice[]
  loading?: boolean
  highlightInvoice?: string | null
  disabledPay?: boolean
}>()

const emit = defineEmits<{ pay: [invoice: SubscriptionInvoice] }>()

function statusLabel(s: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = { pending: 'Pending', paid: 'Paid', past_due: 'Overdue', cancelled: 'Cancelled' }
  return map[s] ?? s
}
function statusClass(s: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    pending: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    past_due: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }
  return map[s] ?? ''
}
function dueDateLabel(due: string) {
  const d = new Date(due)
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)} days ago`
  if (diff === 0) return 'today'
  return `in ${diff} day${diff === 1 ? '' : 's'}`
}
function periodLabel(start: string, end: string) {
  const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function planLabel(inv: SubscriptionInvoice): string | null {
  const snap = inv.plan_snapshot
  if (!snap) return null
  const cycle = inv.billing_cycle as BillingCycle | null
  const fee = cycle === 'yearly' ? snap.yearly_fee : snap.monthly_fee
  const cycleLabel = cycle === 'yearly' ? '/yr' : '/mo'
  return `${snap.plan_name} · Rp ${fee.toLocaleString('id-ID')}${cycleLabel}`
}
</script>

<template>
  <div class="overflow-x-auto">
    <template v-if="loading">
      <div class="space-y-3 p-4">
        <div v-for="i in 3" :key="i" class="h-12 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </template>

    <template v-else-if="!invoices.length">
      <div class="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg class="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm font-medium">No invoices yet</p>
        <p class="text-xs mt-1">Your first invoice will be generated 7 days before your period ends.</p>
      </div>
    </template>

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 text-xs text-slate-500 font-medium">
          <th class="text-left py-3 px-4">Invoice #</th>
          <th class="text-left py-3 px-4 hidden sm:table-cell">Period</th>
          <th class="text-right py-3 px-4">Amount</th>
          <th class="text-left py-3 px-4 hidden md:table-cell">Due Date</th>
          <th class="text-center py-3 px-4">Status</th>
          <th class="text-right py-3 px-4">Action</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        <tr
          v-for="inv in invoices"
          :key="inv.id"
          :class="[
            'hover:bg-slate-50 transition-colors',
            inv.status === 'past_due' ? 'bg-red-50/40' : '',
            highlightInvoice === inv.invoice_number ? 'ring-2 ring-primary-400 ring-inset' : ''
          ]"
        >
          <td class="py-3 px-4">
            <span class="font-mono text-xs text-slate-700">{{ inv.invoice_number }}</span>
            <p v-if="planLabel(inv)" class="text-xs text-slate-400 mt-0.5">{{ planLabel(inv) }}</p>
          </td>
          <td class="py-3 px-4 hidden sm:table-cell text-slate-600">{{ periodLabel(inv.period_start, inv.period_end) }}</td>
          <td class="py-3 px-4 text-right font-semibold text-slate-800">Rp {{ inv.amount.toLocaleString('id-ID') }}</td>
          <td class="py-3 px-4 hidden md:table-cell">
            <span :class="['text-xs', inv.status === 'past_due' ? 'text-red-600 font-semibold' : 'text-slate-500']">
              {{ new Date(inv.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              <span class="ml-1 opacity-70">({{ dueDateLabel(inv.due_date) }})</span>
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusClass(inv.status)]">
              {{ statusLabel(inv.status) }}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button
              v-if="inv.status === 'pending' || inv.status === 'past_due'"
              type="button"
              :disabled="disabledPay"
              :title="disabledPay ? 'Account suspended — contact support to reactivate' : undefined"
              :class="[
                'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                disabledPay
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                  : 'text-white bg-primary-600 hover:bg-primary-700'
              ]"
              @click="!disabledPay && emit('pay', inv)"
            >
              Pay
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
