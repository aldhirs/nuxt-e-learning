type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let _id = 0

export function useToast() {
  function show(message: string, type: ToastType = 'success', duration = 3500) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  const success = (msg: string) => show(msg, 'success')
  const error   = (msg: string) => show(msg, 'error')
  const info    = (msg: string) => show(msg, 'info')

  return { toasts, show, success, error, info }
}
