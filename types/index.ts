// ─── Partner ────────────────────────────────────────────────────────────────

// Shape returned by /public/partners and /public/partners/{slug}.
// id/description/created_at TIDAK ada di response BE — slug yang dipakai sebagai primary key di FE.
export interface Partner {
  slug: string
  name: string
  logo_url: string | null
  theme_primary: string | null
  theme_secondary: string | null
  course_count: number
}

// ─── Course ──────────────────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'published' | 'draft' | 'archived'
export type ContentType = 'video' | 'text' | 'pdf' | 'quiz'

// Partner mini-card seperti yang muncul di list / featured course.
export interface CoursePartner {
  slug: string
  name: string
  logo_url: string | null
}

// Shape /public/courses list item. price nullable saat course belum di-set harga.
export interface CourseListItem {
  id: number
  slug: string
  title: string
  description: string
  thumbnail_url: string | null
  difficulty: Difficulty
  price: number | null
  currency: string
  compare_at_price: number | null
  is_free: boolean
  published_at: string | null
  partner: CoursePartner
}

// Lesson minimal — banyak field admin (created_by, deleted_at, chapter ref balik, dll)
// di-strip dari ekspektasi konsumer.
export interface Lesson {
  id: number
  course_id?: number
  chapter_id?: number
  title: string
  description?: string | null
  duration_minutes: number | null
  position?: number
  is_preview: boolean
  content_type?: ContentType
}

export interface Chapter {
  id: number
  course_id?: number
  title: string
  description?: string | null
  position?: number
  lessons: Lesson[]
}

