<script setup lang="ts">
import { useOrdersApi, type OrderListFilters } from '~/composables/api/useOrdersApi'
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import type { CourseListItem, OrderListItem, Paginated } from '~/types'

definePageMeta({ layout: 'default', middleware: 'auth' })
useSeoMeta({ title: 'Order Saya' })

const route = useRoute()
const router = useRouter()
const ordersApi = useOrdersApi()
const coursesApi = useCoursesApi()

const PAGE_SIZE = 12

const filters = computed<OrderListFilters>(() => ({
  status: (route.query.status as OrderListFilters['status']) || undefined,
  limit: PAGE_SIZE,
  offset: route.query.offset ? Number(route.query.offset) : 0
}))

const currentPage = computed(() => Math.floor((filters.value.offset ?? 0) / PAGE_SIZE) + 1)

const queryKey = computed(() => `my-orders:${JSON.stringify(filters.value)}`)
const { data: page, pending, error, refresh } = await useAsyncData<Paginated<OrderListItem>>(
  () => queryKey.value,
  () => ordersApi.listMyOrders(filters.value),
  { watch: [filters] }
)

// Workaround BE-FEEDBACK #10: order response tidak nest course. Kita
// fetch katalog public sekali, build map by ID, lalu enrich tiap order.
// Cached per session via useAsyncData key — tidak refetch saat filter berubah.
const { data: coursesPage } = await useAsyncData<Paginated<CourseListItem>>(
  'course-id-lookup',
  () => coursesApi.listCourses({ limit: 100 })
)
const courseById = computed(() => {
  const map = new Map<number, CourseListItem>()
  for (const c of coursesPage.value?.data ?? []) map.set(c.id, c)
  return map
})

const orders = computed<OrderListItem[]>(() => {
  const raw = page.value?.data ?? []
  return raw.map(o => {
    if (o.course?.title) return o
    const lookup = courseById.value.get(o.course_id)
    if (!lookup) return o
    return {
      ...o,
      course: {
        id: lookup.id,
        title: lookup.title,
        slug: lookup.slug,
        thumbnail_url: lookup.thumbnail_url
      }
    }
  })
})
const totalCount = computed(() => page.value?.meta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))
const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)
const hasActiveFilter = computed(() => Boolean(filters.value.status))

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'paid', label: 'Lunas' },
  { value: 'expired', label: 'Kedaluwarsa' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Direfund' }
]

const selectedStatus = computed({
  get: () => filters.value.status ?? '',
  set: (v: string) => updateQuery({ status: v || undefined, offset: undefined })
})

function updateQuery(partial: Record<string, string | number | undefined>) {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries(route.query)) {
    if (typeof v === 'string' && v) merged[k] = v
  }
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined || v === null || v === '') delete merged[k]
    else merged[k] = String(v)
  }
  router.push({ query: merged })
}

function clearFilters() {
  router.push({ query: {} })
}

function goPage(p: number) {
  const clamped = Math.max(1, Math.min(totalPages.value, p))
  updateQuery({ offset: (clamped - 1) * PAGE_SIZE })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <div class="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Order Saya</h1>
        <p class="text-slate-500 text-sm mt-1">
          <span v-if="pending && !page">Memuat order...</span>
          <span v-else-if="totalCount > 0">{{ totalCount }} order ditemukan</span>
          <span v-else>Belum ada order</span>
        </p>
      </div>
    </div>

    <!-- Filter status -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <BaseSelect
        v-model="selectedStatus"
        :options="statusOptions"
        class="min-w-[200px]"
        aria-label="Filter status order"
      />
      <button
        v-if="hasActiveFilter"
        type="button"
        class="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
        @click="clearFilters"
      >
        Reset filter
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending && !page" class="space-y-4" aria-busy="true">
      <div v-for="i in 3" :key="i" class="rounded-xl overflow-hidden bg-white border border-slate-200">
        <div class="p-4 flex gap-4">
          <BaseSkeleton class="w-24 h-16" />
          <div class="flex-1 space-y-2">
            <BaseSkeleton class="h-3 w-1/4" />
            <BaseSkeleton class="h-4" />
            <BaseSkeleton class="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <BaseCard v-else-if="error" padding="lg" class="border border-red-200 bg-red-50">
      <p class="text-sm text-red-700 mb-3">Gagal memuat order. {{ (error as { message?: string }).message ?? '' }}</p>
      <BaseButton variant="primary" size="sm" @click="refresh()">Coba lagi</BaseButton>
    </BaseCard>

    <!-- Empty (no filter) -->
    <BaseEmptyState
      v-else-if="orders.length === 0 && !hasActiveFilter"
      icon="shopping-cart"
      title="Belum ada order"
      description="Anda belum pernah melakukan pembelian. Temukan course yang sesuai untuk Anda."
      cta-label="Jelajahi Course"
      cta-to="/courses"
    />

    <!-- Empty (filtered) -->
    <BaseEmptyState
      v-else-if="orders.length === 0 && hasActiveFilter"
      icon="search"
      title="Tidak ada order untuk filter ini"
      description="Coba ubah filter status."
      cta-label="Reset Filter"
      @cta-click="clearFilters"
    />

    <!-- Success -->
    <div v-else class="space-y-4">
      <OrderCard v-for="order in orders" :key="order.id" :order="order" />

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 gap-4 flex-wrap">
        <p class="text-sm text-slate-500">
          Halaman {{ currentPage }} dari {{ totalPages }} · {{ orders.length }} dari {{ totalCount }} order
        </p>
        <div class="flex items-center gap-2">
          <BaseButton variant="ghost" size="sm" :disabled="!hasPrev || pending" @click="goPage(currentPage - 1)">← Sebelumnya</BaseButton>
          <BaseButton variant="ghost" size="sm" :disabled="!hasNext || pending" @click="goPage(currentPage + 1)">Berikutnya →</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
