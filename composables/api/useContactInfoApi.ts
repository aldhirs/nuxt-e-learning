// PRD #16 — dynamic contact info. Shape: docs-e-learning/16-contact-info/api.yaml (ContactInfo).
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface DayHours {
  day: Weekday
  open: string
  close: string
  closed: boolean
}

export interface ContactSocials {
  website: string
  instagram: string
  facebook: string
  linkedin: string
  youtube: string
  tiktok: string
}

export interface ContactInfo {
  email: string
  phone: string
  whatsapp: string
  address: string
  maps_url: string
  show_map: boolean
  office_hours: DayHours[]
  notes: string
  socials: ContactSocials
  timezone: string
}

export function useContactInfoApi() {
  const api = useApi()
  return {
    getPlatform() {
      return api.get<ContactInfo>('/public/contact-info')
    },
  }
}
