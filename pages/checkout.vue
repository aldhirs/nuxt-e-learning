<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useOrderStore } from '~/stores/order'
import { useCoursesApi } from '~/composables/api/useCoursesApi'
import { useOrdersApi } from '~/composables/api/useOrdersApi'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'
import type { Course, Order } from '~/types'

definePageMeta({ layout: 'minimal', middleware: 'auth' })
useSeoMeta({ title: 'Checkout' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const orderStore = useOrderStore()
const coursesApi = useCoursesApi()
const ordersApi = useOrdersApi()
const { formatCurrency } = useFormatters()

const courseSlug = computed(() => (route.query.course as string) || '')

// Fetch course beneran dari BE — bukan dari dummy. Kalau slug invalid / 404,
// page tampilkan empty state (bukan throw, lebih user-friendly).
const { data: course, pending: coursePending, error: courseError } = await useAsyncData<Course | null>(
  () => `checkout-course:${courseSlug.value}`,
  async () => {
    if (!courseSlug.value) return null
    try {
      return await coursesApi.getCourseBySlug(courseSlug.value)
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 404) return null
      throw err
    }
  },
  { watch: [courseSlug] }
)

const isLoading = ref(false)
const orderCreated = ref(false)
const createdOrder = ref<Order | null>(null)
const serverError = ref('')

const form = reactive({
  full_name: auth.user?.full_name ?? '',
  email: auth.user?.email ?? '',
  phone: auth.user?.phone ?? ''
})

// Hidrasi ulang kalau /me lands setelah page mount (cookie ada tapi store kosong).
watch(() => auth.user, (u) => {
  if (u) {
    if (!form.full_name && u.full_name) form.full_name = u.full_name
    if (!form.email && u.email) form.email = u.email
    if (!form.phone && u.phone) form.phone = u.phone
  }
})

const phoneRegex = helpers.regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/)
const rules = {
  full_name: { required, minLength: minLength(3) },
  email: { required, email },
  phone: {
    required,
    phoneRegex: helpers.withMessage('Nomor HP tidak valid (contoh: 08123456789 atau +628123456789)', phoneRegex)
  }
}
const v$ = useVuelidate(rules, form)

// PRD #2 menolak checkout course gratis — BE return 422 "Course ini gratis —
// gunakan endpoint enroll-free". Kita pre-check supaya UX-nya jelas.
const isFreeCourse = computed(() => course.value?.is_free === true || course.value?.price === 0)
const isPriceUnset = computed(() => course.value?.price === null || course.value?.price === undefined)
const subtotal = computed(() => course.value?.price ?? 0)
const tax = computed(() => 0) // Tax handling at BE side; UI hides for now until BE returns tax_amount.
const total = computed(() => subtotal.value + tax.value)

function normalizePhone(raw: string): string {
  const t = raw.trim()
  if (t.startsWith('0')) return '+62' + t.slice(1)
  if (t.startsWith('62')) return '+' + t
  return t
}

