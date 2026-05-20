import type {
  Course, CourseListItem, Partner, Order, OrderListItem, PaymentSession, User
} from '~/types'

// ─── Partners ─────────────────────────────────────────────────────────────────

export const dummyPartners: Partner[] = [
  {
    id: 1,
    name: 'IMARE ALPHA',
    slug: 'imare-alpha',
    description: 'Pusat pelatihan maritim terkemuka di Indonesia dengan pengalaman lebih dari 20 tahun. Menyediakan kursus berstandar internasional STCW untuk pelaut profesional.',
    logo_url: 'https://placehold.co/200x200/2F80D2/FFFFFF/png?text=IA',
    theme: { primary_color: '#2F80D2', secondary_color: '#163a64' },
    course_count: 12,
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    name: 'Maritime Training Center',
    slug: 'maritime-training-center',
    description: 'Lembaga pelatihan keselamatan maritim bersertifikat IMO. Fokus pada Basic Safety Training dan Advanced Firefighting.',
    logo_url: 'https://placehold.co/200x200/059669/FFFFFF/png?text=MTC',
    theme: { primary_color: '#059669', secondary_color: '#065F46' },
    course_count: 8,
    created_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Pelayaran Nusantara Academy',
    slug: 'pelayaran-nusantara-academy',
    description: 'Akademi pelayaran dengan kurikulum berbasis kompetensi BNSP. Menyediakan pelatihan untuk rating dan officer kapal niaga.',
    logo_url: 'https://placehold.co/200x200/DC2626/FFFFFF/png?text=PNA',
    theme: { primary_color: '#DC2626', secondary_color: '#991B1B' },
    course_count: 15,
    created_at: '2024-03-10T00:00:00Z'
  },
  {
    id: 4,
    name: 'Ocean Safety Institute',
    slug: 'ocean-safety-institute',
    description: 'Institut keselamatan laut dengan fokus pada manajemen darurat dan survival di laut.',
    logo_url: 'https://placehold.co/200x200/7C3AED/FFFFFF/png?text=OSI',
    theme: { primary_color: '#7C3AED', secondary_color: '#5B21B6' },
    course_count: 6,
    created_at: '2024-04-05T00:00:00Z'
  },
  {
    id: 5,
    name: 'Navigasi Pro',
    slug: 'navigasi-pro',
    description: 'Penyedia pelatihan navigasi dan meteorologi maritim untuk kapten dan perwira deck.',
    logo_url: 'https://placehold.co/200x200/D97706/FFFFFF/png?text=NP',
    theme: { primary_color: '#D97706', secondary_color: '#92400E' },
    course_count: 9,
    created_at: '2024-05-20T00:00:00Z'
  },
  {
    id: 6,
    name: 'Teknik Kapal Indonesia',
    slug: 'teknik-kapal-indonesia',
    description: 'Lembaga pelatihan teknik kapal dan mesin untuk engineer dan teknisi kapal.',
    logo_url: 'https://placehold.co/200x200/0891B2/FFFFFF/png?text=TKI',
    theme: { primary_color: '#0891B2', secondary_color: '#0E7490' },
    course_count: 11,
    created_at: '2024-06-01T00:00:00Z'
  },
  {
    id: 7,
    name: 'Port Operations Academy',
    slug: 'port-operations-academy',
    description: 'Pelatihan operasional pelabuhan dan manajemen kargo untuk profesional kepelabuhanan.',
    logo_url: 'https://placehold.co/200x200/BE185D/FFFFFF/png?text=POA',
    theme: { primary_color: '#BE185D', secondary_color: '#9D174D' },
    course_count: 7,
    created_at: '2024-07-15T00:00:00Z'
  },
  {
    id: 8,
    name: 'Keselamatan Maritim Indonesia',
    slug: 'keselamatan-maritim-indonesia',
    description: 'Spesialis pelatihan keselamatan kapal, ISPS Code, dan manajemen risiko maritim.',
    logo_url: 'https://placehold.co/200x200/166534/FFFFFF/png?text=KMI',
    theme: { primary_color: '#166534', secondary_color: '#14532D' },
    course_count: 10,
    created_at: '2024-08-01T00:00:00Z'
  }
]

// ─── Courses ──────────────────────────────────────────────────────────────────

