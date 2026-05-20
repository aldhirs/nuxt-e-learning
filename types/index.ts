// ─── Partner ────────────────────────────────────────────────────────────────

export interface PartnerTheme {
  primary_color: string | null
  secondary_color: string | null
}

export interface Partner {
  id: number
  name: string
  slug: string
  description: string
  logo_url: string | null
  theme: PartnerTheme
  course_count: number
  created_at: string
}

// ─── Course ──────────────────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'published' | 'draft' | 'archived'
export type ContentType = 'video' | 'text' | 'pdf' | 'quiz'

export interface Lesson {
  id: number
  title: string
  content_type: ContentType
  duration_minutes: number | null
  is_preview: boolean
}

export interface Chapter {
  id: number
  title: string
  order: number
  lessons: Lesson[]
}

export interface CoursePartner {
  id: number
  name: string
  slug: string
  logo_url: string | null
  theme_primary: string | null
}

export interface Course {
  id: number
  title: string
  slug: string
  description: string
  thumbnail_url: string | null
  price: number
  compare_at_price: number | null
  currency: string
  is_free: boolean
  difficulty: Difficulty
  status: CourseStatus
  client_id: number
  partner: CoursePartner
  chapters: Chapter[]
  total_lessons: number
  total_duration_minutes: number
  published_at: string
  created_at: string
}

export interface CourseListItem {
  id: number
  title: string
  slug: string
  thumbnail_url: string | null
  price: number
  compare_at_price: number | null
  currency: string
  is_free: boolean
  difficulty: Difficulty
  total_lessons: number
  total_duration_minutes: number
  partner: CoursePartner
  published_at: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'

export interface OrderCourse {
  id: number
  title: string
  slug: string
  thumbnail_url: string | null
}

export interface Order {
  order_id: number
  order_number: string
  course: OrderCourse
  student_full_name: string
  student_email: string
  student_phone: string | null
  unit_price: number
  tax_amount: number
  total_amount: number
  currency: string
  status: OrderStatus
  payment_method: string | null
  expires_at: string
  paid_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
}

export interface OrderListItem {
  order_id: number
  order_number: string
  course: OrderCourse
  total_amount: number
  currency: string
  status: OrderStatus
  expires_at: string
  created_at: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentMethod =
  | 'va_bca' | 'va_mandiri' | 'va_bri' | 'va_bni'
  | 'qris'
  | 'ewallet_ovo' | 'ewallet_dana' | 'ewallet_shopeepay'

export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'expired'

export interface PaymentSession {
  order_number: string
  payment_method: PaymentMethod
  amount: number
  currency: string
  status: PaymentStatus
  expires_at: string
  // VA
  va_number?: string
  bank_name?: string
  bank_code?: string
  // QRIS
  qr_string?: string
  qr_image_url?: string
  // E-wallet
  redirect_url?: string
  deeplink_url?: string
  created_at: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  full_name: string
  email: string
  phone: string | null
  status: 'active' | 'pending_activation' | 'suspended'
  role: 'student' | 'admin' | 'client_admin'
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Array<{ field?: string; message: string }>
  meta?: PaginationMeta
}

// ─── Checkout Form ────────────────────────────────────────────────────────────

export interface CheckoutForm {
  course_id: number
  student_full_name: string
  student_email: string
  student_phone: string
  accept_terms: boolean
}