async function placeOrder() {
  serverError.value = ''
  if (!course.value) return
  if (isFreeCourse.value) {
    serverError.value = 'This course is free. Please click "Enroll Free" on the course page.'
    return
  }
  if (isPriceUnset.value) {
    serverError.value = 'Course price has not been set by the partner. Please try again later.'
    return
  }
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    const res = await ordersApi.createOrder({
      course_id: course.value.id,
      student_full_name: form.full_name.trim(),
      student_email: form.email.trim().toLowerCase(),
      student_phone: normalizePhone(form.phone)
    })

    // Snapshot course supaya halaman order detail bisa render title/thumbnail
    // tanpa refetch (BE tidak nest course).
    const orderWithCourse: Order = {
      ...res.order,
      course: {
        id: course.value.id,
        title: course.value.title,
        slug: course.value.slug,
        thumbnail_url: course.value.thumbnail_url
      }
    }
    orderStore.setOrder(orderWithCourse)
    createdOrder.value = orderWithCourse
    orderCreated.value = true
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; reason?: string; message?: string; fields?: Record<string, string> }
    const reason = (e.reason || '').toLowerCase()
    if (e.status === 409 || reason.includes('sudah enrolled') || reason.includes('already')) {
      serverError.value = 'You are already enrolled or have an active order for this course.'
    } else if (e.fields && Object.keys(e.fields).length > 0) {
      serverError.value = Object.values(e.fields).join(' • ')
    } else if (e.status === 422) {
      serverError.value = e.message || 'Course cannot be checked out. Check the course status or try another course.'
    } else if (e.status === 401) {
      auth.logout()
      router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
      return
    } else if (e.status === 0) {
      serverError.value = 'Unable to connect to server. Check your internet connection.'
    } else {
      serverError.value = e.message || 'Failed to create order. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

function goToPayment() {
  if (!createdOrder.value) return
  // BE-provided redirect_url = /orders/{n}/payment. PRD #3 payment endpoints
  // belum deploy — page payment akan tampilkan placeholder. Untuk MVP, arahkan
  // user ke detail order biar mereka tetap punya jejak.
  router.push(`/orders/${createdOrder.value.order_number}`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <!-- Loading course -->
    <div v-if="coursePending && !course" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <BaseSkeleton class="h-24 w-full" />
        <BaseSkeleton class="h-64 w-full" />
      </div>
      <div class="lg:col-span-1">
        <BaseSkeleton class="h-56 w-full" />
      </div>
    </div>

    <!-- Course not found -->
    <BaseEmptyState
      v-else-if="!course"
      icon="search"
      title="Course not found"
      :description="courseError ? 'Failed to load course. Please try again.' : 'This course is not available.'"
      cta-label="Browse Catalog"
      cta-to="/courses"
    />

    <!-- Success state -->
    <div v-else-if="orderCreated && createdOrder" class="text-center py-12">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">Order Created Successfully</h1>
      <p class="text-slate-500 text-sm mb-1">
        Order #: <span class="font-mono font-semibold text-slate-700">{{ createdOrder.order_number }}</span>
      </p>
      <p class="text-slate-500 text-sm mb-8">
        Complete payment before
        <span class="font-medium">{{ new Date(createdOrder.expires_at).toLocaleString('id-ID') }}</span>
        to access this course.
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <BaseButton variant="primary" @click="goToPayment">Go to Order Details</BaseButton>
        <BaseButton variant="secondary" to="/orders">View My Orders</BaseButton>
      </div>
    </div>

    <!-- Form -->
    <template v-else>
      <h1 class="text-xl font-bold text-slate-800 mb-6">Checkout</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-5">
          <!-- Free course notice -->
          <div v-if="isFreeCourse" class="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            This course is <strong>free</strong>. Go back to the course page and click "Enroll Free" to sign up instantly.
            <NuxtLink :to="`/courses/${course.slug}`" class="underline font-medium ml-1">Open course →</NuxtLink>
          </div>

          <!-- Price unset notice -->
          <div v-else-if="isPriceUnset" class="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Course price has not been set by the partner. Please try again later or choose another course.
          </div>

          <!-- Server error banner -->
          <div v-if="serverError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {{ serverError }}
          </div>

          <!-- Course summary -->
          <BaseCard shadow="sm" padding="md" class="border border-slate-200">
            <h2 class="text-sm font-semibold text-slate-700 mb-3">Ordered Course</h2>
            <div class="flex gap-3">
              <div class="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                <img v-if="course?.thumbnail_url" :src="course.thumbnail_url" :alt="course.title" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p v-if="course?.partner?.name || course?.client?.name" class="text-xs text-primary-600">
                  {{ course?.partner?.name || course?.client?.name }}
                </p>
                <p class="text-sm font-medium text-slate-800 line-clamp-2">{{ course?.title }}</p>
              </div>
            </div>
          </BaseCard>

          <!-- Buyer info -->
          <BaseCard shadow="sm" padding="md" class="border border-slate-200">
            <h2 class="text-sm font-semibold text-slate-700 mb-4">Buyer Information</h2>
            <div class="space-y-4">
              <BaseInput
                v-model="form.full_name"
                label="Full Name"
                placeholder="As on your ID card"
                :error="v$.full_name.$error ? 'Name must be at least 3 characters' : ''"
                required
                @blur="v$.full_name.$touch"
              />
              <BaseInput
                v-model="form.email"
                type="email"
                label="Email"
                placeholder="Confirmation will be sent to this email"
                :error="v$.email.$error ? 'Invalid email' : ''"
                required
                @blur="v$.email.$touch"
              />
              <BaseInput
                v-model="form.phone"
                label="No. HP"
                placeholder="08123456789"
                :error="v$.phone.$error ? (v$.phone.$errors[0]?.$message as string) : ''"
                hint="Used for payment confirmation"
                required
                @blur="v$.phone.$touch"
              />
            </div>
          </BaseCard>
        </div>

        <!-- Order summary -->
        <div class="lg:col-span-1">
          <div class="sticky top-20">
            <BaseCard shadow="sm" padding="md" class="border border-slate-200">
              <h2 class="text-sm font-semibold text-slate-700 mb-4">Order Summary</h2>
              <CheckoutPriceBreakdown :subtotal="subtotal" :tax="tax" :total="total" />

              <div class="mt-5">
                <BaseButton
                  variant="primary"
                  size="lg"
                  block
                  :loading="isLoading"
                  :disabled="isLoading || isFreeCourse || isPriceUnset"
                  @click="placeOrder"
                >
                  Bayar {{ formatCurrency(total) }}
                </BaseButton>
              </div>

              <p class="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure & encrypted payment
              </p>
            </BaseCard>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
