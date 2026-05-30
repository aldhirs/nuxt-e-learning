<script setup lang="ts">
import type { SubscriptionStatus } from '~/types/partner'

const partner = usePartnerStore()
const toast = useToast()
const { transformUrl } = useFileUrl()

const open = ref(false)
const switching = ref<number | null>(null)

function statusBadge(status?: SubscriptionStatus | null): { label: string; severity: 'success' | 'warn' | 'danger' | 'info' | 'default' } | null {
  switch (status) {
    case 'trial':     return { label: 'Trial',     severity: 'info' }
    case 'active':    return { label: 'Active',    severity: 'success' }
    case 'past_due':  return { label: 'Past Due',  severity: 'warn' }
    case 'suspended': return { label: 'Suspended', severity: 'danger' }
    case 'cancelled': return { label: 'Cancelled', severity: 'default' }
    default:          return null
  }
}

async function select(clientId: number) {
  if (clientId === partner.activeClient?.id || switching.value !== null) return
  const targetName = partner.clients.find(c => c.id === clientId)?.name ?? 'organization'
  switching.value = clientId
  try {
    await partner.switchClient(clientId)
    open.value = false
    toast.success(`Switched to ${targetName}`)
    await navigateTo('/partner/dashboard')
  } catch {
    toast.error('Failed to switch organization. Please try again.')
  } finally {
    switching.value = null
  }
}
</script>

<template>
  <div>
    <!-- ── Trigger — same visual as before ───────────────────────────── -->
    <button
      type="button"
      class="w-full text-left group"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-label="open ? 'Close organization switcher' : 'Open organization switcher'"
      @click="open = true"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-full flex-shrink-0 shadow-md overflow-hidden bg-primary-500">
          <img
            v-if="partner.activeClient?.logo"
            :src="transformUrl(partner.activeClient.logo)"
            :alt="partner.activeClient.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-white font-bold text-base select-none">
            {{ (partner.activeClient?.name || 'P').charAt(0).toUpperCase() }}
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-slate-800 truncate leading-tight">
            {{ partner.activeClient?.name ?? 'Partner' }}
          </p>
          <p class="text-xs text-slate-400 truncate">
            {{ partner.activeClient?.slug ? `${partner.activeClient.slug}.drillspace.id` : '' }}
          </p>
        </div>

        <svg
          :class="['w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 group-hover:text-slate-600', open ? 'rotate-180' : '']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- ── Modal ──────────────────────────────────────────────────────── -->
    <BaseModal v-model="open" title="Switch Organization" size="md">
      <div class="space-y-2">
        <!-- Client cards -->
        <button
          v-for="client in partner.clients"
          :key="client.id"
          type="button"
          :disabled="switching !== null"
          :class="[
            'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
            client.id === partner.activeClient?.id
              ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-300'
              : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50',
            switching !== null && 'opacity-60 cursor-not-allowed'
          ]"
          @click="select(client.id)"
        >
          <!-- Avatar / spinner -->
          <div class="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden bg-primary-100 shadow-sm">
            <template v-if="switching === client.id">
              <div class="w-full h-full flex items-center justify-center bg-primary-100">
                <svg class="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            </template>
            <template v-else-if="client.logo">
              <img :src="transformUrl(client.logo)" :alt="client.name" class="w-full h-full object-cover" />
            </template>
            <template v-else>
              <div :class="[
                'w-full h-full flex items-center justify-center font-bold text-sm',
                client.id === partner.activeClient?.id ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'
              ]">
                {{ client.name.charAt(0).toUpperCase() }}
              </div>
            </template>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['text-sm font-semibold truncate', client.id === partner.activeClient?.id ? 'text-primary-700' : 'text-slate-800']">
                {{ client.name }}
              </span>
              <!-- Active checkmark -->
              <svg
                v-if="client.id === partner.activeClient?.id && switching !== client.id"
                class="w-4 h-4 text-primary-500 flex-shrink-0"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Active"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 truncate">{{ client.slug }}.drillspace.id</p>
          </div>

          <!-- Subscription status badge -->
          <BaseBadge
            v-if="statusBadge(client.subscription_status)"
            :label="statusBadge(client.subscription_status)!.label"
            :severity="statusBadge(client.subscription_status)!.severity"
            size="sm"
            class="flex-shrink-0"
          />
          <span
            v-else
            class="flex-shrink-0 text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full"
          >
            No Plan
          </span>
        </button>

        <!-- Empty state while clients not loaded yet -->
        <p v-if="partner.clients.length === 0" class="text-sm text-slate-400 text-center py-4">
          Loading organizations…
        </p>
      </div>

      <template #footer>
        <NuxtLink
          to="/partner/register"
          class="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          @click="open = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Organization
        </NuxtLink>
      </template>
    </BaseModal>
  </div>
</template>
