import { defineStore } from 'pinia'
import type {
  User,
  LoginRequest,
  Login2FARequired,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ActivateRequest,
  ResetPasswordRequest,
  UpdateProfileRequest
} from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const api = useApi()

  // Single cookie ref created in setup — same reason as partner store.
  const _clientIdCookie = useCookie<number | null>('ds_active_client_id', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: !import.meta.dev,
  })

  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!api.tokenCookie.value && !!user.value)
  const isLoadingMe = ref(false)

  function setToken(token: string | null) {
    api.tokenCookie.value = token
  }

  function setUser(u: User | null) {
    user.value = u
  }

  async function login(payload: LoginRequest): Promise<LoginResponse | Login2FARequired> {
    const data = await api.post<LoginResponse | Login2FARequired>('/auth/storefront/login', payload)

    // 2FA required — return without setting token; caller handles OTP step.
    if ('requires_2fa' in data && data.requires_2fa) return data

    // Normal login — set token + user.
    const resp = data as LoginResponse
    setToken(resp.access_token)
    if (resp.user) {
      setUser(resp.user)
    } else if (typeof resp.id === 'number' && resp.email) {
      setUser({
        id: resp.id,
        email: resp.email,
        full_name: resp.full_name ?? null,
        username: resp.username ?? null,
        is_student: resp.is_student
      })
    }
    try { await fetchMe() } catch { /* non-fatal */ }
    return resp
  }

  // Step 2 of 2FA login: verify email OTP + complete authentication.
  async function login2FA(preAuthToken: string, code: string): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>('/public/auth/login/2fa', {
      pre_auth_token: preAuthToken,
      otp_code: code,
    })
    setToken(data.access_token)
    if (data.user) {
      setUser(data.user)
    } else if (typeof data.id === 'number' && data.email) {
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name ?? null,
        username: data.username ?? null,
        is_student: data.is_student
      })
    }
    try { await fetchMe() } catch { /* non-fatal */ }
    return data
  }

  // Resend login OTP during the 2FA step.
  async function resendOtp(preAuthToken: string): Promise<{ message: string; email_masked: string; remaining_resends: number; otp_expires_at?: string }> {
    return await api.post('/public/auth/2fa/resend-code', {
      purpose: 'login',
      pre_auth_token: preAuthToken,
    })
  }

  async function register(payload: RegisterRequest): Promise<RegisterResponse> {
    return await api.post<RegisterResponse>('/auth/storefront/register', payload)
  }

  async function activate(payload: ActivateRequest): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>('/auth/storefront/activate', payload)
    setToken(data.access_token)
    if (data.user) setUser(data.user)
    try { await fetchMe() } catch { /* non-fatal */ }
    return data
  }

  async function forgotPassword(email: string): Promise<{ message: string }> {
    return await api.post<{ message: string }>('/auth/storefront/forgot-password', { email })
  }

  async function resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
    return await api.post<{ message: string }>('/auth/storefront/reset-password', payload)
  }

  async function resendActivation(email: string): Promise<{ message: string }> {
    return await api.post<{ message: string }>('/auth/storefront/resend-activation', { email })
  }

  async function fetchMe(): Promise<User | null> {
    if (!api.tokenCookie.value) return null
    isLoadingMe.value = true
    try {
      const me = await api.get<User>('/auth/storefront/me')
      setUser(me)
      // Set active client cookie from the first CLIENT_OWNER-scoped role.
      // Using role filter (not active_client_id) prevents student/teacher
      // client IDs from being used as the partner portal context.
      const adminRole = (me.roles ?? []).find(
        r => r.role_name === 'CLIENT_OWNER' && r.client_id != null
      )
      if (adminRole?.client_id && !_clientIdCookie.value) {
        _clientIdCookie.value = adminRole.client_id
      }
      return me
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 401) {
        setToken(null)
        setUser(null)
      }
      return null
    } finally {
      isLoadingMe.value = false
    }
  }

  // PUT /auth/storefront/me — self-scoped partial update.
  // BE returns the refreshed profile in the response body; we still call
  // fetchMe to keep cookie/store consistent and to surface 401 if token
  // expired mid-update.
  async function updateProfile(payload: UpdateProfileRequest): Promise<User | null> {
    const updated = await api.put<User>('/auth/storefront/me', payload)
    if (updated) setUser(updated)
    return updated ?? (await fetchMe())
  }

  function logout() {
    setToken(null)
    setUser(null)
    _clientIdCookie.value = null
  }

  return {
    user,
    isAuthenticated,
    isLoadingMe,
    login,
    login2FA,
    resendOtp,
    register,
    activate,
    forgotPassword,
    resetPassword,
    resendActivation,
    fetchMe,
    updateProfile,
    logout
  }
})
