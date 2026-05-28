<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'

definePageMeta({ layout: 'default' })
useSeoMeta({
  title: 'Contact Us',
  description: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
})

// ── Contact information (single source of truth) ─────────────────────────────
const SUPPORT_EMAIL    = 'support@drillspace.id'
const SUPPORT_PHONE    = '+62 889 7336 1315'
const WHATSAPP_NUMBER  = '628897336131' // E.164 without +, used in wa.me URLs
const BUSINESS_HOURS   = 'Monday - Friday: 08:00 - 16:30 WIB'

// ── Business-hours "Open Now" indicator ──────────────────────────────────────
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (!import.meta.client) return
  // Update every minute so the badge flips at the boundary without a refresh.
  clockTimer = setInterval(() => { now.value = new Date() }, 60_000)
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// WIB (UTC+7). Monday–Friday 08:00–16:30.
const isOpenNow = computed(() => {
  const d = now.value
  // Convert to WIB regardless of user's locale
  const wib = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const dow = wib.getDay() // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return false
  const mins = wib.getHours() * 60 + wib.getMinutes()
  return mins >= 8 * 60 && mins < 16 * 60 + 30
})

// ── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  full_name: '',
  email: '',
  subject: '',
  message: '',
})

const rules = {
  full_name: { required, minLength: minLength(2) },
  email:     { required, email },
  subject:   { required, minLength: minLength(3) },
  message:   { required, minLength: minLength(10) },
}
const v$ = useVuelidate(rules, form)
const isSubmitting = ref(false)

// Build the WhatsApp message + open in a new tab. wa.me universal URL works
// on both mobile (deep-links to the app) and desktop (opens WhatsApp Web).
function sendViaWhatsApp() {
  const body = [
    `*New Contact Request — DrillSpace*`,
    ``,
    `*Name:* ${form.full_name.trim()}`,
    `*Email:* ${form.email.trim()}`,
    `*Subject:* ${form.subject.trim()}`,
    ``,
    `*Message:*`,
    form.message.trim(),
  ].join('\n')
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`
  if (import.meta.client) window.open(url, '_blank', 'noopener,noreferrer')
}

async function submit() {
  const valid = await v$.value.$validate()
  if (!valid) return
  isSubmitting.value = true
  try {
    sendViaWhatsApp()
  } finally {
    // brief loading flash for UX feedback — the wa.me popup opens instantly
    setTimeout(() => { isSubmitting.value = false }, 600)
  }
}

// Direct "Send Email" + "WhatsApp" buttons on the info card
const mailtoHref = computed(() =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Question about DrillSpace')}`,
)
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}`
</script>

<template>
  <div class="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 via-primary-50/30 to-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

      <!-- ── Hero ───────────────────────────────────────────────────────── -->
      <div class="text-center mb-12">
        <div class="inline-flex w-16 h-16 rounded-2xl bg-primary-500 items-center justify-center shadow-lg shadow-primary-200 mb-5">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-slate-800 mb-3">Contact Us</h1>
        <p class="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <!-- ── Two-column body ────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        <!-- ── Left: contact info ───────────────────────────────────────── -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Get in Touch card -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            <h2 class="text-lg font-bold text-slate-800 mb-1">Get in Touch</h2>
            <p class="text-sm text-slate-500 mb-6">Have questions? We're here to help. Reach out through any of the following channels.</p>

            <div class="space-y-5">
              <!-- Email -->
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800">Email Us</p>
                  <p class="text-sm text-slate-500 truncate">{{ SUPPORT_EMAIL }}</p>
                  <a
                    :href="mailtoHref"
                    class="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                    Send Email
                  </a>
                </div>
              </div>

              <!-- Phone / WhatsApp -->
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800">Call Us</p>
                  <p class="text-sm text-slate-500">{{ SUPPORT_PHONE }}</p>
                  <a
                    :href="whatsappHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>

              <!-- Business Hours -->
              <div class="flex gap-4">
                <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800">Business Hours</p>
                  <p class="text-sm text-slate-500">{{ BUSINESS_HOURS }}</p>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold',
                      isOpenNow
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    ]"
                  >
                    <span :class="['w-1.5 h-1.5 rounded-full', isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400']" aria-hidden="true"></span>
                    {{ isOpenNow ? 'Open Now' : 'Closed' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 24/7 Support card -->
          <div class="relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white shadow-lg shadow-primary-200">
            <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
            <div class="relative">
              <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-black mb-1.5">24/7 Support</h3>
              <p class="text-sm text-white/85 leading-relaxed">
                Need urgent help? Our WhatsApp support is monitored after hours for critical issues.
              </p>
            </div>
          </div>
        </div>

        <!-- ── Right: form ──────────────────────────────────────────────── -->
        <div class="lg:col-span-3">
          <form
            class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5"
            @submit.prevent="submit"
          >
            <!-- WhatsApp notice -->
            <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <svg class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <div>
                <p class="text-sm font-bold text-emerald-800">We reply via WhatsApp</p>
                <p class="text-xs text-emerald-700/90 mt-0.5">When you submit this form, WhatsApp will open with your message pre-filled.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <BaseInput
                v-model="form.full_name"
                label="Full Name"
                placeholder="Enter your full name"
                :error="v$.full_name.$error ? 'Please enter your full name' : ''"
                required
                @blur="v$.full_name.$touch"
              />
              <BaseInput
                v-model="form.email"
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                :error="v$.email.$error ? 'Please enter a valid email' : ''"
                required
                @blur="v$.email.$touch"
              />
            </div>

            <BaseInput
              v-model="form.subject"
              label="Subject"
              placeholder="What is this regarding?"
              :error="v$.subject.$error ? 'Please enter a subject' : ''"
              required
              @blur="v$.subject.$touch"
            />

            <!-- Message — multi-line uses a native textarea since BaseInput is single-line -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">
                Message <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.message"
                rows="6"
                placeholder="Write your message here..."
                :class="[
                  'w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors resize-y',
                  v$.message.$error
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                ]"
                @blur="v$.message.$touch"
              ></textarea>
              <p v-if="v$.message.$error" class="mt-1.5 text-xs text-red-600">
                Please write a message (at least 10 characters)
              </p>
              <p v-else class="mt-1.5 text-xs text-slate-400">
                {{ form.message.length }} characters · minimum 10
              </p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="isSubmitting || v$.$invalid"
              class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-primary-200 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <svg v-if="!isSubmitting" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ isSubmitting ? 'Opening WhatsApp...' : 'Send via WhatsApp' }}
            </button>

            <p class="text-xs text-slate-400 text-center">
              By submitting, you'll be redirected to WhatsApp to complete sending your message.
            </p>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>
