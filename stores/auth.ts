import { defineStore } from 'pinia'
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ActivateRequest,
  ResetPasswordRequest,
  UpdateProfileRequest
} from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const api = useApi()

  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!api.tokenCookie.value && !!user.value)
  const isLoadingMe = ref(false)

  function setToken(token: string | null) {
    api.tokenCookie.value = token
  }

  function setUser(u: User | null) {
    user.value = u
  }

  async function login(payload: LoginRequest): Promise<LoginResponse> {
    const data = await api.post<LoginResponse>('/auth/storefront/login', payload)
    setToken(data.access_token)
    // BE returns user fields flat; contract has nested `user`. Accept both.
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
    // Fetch canonical /me to fill the rest of the profile fields.
    try { await fetchMe() } catch { /* non-fatal */ }
    return data
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
  }

  return {
    user,
    isAuthenticated,
    isLoadingMe,
    login,
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
