interface AnalyticsEvent {
  event: string
  payload?: Record<string, unknown>
}

export function useAnalytics() {
  const config = useRuntimeConfig()

  function trackEvent({ event, payload }: AnalyticsEvent) {
    if (config.public.analyticsEnabled === 'true' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, payload)
    } else if (import.meta.dev) {
      console.log('[Analytics]', event, payload)
    }
  }

  return { trackEvent }
}
