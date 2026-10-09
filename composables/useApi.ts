type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface ApiRequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined>
}

const TOKEN_COOKIE = 'ds_access_token'
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// BE actual error envelope is a union of two shapes:
//   1. Contract:  { code: "STRING", message, http_code, fields?: {field: msg} }
//   2. Deployed:  { code: 1234, message, details?: { field, reason, suggest } }
// useApi normalises both into ApiError below.
interface RawErrorPayload {
  code?: string | number
  message?: string
  http_code?: number
  fields?: Record<string, string>
  details?: { field?: string; reason?: string; suggest?: string }
  redirect_to_login?: boolean
  redirect_to_activation?: boolean
}

export interface ApiError extends Error {
  isApiError: true
  status: number
  code: string
  reason?: string
  fields?: Record<string, string>
  payload?: RawErrorPayload
}

function buildApiError(status: number, payload: RawErrorPayload | undefined, fallbackMessage: string): ApiError {
  const message = payload?.message || fallbackMessage
  const err = new Error(message) as ApiError
  err.isApiError = true
  err.status = status
  err.code = payload?.code !== undefined ? String(payload.code) : `HTTP_${status}`
  err.reason = payload?.details?.reason
  err.fields = payload?.fields ?? (payload?.details?.field
    ? { [payload.details.field]: payload.details.reason ?? message }
    : undefined)
  err.payload = payload
  return err
}

// Auth endpoints answer 401 for bad credentials, not for an expired session.
const CREDENTIAL_ENDPOINTS = /^\/(auth\/storefront\/(login|register|activate|forgot-password|reset-password|resend-activation)|public\/auth\/)/

// Route middleware that require a session — on expiry we send the user to /login.
const PROTECTED_MIDDLEWARE = ['auth', 'partner-auth']

let _expiryHandled = false

// Force-logout when an authenticated request comes back 401. The JWT lives
// 24h but the cookie 7 days, so a 401 means the session is dead: clear it
// instead of leaving the user "logged in" with every request failing.
export function handleUnauthorized(nuxtApp: ReturnType<typeof useNuxtApp>, path: string) {
  if (CREDENTIAL_ENDPOINTS.test(path)) return
  nuxtApp.runWithContext(() => {
    useAuthStore().logout()
    if (import.meta.server) return

    // Parallel requests all fail at once — notify/redirect only once.
    if (_expiryHandled) return
    _expiryHandled = true
    setTimeout(() => { _expiryHandled = false }, 3000)

    useToast().info('Sesi Anda telah berakhir. Silakan login kembali.')
    // router.currentRoute (not useRoute) — during a navigation the failing
    // request belongs to the page being entered, which useRoute doesn't show yet.
    const route = useRouter().currentRoute.value
    const middleware = [route.meta.middleware].flat()
    if (middleware.some(m => typeof m === 'string' && PROTECTED_MIDDLEWARE.includes(m))) {
      navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  })
}

export function useAuthCookie() {
  return useCookie<string | null>(TOKEN_COOKIE, {
    maxAge: TOKEN_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev
  })
}

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl as string
  const tokenCookie = useAuthCookie()
  const nuxtApp = useNuxtApp()

  async function request<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(opts.headers || {})
    }
    if (tokenCookie.value) {
      headers.Authorization = `Bearer ${tokenCookie.value}`
    }
    if (opts.body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const res = await $fetch<unknown>(path, {
        baseURL,
        method: opts.method ?? 'GET',
        body: opts.body as Record<string, unknown> | undefined,
        query: opts.query,
        headers,
        // Never hang forever — a stalled API must surface as an error, not
        // freeze the page (the client auth plugin awaits /me before hydration).
        timeout: 15000
      })
      const env = res as { success?: boolean; data?: T; error?: RawErrorPayload }
      if (env && typeof env === 'object' && 'success' in env) {
        if (env.success === false) {
          throw buildApiError(env.error?.http_code ?? 500, env.error, 'Permintaan gagal diproses.')
        }
        return (env.data ?? (env as unknown)) as T
      }
      return res as T
    } catch (err: unknown) {
      const apiErr = (err as ApiError).isApiError === true
        ? err as ApiError
        : (() => {
            const fetchErr = err as { response?: { status?: number; _data?: { error?: RawErrorPayload } }; message?: string }
            const status = fetchErr.response?.status ?? 0
            const payload = fetchErr.response?._data?.error
            return buildApiError(status, payload, fetchErr.message || 'Tidak bisa terhubung ke server.')
          })()
      if (apiErr.status === 401 && headers.Authorization) handleUnauthorized(nuxtApp, path)
      throw apiErr
    }
  }

  return {
    get: <T>(path: string, opts?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...opts, method: 'GET' }),
    post: <T>(path: string, body?: unknown, opts?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...opts, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, opts?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...opts, method: 'PUT', body }),
    del: <T>(path: string, opts?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...opts, method: 'DELETE' }),
    tokenCookie
  }
}
