<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ 'update:open': [boolean]; cancelled: [] }>()

const partner = usePartnerStore()
const toast   = useToast()

const reason      = ref('')
const effective   = ref<'end_of_period' | 'immediate'>('end_of_period')
const submitting  = ref(false)
const serverError = ref('')
const done        = ref(false)

const reasonError = computed(() => {
  if (!reason.value) return ''
  return reason.value.trim().length < 20 ? 'Reason must be at least 20 characters.' : ''
})
const canSubmit = computed(() =>
  reason.value.trim().length >= 20 && !submitting.value
)

function resetState() {
  reason.value = ''
  effective.value = 'end_of_period'
  serverError.value = ''
  done.value = false
}

function close() {
  if (submitting.value) return
  emit('update:open', false)
  setTimeout(resetState, 200)
}

watch(() => props.open, (v) => { if (!v) setTimeout(resetState, 200) })

const effectiveDate = computed(() => {
  const sub = partner.subscription
  if (!sub) return null
  return new Date(sub.current_period_end).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
})

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  serverError.value = ''
  try {
    await partner.cancelSubscription(reason.value.trim(), effective.value)
    emit('cancelled')
    done.value = true
  } catch (err: unknown) {
    serverError.value = (err as { message?: string }).message || 'Failed to cancel subscription. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal :model-value="open" title="Cancel Subscription" size="md" @update:model-value="close">

    <!-- ── Success state ────────────────────────────────────────────────── -->
    <template v-if="done">
      <div class="flex flex-col items-center text-center py-4 gap-4">
        <div class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <svg class="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <p class="text-base font-bold text-slate-900">Subscription Cancelled</p>
          <p class="text-sm text-slate-500 mt-1">
            <template v-if="effective === 'end_of_period'">
              Your access will remain active until <strong class="text-slate-700">{{ effectiveDate }}</strong>.
            </template>
            <template v-else>
              Your subscription has been cancelled immediately.
            </template>
          </p>
        </div>
      </div>
    </template>

    <!-- ── Form ─────────────────────────────────────────────────────────── -->
    <template v-else>
      <div class="space-y-5">

        <!-- Warning banner -->
        <div class="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>
            <strong>Are you sure?</strong> Cancelling will stop all course sales and student access on your platform when the subscription ends.
          </p>
        </div>

        <!-- Current plan info -->
        <div v-if="partner.plan && partner.subscription" class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold text-slate-800">{{ partner.plan.name }}</p>
              <p class="text-slate-500 text-xs mt-0.5 capitalize">{{ partner.subscription.billing_cycle }} billing</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">Current period ends</p>
              <p class="font-semibold text-slate-700 text-xs">{{ effectiveDate }}</p>
            </div>
          </div>
        </div>

        <!-- Reason textarea -->
        <div>
          <label for="cancel-reason" class="block text-sm font-medium text-slate-700 mb-1.5">
            Reason for cancelling <span class="text-red-500">*</span>
          </label>
          <textarea
            id="cancel-reason"
            v-model="reason"
            rows="3"
            maxlength="500"
            placeholder="Please tell us why you're cancelling (min. 20 characters)..."
            class="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 resize-none outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <div class="flex justify-between mt-1">
            <p v-if="reasonError" class="text-xs text-red-500">{{ reasonError }}</p>
            <p v-else class="text-xs text-slate-400">Min. 20 characters</p>
            <p class="text-xs text-slate-400 tabular-nums">{{ reason.trim().length }}/500</p>
          </div>
        </div>

        <!-- Effective options -->
        <div>
          <p class="text-sm font-medium text-slate-700 mb-2">When should the cancellation take effect?</p>
          <div class="space-y-2">
            <label
              class="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
              :class="effective === 'end_of_period' ? 'border-primary-400 bg-primary-50/50' : 'border-slate-200 hover:border-slate-300'"
            >
              <input
                v-model="effective"
                type="radio"
                value="end_of_period"
                class="mt-0.5 accent-primary-500 flex-shrink-0"
              />
              <div>
                <p class="text-sm font-semibold text-slate-800">End of current period <span class="text-xs font-normal text-green-600">(Recommended)</span></p>
                <p class="text-xs text-slate-500 mt-0.5">
                  Access remains active until {{ effectiveDate ?? 'period end' }}. No refund needed.
                </p>
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors"
              :class="effective === 'immediate' ? 'border-red-400 bg-red-50/50' : 'border-slate-200 hover:border-slate-300'"
            >
              <input
                v-model="effective"
                type="radio"
                value="immediate"
                class="mt-0.5 accent-red-500 flex-shrink-0"
              />
              <div>
                <p class="text-sm font-semibold text-slate-800">Immediately <span class="text-xs font-normal text-red-500">(No refund)</span></p>
                <p class="text-xs text-slate-500 mt-0.5">
                  Access ends right now. No partial refund for remaining days.
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Server error -->
        <div v-if="serverError" class="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ serverError }}
        </div>

      </div>
    </template>

    <!-- ── Footer ────────────────────────────────────────────────────────── -->
    <template #footer>
      <template v-if="done">
        <BaseButton variant="primary" @click="close">Close</BaseButton>
      </template>
      <template v-else>
        <BaseButton variant="secondary" :disabled="submitting" @click="close">Keep Subscription</BaseButton>
        <BaseButton
          variant="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          class="!bg-red-600 hover:!bg-red-700 focus-visible:!ring-red-400"
          @click="submit"
        >
          Cancel Subscription
        </BaseButton>
      </template>
    </template>

  </BaseModal>
</template>
