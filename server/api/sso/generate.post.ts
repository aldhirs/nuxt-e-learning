export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Require authenticated storefront session
  const tokenCookie = getCookie(event, 'ds_access_token')
  if (!tokenCookie) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{
    user_id: number
    client_slug: string
    redirect_path?: string
  }>(event)

  if (!body?.user_id || !body?.client_slug) {
    throw createError({ statusCode: 400, statusMessage: 'user_id and client_slug are required' })
  }

  if (!config.ssoApiKey || config.ssoApiKey === 'sk-sso-changeme-generate-a-strong-random-key') {
    console.warn('[SSO] NUXT_SSO_API_KEY is not configured — set a proper key in .env')
  }

  const apiBase = (config.public.apiBaseUrl as string).replace(/\/$/, '')

  let res: { success: boolean; data: { sso_token: string } }
  try {
    res = await $fetch(`${apiBase}/public/sso/generate`, {
      method: 'POST',
      headers: { Authorization: `ApiKey ${config.ssoApiKey}` },
      body: { user_id: body.user_id, client_slug: body.client_slug }
    })
  } catch (err: unknown) {
    const fe = err as { response?: { status?: number; _data?: { error?: { message?: string } } }; message?: string }
    const status = fe.response?.status ?? 500
    const message = fe.response?._data?.error?.message ?? fe.message ?? 'SSO generate failed'
    console.error(`[SSO] generate failed — status=${status} key_set=${!!config.ssoApiKey} message=${message}`)
    throw createError({ statusCode: status, statusMessage: message })
  }

  const redirectParam = body.redirect_path
    ? `&redirect=${encodeURIComponent(body.redirect_path)}`
    : ''

  const exchangeUrl =
    `${apiBase}/public/sso/exchange` +
    `?token=${res.data.sso_token}` +
    `&slug=${body.client_slug}` +
    redirectParam

  return { exchange_url: exchangeUrl }
})
