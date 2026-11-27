export type AttendeeProfile = 'parent' | 'alumni' | 'student' | 'staff' | 'family' | 'friend' | 'guest' | 'other'

export const attendeeProfiles: [AttendeeProfile, string][] = [
  ['alumni', 'Ancien(ne) élève'],
  ['parent', 'Parent d’élève'],
  ['student', 'Élève actuel(le)'],
  ['staff', 'Membre du personnel'],
  ['guest', 'Invité(e)'],
  ['other', 'Autre'],
]

export const profileLabels: Record<AttendeeProfile, string> = Object.fromEntries(
  attendeeProfiles,
) as Record<AttendeeProfile, string>

export const attendanceStatus = {
  yes: { label: 'Confirmé', cls: 'bg-[#e5f5f2] text-[#257c73]' },
  no: { label: 'Décliné', cls: 'bg-[#f5edf0] text-[#946076]' },
  maybe: { label: 'Incertain', cls: 'bg-[#f7f1e4] text-[#997d40]' },
} as const

export type AttendanceStatus = keyof typeof attendanceStatus

export const defaultArrivalSlots = [
  '09h00 – 10h00',
  '10h00 – 11h00',
  '11h00 – 12h00',
  '12h00 – 13h00',
  '13h00 – 14h00',
  'Après 14h00',
  'Je ne sais pas encore',
]

export function normalizeArrivalSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultArrivalSlots
  const slots = value.filter((slot): slot is string => typeof slot === 'string' && slot.trim().length > 0 && slot.length <= 40)
  return slots.length ? slots.slice(0, 12) : defaultArrivalSlots
}

export function normalizeAttendeeProfile(profile?: string | null): AttendeeProfile {
  return attendeeProfiles.some(([value]) => value === profile) ? (profile as AttendeeProfile) : 'guest'
}

export function getLegacyAttendeeType(profile: AttendeeProfile): 'adult' | 'child' {
  return profile === 'student' ? 'child' : 'adult'
}

export type Attendee = { name: string; type: 'adult' | 'child'; profile?: AttendeeProfile }

export type EventSettings = {
  event_name: string | null
  event_date: string | null
  opening_hours: string | null
  address: string | null
  intro_text: string | null
  confirmation_message: string | null
  survey_open: boolean
  arrival_slots: string[]
}
