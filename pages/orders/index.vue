<script setup lang="ts">
import { useOrdersApi, type OrderListFilters } from '~/composables/api/useOrdersApi'
import { useAuthStore } from '~/stores/auth'
import type { OrderListItem, Paginated } from '~/types'

definePageMeta({ layout: 'profile', middleware: 'auth' })
useSeoMeta({ title: 'Order Saya' })

const route = useRoute()
const router = useRouter()
const ordersApi = useOrdersApi()
const auth = useAuthStore()

const PAGE_SIZE = 10

const statusTabs = [
  { value: '',          label: 'Semua' },
  { value: 'pending',   label: 'Menunggu Bayar' },
  { value: 'paid',      label: 'Lunas' },
  { value: 'expired',   label: 'Kedaluwarsa' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'refunded',  label: 'Refund' }
]

const filters = computed<OrderListFilters>(() => ({
  status: (route.query.status as OrderListFilters['status']) || undefined,
  limit: PAGE_SIZE,
  offset: route.query.offset ? Number(route.query.offset) : 0
}))

const currentPage = computed(() => Math.floor((filters.value.offset ?? 0) / PAGE_SIZE) + 1)
const queryKey = computed(() => `my-orders:${JSON.stringify(filters.value)}`)

const { data: page, pending, error, refresh } = await useAsyncData<Paginated<OrderListItem>>(
  queryKey.value,
  () => ordersApi.listMyOrders(filters.value),
  { watch: [filters] }
)

// Course data is now nested directly in the order list response from BE.
const orders = computed<OrderListItem[]>(() => page.value?.data ?? [])

const totalCount  = computed(() => page.value?.meta?.total ?? 0)
const totalPages  = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))
const hasPrev     = computed(() => currentPage.value > 1)
const hasNext     = computed(() => currentPage.value < totalPages.value)
const selectedStatus = computed(() => filters.value.status ?? '')

function setStatus(val: string) {
  router.push({ query: val ? { status: val } : {} })
}

function goPage(p: number) {
  const n = Math.max(1, Math.min(totalPages.value, p))
  const q: Record<string, string> = {}
  if (filters.value.status) q.status = filters.value.status
  if (n > 1) q.offset = String((n - 1) * PAGE_SIZE)
  router.push({ query: q })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function doLogout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <!-- ── Main Content ──────────────────────────────────────────── -->
  <div class="flex-1 min-w-0">

    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Daftar Order</h2>
        <p class="text-sm text-slate-400 mt-0.5">
          <template v-if="pending && !page">Memuat transaksi...</template>
          <template v-else-if="totalCount > 0">{{ totalCount }} transaksi ditemukan</template>
          <template v-else>Belum ada transaksi</template>
        </p>
      </div>
      <!-- Mobile logout -->
      <button
        type="button"
        class="md:hidden text-sm text-slate-500 hover:text-red-500 transition-colors"
        @click="doLogout"
      >
        Keluar
      </button>
    </div>

    <!-- ── Tab Filters ──────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div class="flex overflow-x-auto" style="scrollbar-width:none">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          :class="[
            'flex-shrink-0 flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap',
            selectedStatus === tab.value
              ? 'text-primary-600 border-primary-500 bg-primary-50/40'
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/80'
          ]"
          @click="setStatus(tab.value)"
        >
          {{ tab.label }}
          <span
            v-if="selectedStatus === tab.value && totalCount > 0"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-500 text-white tabular-nums"
          >
            {{ totalCount > 99 ? '99+' : totalCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- ── Loading skeletons ────────────────────────────────────── -->
    <div v-if="pending && !page" class="space-y-4" aria-busy="true">
      <div
        v-for="i in 4"
        :key="i"
        class="animate-fade-in-up bg-white rounded-2xl border border-slate-200 p-4 flex gap-4"
        :style="{ animationDelay: `${(i - 1) * 80}ms` }"
      >
        <BaseSkeleton class="w-24 h-20 rounded-xl flex-shrink-0" />
        <div class="flex-1 space-y-2.5 py-1">
          <BaseSkeleton class="h-3 w-28" />
          <BaseSkeleton class="h-5 w-3/4" />
          <BaseSkeleton class="h-3 w-1/3" />
        </div>
        <div class="flex-shrink-0 flex flex-col gap-2 items-end py-1">
          <BaseSkeleton class="h-5 w-20" />
          <BaseSkeleton class="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>

    <!-- ── Error ────────────────────────────────────────────────── -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4"
    >
      <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold text-red-700 mb-1">Gagal memuat order</p>
        <p class="text-xs text-red-600">{{ (error as { message?: string }).message ?? 'Terjadi kesalahan. Silakan coba lagi.' }}</p>
        <BaseButton variant="primary" size="sm" class="mt-3" @click="refresh()">Coba lagi</BaseButton>
      </div>
    </div>

    <!-- ── Empty: no orders ────────────────────────────────────── -->
    <BaseEmptyState
      v-else-if="!pending && orders.length === 0 && !filters.status"
      icon="shopping-cart"
      title="Belum ada order"
      description="Anda belum pernah melakukan pembelian. Temukan course yang sesuai untuk Anda."
      cta-label="Jelajahi Course"
      cta-to="/courses"
    />

    <!-- ── Empty: filter active ────────────────────────────────── -->
    <BaseEmptyState
      v-else-if="!pending && orders.length === 0 && filters.status"
      icon="search"
      title="Tidak ada order"
      :description="`Tidak ada order dengan status ${statusTabs.find(t => t.value === filters.status)?.label ?? filters.status}.`"
      cta-label="Lihat Semua"
      @cta-click="setStatus('')"
    />

    <!-- ── Order list ───────────────────────────────────────────── -->
    <Transition name="fade-list" mode="out-in">
      <div v-if="!pending && orders.length > 0" :key="selectedStatus + currentPage" class="space-y-4">
        <div
          v-for="(order, i) in orders"
          :key="order.id"
          class="animate-fade-in-up"
          :style="{ animationDelay: `${i * 55}ms` }"
        >
          <OrderCard :order="order" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-2 gap-4 flex-wrap">
          <p class="text-sm text-slate-400 tabular-nums">
            Halaman {{ currentPage }} / {{ totalPages }} · {{ totalCount }} total
          </p>
          <div class="flex items-center gap-2">
            <BaseButton variant="secondary" size="sm" :disabled="!hasPrev || pending" @click="goPage(currentPage - 1)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </BaseButton>
            <BaseButton variant="secondary" size="sm" :disabled="!hasNext || pending" @click="goPage(currentPage + 1)">
              Berikutnya
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-list-enter-active,
.fade-list-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
