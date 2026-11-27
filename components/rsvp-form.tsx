'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Check, ChevronDown, LoaderCircle, Lock } from 'lucide-react'
import { Attendee, AttendeeFields, AttendeeProfile, attendeeProfiles, getLegacyAttendeeType, normalizeAttendeeProfile } from '@/components/attendee-fields'
import { EventSettings, normalizeArrivalSlots } from '@/lib/event'

type RSVP = {
  full_name?: string
  phone?: string
  respondent_type?: string
  attendance?: string
  guests_total?: number
  adults?: number
  children?: number
  attendees?: Attendee[]
  arrival_slot?: string | null
  comment?: string | null
}

type Companion = Attendee & { id: string }

const field = 'mt-2 w-full rounded-xl border border-[#e7e0e9] bg-white px-4 py-3 text-sm text-[#302739] outline-none transition placeholder:text-[#b2aab5] focus:border-[#6a4b7e] focus:ring-4 focus:ring-[#6a4b7e]/10'

function initialAttendeeState(initial: RSVP | null) {
  const saved = initial?.attendees ?? []
  if (saved.length > 1) {
    return {
      companions: saved.slice(1).map((person, index) => ({
        ...person,
        profile: normalizeAttendeeProfile(person.profile ?? (person.type === 'child' ? 'student' : 'guest')),
        id: `saved-${index}`,
      })),
    }
  }
  if (!initial) return { companions: [{ id: 'new-0', name: '', type: 'adult', profile: 'guest' }] as Companion[] }
  if (initial.attendance !== 'yes') return { companions: [] as Companion[] }
  const leadType: Attendee['type'] = saved[0]?.type ?? ((initial.adults ?? 1) > 0 ? 'adult' : 'child')
  const missingAdults = Math.max(0, (initial.adults ?? 1) - (leadType === 'adult' ? 1 : 0))
  const missingChildren = Math.max(0, (initial.children ?? 0) - (leadType === 'child' ? 1 : 0))
  return {
    companions: Array.from({ length: Math.min(9, missingAdults + missingChildren) }, (_, index) => {
      const type = index < missingAdults ? 'adult' as const : 'child' as const
      return { id: `legacy-${index}`, name: 'Nom non renseigné', type, profile: type === 'child' ? 'student' as const : 'guest' as const }
    }),
  }
}

