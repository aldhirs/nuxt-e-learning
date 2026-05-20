# DrillSpace Storefront

Consumer-facing SSR storefront untuk platform e-learning maritim DrillSpace. Dibangun dengan Nuxt 3 + Tailwind CSS v4, siap untuk integrasi API backend Go.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@theme`) |
| State Management | Pinia (`@pinia/nuxt`) |
| Form Validation | Vuelidate (`@vuelidate/core`) |
| Font | Inter (`@fontsource/inter`) |
| E2E Testing | Playwright |
| Node.js | v18+ (direkomendasikan v25 via nvm) |

## Prerequisites

- **Node.js v18+** — gunakan `nvm use system` jika nvm default di bawah v18
- npm v9+

```bash
# Pastikan Node.js versi yang benar
node -v   # v18.x atau lebih tinggi
```

## Setup

```bash
# Install dependencies
npm install

# Salin environment file
cp .env.example .env
```

## Development

```bash
npm run dev
```

Server berjalan di `http://localhost:3000` (atau port berikutnya yang tersedia).

> **Catatan Node.js**: Jika menggunakan nvm dan mendapat error `styleText is not a function`, jalankan:
> ```bash
> source ~/.nvm/nvm.sh && nvm use system
> npm run dev
> ```

## Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Jalankan dev server dengan HMR |
| `npm run build` | Build untuk production (SSR) |
| `npm run generate` | Generate static site |
| `npm run preview` | Preview production build |
| `npm run test:e2e` | Jalankan Playwright E2E tests |
| `npm run lint` | Lint dengan ESLint |
| `npm run format` | Format dengan Prettier |

## Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan:

```env
# URL backend API Go
NUXT_PUBLIC_API_BASE_URL=https://api.staging.drillspace.id/api/v1

# Set ke "true" untuk mengaktifkan analytics
NUXT_PUBLIC_ANALYTICS_ENABLED=false
```

## Struktur Project

```
nuxt-storefront/
├── assets/
│   └── css/main.css              # Global styles, Tailwind @theme tokens
├── components/
│   ├── app/                      # AppNavbar, AppFooter
│   ├── base/                     # Design system: BaseButton, BaseCard, BaseInput, dll.
│   ├── checkout/                 # CheckoutPriceBreakdown
│   ├── course/                   # CourseCard, CourseCardCompact
│   ├── order/                    # OrderCard, OrderCountdownTimer, OrderStatusBadge
│   └── partner/                  # PartnerCard
├── composables/
│   ├── useFormatters.ts          # formatCurrency, formatDatetime
│   ├── useAnalytics.ts           # Event tracking
│   └── useOrder.ts               # Resolve order dari dummy data / Pinia store / localStorage
├── data/
│   └── dummy.ts                  # Dummy data: courses, partners, orders (untuk dev)
├── layouts/
│   ├── default.vue               # Layout utama dengan navbar + footer
│   └── minimal.vue               # Layout minimal untuk checkout & payment
├── pages/
│   ├── index.vue                 # Beranda (hero, featured courses, partners)
│   ├── courses/
│   │   ├── index.vue             # Katalog course (filter, search)
│   │   └── [slug].vue            # Detail course + curriculum
│   ├── partners/
│   │   ├── index.vue             # Daftar partner/instructor
│   │   └── [slug].vue            # Profil partner
│   ├── checkout.vue              # Form checkout + ringkasan order
│   ├── activate.vue              # Aktivasi course gratis
│   ├── orders/
│   │   ├── index.vue             # Daftar order user (requires auth)
│   │   └── [order_number]/
│   │       ├── index.vue         # Detail order (requires auth)
│   │       └── payment/
│   │           ├── index.vue     # Pilih metode pembayaran
│   │           ├── va.vue        # Virtual Account (BCA/Mandiri/BRI/BNI/BSI/CIMB)
│   │           ├── qris.vue      # QRIS
│   │           ├── ewallet.vue   # E-Wallet (OVO/DANA/ShopeePay/GoPay)
│   │           └── status.vue    # Status pembayaran (polling)
│   ├── payment/callback/
│   │   ├── success.vue           # Redirect-back e-wallet (sukses)
│   │   └── failed.vue            # Redirect-back e-wallet (gagal)
│   ├── login.vue
│   ├── register.vue
│   ├── tentang.vue
│   └── kontak.vue
├── stores/
│   ├── auth.ts                   # Auth state (mock login/logout)
│   └── order.ts                  # Order state (persist ke localStorage)
├── types/
│   └── index.ts                  # TypeScript types: Course, Order, Partner, dll.
├── nuxt.config.ts
└── .env.example
```