export const dummyCourses: Course[] = [
  {
    id: 1,
    title: 'Basic Safety Training (BST) — STCW',
    slug: 'basic-safety-training-stcw',
    description: `Course wajib bagi setiap pelaut sesuai ketentuan STCW 2010 Manila Amendments. Mencakup empat elemen utama:

**1. Personal Survival Techniques** — Prosedur abandonment kapal, penggunaan life jacket, survival craft, dan teknik bertahan di laut.

**2. Fire Prevention and Firefighting** — Klasifikasi kebakaran, sistem deteksi dan pemadaman di kapal, breathing apparatus, dan latihan pemadaman nyata.

**3. Elementary First Aid** — Pertolongan pertama darurat, penanganan luka, resusitasi jantung paru (CPR), dan triage.

**4. Personal Safety and Social Responsibilities** — Regulasi SOLAS, ISM Code, prosedur keselamatan, dan keselamatan kerja di kapal.

Setelah menyelesaikan course ini, peserta akan mendapatkan sertifikat BST yang diakui secara internasional dan berlaku selama 5 tahun.`,
    thumbnail_url: 'https://placehold.co/800x450/2F80D2/FFFFFF/png?text=BST+STCW',
    price: 0,
    compare_at_price: null,
    currency: 'IDR',
    is_free: true,
    difficulty: 'beginner',
    status: 'published',
    client_id: 1,
    partner: { id: 1, name: 'IMARE ALPHA', slug: 'imare-alpha', logo_url: 'https://placehold.co/200x200/2F80D2/FFFFFF/png?text=IA', theme_primary: '#2F80D2' },
    chapters: [
      { id: 1, title: 'Personal Survival Techniques', order: 1, lessons: [
        { id: 1, title: 'Pengenalan Life Jacket & Immersion Suit', content_type: 'video', duration_minutes: 15, is_preview: true },
        { id: 2, title: 'Teknik Abandonment Kapal', content_type: 'video', duration_minutes: 20, is_preview: false },
        { id: 3, title: 'Survival Craft Operations', content_type: 'pdf', duration_minutes: null, is_preview: false },
      ]},
      { id: 2, title: 'Fire Prevention and Firefighting', order: 2, lessons: [
        { id: 4, title: 'Klasifikasi Kebakaran di Kapal', content_type: 'video', duration_minutes: 18, is_preview: false },
        { id: 5, title: 'Penggunaan SCBA (Self-Contained Breathing Apparatus)', content_type: 'video', duration_minutes: 25, is_preview: false },
        { id: 6, title: 'Praktik Pemadaman Kebakaran', content_type: 'video', duration_minutes: 30, is_preview: false },
      ]},
      { id: 3, title: 'Elementary First Aid', order: 3, lessons: [
        { id: 7, title: 'Penanganan Darurat & Triage', content_type: 'video', duration_minutes: 20, is_preview: false },
        { id: 8, title: 'CPR & AED', content_type: 'video', duration_minutes: 25, is_preview: false },
      ]},
      { id: 4, title: 'Personal Safety and Social Responsibilities', order: 4, lessons: [
        { id: 9, title: 'SOLAS dan ISM Code', content_type: 'text', duration_minutes: null, is_preview: false },
        { id: 10, title: 'Evaluasi & Sertifikasi', content_type: 'quiz', duration_minutes: 45, is_preview: false },
      ]}
    ],
    total_lessons: 10,
    total_duration_minutes: 198,
    published_at: '2026-01-10T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'Maritime Safety Management — ISM Code Implementation',
    slug: 'maritime-safety-management-ism-code',
    description: `Pemahaman komprehensif tentang International Safety Management (ISM) Code dan implementasinya di kapal maupun perusahaan pelayaran.

Course ini dirancang untuk perwira senior, nakhoda, dan safety officer yang bertanggung jawab atas sistem manajemen keselamatan kapal.

**Materi utama:**
- Struktur dan persyaratan ISM Code
- Safety Management System (SMS) development
- Document and record management
- Internal audit dan review manajemen
- Accident/incident investigation
- Emergency preparedness dan response
- Company security officer (CSO) responsibilities`,
    thumbnail_url: 'https://placehold.co/800x450/1e5088/FFFFFF/png?text=ISM+Code',
    price: 350000,
    compare_at_price: 500000,
    currency: 'IDR',
    is_free: false,
    difficulty: 'intermediate',
    status: 'published',
    client_id: 1,
    partner: { id: 1, name: 'IMARE ALPHA', slug: 'imare-alpha', logo_url: 'https://placehold.co/200x200/2F80D2/FFFFFF/png?text=IA', theme_primary: '#2F80D2' },
    chapters: [
      { id: 5, title: 'Pengenalan ISM Code', order: 1, lessons: [
        { id: 11, title: 'Sejarah dan Latar Belakang ISM Code', content_type: 'video', duration_minutes: 20, is_preview: true },
        { id: 12, title: 'Struktur ISM Code — 16 Elemen', content_type: 'text', duration_minutes: null, is_preview: false },
      ]},
      { id: 6, title: 'Safety Management System', order: 2, lessons: [
        { id: 13, title: 'Pengembangan SMS', content_type: 'video', duration_minutes: 35, is_preview: false },
        { id: 14, title: 'Document Control System', content_type: 'video', duration_minutes: 25, is_preview: false },
        { id: 15, title: 'Template SMS', content_type: 'pdf', duration_minutes: null, is_preview: false },
      ]},
      { id: 7, title: 'Audit dan Review', order: 3, lessons: [
        { id: 16, title: 'Internal Audit Methodology', content_type: 'video', duration_minutes: 40, is_preview: false },
        { id: 17, title: 'Management Review Process', content_type: 'video', duration_minutes: 30, is_preview: false },
        { id: 18, title: 'Evaluasi Akhir', content_type: 'quiz', duration_minutes: 60, is_preview: false },
      ]}
    ],
    total_lessons: 8,
    total_duration_minutes: 210,
    published_at: '2026-01-20T00:00:00Z',
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 3,
    title: 'Advanced Firefighting — Ship Fire Response',
    slug: 'advanced-firefighting-ship-fire-response',
    description: 'Pelatihan pemadaman kebakaran lanjutan untuk perwira dan kru yang ditunjuk sebagai anggota tim pemadam kebakaran kapal (Fire Team). Sesuai STCW A-VI/3.',
    thumbnail_url: 'https://placehold.co/800x450/DC2626/FFFFFF/png?text=Advanced+Firefighting',
    price: 450000,
    compare_at_price: null,
    currency: 'IDR',
    is_free: false,
    difficulty: 'advanced',
    status: 'published',
    client_id: 2,
    partner: { id: 2, name: 'Maritime Training Center', slug: 'maritime-training-center', logo_url: 'https://placehold.co/200x200/059669/FFFFFF/png?text=MTC', theme_primary: '#059669' },
    chapters: [
      { id: 8, title: 'Teori Lanjutan Kebakaran', order: 1, lessons: [
        { id: 19, title: 'Combustion Chemistry', content_type: 'video', duration_minutes: 30, is_preview: true },
        { id: 20, title: 'Fire Growth dan Spread', content_type: 'video', duration_minutes: 25, is_preview: false },
      ]},
      { id: 9, title: 'Taktik Pemadaman', order: 2, lessons: [
        { id: 21, title: 'Offensive vs Defensive Attack', content_type: 'video', duration_minutes: 35, is_preview: false },
        { id: 22, title: 'Engine Room Fire', content_type: 'video', duration_minutes: 40, is_preview: false },
        { id: 23, title: 'Cargo Hold Fire', content_type: 'video', duration_minutes: 35, is_preview: false },
      ]},
      { id: 10, title: 'Simulasi & Evaluasi', order: 3, lessons: [
        { id: 24, title: 'Live Fire Exercise', content_type: 'video', duration_minutes: 60, is_preview: false },
        { id: 25, title: 'Assessment', content_type: 'quiz', duration_minutes: 45, is_preview: false },
      ]}
    ],
    total_lessons: 7,
    total_duration_minutes: 270,
    published_at: '2026-02-05T00:00:00Z',
    created_at: '2026-01-25T00:00:00Z'
  },
  {
    id: 4,
    title: 'Navigasi Radar & ARPA',
    slug: 'navigasi-radar-arpa',
    description: 'Penguasaan peralatan navigasi radar dan ARPA (Automatic Radar Plotting Aid) untuk menghindari tabrakan dan meningkatkan keselamatan pelayaran.',
    thumbnail_url: 'https://placehold.co/800x450/D97706/FFFFFF/png?text=Radar+ARPA',
    price: 299000,
    compare_at_price: 399000,
    currency: 'IDR',
    is_free: false,
    difficulty: 'intermediate',
    status: 'published',
    client_id: 5,
    partner: { id: 5, name: 'Navigasi Pro', slug: 'navigasi-pro', logo_url: 'https://placehold.co/200x200/D97706/FFFFFF/png?text=NP', theme_primary: '#D97706' },
    chapters: [
      { id: 11, title: 'Prinsip Radar', order: 1, lessons: [
        { id: 26, title: 'Cara Kerja Radar Maritim', content_type: 'video', duration_minutes: 25, is_preview: true },
        { id: 27, title: 'Interpretasi Gambar Radar', content_type: 'video', duration_minutes: 30, is_preview: false },
      ]},
      { id: 12, title: 'ARPA Operations', order: 2, lessons: [
        { id: 28, title: 'ARPA Tracking & Acquisition', content_type: 'video', duration_minutes: 35, is_preview: false },
        { id: 29, title: 'CPA & TCPA Calculation', content_type: 'text', duration_minutes: null, is_preview: false },
        { id: 30, title: 'Latihan Soal ARPA', content_type: 'quiz', duration_minutes: 30, is_preview: false },
      ]}
    ],
    total_lessons: 5,
    total_duration_minutes: 120,
    published_at: '2026-02-15T00:00:00Z',
    created_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 5,
    title: 'GMDSS — Global Maritime Distress and Safety System',
    slug: 'gmdss-global-maritime-distress-safety-system',
    description: 'Kursus komprehensif GMDSS untuk operator radio kapal. Mencakup VHF DSC, MF/HF DSC, NAVTEX, EGC, EPIRB, SART, dan Inmarsat.',
    thumbnail_url: 'https://placehold.co/800x450/0891B2/FFFFFF/png?text=GMDSS',
    price: 550000,
    compare_at_price: null,
    currency: 'IDR',
    is_free: false,
    difficulty: 'advanced',
    status: 'published',
    client_id: 6,
    partner: { id: 6, name: 'Teknik Kapal Indonesia', slug: 'teknik-kapal-indonesia', logo_url: 'https://placehold.co/200x200/0891B2/FFFFFF/png?text=TKI', theme_primary: '#0891B2' },
    chapters: [
      { id: 13, title: 'Pengenalan GMDSS', order: 1, lessons: [
        { id: 31, title: 'Arsitektur GMDSS', content_type: 'video', duration_minutes: 20, is_preview: true },
        { id: 32, title: 'Sea Areas A1-A4', content_type: 'text', duration_minutes: null, is_preview: false },
      ]},
      { id: 14, title: 'Peralatan GMDSS', order: 2, lessons: [
        { id: 33, title: 'VHF DSC Controller', content_type: 'video', duration_minutes: 30, is_preview: false },
        { id: 34, title: 'EPIRB dan SART', content_type: 'video', duration_minutes: 25, is_preview: false },
        { id: 35, title: 'Inmarsat C & Fleet', content_type: 'video', duration_minutes: 35, is_preview: false },
      ]},
      { id: 15, title: 'Prosedur Distress', order: 3, lessons: [
        { id: 36, title: 'Mayday Procedures', content_type: 'video', duration_minutes: 40, is_preview: false },
        { id: 37, title: 'SAR Coordination', content_type: 'video', duration_minutes: 30, is_preview: false },
        { id: 38, title: 'Ujian GMDSS', content_type: 'quiz', duration_minutes: 90, is_preview: false },
      ]}
    ],
    total_lessons: 8,
    total_duration_minutes: 270,
    published_at: '2026-03-01T00:00:00Z',
    created_at: '2026-02-20T00:00:00Z'
  },
  {
    id: 6,
    title: 'Penanganan dan Stowage Muatan Kapal',
    slug: 'penanganan-stowage-muatan-kapal',
    description: 'Teknik pemuatan, stowage, securing, dan pemindahan muatan kapal sesuai IMDG Code dan aturan keselamatan muatan.',
    thumbnail_url: 'https://placehold.co/800x450/BE185D/FFFFFF/png?text=Cargo+Handling',
    price: 0,
    compare_at_price: null,
    currency: 'IDR',
    is_free: true,
    difficulty: 'beginner',
    status: 'published',
    client_id: 7,
    partner: { id: 7, name: 'Port Operations Academy', slug: 'port-operations-academy', logo_url: 'https://placehold.co/200x200/BE185D/FFFFFF/png?text=POA', theme_primary: '#BE185D' },
    chapters: [
      { id: 16, title: 'Dasar-Dasar Muatan', order: 1, lessons: [
        { id: 39, title: 'Jenis-Jenis Muatan Kapal', content_type: 'video', duration_minutes: 20, is_preview: true },
        { id: 40, title: 'Stabilitas Kapal dan Muatan', content_type: 'text', duration_minutes: null, is_preview: false },
        { id: 41, title: 'Stowage Plan', content_type: 'pdf', duration_minutes: null, is_preview: false },
      ]}
    ],
    total_lessons: 3,
    total_duration_minutes: 60,
    published_at: '2026-03-15T00:00:00Z',
    created_at: '2026-03-01T00:00:00Z'
  }
]

