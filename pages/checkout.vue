<script setup lang="ts">
import { dummyCourses } from '~/data/dummy'
import { useAuthStore } from '~/stores/auth'
import { useOrderStore } from '~/stores/order'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'
import type { Order } from '~/types'

definePageMeta({ layout: 'minimal' })

useSeoMeta({ title: 'Checkout' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orderStore = useOrderStore()
const { formatCurrency } = useFormatters()

const courseSlug = computed(() => route.query.course as string)
const course = computed(() => dummyCourses.find(c => c.slug === courseSlug.value))

if (!course.value) {
  throw createError({ statusCode: 404, message: 'Course tidak ditemukan' })
}

const isLoading = ref(false)
const orderCreated = ref(false)
const createdOrder = ref<Order | null>(null)

const form = reactive({
  full_name: auth.isAuthenticated ? auth.user?.full_name ?? '' : '',
  email: auth.isAuthenticated ? auth.user?.email ?? '' : '',
  phone: '',
  notes: ''
})

const phoneRegex = helpers.regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/)

const rules = {
  full_name: { required, minLength: minLength(3) },
  email: { required, email },
  phone: { required, phoneRegex: helpers.withMessage('Nomor telepon tidak valid (contoh: 08123456789)', phoneRegex) },
}

const v$ = useVuelidate(rules, form)

const isFree = computed(() => course.value?.price === 0)
const subtotal = computed(() => course.value?.price ?? 0)
const tax = computed(() => isFree.value ? 0 : Math.round(subtotal.value * 0.11))
const total = computed(() => subtotal.value + tax.value)

async function placeOrder() {
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 1000))

    const now = new Date()
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '')
    const seq = Math.floor(Math.random() * 9000 + 1000)
    const orderNumber = `DRS-${datePart}-${seq}`

    const order: Order = {
      order_id: Math.floor(Math.random() * 90000 + 10000),
      order_number: orderNumber,
      course: {
        id: course.value!.id,
        title: course.value!.title,
        slug: course.value!.slug,
        thumbnail_url: course.value!.thumbnail_url
      },
      student_full_name: form.full_name,
      student_email: form.email,
      student_phone: form.phone || null,
      unit_price: subtotal.value,
      tax_amount: tax.value,
      total_amount: total.value,
      currency: 'IDR',
      status: 'pending',
      payment_method: null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      paid_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: now.toISOString()
    }

    // Simpan ke store agar payment pages bisa menemukan order ini
    orderStore.setOrder(order)
    createdOrder.value = order
    orderCreated.value = true
  } finally {
    isLoading.value = false
  }
}

function goToPayment() {
  if (!createdOrder.value) return
  if (isFree.value) {
    router.push(`/activate?order=${createdOrder.value.order_number}`)
  } else {
    router.push(`/orders/${createdOrder.value.order_number}/payment`)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <!-- Success state -->
    <div v-if="orderCreated && createdOrder" class="text-center py-12">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">Order Berhasil Dibuat</h1>
      <p class="text-slate-500 text-sm mb-1">No. Order: <span class="font-mono font-semibold text-slate-700">{{ createdOrder.order_number }}</span></p>
      <p class="text-slate-500 text-sm mb-8">
        {{ isFree ? 'Course gratis siap diakses.' : 'Selesaikan pembayaran untuk mengakses course.' }}
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <BaseButton variant="primary" @click="goToPayment">
          {{ isFree ? 'Akses Course' : 'Bayar Sekarang' }}
        </BaseButton>
        <BaseButton variant="secondary" to="/orders">Lihat Order Saya</BaseButton>
      </div>
    </div>

    <template v-else>
      <h1 class="text-xl font-bold text-slate-800 mb-6">Checkout</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Course summary -->
          <BaseCard shadow="sm" padding="md" class="border border-slate-200">
            <h2 class="text-sm font-semibold text-slate-700 mb-3">Course yang dipesan</h2>
            <div class="flex gap-3">
              <div class="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                <img v-if="course?.thumbnail_url" :src="course.thumbnail_url" :alt="course.title" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-primary-600">{{ course?.partner?.name }}</p>
                <p class="text-sm font-medium text-slate-800 line-clamp-2">{{ course?.title }}</p>
              </div>
            </div>
          </BaseCard>

          <!-- Buyer info -->
          <BaseCard shadow="sm" padding="md" class="border border-slate-200">
            <h2 class="text-sm font-semibold text-slate-700 mb-4">Informasi Pemesan</h2>
            <div class="space-y-4">
              <BaseInput
                v-model="form.full_name"
                label="Nama Lengkap"
                placeholder="Nama sesuai KTP"
                :error="v$.full_name.$error ? 'Nama minimal 3 karakter' : ''"
                required
                @blur="v$.full_name.$touch"
              />
              <BaseInput
                v-model="form.email"
                type="email"
                label="Email"
                placeholder="Konfirmasi akan dikirim ke email ini"
                :error="v$.email.$error ? 'Email tidak valid' : ''"
                required
                @blur="v$.email.$touch"
              />
              <BaseInput
                v-model="form.phone"
                label="No. Telepon"
                placeholder="08123456789"
                :error="v$.phone.$error ? (v$.phone.$errors[0]?.$message as string) : ''"
                hint="Digunakan untuk konfirmasi pembayaran"
                required
                @blur="v$.phone.$touch"
              />
              <BaseInput
                v-model="form.notes"
                label="Catatan (opsional)"
                placeholder="Informasi tambahan untuk pesanan ini"
              />
            </div>
          </BaseCard>
        </div>

        <!-- Order summary -->
        <div class="lg:col-span-1">
          <div class="sticky top-20">
            <BaseCard shadow="sm" padding="md" class="border border-slate-200">
              <h2 class="text-sm font-semibold text-slate-700 mb-4">Ringkasan Pesanan</h2>
              <CheckoutPriceBreakdown :subtotal="subtotal" :tax="isFree ? 0 : tax" :total="total" />

              <div class="mt-5">
                <BaseButton
                  variant="primary"
                  size="lg"
                  block
                  :loading="isLoading"
                  :disabled="isLoading"
                  @click="placeOrder"
                >
                  {{ isFree ? 'Konfirmasi Gratis' : `Bayar ${formatCurrency(total)}` }}
                </BaseButton>
              </div>

              <p class="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pembayaran aman & terenkripsi
              </p>
            </BaseCard>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
