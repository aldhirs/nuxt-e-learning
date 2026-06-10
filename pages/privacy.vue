<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Privacy Policy — DrillSpace',
  description: 'Learn how DrillSpace collects, uses, and protects your personal data.'
})

const lastUpdated = 'June 10, 2026'
const sections = [
  { id: 'intro',        label: '1. Introduction' },
  { id: 'data-collect', label: '2. Data We Collect' },
  { id: 'how-use',      label: '3. How We Use Your Data' },
  { id: 'sharing',      label: '4. Data Sharing' },
  { id: 'storage',      label: '5. Data Storage & Security' },
  { id: 'cookies',      label: '6. Cookies' },
  { id: 'rights',       label: '7. Your Rights' },
  { id: 'children',     label: '8. Children\'s Privacy' },
  { id: 'changes',      label: '9. Changes to This Policy' },
  { id: 'contact',      label: '10. Contact Us' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
      <p class="text-sm text-slate-500">Last updated: {{ lastUpdated }}</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-10">
      <!-- Table of contents -->
      <aside class="lg:w-56 flex-shrink-0">
        <div class="sticky top-24 bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contents</p>
          <nav class="space-y-1">
            <a
              v-for="s in sections"
              :key="s.id"
              :href="`#${s.id}`"
              class="block text-sm text-slate-600 hover:text-primary-600 hover:bg-white rounded px-2 py-1 transition-colors"
            >{{ s.label }}</a>
          </nav>
        </div>
      </aside>

      <!-- Body -->
      <article class="prose prose-slate max-w-none flex-1 text-[15px] leading-relaxed">

        <section id="intro" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">1. Introduction</h2>
          <p class="text-slate-600 mb-3">
            DrillSpace ("we", "us", or "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share information about you when you use our maritime e-learning platform at <strong>drillspace.id</strong>.
          </p>
          <p class="text-slate-600">
            By using our Platform, you consent to the data practices described in this Policy. This Policy is part of our
            <NuxtLink to="/terms" class="text-primary-600 hover:underline font-medium">Terms &amp; Conditions</NuxtLink>.
          </p>
        </section>

        <section id="data-collect" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">2. Data We Collect</h2>
          <p class="text-slate-600 mb-3">We collect the following categories of personal data:</p>

          <h3 class="font-semibold text-slate-700 mb-2">Account &amp; Profile Data</h3>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-4">
            <li>Full name, email address, phone number</li>
            <li>Username and hashed password</li>
            <li>Profile photo (optional)</li>
          </ul>

          <h3 class="font-semibold text-slate-700 mb-2">Transaction Data</h3>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-4">
            <li>Course purchase records and order history</li>
            <li>Payment method type (VA, e-wallet, QRIS) — we do not store full card numbers</li>
            <li>Invoice and billing information</li>
          </ul>

          <h3 class="font-semibold text-slate-700 mb-2">Usage &amp; Technical Data</h3>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-4">
            <li>IP address and device information</li>
            <li>Browser type, operating system, and language settings</li>
            <li>Pages visited, time spent, and clickstream data</li>
            <li>Course progress and completion data</li>
          </ul>

          <h3 class="font-semibold text-slate-700 mb-2">Partner Data (for Partner organisations)</h3>
          <ul class="list-disc pl-5 text-slate-600 space-y-1">
            <li>Organisation name, address, and registration number</li>
            <li>Bank account details (for withdrawal processing)</li>
            <li>Subscription and billing records</li>
          </ul>
        </section>

        <section id="how-use" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">3. How We Use Your Data</h2>
          <p class="text-slate-600 mb-3">We use your personal data to:</p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1">
            <li>Provide, operate, and maintain the Platform</li>
            <li>Process course enrolments and payments</li>
            <li>Send transactional emails (receipts, OTP codes, account activation)</li>
            <li>Personalise your learning experience</li>
            <li>Track learning progress and issue completion certificates</li>
            <li>Detect and prevent fraud, abuse, or security incidents</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Improve Platform features through aggregated analytics (non-identifiable)</li>
          </ul>
        </section>

        <section id="sharing" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">4. Data Sharing</h2>
          <p class="text-slate-600 mb-3">
            We do not sell your personal data. We may share your data with:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li><strong>Partner organisations</strong> — your enrolment and progress data is visible to the Partner who offers the course you enrolled in</li>
            <li><strong>Payment processors</strong> — DOKU receives transaction data necessary to process payments</li>
            <li><strong>Email service providers</strong> — for sending transactional and notification emails</li>
            <li><strong>Cloud infrastructure providers</strong> — for hosting and storage (data remains in Indonesia where possible)</li>
            <li><strong>Law enforcement</strong> — when required by applicable law, court order, or governmental authority</li>
          </ul>
          <p class="text-slate-600">
            All third-party service providers are contractually obligated to handle your data securely and only for the specified purpose.
          </p>
        </section>

        <section id="storage" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">5. Data Storage &amp; Security</h2>
          <p class="text-slate-600 mb-3">
            We implement industry-standard technical and organisational measures to protect your data, including:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li>Passwords stored as bcrypt hashes (never in plaintext)</li>
            <li>HTTPS/TLS encryption for all data in transit</li>
            <li>Access controls and role-based permissions</li>
            <li>Regular security audits and dependency scanning</li>
          </ul>
          <p class="text-slate-600">
            We retain your data for as long as your account is active, or as necessary to provide services and comply with legal obligations. You may request deletion of your account and associated data at any time.
          </p>
        </section>

        <section id="cookies" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">6. Cookies</h2>
          <p class="text-slate-600 mb-3">
            We use cookies and similar technologies for:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li><strong>Authentication</strong> — keeping you logged in securely</li>
            <li><strong>Preferences</strong> — remembering your language and settings</li>
            <li><strong>Analytics</strong> — understanding how the Platform is used (aggregated, non-identifiable)</li>
          </ul>
          <p class="text-slate-600">
            You can control cookies through your browser settings. Disabling essential cookies may affect Platform functionality.
          </p>
        </section>

        <section id="rights" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">7. Your Rights</h2>
          <p class="text-slate-600 mb-3">
            Under applicable Indonesian data protection laws, you have the right to:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — request correction of inaccurate or incomplete data</li>
            <li><strong>Deletion</strong> — request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Objection</strong> — object to certain types of processing</li>
          </ul>
          <p class="text-slate-600">
            To exercise any of these rights, contact us at
            <a href="mailto:privacy@drillspace.id" class="text-primary-600 hover:underline">privacy@drillspace.id</a>.
            We will respond within 14 business days.
          </p>
        </section>

        <section id="children" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">8. Children's Privacy</h2>
          <p class="text-slate-600">
            The Platform is intended for users aged 17 and above. We do not knowingly collect personal data from children under 17. If you believe we have inadvertently collected such data, please contact us and we will promptly delete it.
          </p>
        </section>

        <section id="changes" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">9. Changes to This Policy</h2>
          <p class="text-slate-600">
            We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a prominent notice on the Platform before the change becomes effective. Your continued use of the Platform after the effective date constitutes acceptance of the updated Policy.
          </p>
        </section>

        <section id="contact" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">10. Contact Us</h2>
          <p class="text-slate-600 mb-3">
            For privacy-related enquiries or to exercise your data rights:
          </p>
          <div class="bg-slate-50 rounded-xl border border-slate-200 p-5 text-slate-700 text-sm space-y-1">
            <p class="font-semibold text-slate-800">DrillSpace — Data Privacy</p>
            <p>Email: <a href="mailto:privacy@drillspace.id" class="text-primary-600 hover:underline">privacy@drillspace.id</a></p>
            <p>General: <a href="mailto:support@drillspace.id" class="text-primary-600 hover:underline">support@drillspace.id</a></p>
            <p>Website: <NuxtLink to="/" class="text-primary-600 hover:underline">drillspace.id</NuxtLink></p>
          </div>
        </section>

      </article>
    </div>
  </div>
</template>
