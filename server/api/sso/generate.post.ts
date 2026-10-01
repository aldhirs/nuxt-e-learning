import { createHash, randomBytes } from 'node:crypto'

// SSO hand-off: mint a one-time LMS login link for the user signed in on the
// storefront.
//
// Security:
// 1. Account takeover — the SSO API key only proves *this server* is trusted.
//    The user the token is minted for MUST be the user who owns the storefront
//    session, never a user_id from the request body. So we resolve the user
//    from the session JWT via /auth/storefront/me and forward that JWT so the
//    backend re-verifies it (X-SSO-User-Token).
// 2. Login CSRF — the link is bound to this browser: a random ds_sso_state
//    cookie is kept in the browser and only its SHA-256 goes to the backend.
//    The exchange endpoint (API host) recomputes the hash from the cookie, so
//    a link opened in any other browser (e.g. one mailed to a victim) fails.

const STATE_COOKIE = 'ds_sso_state'
// Reused across links so several tabs/links in flight stay valid; refreshed on
// every generate.
const STATE_COOKIE_MAX_AGE = 60 * 60
const STATE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/

// Cookie Domain shared by the storefront host and the API host, so the API's
// exchange endpoint receives the cookie: drillspace.id + api.drillspace.id →
// "drillspace.id". Same host / IP / localhost → undefined (host-only cookie,
// which browsers also send to other ports on that host).
function sharedCookieDomain(requestHost: string, apiHost: string): string | undefined {
  const a = requestHost.toLowerCase().split('.').reverse()
  const b = apiHost.toLowerCase().split('.').reverse()
  if (requestHost === apiHost || /^[\d.]+$/.test(requestHost) || requestHost.includes(':')) return undefined
  const common: string[] = []
  for (let i = 0; i < Math.min(a.length, b.length) && a[i] === b[i]; i++) common.push(a[i])
  if (common.length < 2) return undefined
  return common.reverse().join('.')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const accessToken = getCookie(event, 'ds_access_token')
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{
    user_id?: number
    client_slug?: string
    redirect_path?: string
  }>(event)

  const clientSlug = typeof body?.client_slug === 'string' ? body.client_slug.trim() : ''
  if (!clientSlug) {
    throw createError({ statusCode: 400, statusMessage: 'client_slug is required' })
  }

  if (!config.ssoApiKey || config.ssoApiKey === 'sk-sso-changeme-generate-a-strong-random-key') {
    console.warn('[SSO] NUXT_SSO_API_KEY is not configured — set a proper key in .env')
  }

  const apiBase = (config.public.apiBaseUrl as string).replace(/\/$/, '')

  // Resolve the real user behind the session cookie (validates signature + expiry).
  let sessionUserId: number | undefined
  try {
    const me = await $fetch<{ success?: boolean; data?: { id?: number } }>(`${apiBase}/auth/storefront/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    sessionUserId = me?.data?.id
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (!sessionUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Clients still send user_id; a mismatch means a tampered request.
  if (body?.user_id !== undefined && Number(body.user_id) !== sessionUserId) {
    console.warn(`[SSO] user_id mismatch — session=${sessionUserId} body=${body.user_id}`)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Browser binding (login CSRF): reuse this browser's state or create one.
  const existingState = getCookie(event, STATE_COOKIE)
  const state = existingState && STATE_PATTERN.test(existingState)
    ? existingState
    : randomBytes(32).toString('base64url')
  const requestHost = getRequestHost(event, { xForwardedHost: true }).replace(/:\d+$/, '')
  const cookieDomain = (config.ssoStateCookieDomain as string) || sharedCookieDomain(requestHost, new URL(apiBase).hostname)
  setCookie(event, STATE_COOKIE, state, {
    httpOnly: true,
    secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
    maxAge: STATE_COOKIE_MAX_AGE
  })
  const stateHash = createHash('sha256').update(state).digest('hex')

  let res: { success: boolean; data: { sso_token: string } }
  try {
    res = await $fetch(`${apiBase}/public/sso/generate`, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${config.ssoApiKey}`,
        'X-SSO-User-Token': `Bearer ${accessToken}`
      },
      body: { user_id: sessionUserId, client_slug: clientSlug, state_hash: stateHash }
    })
  } catch (err: unknown) {
    const fe = err as { response?: { status?: number; _data?: { error?: { message?: string } } }; message?: string }
    const status = fe.response?.status ?? 500
    const message = fe.response?._data?.error?.message ?? fe.message ?? 'SSO generate failed'
    console.error(`[SSO] generate failed — status=${status} key_set=${!!config.ssoApiKey} message=${message}`)
    throw createError({ statusCode: status, statusMessage: message })
  }

  const params = new URLSearchParams({ token: res.data.sso_token, slug: clientSlug })
  if (body?.redirect_path) params.set('redirect', body.redirect_path)

  return { exchange_url: `${apiBase}/public/sso/exchange?${params.toString()}` }
})
