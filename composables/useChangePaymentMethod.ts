import { usePaymentApi } from '~/composables/api/usePaymentApi'
import { useSubscriptionPaymentApi } from '~/composables/api/useSubscriptionPaymentApi'
import { usePaymentStore } from '~/stores/payment'
import { usePartnerPaymentStore } from '~/stores/partnerPayment'

type PaymentContext =
  | { type: 'order'; orderNumber: string; methodSelectionPath: string }
  | { type: 'invoice'; invoiceNumber: string; methodSelectionPath: string }

export function useChangePaymentMethod(
  ctx: PaymentContext,
  opts: {
    isPaid: Ref<boolean>
    isExpired: Ref<boolean>
  }
) {
  const router = useRouter()
  const paymentApi = usePaymentApi()
  const subPayApi = useSubscriptionPaymentApi()

  const paymentStore = usePaymentStore()
  const partnerPaymentStore = usePartnerPaymentStore()
  const toast = useToast()

  const showConfirmModal = ref(false)
  const isChanging = ref(false)
  // Set to true right before programmatic redirect after cancel — lets the guard pass
  const allowMethodSelectionNav = ref(false)

  // Block back navigation to method selection while payment is still pending.
  // Does NOT block when:
  // - user explicitly confirms "Change Payment Method" (allowMethodSelectionNav)
  // - no active session exists in the store (automatic redirect, not user back)
  onBeforeRouteLeave((to, _from, next) => {
    const goingToMethodSelection = to.path === ctx.methodSelectionPath
    if (!goingToMethodSelection || opts.isPaid.value || opts.isExpired.value || allowMethodSelectionNav.value) {
      next()
      return
    }

    // Only block if there's actually an active session in the store
    const hasSession = ctx.type === 'order'
      ? !!paymentStore.getSession(ctx.orderNumber)
      : !!partnerPaymentStore.getSession(ctx.invoiceNumber)

    if (!hasSession) {
      // No session — this is an automatic redirect (e.g. from onMounted), allow it
      next()
      return
    }

    // Active session exists and user is navigating back — block
    next(false)
  })

  function openConfirmModal() {
    showConfirmModal.value = true
  }

  function closeConfirmModal() {
    showConfirmModal.value = false
  }

  async function confirmChange() {
    if (isChanging.value) return
    isChanging.value = true
    try {
      if (ctx.type === 'order') {
        await paymentApi.cancel(ctx.orderNumber)
        paymentStore.clearSession(ctx.orderNumber)
      } else {
        await subPayApi.cancel(ctx.invoiceNumber)
        partnerPaymentStore.clearSession(ctx.invoiceNumber)
      }
      showConfirmModal.value = false
      allowMethodSelectionNav.value = true
      await router.push(ctx.methodSelectionPath)
    } catch {
      allowMethodSelectionNav.value = false
      toast.error('Gagal membatalkan sesi pembayaran. Coba lagi.')
    } finally {
      isChanging.value = false
    }
  }

  return { showConfirmModal, isChanging, openConfirmModal, closeConfirmModal, confirmChange }
}