## Alur Pembayaran (End-to-End)

```
/courses/[slug]
  → Klik "Beli Sekarang"
  → /checkout?course=[slug]
  → Isi form + submit → order dibuat + disimpan ke localStorage
  → /orders/[order_number]/payment
  → Pilih metode → /payment/va, /payment/qris, atau /payment/ewallet
  → Klik "Saya Sudah Bayar"
  → /orders/[order_number]/payment/status  (polling)
  → /orders/[order_number]  (detail order)
```

### Metode Pembayaran

| Metode | Route | Keterangan |
|---|---|---|
| Virtual Account | `/payment/va?method=va_bca` | BCA, Mandiri, BRI, BNI, BSI, CIMB |
| QRIS | `/payment/qris` | Semua e-wallet kompatibel QRIS |
| E-Wallet | `/payment/ewallet?method=ewallet_dana` | OVO, DANA, ShopeePay, GoPay |

## Dummy Data & Integrasi API

Saat ini seluruh data berasal dari `data/dummy.ts`. Setiap halaman sudah menggunakan shape yang identik dengan API contract (`docs/contracts/api/`).

**Untuk integrasi API**, ganti pemanggilan data dummy dengan `useFetch` / `$fetch`:

```ts
// Sebelum (dummy)
const courses = dummyCourses

// Sesudah (API)
const { data: courses } = await useFetch('/courses', {
  baseURL: useRuntimeConfig().public.apiBaseUrl
})
```

Order yang dibuat di checkout disimpan ke **Pinia store** (`stores/order.ts`) dan dipersist ke `localStorage` (key: `ds_current_order`) sehingga bertahan saat halaman di-refresh. Composable `useOrder()` me-resolve order dari tiga sumber secara berurutan: dummy data → Pinia store → localStorage.

## Konvensi Komponen

Nuxt 3 auto-import komponen dari direktori `components/` dengan prefix nama subdirektori:

| File | Tag di template |
|---|---|
| `components/base/BaseButton.vue` | `<BaseButton>` |
| `components/order/CountdownTimer.vue` | `<OrderCountdownTimer>` |
| `components/checkout/PriceBreakdown.vue` | `<CheckoutPriceBreakdown>` |
| `components/course/CourseCard.vue` | `<CourseCard>` |

## Routing Notes

- Halaman `/orders/[order_number]/index.vue` dan `/orders/[order_number]/payment/*` adalah **independent routes** — bukan nested. Payment pages tidak memerlukan auth.
- Halaman yang memerlukan auth (`/orders`, `/orders/[order_number]`) menggunakan mock auth dari `stores/auth.ts`.

## E2E Testing

```bash
# Install Playwright browsers (sekali saja)
npx playwright install

# Jalankan semua tests
npm run test:e2e

# Jalankan dengan UI mode
npx playwright test --ui
```

Spec files di `tests/` (belum dibuat — Gate 2 requirement per `CLAUDE.md §2.15`).

## Catatan Produksi

- Semua secret (API key, DOKU credentials) **wajib** di `.env`, tidak pernah di-commit
- Payment gateway: **DOKU SNAP BI** — integrasi di backend Go, storefront hanya consume session URL dari API
- Multi-tenant: storefront ini di-deploy per subdomain `<client>.drillspace.id` dengan `client_id` di-inject via runtime config
- Currency: IDR, disimpan sebagai `DECIMAL(15,2)` di backend, diformat `Rp` di FE via `useFormatters()`