export const dummyCourseList: CourseListItem[] = dummyCourses.map(c => ({
  id: c.id,
  title: c.title,
  slug: c.slug,
  thumbnail_url: c.thumbnail_url,
  price: c.price,
  compare_at_price: c.compare_at_price,
  currency: c.currency,
  is_free: c.is_free,
  difficulty: c.difficulty,
  total_lessons: c.total_lessons,
  total_duration_minutes: c.total_duration_minutes,
  partner: c.partner,
  published_at: c.published_at
}))

// ─── Orders ───────────────────────────────────────────────────────────────────

export const dummyOrders: Order[] = [
  {
    order_id: 1,
    order_number: 'DRS-260505-0012',
    course: { id: 2, title: 'Maritime Safety Management — ISM Code Implementation', slug: 'maritime-safety-management-ism-code', thumbnail_url: 'https://placehold.co/800x450/1e5088/FFFFFF/png?text=ISM+Code' },
    student_full_name: 'Budi Santoso',
    student_email: 'budi@example.com',
    student_phone: '+628123456789',
    unit_price: 350000,
    tax_amount: 0,
    total_amount: 350000,
    currency: 'IDR',
    status: 'pending',
    payment_method: null,
    expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    paid_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date().toISOString()
  },
  {
    order_id: 2,
    order_number: 'DRS-260504-0089',
    course: { id: 4, title: 'Navigasi Radar & ARPA', slug: 'navigasi-radar-arpa', thumbnail_url: 'https://placehold.co/800x450/D97706/FFFFFF/png?text=Radar+ARPA' },
    student_full_name: 'Budi Santoso',
    student_email: 'budi@example.com',
    student_phone: '+628123456789',
    unit_price: 299000,
    tax_amount: 0,
    total_amount: 299000,
    currency: 'IDR',
    status: 'paid',
    payment_method: 'va_bca',
    expires_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  },
  {
    order_id: 3,
    order_number: 'DRS-260503-0045',
    course: { id: 3, title: 'Advanced Firefighting — Ship Fire Response', slug: 'advanced-firefighting-ship-fire-response', thumbnail_url: 'https://placehold.co/800x450/DC2626/FFFFFF/png?text=Advanced+Firefighting' },
    student_full_name: 'Budi Santoso',
    student_email: 'budi@example.com',
    student_phone: '+628123456789',
    unit_price: 450000,
    tax_amount: 0,
    total_amount: 450000,
    currency: 'IDR',
    status: 'expired',
    payment_method: null,
    expires_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    paid_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
  }
]