export function RSVPForm({ editToken, initial, settings }: { editToken: string; initial: RSVP | null; settings: EventSettings }) {
  const slots = useMemo(() => normalizeArrivalSlots(settings.arrival_slots), [settings.arrival_slots])
  const [attendance, setAttendance] = useState(initial?.attendance ?? '')
  const [leadName, setLeadName] = useState(initial?.full_name ?? '')
  const [leadProfile, setLeadProfile] = useState<AttendeeProfile | ''>(initial ? normalizeAttendeeProfile(initial.respondent_type) : '')
  const attendeeState = useMemo(() => initialAttendeeState(initial), [initial])
  const [companions, setCompanions] = useState<Companion[]>(attendeeState.companions)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(editToken && initial)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') ?? '').trim()
    const attendees: Attendee[] = attendance === 'yes'
      ? [{ name: fullName, type: getLegacyAttendeeType(leadProfile as AttendeeProfile), profile: leadProfile as AttendeeProfile }, ...companions.map(({ name, type, profile }) => {
          const normalizedProfile = normalizeAttendeeProfile(profile ?? (type === 'child' ? 'student' : 'guest'))
          return { name: name.trim(), type: getLegacyAttendeeType(normalizedProfile), profile: normalizedProfile }
        })]
      : []
    const adults = attendees.filter(person => person.type === 'adult').length
    const whatsapp = String(form.get('whatsapp') ?? '').trim()
    const payload = {
      full_name: fullName,
      whatsapp,
      respondent_type: leadProfile,
      attendance,
      guests_total: attendees.length,
      adults,
      children: attendees.length - adults,
      attendees,
      arrival_slot: attendance === 'yes' ? String(form.get('arrival_slot') ?? '') : null,
      comment: String(form.get('comment') ?? ''),
      consent: form.get('consent') === 'on',
      editToken,
    }
    try {
      const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Une erreur est survenue. Réessayez.')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-[1.75rem] border border-[#e9e3ec] bg-white p-8 text-center shadow-[0_18px_55px_-35px_rgba(56,39,70,.3)] sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f6f3] text-[#268a80]"><Check size={24} /></span>
        <h2 className="mt-5 text-2xl font-semibold text-[#382746]">Merci pour votre réponse !</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#766e79]">{settings.confirmation_message || 'Votre participation nous aide à mieux préparer cette belle journée. À très bientôt, in sha Allah !'}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-[1.75rem] border border-[#e9e3ec] bg-white p-5 shadow-[0_18px_55px_-35px_rgba(56,39,70,.3)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#514658]">Nom et prénom *
          <input required name="full_name" autoComplete="name" maxLength={120} value={leadName} onChange={event => setLeadName(event.target.value)} placeholder="Ex. Aïcha Diallo" className={field} />
        </label>
        <label className="text-xs font-semibold text-[#514658]">Numéro WhatsApp *
          <input required name="whatsapp" type="tel" autoComplete="tel" minLength={6} maxLength={30} defaultValue={initial?.phone ?? ''} placeholder="Ex. +221 77 000 00 00" className={field} />
        </label>
      </div>
      <label className="mt-5 block text-xs font-semibold text-[#514658]">Vous êtes *
        <span className="relative block">
          <select required name="respondent_type" value={leadProfile} onChange={event => setLeadProfile(event.target.value as AttendeeProfile)} className={`${field} appearance-none`}>
            <option value="" disabled>Sélectionnez votre profil</option>
            {attendeeProfiles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-5 text-[#84758c]" size={15} />
        </span>
      </label>
      <fieldset className="mt-6">
        <legend className="text-xs font-semibold text-[#514658]">Comptez-vous participer à la Journée Portes Ouvertes ? *</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[['yes', 'Oui, je serai présent(e)'], ['no', 'Non, je ne pourrai pas venir'], ['maybe', 'Je ne suis pas encore sûr(e)']].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={attendance === value} onClick={() => setAttendance(value)} className={`rounded-xl border px-2 py-3 text-xs font-semibold transition sm:text-sm ${attendance === value ? 'border-[#5d4072] bg-[#f3eef6] text-[#513765] ring-2 ring-[#5d4072]/10' : 'border-[#e7e0e9] text-[#766e79] hover:bg-[#faf8fb]'}`}>{label}</button>
          ))}
        </div>
      </fieldset>
      {attendance === 'yes' && (
        <div className="mt-6 rounded-2xl bg-[#f9f7fa] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[#473653]">Nombre de personnes</h3>
          <p className="mt-1 text-xs leading-5 text-[#847b88]">Indiquez le nom et le profil de chaque personne prévue, vous compris. Le total doit correspondre au nombre d’adultes et d’enfants.</p>
          {isEdit && initial && !initial.attendees?.length && Boolean(initial.guests_total && initial.guests_total > 1) && (
            <p className="mt-3 rounded-lg bg-[#f7f1e4] p-3 text-xs leading-5 text-[#806b3f]">Cette ancienne réponse ne contient pas encore les noms des accompagnants. Remplacez « Nom non renseigné » par leurs noms pour les enregistrer.</p>
          )}
          <AttendeeFields companions={companions} onCompanionsChange={setCompanions} />
          <p className="mt-3 text-xs font-medium text-[#64596a]">Total : {companions.length + 1} personne{(companions.length + 1) > 1 ? 's' : ''} · {companions.filter(person => getLegacyAttendeeType(normalizeAttendeeProfile(person.profile ?? (person.type === 'child' ? 'student' : 'guest')))).length + (normalizeAttendeeProfile(leadProfile || 'guest') === 'student' ? 0 : 1)} adulte(s) · {companions.filter(person => normalizeAttendeeProfile(person.profile ?? (person.type === 'child' ? 'student' : 'guest')) === 'student').length + (normalizeAttendeeProfile(leadProfile || 'guest') === 'student' ? 1 : 0)} enfant(s)</p>
          <label className="mt-4 block text-xs font-medium text-[#64596a]">Heure d’arrivée estimée *
            <span className="relative block">
              <select name="arrival_slot" required defaultValue={initial?.arrival_slot ?? ''} className={`${field} appearance-none`}>
                <option value="" disabled>Choisir un créneau</option>
                {slots.map(slot => <option key={slot}>{slot}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-5 text-[#84758c]" size={15} />
            </span>
          </label>
        </div>
      )}
      {attendance === 'maybe' && <p className="mt-4 rounded-xl bg-[#f5f1f8] p-3 text-xs leading-5 text-[#695975]">Votre réponse sera conservée comme incertaine et ne sera pas comptée parmi les présences confirmées.</p>}
      <label className="mt-5 block text-xs font-semibold text-[#514658]">Un commentaire ou une précision à nous communiquer ? <span className="font-normal text-[#968c9b]">(facultatif)</span>
        <textarea name="comment" maxLength={1000} rows={3} defaultValue={initial?.comment ?? ''} className={`${field} resize-y`} />
      </label>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#eee9f0] bg-[#fcfbfc] p-3">
        <input required name="consent" type="checkbox" defaultChecked={false} className="mt-0.5 size-4 accent-[#55396b]" />
        <span className="text-xs leading-5 text-[#766e79]">J’accepte que mes informations soient utilisées uniquement pour l’organisation de la JPO RAHMAH. *</span>
      </label>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving || !attendance} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4b3260] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4b3260]/15 transition hover:bg-[#392449] disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? <><LoaderCircle className="animate-spin" size={17} /> Envoi en cours…</> : isEdit ? 'Enregistrer ma modification' : 'Envoyer ma réponse'}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#968c9b]"><Lock size={11} /> Vos informations restent confidentielles et servent uniquement à l’organisation de la journée.</p>
    </form>
  )
}
