'use client'

import { Plus, Trash2 } from 'lucide-react'

export const attendeeProfiles = [
  ['parent', 'Parent d’élève'],
  ['student', 'Élève'],
  ['alumni', 'Ancien élève'],
  ['guest', 'Visiteur'],
] as const

export type AttendeeProfile = (typeof attendeeProfiles)[number][0]
export type Attendee = { name: string; type: 'adult' | 'child'; profile?: AttendeeProfile }
type Companion = Attendee & { id: string }

export function normalizeAttendeeProfile(profile?: string | null): AttendeeProfile {
  return profile === 'parent' || profile === 'student' || profile === 'alumni' ? profile : 'guest'
}

export function getLegacyAttendeeType(profile: AttendeeProfile): Attendee['type'] {
  return profile === 'student' ? 'child' : 'adult'
}

export function AttendeeFields({
  companions,
  onCompanionsChange,
}: {
  companions: Companion[]
  onCompanionsChange: (companions: Companion[]) => void
}) {
  function updateCompanion(id: string, changes: Partial<Companion>) {
    onCompanionsChange(companions.map(person => person.id === id ? { ...person, ...changes } : person))
  }

  function addCompanion() {
    if (companions.length >= 9) return
    const profile: AttendeeProfile = 'guest'
    onCompanionsChange([...companions, { id: crypto.randomUUID(), name: '', type: getLegacyAttendeeType(profile), profile }])
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {companions.map((person, index) => (
        <div key={person.id} className="grid gap-2 rounded-xl border border-[#e7e0e9] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="text-xs font-medium text-[#64596a]">Nom et prénom de l’accompagnant {index + 1}
            <input required minLength={2} maxLength={120} value={person.name} onChange={event => updateCompanion(person.id, { name: event.target.value })} placeholder="Nom et prénom" className="mt-1 w-full rounded-lg border border-[#e7e0e9] px-3 py-2.5 text-sm outline-none focus:border-[#6a4b7e]" />
          </label>
          <label className="text-xs font-medium text-[#64596a]">Profil
            <select value={person.profile ?? (person.type === 'child' ? 'student' : 'guest')} onChange={event => {
              const profile = event.target.value as AttendeeProfile
              updateCompanion(person.id, { profile, type: getLegacyAttendeeType(profile) })
            }} className="mt-1 w-full rounded-lg border border-[#e7e0e9] bg-white px-3 py-2.5 text-sm">
              {attendeeProfiles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => onCompanionsChange(companions.filter(item => item.id !== person.id))} aria-label={`Retirer l’accompagnant ${index + 1}`} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#eee2e5] px-3 text-xs font-semibold text-[#946076] sm:size-10 sm:px-0"><Trash2 size={15}/><span className="sm:sr-only">Retirer</span></button>
        </div>
      ))}
      <button type="button" disabled={companions.length >= 9} onClick={addCompanion} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfc3d5] px-4 text-xs font-semibold text-[#604a70] hover:bg-[#faf8fb] disabled:opacity-50"><Plus size={15}/> Ajouter un accompagnant</button>
    </div>
  )
}
