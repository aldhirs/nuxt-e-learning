<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Terms & Conditions — DrillSpace',
  description: 'Read the Terms and Conditions for using the DrillSpace maritime e-learning platform.'
})

const lastUpdated = 'June 10, 2026'
const sections = [
  { id: 'acceptance',    label: '1. Acceptance of Terms' },
  { id: 'services',      label: '2. Description of Services' },
  { id: 'accounts',      label: '3. User Accounts' },
  { id: 'payments',      label: '4. Payments & Refunds' },
  { id: 'content',       label: '5. Content & Intellectual Property' },
  { id: 'conduct',       label: '6. Acceptable Use' },
  { id: 'privacy',       label: '7. Privacy' },
  { id: 'termination',   label: '8. Termination' },
  { id: 'liability',     label: '9. Limitation of Liability' },
  { id: 'governing-law', label: '10. Governing Law' },
  { id: 'contact',       label: '11. Contact Us' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-3xl font-bold text-slate-800 mb-2">Terms &amp; Conditions</h1>
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

        <section id="acceptance" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
          <p class="text-slate-600 mb-3">
            By accessing or using DrillSpace ("the Platform"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all of these Terms, you may not use the Platform.
          </p>
          <p class="text-slate-600">
            These Terms apply to all users of the Platform, including students, instructors, partner organisations, and platform administrators.
          </p>
        </section>

        <section id="services" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">2. Description of Services</h2>
          <p class="text-slate-600 mb-3">
            DrillSpace is a multi-tenant maritime e-learning platform that enables partner organisations ("Partners") to publish, manage, and sell maritime training courses to students. Services include:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li>Access to online maritime training courses (STCW and related programmes)</li>
            <li>Course progress tracking and completion certificates</li>
            <li>Payment processing for course enrolments</li>
            <li>Partner portal for course and student management</li>
          </ul>
          <p class="text-slate-600">
            We reserve the right to modify, suspend, or discontinue any part of the Platform at any time with reasonable notice.
          </p>
        </section>

        <section id="accounts" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">3. User Accounts</h2>
          <p class="text-slate-600 mb-3">
            To access most features, you must register for an account. You agree to:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li>Provide accurate, current, and complete registration information</li>
            <li>Keep your password secure and not share it with others</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
            <li>Take responsibility for all activities that occur under your account</li>
          </ul>
          <p class="text-slate-600">
            We reserve the right to suspend or terminate accounts that violate these Terms or that have been inactive for an extended period.
          </p>
        </section>

        <section id="payments" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">4. Payments &amp; Refunds</h2>
          <p class="text-slate-600 mb-3">
            All prices are displayed in Indonesian Rupiah (IDR) and are inclusive of applicable taxes. Payments are processed securely via DOKU Payment Gateway.
          </p>
          <p class="text-slate-600 mb-3">
            <strong>Refund Policy:</strong> Refund requests may be submitted within 7 days of purchase, provided that:
          </p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1 mb-3">
            <li>Less than 20% of the course content has been accessed</li>
            <li>The request is submitted through the official refund process</li>
          </ul>
          <p class="text-slate-600">
            Approved refunds will be credited to your original payment method within 7–14 business days. Partner organisations are subject to separate subscription and commission terms outlined in their Partner Agreement.
          </p>
        </section>

        <section id="content" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">5. Content &amp; Intellectual Property</h2>
          <p class="text-slate-600 mb-3">
            All content on the Platform, including course materials, videos, assessments, logos, and software, is owned by DrillSpace or its licensed Partners and is protected by copyright and intellectual property laws.
          </p>
          <p class="text-slate-600 mb-3">
            You are granted a limited, non-exclusive, non-transferable licence to access and view course content solely for your personal, non-commercial educational purposes.
          </p>
          <p class="text-slate-600">
            You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any content without explicit written permission from DrillSpace or the respective Partner.
          </p>
        </section>

        <section id="conduct" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">6. Acceptable Use</h2>
          <p class="text-slate-600 mb-3">You agree not to:</p>
          <ul class="list-disc pl-5 text-slate-600 space-y-1">
            <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
            <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure</li>
            <li>Share your account credentials or course access with others</li>
            <li>Upload or transmit malicious code, spam, or harmful content</li>
            <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
            <li>Use automated tools (bots, scrapers) to access or collect data from the Platform</li>
          </ul>
        </section>

        <section id="privacy" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">7. Privacy</h2>
          <p class="text-slate-600">
            Your use of the Platform is also governed by our
            <NuxtLink to="/privacy" class="text-primary-600 hover:underline font-medium">Privacy Policy</NuxtLink>,
            which is incorporated into these Terms by reference. Please review it to understand our data practices.
          </p>
        </section>

        <section id="termination" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">8. Termination</h2>
          <p class="text-slate-600 mb-3">
            We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
          <p class="text-slate-600">
            Upon termination, your right to use the Platform will immediately cease. Provisions that by their nature should survive termination (including ownership, disclaimers, indemnity, and limitations of liability) shall survive.
          </p>
        </section>

        <section id="liability" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">9. Limitation of Liability</h2>
          <p class="text-slate-600 mb-3">
            The Platform is provided "as is" without warranty of any kind. To the maximum extent permitted by applicable law, DrillSpace shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Platform.
          </p>
          <p class="text-slate-600">
            Our total liability to you for any claim arising from these Terms or your use of the Platform shall not exceed the total amount paid by you to DrillSpace in the twelve (12) months preceding the event giving rise to the claim.
          </p>
        </section>

        <section id="governing-law" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">10. Governing Law</h2>
          <p class="text-slate-600">
            These Terms are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Jakarta, Indonesia.
          </p>
        </section>

        <section id="contact" class="mb-8">
          <h2 class="text-xl font-bold text-slate-800 mb-3">11. Contact Us</h2>
          <p class="text-slate-600 mb-3">
            If you have any questions about these Terms, please contact us:
          </p>
          <div class="bg-slate-50 rounded-xl border border-slate-200 p-5 text-slate-700 text-sm space-y-1">
            <p class="font-semibold text-slate-800">DrillSpace</p>
            <p>Email: <a href="mailto:support@drillspace.id" class="text-primary-600 hover:underline">support@drillspace.id</a></p>
            <p>Website: <NuxtLink to="/" class="text-primary-600 hover:underline">drillspace.id</NuxtLink></p>
          </div>
        </section>

      </article>
    </div>
  </div>
</template>
