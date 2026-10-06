import { useContactInfoApi, type ContactInfo, type Weekday } from '~/composables/api/useContactInfoApi'

const DAY_LABEL: Record<Weekday, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

// Weekday key + "HH:MM" in WIB regardless of the viewer's timezone.
function nowInWib(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  return { day: get('weekday').toLowerCase().slice(0, 3), time: `${get('hour').replace('24', '00')}:${get('minute')}` }
}

/**
 * DrillSpace platform contact info (PRD #16), shared by the Contact Us page
 * and the footer — same useAsyncData key so it is fetched once per request.
 */
export function usePlatformContactInfo() {
  const api = useContactInfoApi()
  const { data, status, error, refresh } = useAsyncData<ContactInfo | null>(
    'platform-contact-info',
    () => api.getPlatform(),
    { default: () => null },
  )

  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 60_000) })
  onBeforeUnmount(() => { if (timer) clearInterval(timer) })

  const hours = computed(() => data.value?.office_hours || [])
  const hasHours = computed(() => hours.value.length === 7)

  const isOpenNow = computed(() => {
    if (!hasHours.value) return false
    const { day, time } = nowInWib(now.value)
    const d = hours.value.find(h => h.day === day)
    return !!d && !d.closed && time >= d.open && time < d.close
  })

  // Groups consecutive days with identical hours: "Mon–Fri: 08:00–16:30".
  const hoursSummary = computed(() => {
    const groups: { from: Weekday; to: Weekday; text: string }[] = []
    for (const d of hours.value) {
      const text = d.closed ? 'Closed' : `${d.open}–${d.close}`
      const last = groups[groups.length - 1]
      if (last && last.text === text) last.to = d.day
      else groups.push({ from: d.day, to: d.day, text })
    }
    return groups.map(g => ({
      days: g.from === g.to ? DAY_LABEL[g.from] : `${DAY_LABEL[g.from]}–${DAY_LABEL[g.to]}`,
      text: g.text,
    }))
  })

  const whatsappLink = (text = '') => {
    const wa = data.value?.whatsapp
    if (!wa) return ''
    return `https://wa.me/${wa}${text ? `?text=${encodeURIComponent(text)}` : ''}`
  }

  const mapsLink = computed(() => {
    const i = data.value
    if (!i) return ''
    if (i.maps_url) return i.maps_url
    return i.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.address)}` : ''
  })

  return { info: data, status, error, refresh, hasHours, isOpenNow, hoursSummary, whatsappLink, mapsLink }
}