export const dummyOrderList: OrderListItem[] = dummyOrders.map(o => ({
  order_id: o.order_id,
  order_number: o.order_number,
  course: o.course,
  total_amount: o.total_amount,
  currency: o.currency,
  status: o.status,
  expires_at: o.expires_at,
  created_at: o.created_at
}))

// ─── Payment Sessions ─────────────────────────────────────────────────────────

export const dummyPaymentSessions: Record<string, PaymentSession> = {
  va_bca: {
    order_number: 'DRS-260505-0012',
    payment_method: 'va_bca',
    amount: 350000,
    currency: 'IDR',
    status: 'pending',
    va_number: '1234567890123456',
    bank_name: 'BCA',
    bank_code: 'BCA',
    expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  qris: {
    order_number: 'DRS-260505-0012',
    payment_method: 'qris',
    amount: 350000,
    currency: 'IDR',
    status: 'pending',
    qr_string: '00020101021226640014ID.CO.DOKU.WWW011893600898100000065310215DRILLSPACE0012020000000101030105204599953033605802ID5920DrillSpace Course6015JAKARTA SELATAN610512345',
    qr_image_url: 'https://placehold.co/300x300/1e293b/FFFFFF/png?text=QR+CODE',
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  ewallet_dana: {
    order_number: 'DRS-260505-0012',
    payment_method: 'ewallet_dana',
    amount: 350000,
    currency: 'IDR',
    status: 'pending',
    redirect_url: 'https://m.dana.id/checkout?token=dummy_token_12345',
    deeplink_url: 'dana://checkout?token=dummy_token_12345',
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  }
}

// ─── Current User (dummy auth) ────────────────────────────────────────────────

export const dummyUser: User = {
  id: 1,
  full_name: 'Budi Santoso',
  email: 'budi@example.com',
  phone: '+628123456789',
  status: 'active',
  role: 'student',
  created_at: '2026-01-01T00:00:00Z'
}
