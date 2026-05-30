<script setup lang="ts">
import type { SubscriptionStatus } from '~/types/partner'

const partner = usePartnerStore()
const toast = useToast()
const { transformUrl } = useFileUrl()

const open = ref(false)
const switching = ref<number | null>(null)

// Show switcher UI if user has 2+ clients OR we always want the "Add org" option
const showDropdown = computed(() => open.value)

function close() { open.value = false }
function toggle() { open.value = !open.value }

async function select(clientId: number) {
  if (clientId === partner.activeClient?.id || switching.value !== null) return
  switching.value = clientId
  open.value = false
  try {
    await partner.switchClient(clientId)
    toast.success('Switched to ' + (partner.activeClient?.name ?? 'new organization'))
  } catch {
    toast.error('Failed to switch organization. Please try again.')
  } finally {
    switching.value = null
  }
}

const statusBadgeConfig = (status?: SubscriptionStatus | null) => {
  switch (status) {
    case 'trial':     return { label: 'Trial',     cls: 'bg-blue-100 text-blue-700' }
    case 'active':    return { label: 'Active',    cls: 'bg-green-100 text-green-700' }
    case 'past_due':  return { label: 'Past Due',  cls: 'bg-amber-100 text-amber-700' }
    case 'suspended': return { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
    case 'cancelled': return { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' }
    default:          return null
  }
}
</script>

<template>
  <div class="relative">
    <!-- Trigger — always clickable to open/close -->
    <button
      type="button"
      class="w-full text-left group"
      :aria-expanded="open"
      :aria-label="open ? 'Close organization switcher' : 'Open organization switcher'"
      @click="toggle"
    >
      <div class="flex items-center gap-2.5">
        <!-- Avatar: logo image or initial letter -->
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

        <!-- Chevron — always shown -->
        <svg
          :class="['w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 group-hover:text-slate-600', open ? 'rotate-180' : '']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown"
        class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
      >
        <!-- Client list -->
        <ul class="py-1 max-h-60 overflow-y-auto">
          <li
            v-for="client in partner.clients"
            :key="client.id"
            class="relative"
          >
            <button
              type="button"
              :disabled="switching !== null"
              :class="[
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                client.id === partner.activeClient?.id
                  ? 'bg-primary-50'
                  : 'hover:bg-slate-50',
              ]"
              @click="select(client.id)"
            >
              <!-- Avatar / spinner / check -->
              <div class="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-primary-100">
                <template v-if="switching === client.id">
                  <div class="w-full h-full flex items-center justify-center bg-primary-100">
                    <svg class="w-3.5 h-3.5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                </template>
                <template v-else-if="client.logo">
                  <img :src="transformUrl(client.logo)" :alt="client.name" class="w-full h-full object-cover" />
                </template>
                <template v-else>
                  <div :class="['w-full h-full flex items-center justify-center font-bold text-xs',
                    client.id === partner.activeClient?.id ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600']">
                    {{ client.name.charAt(0).toUpperCase() }}
                  </div>
                </template>
              </div>
              <!-- Active checkmark overlay -->
              <div v-if="client.id === partner.activeClient?.id && switching !== client.id" class="absolute right-2 top-1/2 -translate-y-1/2">
                <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <p :class="['text-sm font-medium truncate', client.id === partner.activeClient?.id ? 'text-primary-700' : 'text-slate-700']">
                  {{ client.name }}
                </p>
                <p class="text-xs text-slate-400 truncate">{{ client.slug }}.drillspace.id</p>
              </div>

              <!-- Status badge -->
              <span
                v-if="statusBadgeConfig(client.subscription_status)"
                :class="['flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full', statusBadgeConfig(client.subscription_status)!.cls]"
              >
                {{ statusBadgeConfig(client.subscription_status)!.label }}
              </span>
            </button>
          </li>

          <!-- Empty state while loading -->
          <li v-if="partner.clients.length === 0" class="px-3 py-3 text-xs text-slate-400 text-center">
            Loading organizations...
          </li>
        </ul>

        <!-- Footer: Add new org -->
        <div class="border-t border-slate-100 p-1.5">
          <NuxtLink
            to="/partner/register"
            class="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
            @click="close"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Organization
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Backdrop click-away -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />
  </div>
</template>

<style scoped>
.dropdown-enter-active { transition: all 0.15s ease-out; }
.dropdown-leave-active { transition: all 0.1s ease-in; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