// /public/courses/slug/{slug} returns a much richer (and partly internal) shape.
// We model only what storefront needs; banned-field cleanup tracked di BE-FEEDBACK.
export interface Course {
  id: number
  slug: string
  title: string
  description: string
  thumbnail_url: string | null
  difficulty: Difficulty
  status: CourseStatus
  learning_method?: string
  price: number | null
  currency: string
  compare_at_price: number | null
  is_free?: boolean
  published_at: string | null
  created_at: string
  updated_at?: string
  enable_completion_cert?: boolean
  chapters: Chapter[]
  // BE returns `client` (with theme_primary/secondary, client_type) instead of `partner` di endpoint detail.
  client?: {
    slug: string
    name: string
    logo: string | null
    theme_primary: string | null
    theme_secondary: string | null
    client_type?: string
  }
  partner?: CoursePartner
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

// BE list endpoints (public/courses, public/partners) embed data + meta dalam `data` envelope:
//   { success, data: { data: T[], meta: PaginationMeta }, meta: ResponseMeta }
// useApi sudah unwrap satu lapis, jadi composable terima { data, meta }.
export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

// ─── Homepage / Featured / Testimonials / Search ─────────────────────────────

export interface FeaturedHomepage {
  courses: CourseListItem[]
  partners: Partner[]
}

export interface Testimonial {
  id: number
  author_name: string
  author_role: string | null
  author_avatar_url: string | null
  content: string
  course_id: number | null
  rating: number | null
  position?: number
}

export type SearchResultType = 'course' | 'partner'

export interface SearchResultCourse {
  type: 'course'
  id: number
  slug: string
  title: string
  description: string
  thumbnail_url: string | null
  is_free: boolean
  partner: CoursePartner
  price?: number | null
}

export interface SearchResultPartner {
  type: 'partner'
  slug: string
  name: string
  logo_url: string | null
  course_count: number
}

export type SearchResult = SearchResultCourse | SearchResultPartner

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

// ─── Enrollment (free / hybrid auth) ─────────────────────────────────────────

export interface EnrollFreeRequest {
  // Guest path wajib lengkap; authenticated (JWT) cukup partial — BE auto-fill dari profile.
  student_full_name?: string
  student_email?: string
  student_phone?: string
}

export interface EnrollFreeResponse {
  enrollment_id: number
  course_id: number
  student_user_id: number
  enrolled_at: string
  // Guest path tambah field activation:
  activation_required?: boolean
  activation_email?: string
}

// ─── Enrollment Check (GET /my/courses/:id/enrollment) ───────────────────────

export interface EnrollmentCheckClient {
  id: number
  slug: string
  name: string
  logo: string | null
}

export interface EnrollmentCheckResponse {
  enrolled: boolean
  enrollment_id?: number
  status?: 'active' | 'completed' | 'cancelled'
  enrollment_source?: string
  client?: EnrollmentCheckClient
}

// ─── My Purchased Courses ────────────────────────────────────────────────────

export interface PurchasedCourseClient {
  id: number
  name: string
  slug: string
  logo: string | null
}

export interface PurchasedCourseSummary {
  id: number
  title: string
  slug: string
  thumbnail_url: string | null
  difficulty: string | null
  status: string
  client?: PurchasedCourseClient
}

export interface PurchasedCourseItem {
  enrollment_id: number
  status: 'active' | 'completed' | 'cancelled'
  enrollment_source: string
  order_id: number | null  // numeric DB id — use /orders list, not a direct link
  enrolled_at: string
  completed_at: string | null
  course: PurchasedCourseSummary | null
}

export interface PagedPaging {
  page: number
  page_size: number
  total_items: number
  total_pages: number
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'

// Nested course snippet returned by GET /orders/:order_number.
// BE now embeds this directly so storefront needs only one request per order page.
export interface OrderCourse {
  id: number
  title: string
  slug: string
  thumbnail_url?: string | null
}

// BE shape (snake_case, flat). Beberapa field admin masih leak (client_id /
// student_user_id / cancelled_by) — diabaikan FE.
export interface Order {
  id: number
  order_number: string
  course_id: number
  unit_price: number
  tax_amount: number
  total_amount: number
  currency: string
  student_full_name: string
  student_email: string
  student_phone: string | null
  status: OrderStatus
  payment_method: string | null
  payment_reference?: string | null
  expires_at: string
  paid_at?: string | null
  expired_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  created_at: string
  updated_at?: string
  // Optional — kalau FE punya snapshot dari context checkout / cache lookup.
  course?: OrderCourse
}

export type OrderListItem = Order

export interface CreateOrderRequest {
  course_id: number
  student_full_name?: string
  student_email?: string
  student_phone?: string
}

export interface CreateOrderResponse {
  order: Order
  redirect_url: string
  activation_email_sent?: boolean
}

export interface CancelOrderRequest {
  reason?: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────
// Shape mengikuti PRD #3 (`docs/03-doku-payment-integration/api.yaml`).
// FE saat ini cuma akses storefront endpoint (sysadmin di luar scope):
//   POST /api/v1/orders/{order_number}/payment/initiate
//   GET  /api/v1/payments/{order_number}/status
//   POST /api/v1/orders/{order_number}/payment/cancel

export type PaymentMethodVA = 'va_bca' | 'va_mandiri' | 'va_bri' | 'va_bni'
export type PaymentMethodEwallet = 'ewallet_ovo' | 'ewallet_dana' | 'ewallet_gopay'
export type PaymentMethodQRIS = 'qris'

export type PaymentMethod = PaymentMethodVA | PaymentMethodQRIS | PaymentMethodEwallet

// Order status (sebelumnya re-exported sebagai OrderStatus di section Order).
// PaymentStatus dipakai oleh GET /payments/{n}/status — superset OrderStatus.
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled' | 'created'

export interface InitiatePaymentRequest {
  payment_method: PaymentMethod
}

// Shape per contract — semua respon initiate share field umum:
// payment_method, amount, currency, expires_at, instructions[].
// Channel-specific field di-discriminate via `payment_method`.
interface PaymentSessionBase {
  payment_method: PaymentMethod
  amount: number
  currency: string
  expires_at: string
  instructions?: string[]
}

export interface PaymentSessionVA extends PaymentSessionBase {
  payment_method: PaymentMethodVA
  bank_name: string
  virtual_account_number: string
  account_name: string
}

export interface PaymentSessionQRIS extends PaymentSessionBase {
  payment_method: 'qris'
  qr_content: string
  qr_image_url?: string | null
}

export interface PaymentSessionEwallet extends PaymentSessionBase {
  payment_method: PaymentMethodEwallet
  provider_name: string
  redirect_url: string
  deeplink_url?: string | null
}

export type PaymentSession = PaymentSessionVA | PaymentSessionQRIS | PaymentSessionEwallet

// PaymentSession yang disimpan di store — tambah `order_number` agar bisa
// dilookup tanpa context route (Pinia store keyed by order).
export type StoredPaymentSession = PaymentSession & { order_number: string }

export interface PaymentStatusSnapshot {
  order_number: string
  status: PaymentStatus
  payment_method: PaymentMethod | null
  total_amount: number
  currency: string
  expires_at: string
  paid_at?: string | null
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'pending_activation' | 'suspended'

export interface UserRoleEntry {
  role_id: number
  role_name: string
  client_id: number | null
  client_name: string | null
  assigned_at: string
}

// Shape per /me deployed BE.
export interface User {
  id: number
  email: string
  full_name: string | null
  username?: string | null
  phone?: string | null
  status?: UserStatus
  role?: string | null
  roles?: UserRoleEntry[]
  is_student?: boolean
  '2fa_enabled'?: boolean
  active_client_id?: number | null
  last_login?: string | null
  created_at?: string
}

export interface LoginRequest {
  email: string
  password: string
  device_name?: string
}

// BE deployed returns user fields FLAT (no nested `user`), plus refresh_token + roles flags.
// Contract had `{user, access_token, ...}`. We accept both.
export interface LoginResponse {
  // Flat shape (actual deployed):
  id?: number
  username?: string
  email?: string
  full_name?: string | null
  is_student?: boolean
  is_sysadmin?: boolean
  clients?: unknown[]
  refresh_token?: string
  // Common:
  access_token: string
  token_type?: string
  expires_in?: number
  // Contract shape (kept for forward compat):
  user?: User
}

// NOTE: BE staging currently uses {username, email, password} (admin handler reused on
// storefront route). full_name is sent but silently dropped — kept so the wire payload
// is forward-compatible when PRD #1B storefront register handler ships.
export interface RegisterRequest {
  full_name: string
  username: string
  email: string
  password: string
  phone?: string  // optional — BE simpan ke users.phone (E.164), absent = NULL
}

export interface RegisterResponse {
  username: string
  email: string
  // PRD #1B target shape (not returned by current BE):
  message?: string
  activation_sent?: boolean
}

export interface ActivateRequest {
  token: string
  password: string
  password_confirm: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

// PUT /auth/storefront/me — partial body. All fields optional; absent fields
// stay unchanged. user_id is sourced from JWT on BE — never sent in body.
export interface UpdateProfileRequest {
  full_name?: string
  email?: string
  username?: string
  phone?: string  // "" = clear (set NULL), "+62..." = update, absent = skip
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ResponseMeta {
  request_id?: string
  timestamp?: string
  duration_ms?: number
}

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  meta?: ResponseMeta | PaginationMeta
}

export interface ApiErrorPayload {
  code: string
  message: string
  http_code: number
  fields?: Record<string, string>
  redirect_to_login?: boolean
  redirect_to_activation?: boolean
}

export interface ApiErrorEnvelope {
  success: false
  error: ApiErrorPayload
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiErrorEnvelope

// ─── Checkout Form ────────────────────────────────────────────────────────────

export interface CheckoutForm {
  course_id: number
  student_full_name: string
  student_email: string
  student_phone: string
  accept_terms: boolean
}
