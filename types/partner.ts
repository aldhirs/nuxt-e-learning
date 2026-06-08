// ─── Partner Portal Types ──────────────────────────────────────────────────

export interface ClientSummary {
  id: number
  name: string
  slug: string
  logo?: string | null
  is_active: boolean
  subscription_status?: SubscriptionStatus | null
}

// ─── Subscription ───────────────────────────────────────────────────────────

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly'
export type InvoiceStatus = 'pending' | 'paid' | 'past_due' | 'cancelled'

export interface SubscriptionPlan {
  id: number
  code: string
  name: string
  monthly_fee: number
  yearly_fee: number
  commission_rate_percent: number
  max_courses: number    // -1 = unlimited
  max_students: number   // -1 = unlimited
  max_storage_gb: number
  features?: Record<string, unknown>
  is_active: boolean
  sort_order: number
}

export interface ClientSubscription {
  id: number
  client_id: number
  plan_id: number
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  started_at: string
  current_period_start: string
  current_period_end: string
  trial_ends_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  auto_renew: boolean
  plan?: SubscriptionPlan
}

export interface UsageCounter {
  current: number
  limit: number      // -1 = unlimited
  percent?: number   // null when unlimited
}

export interface CurrentSubscriptionView {
  subscription: ClientSubscription
  plan: SubscriptionPlan | null
  usage: {
    courses: UsageCounter
    students: UsageCounter
  }
  pending_invoice_number?: string | null
}

export interface PlanSnapshot {
  plan_id: number
  plan_code: string
  plan_name: string
  monthly_fee: number
  yearly_fee: number
  max_courses?: number
  max_students?: number
  commission_rate_percent?: number
}

export interface SubscriptionInvoice {
  id: number
  client_subscription_id: number
  invoice_number: string
  period_start: string
  period_end: string
  billing_cycle?: BillingCycle | null
  plan_snapshot?: PlanSnapshot | null
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string
  paid_at?: string | null
  payment_method?: string | null
  created_at: string
}

export interface InvoiceHistoryResponse {
  invoices: SubscriptionInvoice[]
  total: number
  limit: number
  offset: number
}

// ─── Partner Registration ────────────────────────────────────────────────────

export interface PartnerRegisterRequest {
  full_name: string
  username: string
  email: string
  password: string
  password_confirmation: string
  organization_name: string
  subdomain_slug: string
  phone?: string
  agree_tos: boolean
}

export interface PartnerRegisterResponse {
  message: string
  email_masked: string
}

export interface PartnerVerifyRequest {
  token: string
}

export interface PartnerUpgradeRequest {
  organization_name: string
  subdomain_slug: string
  agree_tos: boolean
}

export interface OnboardAsPartnerResponse {
  access_token: string
  active_client_id: number
  client: { id: number; slug: string; name: string }
}

// ─── Partner Dashboard Stats ─────────────────────────────────────────────────

export interface PartnerDashboardStats {
  revenue_this_month: number
  courses_published: number
  students_active: number
  recent_activities: PartnerActivity[]
}

export interface PartnerActivity {
  type: 'student_enrolled' | 'course_published' | 'payment_received' | string
  description: string
  created_at: string
}

// ─── Partner Profile ─────────────────────────────────────────────────────────

export type ClientType = 'individual' | 'company' | 'government' | 'shipowner'

export interface PartnerProfile {
  id: number
  name: string
  slug: string
  email: string
  phone: string
  logo?: string | null
  address?: string | null
  client_type: ClientType
  theme_primary?: string | null
  theme_secondary?: string | null
  is_active: boolean
}

export interface UpdatePartnerProfileRequest {
  name?: string
  email?: string
  phone?: string
  address?: string
  client_type?: ClientType
  logo?: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type SubscriptionPaymentMethod =
  | 'va_bca' | 'va_mandiri' | 'va_bri' | 'va_bni' | 'va_cimb' | 'va_bsi' | 'va_permata'
  | 'qris'
  | 'ewallet_dana' | 'ewallet_shopeepay' | 'ewallet_ovo'

export interface InvoicePaymentRequest {
  payment_method: SubscriptionPaymentMethod
}

// Shape returned by POST /clients/subscription/invoices/{n}/pay → data.payment_session
export interface InvoicePaymentSession {
  payment_method: SubscriptionPaymentMethod
  invoice_number: string
  amount: number
  is_existing_session: boolean
  expired_at: string
  // VA
  va_number?: string | null
  bank_code?: string | null
  // QRIS
  qris_string?: string | null
  qris_url?: string | null
  // e-wallet
  ewallet_redirect_url?: string | null
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export interface OnboardingStep {
  key: string
  label: string
  completed: boolean
  cta_label: string
  cta_href: string
  external?: boolean
}
