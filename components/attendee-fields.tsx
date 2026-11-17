'use client'

import { Plus, Trash2 } from 'lucide-react'

export const attendeeProfiles = [
  ['parent', 'Parent d’élève'],
  ['alumni', 'Ancien(ne) élève'],
  ['student', 'Élève'],
  ['family', 'Membre de la famille'],
  ['friend', 'Ami(e)'],
  ['guest', 'Visiteur / invité(e)'],
  ['other', 'Autre'],
] as const

export type AttendeeProfile = (typeof attendeeProfiles)[number][0]
export type Attendee = { name: string; type: 'adult' | 'child'; profile?: AttendeeProfile }
type Companion = Attendee & { id: string }

const profileLabels = Object.fromEntries(attendeeProfiles) as Record<AttendeeProfile, string>

export function AttendeeFields({
  leadName,
  leadType,
  leadProfile,
  onLeadTypeChange,
  companions,
  onCompanionsChange,
}: {
  leadName: string
  leadType: Attendee['type']
  leadProfile: AttendeeProfile
  onLeadTypeChange: (type: Attendee['type']) => void
  companions: Companion[]
  onCompanionsChange: (companions: Companion[]) => void
}) {
  function updateCompanion(id: string, changes: Partial<Companion>) {
    onCompanionsChange(companions.map(person => person.id === id ? { ...person, ...changes } : person))
  }

  function addCompanion() {
    if (companions.length >= 9) return
    onCompanionsChange([...companions, { id: crypto.randomUUID(), name: '', type: 'adult', profile: 'guest' }])
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="rounded-xl border border-[#e7e0e9] bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#928996]">Vous · personne principale</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#493653]">{leadName || 'Votre nom et prénom'}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-xs font-medium text-[#64596a]">Profil<span className="mt-1 block rounded-lg bg-[#f7f4f8] px-3 py-2 text-sm text-[#493653]">{profileLabels[leadProfile]}</span></p>
            <label className="text-xs font-medium text-[#64596a]">Âge
              <select value={leadType} onChange={event => onLeadTypeChange(event.target.value as Attendee['type'])} className="mt-1 block w-full rounded-lg border border-[#e7e0e9] bg-white px-3 py-2 text-sm sm:w-36">
                <option value="adult">Adulte</option>
                <option value="child">Enfant</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      {companions.map((person, index) => (
        <div key={person.id} className="grid gap-2 rounded-xl border border-[#e7e0e9] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto] sm:items-end">
          <label className="text-xs font-medium text-[#64596a]">Nom et prénom de l’accompagnant {index + 1}
            <input required minLength={2} maxLength={120} value={person.name} onChange={event => updateCompanion(person.id, { name: event.target.value })} placeholder="Nom et prénom" className="mt-1 w-full rounded-lg border border-[#e7e0e9] px-3 py-2.5 text-sm outline-none focus:border-[#6a4b7e]" />
          </label>
          <label className="text-xs font-medium text-[#64596a]">Profil
            <select value={person.profile ?? 'guest'} onChange={event => updateCompanion(person.id, { profile: event.target.value as AttendeeProfile })} className="mt-1 w-full rounded-lg border border-[#e7e0e9] bg-white px-3 py-2.5 text-sm">
              {attendeeProfiles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-[#64596a]">Âge
            <select value={person.type} onChange={event => updateCompanion(person.id, { type: event.target.value as Attendee['type'] })} className="mt-1 w-full rounded-lg border border-[#e7e0e9] bg-white px-3 py-2.5 text-sm">
              <option value="adult">Adulte</option>
              <option value="child">Enfant</option>
            </select>
          </label>
          <button type="button" onClick={() => onCompanionsChange(companions.filter(item => item.id !== person.id))} aria-label={`Retirer l’accompagnant ${index + 1}`} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#eee2e5] px-3 text-xs font-semibold text-[#946076] sm:size-10 sm:px-0"><Trash2 size={15}/><span className="sm:sr-only">Retirer</span></button>
        </div>
      ))}
      <button type="button" disabled={companions.length >= 9} onClick={addCompanion} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfc3d5] px-4 text-xs font-semibold text-[#604a70] hover:bg-[#faf8fb] disabled:opacity-50"><Plus size={15}/> Ajouter un accompagnant</button>
    </div>
  )
}
