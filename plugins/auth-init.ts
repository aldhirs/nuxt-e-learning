// Resolve the session (/me) on BOTH server and client.
//
// Runs on the server so SSR renders the same logged-in UI the client will
// hydrate. When /me was client-only, SSR rendered the guest navbar/layout and
// the client the logged-in one; the resulting hydration mismatch could leave
// buttons in the DOM that had no event listeners ("can't click anything").
// The user loaded on the server is transferred to the client via Pinia state,
// so the client skips the request.
//
// Max time we wait for /me. Nuxt does not render (server) or mount (client)
// until plugins resolve, so a slow API must not block the page.
const ME_WAIT_MS = 4000

export default defineNuxtPlugin(async () => {
  const tokenCookie = useAuthCookie()
  if (!tokenCookie.value) return

  const auth = useAuthStore()
  if (auth.user) return

  // fetchMe keeps running in the background if the timeout wins; on the
  // client the navbar updates reactively once it lands.
  await Promise.race([
    auth.fetchMe(),
    new Promise(resolve => setTimeout(resolve, ME_WAIT_MS))
  ])
})
